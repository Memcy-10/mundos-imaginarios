const fs = require('fs');
const path = require('path');

const MODELO_IMAGEN = '@cf/black-forest-labs/flux-1-schnell';
const URL_IMAGEN = 'https://api.cloudflare.com/client/v4/accounts';

// paso 1: transforma los errores HTTP en mensajes claros en español y sin mostrar claves ni datos internos.
function obtenerMensajeError(status) {
  if (status === 401 || status === 403) {
    return 'La API key no es válida. Revisa tu archivo .env.';
  }

  if (status === 402 || status === 429) {
    return 'Superaste el límite gratuito. Espera un momento.';
  }

  if (status === 404 || status === 410) {
    return 'El modelo o la URL no existen. Revisa tu configuración.';
  }

  return 'No se pudo generar la imagen del mundo.';
}

// paso 2: genera la imagen a partir de la descripción guardada en descripciones/mundo_<id>.txt.
async function generarImagen(descripcion) {
  if (typeof descripcion !== 'string' || descripcion.trim() === '') {
    throw new Error('La descripción de la imagen está vacía.');
  }

  const id = descripcion.includes('mundo_') ? descripcion.split('mundo_')[1].split('.')[0] : null;
  const rutaDescripcion = id
    ? path.join(__dirname, '..', 'descripciones', `mundo_${id}.txt`)
    : path.join(__dirname, '..', 'descripciones');

  let textoDescripcion = descripcion;
  if (fs.existsSync(rutaDescripcion) && fs.statSync(rutaDescripcion).isFile()) {
    textoDescripcion = fs.readFileSync(rutaDescripcion, 'utf8');
  }

  const promtFinal = textoDescripcion.trim();

  if (!process.env.ACCOUNT_ID) {
    throw new Error('Falta la variable ACCOUNT_ID en tu archivo .env.');
  }

  const respuesta = await fetch(`${URL_IMAGEN}/${process.env.ACCOUNT_ID}/ai/run/${MODELO_IMAGEN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: promtFinal,
      steps: 4,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!respuesta.ok) {
    throw new Error(obtenerMensajeError(respuesta.status));
  }

  const datos = await respuesta.json();
  if (!datos || typeof datos !== 'object') {
    throw new Error('La respuesta de Cloudflare no tiene el formato esperado.');
  }

  // paso 3: se imprime la forma de la respuesta sin revelar claves para confirmar la estructura exacta.
  console.log('Respuesta de Cloudflare:', JSON.stringify({ success: datos.success, result: datos.result ? { image: 'base64...' } : null }, null, 2));

  if (datos.success === false) {
    throw new Error('La API de imágenes respondió con un error. Revisa la descripción o la configuración.');
  }

  const base64Imagen = datos?.result?.image;
  if (typeof base64Imagen !== 'string' || base64Imagen.trim() === '') {
    throw new Error('La imagen no llegó en base64.');
  }

  const bytes = Buffer.from(base64Imagen, 'base64');
  if (bytes.length === 0) {
    throw new Error('La imagen generada está vacía.');
  }

  const carpetaImagen = path.join(__dirname, '..', 'imagenes');
  fs.mkdirSync(carpetaImagen, { recursive: true });

  const idImagen = id || 'mundo';
  const rutaImagen = path.join(carpetaImagen, `${idImagen}.jpg`);
  fs.writeFileSync(rutaImagen, bytes);

  return bytes;
}

module.exports = {
  generarImagen,
};
