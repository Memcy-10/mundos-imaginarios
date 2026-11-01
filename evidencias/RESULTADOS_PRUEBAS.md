# Evidencias reales de ejecución — mundos-ia

Este registro reúne ejecuciones realizadas con el programa y sus servicios reales. No se presentan respuestas simuladas como resultados reales. Las ocho capturas recibidas están en `capturas/`.

## 1. Mundo Saharia: generación completa

Argumentos usados:

```powershell
npm start -- "Una tormenta de arena revela una ciudad enterrada" "Saharia, una ciudad de piedra alrededor de un oasis luminoso" ámbar turquesa marfil cobre violeta
```

La captura `capturas/01-saharia-generacion.png` muestra que se guardó el JSON y la descripción, Cloudflare respondió con `success: true`, se guardó el JPG y el programa terminó con “Listo”.

Archivos reales guardados:

- `mundo_887bb903/mundo_887bb903.json`
- `mundo_887bb903/mundo_887bb903.txt`
- `mundo_887bb903/mundo_887bb903.jpg`

## 2. Saharia: segunda ejecución y reutilización

Se repitieron los mismos argumentos. La captura `capturas/02-saharia-reutilizacion.png` muestra que el programa reutilizó tanto la descripción como la imagen y reportó que no volvió a llamar a los modelos.

## 3. Mundo Nacar: segunda generación completa

Argumentos usados:

```powershell
npm start -- "Una marea luminosa cubre un archipiélago al amanecer" "Nacar, islas de coral con puentes de cristal sobre un mar tranquilo" coral azul índigo plata verde
```

La captura `capturas/03-nacar-generacion.png` muestra el guardado del JSON y la descripción, `success: true` de Cloudflare, el JPG guardado y la finalización correcta.

Archivos reales guardados:

- `mundo_f8a6a6b5/mundo_f8a6a6b5.json`
- `mundo_f8a6a6b5/mundo_f8a6a6b5.txt`
- `mundo_f8a6a6b5/mundo_f8a6a6b5.jpg`

## 4. Errores reales de validación

Las capturas `capturas/04-error-argumentos.png` y `capturas/05-error-vacio-colores-repetidos.png` muestran las salidas de estos tres casos:

| Caso | Resultado visible |
|---|---|
| Argumentos insuficientes | Mensaje indicando que se requieren exactamente 7 argumentos, con ejemplo de uso. |
| Argumento vacío o compuesto por espacios | Mensaje indicando que ningún argumento puede estar vacío ni tener solo espacios. |
| Color repetido con distinta capitalización | Mensaje indicando que los 5 colores deben ser distintos sin distinguir mayúsculas/minúsculas. |

## 5. Experimentos `npm publish --dry-run`

No se publicó el paquete: ambas pruebas usan `--dry-run`.

### Con `.gitignore`

La captura `capturas/06-npm-dry-run-con-gitignore.png` muestra el listado del paquete. En esa ejecución aparecen el código, la documentación y archivos bajo `evidencias/`; no aparece `.env`.

### Con `.gitignore` temporalmente renombrado

La captura `capturas/07-npm-dry-run-sin-gitignore.png` muestra que, al renombrar temporalmente `.gitignore` a `.gitignore.off`, el paquete sí incluye `.env` y archivos generados de `data/`, `descripciones/` e `imagenes/`. El archivo `.gitignore` fue restaurado después de la prueba.

La salida solo revela el nombre `.env` y su tamaño; su contenido no se abrió, leyó ni copió a esta evidencia. El resultado demuestra que retirar las reglas de exclusión permite que el paquete incluya archivos locales sensibles y generados.

## 6. Verificación de `.env` en Git

La captura `capturas/08-git-ls-files-env.png` muestra que `git ls-files -- .env` no devolvió ninguna ruta y que el mensaje final confirmó que `.env` no está versionado.

## 7. Archivos y organización

- `capturas/`: capturas de las ejecuciones, errores, dry-runs y comprobación de Git.
- `mundo_887bb903/`: JSON, descripción e imagen reales de Saharia.
- `mundo_f8a6a6b5/`: JSON, descripción e imagen reales de Nacar.
- `mundo_b066729f/`: archivos de un mundo generado anteriormente, conservados como evidencia adicional.

Las dos imágenes principales se guardaron como JPG y se pueden abrir desde sus carpetas respectivas. Los screenshots documentan sus ejecuciones reales.
