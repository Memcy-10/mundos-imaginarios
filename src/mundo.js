const fs = require('fs');
const path = require('path');
const objectHash = require('object-hash');

// paso 1: valida que lleguen exactamente 7 argumentos y que no haya valores vacíos.
function validarArgumentos(args) {
  if (!Array.isArray(args) || args.length !== 7) {
    throw new Error('Debes enviar exactamente 7 argumentos: situación, mundo y 5 colores. Ejemplo: npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta');
  }

  const [situacion, mundo, ...colores] = args;

  for (const valor of [situacion, mundo, ...colores]) {
    if (typeof valor !== 'string' || valor.trim() === '') {
      throw new Error('Ningún argumento puede estar vacío ni tener solo espacios. Ejemplo: npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta');
    }
  }

  const coloresNormalizados = colores.map((color) => color.trim().toLowerCase());
  if (new Set(coloresNormalizados).size !== 5) {
    throw new Error('Los 5 colores deben ser distintos, sin importar mayúsculas o minúsculas. Ejemplo: rojo azul verde dorado violeta');
  }
}

// paso 2: crea el objeto JSON con el id calculado a partir de la situación, el mundo y los colores.
function crearMundo(args) {
  validarArgumentos(args);

  const [situacion, mundo, ...colores] = args;
  const coloresLimpios = colores.map((color) => color.trim());
  const mundoBase = {
    situacion: situacion.trim(),
    mundo: mundo.trim(),
    colores: coloresLimpios,
  };

  const hash = objectHash(mundoBase);
  const id = hash.slice(0, 8);

  return {
    id,
    situacion: mundoBase.situacion,
    mundo: mundoBase.mundo,
    colores: mundoBase.colores,
    creadoEn: new Date().toISOString(),
  };
}

// paso 3: guarda el JSON en data/mundo_<id>.json usando la ruta correcta del proyecto.
function guardarMundo(mundo) {
  if (!mundo || !mundo.id || !mundo.situacion || !mundo.mundo || !Array.isArray(mundo.colores) || mundo.colores.length !== 5) {
    throw new Error('El mundo recibido no tiene el formato esperado.');
  }

  const rutaCarpeta = path.join(__dirname, '..', 'data');
  fs.mkdirSync(rutaCarpeta, { recursive: true });

  const rutaArchivo = path.join(rutaCarpeta, `mundo_${mundo.id}.json`);
  const contenido = JSON.stringify(mundo, null, 2);
  fs.writeFileSync(rutaArchivo, contenido, 'utf8');

  return rutaArchivo;
}

// paso 4: lee el archivo JSON guardado y lo convierte en un objeto JavaScript.
function leerMundo(ruta) {
  if (typeof ruta !== 'string' || ruta.trim() === '') {
    throw new Error('Debes indicar la ruta del archivo JSON del mundo.');
  }

  if (!fs.existsSync(ruta)) {
    throw new Error('No existe el archivo del mundo que intentas leer.');
  }

  const contenido = fs.readFileSync(ruta, 'utf8');
  return JSON.parse(contenido);
}

module.exports = {
  crearMundo,
  guardarMundo,
  leerMundo,
};
