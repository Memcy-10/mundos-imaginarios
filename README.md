# mundos-ia

Este proyecto crea bocetos visuales rápidos de mundos imaginarios a partir de una situación, un mundo y 5 colores. El flujo funciona así:

1. Se recibe la información por parámetros en la terminal.
2. Se guarda en un JSON en `data/`.
3. Se envía a un modelo de texto para generar una descripción.
4. Esa descripción se usa para pedir una imagen al modelo de generación.
5. La imagen se guarda en `imagenes/` para revisarla después.

## ¿Qué hace el programa?

El programa recibe una frase de situación, una descripción del mundo y 5 colores, los valida y genera un objeto JSON con un `id` calculado a partir de esos datos. Luego, con ese JSON, consulta un modelo de lenguaje para describir una imagen y un modelo de generación para crear la imagen final.

## Configuración

1. Copia el archivo `.env.example` a `.env`.
2. Completa tus claves reales en `.env`.
3. Asegúrate de que las variables sean:
   - `NVIDIA_API_KEY`
   - `CLOUDFLARE_API_KEY`
   - `ACCOUNT_ID`

No escribas claves reales en código, comentarios ni mensajes.

## Ejemplo de uso

```bash
npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta
```

Salida esperada en consola:

```text
Paso 1: mundo guardado en data/mundo_3f9a1c2e.json
Paso 2: descripción guardada en descripciones/mundo_3f9a1c2e.txt
Paso 3: imagen guardada en imagenes/mundo_3f9a1c2e.jpg
Listo. Revisa la carpeta imagenes/
```

Si vuelves a ejecutar el mismo comando, el programa detecta que ya existen los archivos y no vuelve a llamar a la API.

## Estructura del proyecto

```text
mundos-ia/
├── src/
│   ├── index.js
│   ├── mundo.js
│   ├── texto.js
│   └── imagen.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── PROMPT.md
├── data/
├── descripciones/
├── imagenes/
└── node_modules/
```

## Servicios usados

### NVIDIA (texto)

Se usa la API compatible con OpenAI de NVIDIA:
- URL: https://integrate.api.nvidia.com/v1/chat/completions
- Modelo: `meta/llama-3.2-90b-vision-instruct`
- Documentación: https://docs.nvidia.com/nim/large-language-models/latest/index.html

### Cloudflare Workers AI (imagen)

Se usa Cloudflare Workers AI para generar imágenes:
- URL: https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell
- Modelo: `FLUX.1-schnell`
- Documentación: https://developers.cloudflare.com/workers-ai/

## Experimento npm publish --dry-run

Este espacio está listo para que anotes lo que pasó al renombrar `.gitignore` a `.gitignore.off` y por qué es peligroso.

```text
Resultado esperado no inventado: deja aquí lo que observes al ejecutar npm publish --dry-run.
```

### ¿Por qué es peligroso renombrar `.gitignore`?

Porque Git deja de ignorar automáticamente archivos sensibles o temporales como `node_modules/`, `.env`, `data/`, `descripciones/` e `imagenes/`, y eso puede hacer que se suban elementos no deseados al repositorio.

## Preguntas de reflexión

1. ¿Por qué el id se calcula sin la fecha? ¿Qué pasaría si la incluyeras?
   Tu respuesta aquí:

2. ¿Por qué se le pide al modelo de texto la descripción en inglés? Si puedes, prueba con una en español y compara las imágenes.
   Tu respuesta aquí:

3. ¿Qué diferencia hay entre una respuesta JSON de texto y una respuesta con los bytes de una imagen? ¿Qué es base64?
   Tu respuesta aquí:

4. ¿Qué pasaría si guardas la imagen con 'utf-8'? ¿Por qué?
   Tu respuesta aquí:

5. ¿Qué pasos consumen cuota gratuita y cómo evitaste repetirlos?
   Tu respuesta aquí:

6. Si usaste IA: ¿qué fue lo más difícil de pedirle y qué parte tuviste que corregir tú?
   Tu respuesta aquí:

## Nota importante

Este proyecto nunca debe imprimir claves en consola ni mostrar el contenido del archivo `.env`. Solo se accede con `process.env.NOMBRE` y se guardan variables vacías en `.env.example` para dar la estructura sin revelar secretos.
