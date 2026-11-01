# A. Declaración de uso de IA

**Usé IA: sí**

# B. Herramienta y modelo

GitHub Copilot en VS Code (chat), modelo GPT 6 (el que tenía seleccionado en el selector de modelos del chat).

# C. Prompt inicial completo

```text
Actúa como un instructor de Node.js para principiantes. Vas a ayudarme a construir un programa de consola llamado "mundos-ia". Explica cada bloque de código en 2 líneas y entrégame un archivo a la vez.

=== REGLA DE SEGURIDAD (MUY IMPORTANTE) ===
- NO abras, NO leas, NO imprimas y NO me pidas el contenido del archivo .env.
- Solo debes saber que ese archivo contiene estas 3 variables: NVIDIA_API_KEY, CLOUDFLARE_API_KEY y ACCOUNT_ID.
- En el código se leen únicamente con process.env.NOMBRE. Nunca escribas valores reales en el código, en comentarios, en README, en PROMPT.md ni en mensajes de error.
- El programa nunca debe imprimir las claves en consola.
- Crea un .env.example con esos tres nombres y valores vacíos (NVIDIA_API_KEY=, CLOUDFLARE_API_KEY=, ACCOUNT_ID=).

=== QUÉ HACE EL PROGRAMA ===
Un estudio de videojuegos necesita bocetos visuales rápidos de mundos imaginarios. El programa:
1. Recibe por parámetros una situación, un mundo y 5 colores, y los guarda en un objeto JSON.
2. Lee ese JSON guardado y se lo envía a un modelo de lenguaje gratuito para que escriba la descripción de una imagen. La descripción se guarda en un .txt.
3. Envía esa descripción a un modelo de generación de imágenes gratuito y guarda la imagen en una carpeta.

Flujo:
 [Terminal: situación, mundo y 5 colores] -> process.argv
 data/mundo_<id>.json
 -> API de TEXTO (fetch) -> descripciones/mundo_<id>.txt
 -> API de IMAGEN (fetch) -> imagenes/mundo_<id>.jpg

Comando de ejemplo:
 npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta

Salida esperada en consola:
 Paso 1: mundo guardado en data/mundo_3f9a1c2e.json
 Paso 2: descripción guardada en descripciones/mundo_3f9a1c2e.txt
 Paso 3: imagen guardada en imagenes/mundo_3f9a1c2e.jpg
 Listo. Revisa la carpeta imagenes/

Si ejecuto el mismo comando otra vez, NO debe llamar a ninguna API:
 Paso 1: mundo guardado en data/mundo_3f9a1c2e.json
 Paso 2: la descripción ya existía, no se llamó al modelo de texto.
 Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.

=== SERVICIOS QUE USO ===
TEXTO: NVIDIA (API compatible con OpenAI), modelo meta/llama-3.2-90b-vision-instruct
- Método POST a https://integrate.api.nvidia.com/v1/chat/completions
- Cabeceras: Content-Type: application/json y Authorization: Bearer ${process.env.NVIDIA_API_KEY}
- Cuerpo: { "model": "meta/llama-3.2-90b-vision-instruct", "messages": [ { "role": "system", "content": "..." }, { "role": "user", "content": "..." } ] }
- Es un modelo de visión, pero aquí solo se le envía texto (no imágenes). Usa el mismo formato de mensajes con content como string.
- Texto de la respuesta: datos.choices[0].message.content
- Deja el nombre del modelo en una constante al inicio de texto.js para cambiarlo fácil. Si responde 404 o 410 ("end of life"), el modelo fue retirado: debe mostrar un mensaje claro para que yo lo cambie.

IMAGEN: Cloudflare Workers AI, modelo FLUX.1-schnell
- Método POST a https://api.cloudflare.com/client/v4/accounts/${process.env.ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell
- Cabeceras: Content-Type: application/json y Authorization: Bearer ${process.env.CLOUDFLARE_API_KEY}
- Cuerpo: { "prompt": "<descripción>", "steps": 4 } (el prompt admite máximo 2048 caracteres; steps hasta 8)
- La imagen llega en base64 dentro de datos.result.image. Revisa también datos.success; si es false, muestra un error claro. La primera vez imprime la forma de la respuesta SIN incluir ninguna clave, para confirmar la estructura.
- La URL, el nombre del modelo y los demás datos fijos van como constantes en el código (no en .env). Del .env solo se leen las 3 variables indicadas.

=== HERRAMIENTAS PERMITIDAS (SOLO ESTAS) ===
- JavaScript básico: variables, funciones, condicionales, ciclos, arreglos, objetos, JSON.stringify y JSON.parse.
- process.argv, parseInt, template literals.
- Módulos locales: usa CommonJS (require / module.exports) en TODO el proyecto, sin mezclar con ES Modules.
- Módulos nativos: fs (solo versiones síncronas: writeFileSync, readFileSync, existsSync, mkdirSync) y path.
- npm init, npm install, scripts de package.json y UN solo paquete externo: object-hash.
- async/await, try/catch, archivo .env cargado con process.loadEnvFile().
- fetch nativo de Node y AbortSignal.timeout.
- Buffer.from(...) para guardar la imagen.
- NO uses: axios, node-fetch, SDK de proveedores (openai, groq-sdk, etc.), dotenv, readline, commander, yargs, frameworks (Express u otros), TypeScript ni bases de datos. Si dudas de algo que no esté en esta lista, pregúntame antes de usarlo.
- Código simple, con comentarios en español numerados ("paso 1", "paso 2"...).

=== ESTRUCTURA DEL PROYECTO ===
mundos-ia/
├── src/
│ ├── index.js (orquesta los pasos 1 a 3)
│ ├── mundo.js (valida argumentos, crea el objeto, guarda y lee el JSON)
│ ├── texto.js (consulta al modelo de lenguaje con fetch)
│ └── imagen.js (consulta al modelo de imágenes con fetch y devuelve los bytes)
├── .env (mis claves, tú no lo tocas ni lo lees)
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── PROMPT.md

El .gitignore debe tener, una por línea: node_modules/, .env, data/, descripciones/ e imagenes/.
Las rutas de data/, descripciones/ e imagenes/ se construyen con path.join(__dirname, '..', 'data') (y equivalentes), no desde donde se ejecute el comando. Si una carpeta no existe, créala con fs.mkdirSync(ruta, { recursive: true }).
El package.json debe tener: name, version, description, keywords, author, license, main apuntando a src/index.js y el script "start": "node src/index.js".

=== PARTE 2: PARÁMETROS Y OBJETO JSON (mundo.js) ===
Validaciones. Si algo falla, muestra un mensaje claro en español con un ejemplo de uso, sin errores técnicos, y termina con process.exitCode = 1:
- Deben llegar exactamente 7 argumentos.
- Ningún argumento puede estar vacío ni tener solo espacios.
- Los 5 colores deben ser distintos (sin distinguir mayúsculas de minúsculas).

El objeto JSON tiene: id, situacion, mundo, colores (arreglo de 5 elementos) y creadoEn (fecha ISO).
- El id son los primeros 8 caracteres del hash de object-hash calculado sobre { situacion, mundo, colores }. NO incluyas creadoEn en el hash, para que los mismos datos den siempre el mismo id.
- Guarda con JSON.stringify(objeto, null, 2) en data/mundo_<id>.json.
- mundo.js exporta como mínimo: crearMundo(args), guardarMundo(mundo) y leerMundo(ruta).

=== PARTE 3: DESCRIPCIÓN CON EL MODELO DE TEXTO (texto.js) ===
- En index.js, después de guardar el mundo, vuelve a leer el JSON desde el archivo con leerMundo(ruta). No reutilices el objeto en memoria.
- texto.js exporta describirMundo(mundo) (async). El mensaje del usuario es JSON.stringify(mundo).
- Escribe un mensaje de sistema (role: 'system') que pida al modelo responder con: un solo párrafo en inglés, entre 80 y 120 palabras, describiendo UNA IMAGEN (escena, elementos, iluminación, composición y estilo artístico, no un cuento), mencionando los 5 colores (puede traducirlos), sin títulos, sin markdown y sin texto escrito dentro de la imagen.
- Valida: si la respuesta llega vacía, lanza un Error. Si supera 1500 caracteres, recórtala con slice y avisa al usuario.
- Guarda la descripción en descripciones/mundo_<id>.txt.
- Usa AbortSignal.timeout(30000) y revisa respuesta.ok.

=== PARTE 4: IMAGEN (imagen.js) ===
- imagen.js exporta generarImagen(descripcion) (async) y devuelve los bytes de la imagen.
- La descripción que se envía se lee desde el archivo .txt guardado.
- Convierte el base64 con Buffer.from(textoBase64, 'base64') y guarda con fs.writeFileSync(rutaImagen, bytes) SIN pasar 'utf-8' (si no, la imagen queda dañada).
- Guarda en imagenes/mundo_<id>.jpg.
- Usa AbortSignal.timeout(60000).
- Valida: respuesta.ok, datos.success y que los bytes no estén vacíos.

=== PARTE 5: ORQUESTACIÓN, ERRORES Y AHORRO DE CUOTA (index.js) ===
- index.js ejecuta los 3 pasos en orden dentro de una función async main() con try/catch. Carga el .env con process.loadEnvFile() al inicio.
- Cada paso muestra un mensaje que empieza con "Paso N:" en español.
- Si descripciones/mundo_<id>.txt ya existe, no llames al modelo de texto y usa su contenido. Si imagenes/mundo_<id>.jpg ya existe, no llames al modelo de imágenes. Usa fs.existsSync e informa al usuario.
- Si un paso falla, conserva los archivos de los pasos anteriores; al ejecutar de nuevo continúa desde donde quedó. Si algo falla, process.exitCode = 1.
- Mensajes de error en español, sin mostrar errores técnicos incomprensibles:
 * Estado 401 o 403: "La API key no es válida. Revisa tu archivo .env."
 * Estado 402 o 429: "Superaste el límite gratuito. Espera un momento." (menciona retry-after si existe)
 * Estado 404 o 410: "El modelo o la URL no existen. Revisa tu configuración."
 * fetch lanza TypeError: "No se pudo conectar. Revisa tu internet o la URL."
 * error.name === 'TimeoutError': "El servicio tardó demasiado en responder."
- Verifica al inicio que existan las 3 variables (NVIDIA_API_KEY, CLOUDFLARE_API_KEY, ACCOUNT_ID) y, si falta alguna, avisa cuál falta SIN imprimir ningún valor.

=== PARTE 6: README Y PUBLICACIÓN ===
Escribe el README.md con: qué hace el programa, cómo configurarlo (copiar .env.example a .env y poner las claves), el comando de ejemplo, la estructura de carpetas y los servicios usados (NVIDIA con meta/llama-3.2-90b-vision-instruct para texto; Cloudflare Workers AI con FLUX.1-schnell para imagen) con sus enlaces. Incluye una sección "Experimento npm publish --dry-run" con espacio para que yo anote qué pasó al renombrar .gitignore a .gitignore.off y por qué es peligroso (no inventes el resultado, déjalo para que yo lo complete).

=== PREGUNTAS DE REFLEXIÓN (en el README.md) ===
Agrega una sección "Preguntas de reflexión" con estas 6 preguntas. NO las respondas: debajo de cada una escribe exactamente "Tu respuesta aquí:" y deja el espacio vacío para que yo las conteste.
1. ¿Por qué el id se calcula sin la fecha? ¿Qué pasaría si la incluyeras?
2. ¿Por qué se le pide al modelo de texto la descripción en inglés? Si puedes, prueba con una en español y compara las imágenes.
3. ¿Qué diferencia hay entre una respuesta JSON de texto y una respuesta con los bytes de una imagen? ¿Qué es base64?
4. ¿Qué pasaría si guardas la imagen con 'utf-8'? ¿Por qué?
5. ¿Qué pasos consumen cuota gratuita y cómo evitaste repetirlos?
6. Si usaste IA: ¿qué fue lo más difícil de pedirle y qué parte tuviste que corregir tú?

=== PROMPT.md ===
Crea un PROMPT.md en la raíz solo con los títulos de estas secciones y "Escribe aquí:" debajo de cada una, porque debo completarlo yo con mi proceso real: A. Declaración de uso de IA, B. Herramienta y modelo, C. Prompt inicial completo, D. Prompts siguientes, E. Tres cambios que hice yo, F. Una línea de código que no entendía, G. Un error y cómo lo resolví. No inventes contenido ni incluyas claves.

=== GIT Y COMMITS ===
- El repositorio remoto es: https://github.com/Memcy-10/mundos-imaginarios.git
- Haz git init, conecta el remoto con git remote add origin https://github.com/Memcy-10/mundos-imaginarios.git, usa la rama main y sube los cambios con git push -u origin main.
- Debe haber mínimo 6 commits con mensajes claros, uno por parte:
  1. Parte 1: proyecto base (package.json, .gitignore, .env.example, estructura)
  2. Parte 2: parámetros, validaciones y objeto JSON (mundo.js)
  3. Parte 3: descripción con el modelo de texto (texto.js)
  4. Parte 4: generación y guardado de la imagen (imagen.js)
  5. Parte 5: orquestación, manejo de errores y ahorro de cuota (index.js)
  6. Parte 6: README y plantilla de PROMPT.md
  7. (Lo hago yo después) PROMPT.md completo y carpeta evidencias/
- Crea el .gitignore ANTES del primer commit. Nunca uses "git add ." si el .gitignore aún no existe.
- Antes de cada commit, confirma con git status que .env, data/, descripciones/ e imagenes/ NO aparecen para agregar.
- No abras ni leas el .env para hacer commits. Con git ls-files debo poder demostrar que .env no está versionado.
- Haz el commit al terminar cada parte y espera mi confirmación antes de seguir. Haz git push al final.

=== FORMA DE RESPONDER ===
Empieza por la Parte 1 (package.json, .gitignore, .env.example y estructura vacía) y espera mi confirmación antes de pasar a la siguiente parte. Dame un archivo a la vez, explica cada bloque en 2 líneas y no uses nada que no esté en la lista de herramientas permitidas.
```

# D. Prompts siguientes

## Primer mensaje después del prompt base

**Mi prompt:**

> explica qué ocurre en esta función

```js
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
```

**Qué respondió la IA:**

Esta función revisa que el programa tenga las tres variables necesarias antes de seguir.

- `const variables = [...]`: crea un arreglo con los nombres que deben existir: `NVIDIA_API_KEY`, `CLOUDFLARE_API_KEY` y `ACCOUNT_ID`.
- `const faltantes = variables.filter((nombre) => !process.env[nombre]);`: recorre cada variable y la marca como faltante si en `process.env` no tiene valor. Si por ejemplo `process.env.NVIDIA_API_KEY` es `undefined` o `''`, entra en la lista.
- `if (faltantes.length > 0)`: si hay al menos una variable faltante, se decide detener el flujo.
- `const mensaje = ...`: arma un mensaje en español según si falta 1 o varias variables.
- `throw new Error(mensaje)`: lanza una excepción con ese texto para que el `try/catch` del `main()` lo capture y muestre un error claro. Esto evita seguir con la ejecución si la configuración no está lista.

En otras palabras, esta función actúa como "validación de configuración": si algo falta, el programa no continúa con la llamada a las APIs.

**Qué hice:** entendí que la función valida la configuración antes de llamar a las APIs y la dejé en el programa.

## Segundo mensaje

**Mi prompt:**

> imagen.js 30-33
> explica esta parte

**Qué respondió la IA:**

Esa parte intenta "adivinar" el ID del mundo a partir del texto de la descripción.

```js
const id = descripcion.includes('mundo_') ? descripcion.split('mundo_')[1].split('.')[0] : null;
```

Se lee así:

- `descripcion.includes('mundo_')` devuelve `true` si la descripción contiene `mundo_`, y `false` si no.
- Si existe, `descripcion.split('mundo_')[1]` divide el texto por `"mundo_"` y toma la parte que viene después. Ejemplo: con `"mundo_3f9a1c2e.txt"` el resultado es `"3f9a1c2e.txt"`.
- Luego `.split('.')[0]` separa por el punto y toma solo la primera parte, así elimina `.txt`. Resultado final: `"3f9a1c2e"`.

Y después:

```js
const rutaDescripcion = id
  ? path.join(__dirname, '..', 'descripciones', `mundo_${id}.txt`)
  : path.join(__dirname, '..', 'descripciones');
```

- Si `id` existe, arma la ruta completa del archivo: `.../descripciones/mundo_3f9a1c2e.txt`.
- Si no existe, usa solo la carpeta: `.../descripciones`.

La idea es: "si la descripción trae el nombre del archivo del mundo, puedo construir la ruta exacta; si no trae ese dato, me quedo con la carpeta". Es un truco para reutilizar la descripción guardada, pero depende de que el texto contenga `mundo_xxx` de forma útil. Si no lo contiene, cae al `: null` y no puede identificar el archivo exacto.

**Qué hice:** con esa explicación entendí cómo funcionaba el bloque, pero no me quedó claro para qué servía, así que hice la siguiente pregunta.

## Tercer mensaje

**Mi prompt:**

> aja y qué función cumple, o sea, ¿para qué se hace?

**Qué respondió la IA:**

La intención de ese bloque parece ser identificar el id del mundo para volver a leer su archivo `.txt` desde `descripciones/`.

Pero hay un problema: en el flujo actual, `generarImagen(descripcion)` recibe el contenido de la descripción, no el nombre del archivo. Por eso buscar `"mundo_"` dentro del texto no es una forma fiable de obtener el id. Si no lo encuentra, `rutaDescripcion` apunta a la carpeta completa, no a un archivo concreto.

En consecuencia, ese bloque no cumple bien su propósito y puede terminar guardando la imagen como `mundo.jpg` en vez de `mundo_<id>.jpg`. Para hacerlo correctamente, el programa debería pasar el id por separado junto con la descripción (o pasar la ruta del archivo), sin intentar deducirlo del texto. No he cambiado el código.

**Qué hice:** concluí que el bloque estaba mal diseñado y lo reemplacé: ahora `generarImagen(id, descripcion)` recibe el id por separado (ver el cambio 2 de la sección E y el error de la sección G).

# E. Tres cambios que hice yo

## Primer cambio

En `index.js` había una función que quedó como código basura:

```js
function rutaMundo(id) {
  return path.join(__dirname, '..', 'data', `mundo_${id}.json`);
}
```

La eliminé porque era "dead code": no se usaba en ningún lugar del programa y solo agregaba ruido.

## Segundo cambio

La IA había dejado este bloque dentro de `imagen.js`, que deducía el id a partir del texto de la descripción:

```js
const id = descripcion.includes('mundo_') ? descripcion.split('mundo_')[1].split('.')[0] : null;
const rutaDescripcion = id
  ? path.join(__dirname, '..', 'descripciones', `mundo_${id}.txt`)
  : path.join(__dirname, '..', 'descripciones');

let textoDescripcion = descripcion;
if (fs.existsSync(rutaDescripcion) && fs.statSync(rutaDescripcion).isFile()) {
  textoDescripcion = fs.readFileSync(rutaDescripcion, 'utf8');
}

const promtFinal = textoDescripcion.trim();
```

Lo cambié para que `generarImagen` reciba el `id` como parámetro y valide que sea un texto no vacío, en lugar de intentar deducirlo desde la descripción:

```js
async function generarImagen(id, descripcion) {
  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error('El id del mundo no es válido.');
  }
```

Lo hice porque `imagen.js` solo debe encargarse de generar y guardar la imagen. Buscar el id dentro del texto no era fiable y podía hacer que la imagen quedara con un nombre incorrecto (más detalle en la sección G).

## Tercer cambio

En el `fetch` que envía el JSON del mundo al modelo de NVIDIA (el que escribe el texto que luego se manda a Cloudflare para crear la imagen), no había un límite máximo de tokens. Eso significaba que el modelo podía gastar todos los que quisiera y dejarme sin cuota gratuita después de una sola ejecución.

Por eso agregué la constante `MAX_TOKENS` para limitar los tokens de la respuesta. Le puse 250, aunque estoy pensando si más adelante conviene cambiar ese límite.

```js
const respuesta = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
  },
  body: JSON.stringify({
    model: MODELO_TEXTO,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: promptSistema },
      { role: 'user', content: JSON.stringify(mundo) },
    ],
  }),
  signal: AbortSignal.timeout(30000),
});
```

# F. Una línea de código que no entendía

Esta línea pertenece a `mundo.js`:

```js
const [situacion, mundo, ...colores] = args;
```

Al inicio creía que era una asignación de clave y valor, donde `situacion`, `mundo` y `colores` eran "claves". Pero después de pensarlo vi que no tenía sentido, porque así no se asignarían todos los colores, solo el último.

Lo que realmente ocurre es que `args` son los argumentos que le envío al programa desde la terminal, y esta línea los reparte por posición: el primero va a `situacion`, el segundo a `mundo`, y los tres puntos (`...`) son el operador *rest*, que junta todos los argumentos que sobran en un arreglo llamado `colores`. Gracias a eso no tengo que escribir `color1`, `color2`, `color3`, etc., y el código queda más corto.

En resumen: `colores` queda como un arreglo con los argumentos restantes, después de sacar `situacion` y `mundo`.

# G. Un error y cómo lo resolví

## Resumen

Al ejecutar el programa, el Paso 2 (modelo de texto de NVIDIA) fallaba siempre con el mensaje "El servicio tardó demasiado en responder." Lo resolví alineando la petición `fetch` con el ejemplo oficial de la página del modelo en build.nvidia.com y aumentando el tiempo de espera.

## 1. El error

Mensaje que mostraba el programa:

```text
Paso 1: mundo guardado en data/mundo_5df091c3.json
El servicio tardó demasiado en responder.
```

Se repitió con tres mundos distintos (`mundo_5df091c3`, `mundo_239be04e` y `mundo_b0344cbf`). El Paso 1 siempre funcionaba y fallaba en el Paso 2.

## 2. Qué probé

| # | Qué hice | Resultado |
|---|----------|-----------|
| 1 | Aumenté el tiempo de espera del `fetch` | Mismo error |
| 2 | Creé un archivo temporal `probar-key.js` con un mensaje corto ("Di hola") y `max_tokens: 20` | Estado HTTP 200: la API key y el modelo funcionan |
| 3 | Volví a ejecutar el programa pensando que era solo el tiempo | Falló otra vez |
| 4 | Comparé mi petición con el ejemplo oficial de NVIDIA y corregí las diferencias | Funcionó |

Con la prueba 2 descarté dos causas: la clave no estaba mal y el modelo no estaba retirado. Probé con 20 tokens porque quería saber si el problema era la conexión o la respuesta larga.

## 3. Lo que cambié en la petición

**Antes:**

```js
const respuesta = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'meta/llama-3.2-90b-vision-instruct',
    max_tokens: 250,
    messages: [
      { role: 'system', content: promptSistema },
      { role: 'user', content: JSON.stringify(mundo) },
    ],
  }),
  signal: AbortSignal.timeout(120000),
});
```

**Después:**

```js
const respuesta = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'meta/llama-3.2-90b-vision-instruct',
    max_tokens: 250,
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
  signal: AbortSignal.timeout(120000),
});
```

Diferencias:

- **Cabecera nueva:** `Accept: 'application/json'`.
- **Parámetros nuevos:** `temperature: 1`, `top_p: 1` y `stream: false`.
- **Formato del mensaje del usuario:** antes `content` era un texto directo y ahora es un arreglo de partes (`[{ type: 'text', text: ... }]`), como en el ejemplo de NVIDIA.
- **Tiempo de espera:** lo subí a 240 segundos para tener margen.

## 4. Resultado

```text
Paso 1: mundo guardado en data/mundo_b066729f.json
Paso 2: descripción guardada en descripciones/mundo_b066729f.txt
Respuesta de Cloudflare: {
  "success": true,
  "result": {
    "image": "base64..."
  }
}
Paso 3: imagen guardada en imagenes/mundo_b066729f.jpg
Listo. Revisa la carpeta imagenes/
```

Los tres pasos funcionaron y la imagen se generó.

## 5. Lo que no sé con seguridad

Cambié varias cosas al mismo tiempo, así que no puedo asegurar cuál fue la que realmente lo resolvió. Lo que sí sé:

- La API key y el modelo estaban bien (prueba con estado 200).
- La prueba corta con `content` como texto simple también funcionó, así que ese formato por sí solo parece aceptado.
- Es posible que la diferencia estuviera en que la respuesta de 250 tokens tarda más que la de 20 y en el tiempo de espera, y no solo en la sintaxis.


## 6. Lo que aprendí

- Cuando un servicio "tarda demasiado", conviene probar la clave y el modelo con una petición mínima aparte, antes de culpar al tiempo de espera.
- Copiar la forma de la petición del ejemplo oficial de la documentación reduce los errores.
- Al corregir un error, conviene cambiar una cosa a la vez para saber qué lo arregló.