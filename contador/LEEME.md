# Contador de códigos QR (Google Sheets + Apps Script)

La web envía, cada vez que alguien genera códigos, **solo** esto: `{"qrs": 6, "modo": "audio"}`.
Ni voz, ni texto, ni contenido de los QR. La hoja de cálculo lo suma por días.

## Puesta en marcha (una sola vez, unos 5 minutos)

1. Crea una hoja de cálculo nueva en Google Drive, por ejemplo **«audiopapel · contador»**.
2. En la hoja: **Extensiones → Apps Script**. Borra lo que haya y pega el contenido de `Codigo.gs`. Guarda.
3. Arriba, elige la función **`pruebaContador`** y pulsa **Ejecutar**. Google pedirá permisos:
   *Revisar permisos → tu cuenta → Configuración avanzada → Ir a (nombre del proyecto) → Permitir*.
   Es tu propio script: el aviso de "aplicación no verificada" es normal. Comprueba que en la hoja
   ha aparecido la pestaña **Diario** con una fila de prueba (3 QR). Puedes borrar esa fila después.
4. **Implementar → Nueva implementación → tipo «Aplicación web»**:
   - *Ejecutar como*: **Yo**
   - *Quién tiene acceso*: **Cualquier usuario** (sin iniciar sesión; si no, la web no puede escribir)
   - Pulsa **Implementar** y copia la **URL de la aplicación web** (acaba en `/exec`).
5. Pega esa URL en `contador/url.txt` (una sola línea) y ejecuta `python construir.py`.
   Se aplica a la portada y a la herramienta a la vez. Sube los cambios con `git push`.

Para comprobarlo, abre la URL en el navegador: debe responder algo como
`{"mensajes":1,"qrs":3,"qrsAudio":3,"qrsTexto":0}`.

## Si cambias el script

Tras editar `Codigo.gs` en Apps Script: **Implementar → Gestionar implementaciones → editar (lápiz)
→ Versión: nueva → Implementar**. Así la URL no cambia.

## Seguridad

- **`@OnlyCurrentDoc`** (primera línea del script) limita sus permisos a esta hoja: aunque alguien lograra modificar el script, no podría llegar a tus otras hojas.
- La dirección `/exec` solo ejecuta `doGet` (leer el total) y `doPost` (sumar un número). No da acceso a la hoja ni a tu cuenta.
- Solo se guardan números: no se puede inyectar texto ni fórmulas en la hoja.
- Si alguien abusara del contador (inflarlo o saturarlo): **Implementar → Gestionar implementaciones → Archivar** y crear una nueva; cambia la URL en `contador/url.txt`.
- Lo que de verdad protege todo esto: **verificación en dos pasos** en tu cuenta de Google, en GitHub y en OVH.

## Detalles

- Google «despierta» el script si llevaba un rato parado: la primera petición puede tardar 10-20 segundos. La web no espera por él: el aviso y el sello simplemente aparecen más tarde.

- No cuenta lo que se genera abriendo la web en local (`file://`, `localhost`, red de casa): así las pruebas no inflan el número.
- El número es de buena fe: la URL es pública y alguien podría enviar datos falsos. El script rechaza valores absurdos (más de 100 QR por mensaje).
- Si el contador no responde, la web funciona igual: simplemente no muestra el total.
- Límites de Google para cuentas gratuitas: de sobra para miles de usos al día.
