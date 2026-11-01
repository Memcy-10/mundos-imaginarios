const fs = require('fs');
const path = require('path');

const { crearMundo, guardarMundo, leerMundo } = require('./mundo');
const { describirMundo } = require('./texto');
const { generarImagen } = require('./imagen');

// paso 1: comprueba que las 3 variables obligatorias del .env existan antes de hacer cualquier llamada.
function verificarVariablesDeEntorno() {
  const variables = ['NVIDIA_API_KEY', 'CLOUDFLARE_API_KEY', 'ACCOUNT_ID'];
  const faltantes = variables.filter((nombre) => !process.env[nombre]);

  if (faltantes.length > 0) {
    const mensaje = faltantes.length === 1
      ? `Falta la variable ${faltantes[0]} en tu archivo .env.`
      : `Faltan las variables ${faltantes.join(', ')} en tu archivo .env.`;
    throw new Error(mensaje);
  }
}

// paso 2: valida que el archivo del mundo exista antes de continuar, para reusar el JSON guardado.
// Lugar de la funcion borrada del primer cambio hecho por mi

function rutaDescripcion(id) {
  return path.join(__dirname, '..', 'descripciones', `mundo_${id}.txt`);
}

function rutaImagen(id) {
  return path.join(__dirname, '..', 'imagenes', `mundo_${id}.jpg`);
}

// paso 3: orquesta los tres pasos del flujo: guardar el mundo, generar descripción y generar imagen.
async function main() {
  process.loadEnvFile();
  verificarVariablesDeEntorno();

  const args = process.argv.slice(2);

  try {
    const mundo = crearMundo(args);
    const archivoMundo = guardarMundo(mundo);
    console.log(`Paso 1: mundo guardado en ${path.relative(process.cwd(), archivoMundo).replace(/\\/g, '/')}`);

    const mundoGuardado = leerMundo(archivoMundo);
    const id = mundoGuardado.id;
    const archivoDescripcion = rutaDescripcion(id);

    let descripcion;
    if (fs.existsSync(archivoDescripcion)) {
      descripcion = fs.readFileSync(archivoDescripcion, 'utf8');
      console.log(`Paso 2: la descripción ya existía, no se llamó al modelo de texto.`);
    } else {
      descripcion = await describirMundo(mundoGuardado);
      console.log(`Paso 2: descripción guardada en ${path.relative(process.cwd(), archivoDescripcion).replace(/\\/g, '/')}`);
    }

    descripcion = fs.readFileSync(archivoDescripcion, 'utf8');
    const archivoImagen = rutaImagen(id);
    if (fs.existsSync(archivoImagen)) {
      console.log(`Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.`);
    } else {
      await generarImagen(id, descripcion);
      console.log(`Paso 3: imagen guardada en ${path.relative(process.cwd(), archivoImagen).replace(/\\/g, '/')}`);
    }

    console.log('Listo. Revisa la carpeta imagenes/');
  } catch (error) {
    const mensaje = (() => {
      if (!error) {
        return 'Ocurrió un error al generar el mundo.';
      }

      if (error.name === 'TypeError') {
        return 'No se pudo conectar. Revisa tu internet o la URL.';
      }

      if (error.name === 'TimeoutError') {
        return 'El servicio tardó demasiado en responder.';
      }

      if (typeof error.message === 'string' && error.message.trim() !== '') {
        return error.message;
      }

      return 'Ocurrió un error al generar el mundo.';
    })();

    console.error(mensaje);
    process.exitCode = 1;
  }
}

main();
