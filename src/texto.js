const fs = require('fs');
const path = require('path');

const MODELO_TEXTO = 'meta/llama-3.2-90b-vision-instruct';
const MAX_TOKENS = 250;

// paso 1: convierte estados HTTP en mensajes claros para el usuario, sin mostrar detalles técnicos.
function obtenerMensajeError(status, headers) {
  const retryAfter = headers && headers.get ? headers.get('retry-after') : null;

  if (status === 401 || status === 403) {
    return 'La API key no es válida. Revisa tu archivo .env.';
  }

  if (status === 402 || status === 429) {
    return retryAfter
      ? `Superaste el límite gratuito. Espera un momento. retry-after: ${retryAfter}`
      : 'Superaste el límite gratuito. Espera un momento.';
  }

  if (status === 404 || status === 410) {
    return 'El modelo o la URL no existen. Revisa tu configuración.';
  }

  return 'No se pudo generar la descripción del mundo.';
}

// paso 2: prepara la petición al modelo de texto con el formato requerido por NVIDIA.
async function describirMundo(mundo) {
  if (!mundo || !mundo.id || !mundo.situacion || !mundo.mundo || !Array.isArray(mundo.colores)) {
    throw new Error('El objeto del mundo no tiene la estructura esperada.');
  }

  const promptSistema = `Write only in English: describe one image of this imaginary world in a single paragraph of 80 to 120 words. Describe the scene, elements, lighting, composition, and artistic style; do not write a story, title, markdown, or text that should appear inside the image. Mention all colors from this palette, translating their names into English while preserving their meaning: ${mundo.colores.join(', ')}.`;

  const respuesta = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODELO_TEXTO,
      max_tokens: MAX_TOKENS,
      temperature: 1,
      top_p: 1,
      stream: false,
      messages: [
        { role: 'system', content: promptSistema },
        {
          role: 'user',
          content: [{ type: 'text', text: JSON.stringify(mundo) }],
        },
      ],
    }),
    signal: AbortSignal.timeout(240000),
  });

  if (!respuesta.ok) {
    throw new Error(obtenerMensajeError(respuesta.status, respuesta.headers));
  }

  const data = await respuesta.json();
  const contenido = data?.choices?.[0]?.message?.content;

  if (typeof contenido !== 'string' || contenido.trim() === '') {
    throw new Error('El modelo de texto no devolvió una descripción válida.');
  }

  let descripcion = contenido.trim();

  if (descripcion.length > 1500) {
    console.log('La descripción generada excedió 1500 caracteres y se recortó para continuar.');
    descripcion = descripcion.slice(0, 1500);
  }

  // paso 3: guarda la descripción en descripciones/mundo_<id>.txt para reutilizarla en la siguiente parte.
  const rutaCarpeta = path.join(__dirname, '..', 'descripciones');
  fs.mkdirSync(rutaCarpeta, { recursive: true });

  const rutaArchivo = path.join(rutaCarpeta, `mundo_${mundo.id}.txt`);
  fs.writeFileSync(rutaArchivo, descripcion, 'utf8');

  return descripcion;
}

module.exports = {
  describirMundo,
};
