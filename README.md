# audiopapel

**La voz, en papel.** Graba un mensaje de voz, conviértelo en códigos QR que puedes imprimir y haz que cualquier móvil lo vuelva a hacer sonar. Sin apps, sin cuentas y sin servidores: todo ocurre en el navegador.

👉 **https://audiopapel.com**

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `index.html` | La portada de audiopapel.com. **Generado** a partir de `portada_fuente.html`. |
| `audio_en_papel.html` | La herramienta: grabar, crear los QR, escanear y escuchar. Un solo archivo con todo dentro. **Generado** a partir de `plantilla_fuente.html`. |
| `plantilla_fuente.html` | Código de la herramienta, comentado en español paso a paso. **Aquí se edita.** |
| `portada_fuente.html` | Código de la portada. **Aquí se edita.** |
| `construir.py` | Genera `index.html` y `audio_en_papel.html` incrustando las librerías de `vendor/`. |
| `vendor/` | Codec 2 (WebAssembly), qrcode-generator y jsQR. |
| `fuentes/` | Tipografías servidas desde el propio sitio. |
| `privacidad.html`, `aviso-legal.html` | Páginas legales. |

Después de editar un archivo `*_fuente.html`:

```sh
python construir.py
```

## Cómo funciona

```
micrófono → 8 kHz mono → Codec 2 (1200 ó 700 bit/s) → Base32 → trozos numerados → QR
cámara → leer cabecera → ordenar y juntar → Codec 2 → altavoz
```

Cada QR es un enlace a la herramienta con los datos tras el `#`, una parte de la dirección que el navegador nunca envía al servidor:

```
https://audiopapel.com/audio_en_papel.html#AUDIORR2:K7P2QX:2:7:C2-1200:GEZDGNBV…
                                           protocolo:id:bloque:total:códec:datos
```

Los datos van en Base32 (solo mayúsculas y cifras) para que el QR use su modo alfanumérico, que cabe un 22 % más que el modo byte.

## Licencia

El código y los textos propios de audiopapel están bajo la **[PolyForm Noncommercial License 1.0.0](LICENSE)**: úsalo, estúdialo, modifícalo y compártelo gratis para cualquier fin **no comercial** (en clase, en casa, en proyectos personales o educativos). Para un uso comercial, [abre una incidencia](https://github.com/dgedise/audiopapel/issues).

### Componentes de terceros

- **Codec 2** © David Rowe — LGPL 2.1 — <https://github.com/drowe67/codec2>, compilado a WebAssembly por [codec2-web](https://github.com/belteshazzar/codec2-web) (MIT).
- **qrcode-generator** © Kazuhiko Arase — MIT.
- **jsQR** © Cosmo Wolfe — Apache 2.0.
- Tipografías **Archivo**, **Atkinson Hyperlegible**, **IBM Plex Mono** y **Kalam** — SIL Open Font License.

«QR Code» es una marca registrada de DENSO WAVE INCORPORATED.
