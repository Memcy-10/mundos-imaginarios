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

Ejecuté `npm publish --dry-run` sin publicar el paquete. Con `.gitignore` presente, npm indicó que lo usaría para excluir archivos porque no hay un `.npmignore`. El listado no incluyó `.env` ni las carpetas `data/`, `descripciones/` e `imagenes/`.

Después renombré temporalmente `.gitignore` a `.gitignore.off` y repetí el comando. El listado del paquete sí incluyó `.env`, los archivos JSON de `data/`, las descripciones y las imágenes. Al terminar, restauré el nombre `.gitignore`.

### ¿Por qué es peligroso renombrar `.gitignore`?

En este experimento, npm usó `.gitignore` como regla de exclusión para el paquete cuando no había `.npmignore`. Al renombrarlo, esos archivos dejaron de excluirse del paquete; por eso el listado incluyó `.env` y archivos generados. Si se publicara sin revisar ese listado, podrían filtrarse claves y distribuirse archivos que no deberían formar parte del paquete. El `--dry-run` solo mostró el nombre y tamaño de `.env`

## Preguntas de reflexión

1. ¿Por qué el id se calcula sin la fecha? ¿Qué pasaría si la incluyeras?
   No se calcula con la fecha debido a que esta es cambiante entonces si se calculara con la fecha se podria repetir la misma descripcion y volver a pedir imagenes basicamente gastando tokens innecesariamente debido a que el tiempo no se repite entonces incluso si repetimos el mismo comando exacto la fecha ya cambio incluso si lo haces rapido habrian pasado algunos segundos y se generaria un id nuevo y totalmente diferente permitiendo que se repitan

2. ¿Por qué se le pide al modelo de texto la descripción en inglés? Si puedes, prueba con una en español y compara las imágenes.
   No lo intente debido a que ya se la respuesta es que se pide la descripcion en ingles debido a que las ia de creacion de imagenes fueron entrenadas en ese idioma entonces lo entienden perfectamente y agstarian la menor cantidad de tokens mientras que si se la mando por ejemplo en español la ia tendra que traducirlo y algunas palabras no se traduciran correctamente ademas de que gastara "tokens" haciendo esa traduccion por ende dando una imagen de peor calidad en todos los sentidos

3. ¿Qué diferencia hay entre una respuesta JSON de texto y una respuesta con los bytes de una imagen? ¿Qué es base64?
   Básicamente, JSON organiza datos en propiedades y valores, como una descripción de texto. Los bytes de una imagen son datos binarios y no son texto común, por eso no se ponen directamente como texto en JSON. Base64 convierte esos bytes en una cadena de texto que sí se puede incluir en JSON; después, el programa convierte esa cadena otra vez a bytes para guardar la imagen.

4. ¿Qué pasaría si guardas la imagen con 'utf-8'? ¿Por qué?
   La imagen esta compuesta de bytes y cuando lo convertimos a base64 es una imagen decodificada basicamente texto ahora esto si lo convirtieramos a utf-8 que es para texto pero es muy diferente de base64 provocando que se arruine la decodificacion de la imagen imposibilitando su reconstruccion

5. ¿Qué pasos consumen cuota gratuita y cómo evitaste repetirlos?
   Pues por lo que entiendo es cuando se llaman a las apis y mayormente los pasos que lo hacen es llamar varias veces a las apis o no revisar si algun archivo ya esta llamar a la api que el software vea que ya existe y tire a la basura lo que le devolvio la api ahi estarias gastando tokens a lo bruto entonces para evitar hice que antes de llamar a cualquier api revisa si ya existen los archivos ya cuando estoy seguro que no existen ahi si llamo las apis para reducir en lo mas posible el consumo.
   Otra cosa que consume bastante es no limitar las respuesta que nos den las apis en mi caso la de nvidia si no le ponia limita gastaba tokens a lo loco entonces le puse un limite la verdad algo bajo para evitar quemar tokens a lo bobo

6. Si usaste IA: ¿qué fue lo más difícil de pedirle y qué parte tuviste que corregir tú?
   La logica de contacto con apis le explique que usaba y en que servicio usaba como el de cloudflare e imagenes y el de nvidia y texto en el de nvidia tuve bastantes errores debido a que la ia aunque no lo parezca es vaga toma atajos y al inicio hace el codigo con todo lo necesario pero despues se va degradando y escribiendo lo que considera que es lo minimo para que funcione debido a que en la peticion estaba no exactamente mal redactada pero le faltaban algunas cositas para la peticion y me toco cambiarla desde el tiempo de espera hasta su estructura base.
   Porque la ia considero que en una peticion a la ia de texto de nvidia deberia responder en 30 segundos lo cual es exageradamente bajo.
   Otro error que hubo es que agrego codigo basura y se paso por sus circuitos la logica en el flujo de trabajo agregando algo que no debia a imagen.js haciendo que se buscara un id cuando imagen solo se debe de encargar de la imagen y el como se manega esta donde se guarda etc etc

## Nota importante

Este proyecto nunca debe imprimir claves en consola ni mostrar el contenido del archivo `.env`. Solo se accede con `process.env.NOMBRE` y se guardan variables vacías en `.env.example` para dar la estructura sin revelar secretos.
