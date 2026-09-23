# Genera los dos archivos que se publican:
#   · audio_en_papel.html  ← plantilla_fuente.html + librerías de vendor/ + wasm de Codec 2
#   · index.html           ← portada_fuente.html + generador de QR (para la demo)
#   python construir.py
import base64
import re

qr = open('vendor/qrcode.min.js', encoding='utf-8').read()
jsqr = open('vendor/jsQR.js', encoding='utf-8').read()
glue = open('vendor/codec2.js', encoding='utf-8').read()

# ---------------------------------------------------------------- contador
# Dirección del contador de QR (Google Apps Script). Vacía = desactivado.
try:
    contador = open('contador/url.txt', encoding='utf-8').read().strip()
except FileNotFoundError:
    contador = ''
assert contador == '' or contador.startswith('https://script.google.com/'), 'contador/url.txt no parece una URL de Apps Script'
print('contador:', contador or '(desactivado)')

# ---------------------------------------------------------------- herramienta
plantilla = open('plantilla_fuente.html', encoding='utf-8').read()

# El pegamento de Emscripten es un módulo ES6; lo convertimos en script clásico.
glue = re.sub(r'export default createCodec2;?\s*$', '', glue)
glue = glue.replace('import.meta.url', 'document.baseURI')
assert 'import.meta' not in glue and 'export ' not in glue

wasm = base64.b64encode(open('vendor/codec2.wasm', 'rb').read()).decode()

for lib in (qr, jsqr, glue):
    assert '</script' not in lib.lower()

salida = (plantilla
          .replace('__QRCODE_JS__', qr)
          .replace('__JSQR_JS__', jsqr)
          .replace('__CODEC2_GLUE_JS__', glue)
          .replace('__CODEC2_WASM_BASE64__', wasm)
          .replace('__CONTADOR_URL__', contador))
assert '__CODEC2' not in salida.replace('CODEC2_WASM_BASE64 =', '')

open('audio_en_papel.html', 'w', encoding='utf-8', newline='\n').write(salida)
print('escrito audio_en_papel.html', len(salida.encode('utf-8')), 'bytes')

# ---------------------------------------------------------------- portada
portada = open('portada_fuente.html', encoding='utf-8').read().replace('__QRCODE_JS__', qr).replace('__CONTADOR_URL__', contador)
assert '__QRCODE_JS__' not in portada
open('index.html', 'w', encoding='utf-8', newline='\n').write(portada)
print('escrito index.html', len(portada.encode('utf-8')), 'bytes')
