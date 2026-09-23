/**
 * audiopapel · contador de códigos QR generados
 * =============================================
 * Google Apps Script para pegar en una hoja de cálculo de Google
 * (Extensiones → Apps Script). Ver contador/LEEME.md.
 *
 * Qué recibe: solo cuántos códigos se han generado y en qué modo
 * (audio o texto). Nunca la voz, el texto ni el contenido de los QR.
 * Qué guarda: una fila por día en la hoja "Diario":
 *     Fecha | Mensajes | QR | QR audio | QR texto
 *
 *   GET  → devuelve los totales:   {"mensajes":123,"qrs":4567,...}
 *   POST → suma una generación:    cuerpo {"qrs":6,"modo":"audio"}
 */

const HOJA = 'Diario';
const ZONA = 'Europe/Madrid';
const MAX_QR_POR_MENSAJE = 100;   // 3 minutos de voz ocupan unos 40 QR pequeños

function doGet() {
  return responder(totales());
}

function doPost(e) {
  let datos = {};
  try { datos = JSON.parse(e.postData.contents); } catch (err) { /* cuerpo no válido */ }
  const qrs = Math.floor(Number(datos.qrs));
  const modo = datos.modo === 'texto' ? 'texto' : 'audio';
  // Filtro de cordura: el contador es público y cualquiera podría llamarlo.
  if (!(qrs >= 1 && qrs <= MAX_QR_POR_MENSAJE)) return responder({ error: 'dato no válido' });

  // El cerrojo evita que dos visitas a la vez se pisen al sumar.
  const cerrojo = LockService.getScriptLock();
  cerrojo.waitLock(10000);
  try {
    const hoja = hojaDiario();
    const hoy = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd');
    let fila = hoja.getLastRow();
    if (fila < 2 || textoFecha(hoja.getRange(fila, 1).getValue()) !== hoy) {
      hoja.appendRow([hoy, 0, 0, 0, 0]);
      fila = hoja.getLastRow();
      hoja.getRange(fila, 1).setNumberFormat('@').setValue(hoy);
    }
    const celdas = hoja.getRange(fila, 2, 1, 4);
    const [mensajes, total, audio, texto] = celdas.getValues()[0].map(Number);
    celdas.setValues([[
      mensajes + 1,
      total + qrs,
      audio + (modo === 'audio' ? qrs : 0),
      texto + (modo === 'texto' ? qrs : 0),
    ]]);
    SpreadsheetApp.flush();
    CacheService.getScriptCache().remove('totales');
  } finally {
    cerrojo.releaseLock();
  }
  return responder(totales());
}

/** Suma todas las filas. Se guarda un minuto en caché: la portada lo pide en cada visita. */
function totales() {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get('totales');
  if (guardado) return JSON.parse(guardado);
  const hoja = hojaDiario();
  const res = { mensajes: 0, qrs: 0, qrsAudio: 0, qrsTexto: 0 };
  if (hoja.getLastRow() >= 2) {
    for (const [, m, q, a, t] of hoja.getRange(2, 1, hoja.getLastRow() - 1, 5).getValues()) {
      res.mensajes += Number(m) || 0;
      res.qrs += Number(q) || 0;
      res.qrsAudio += Number(a) || 0;
      res.qrsTexto += Number(t) || 0;
    }
  }
  cache.put('totales', JSON.stringify(res), 60);
  return res;
}

function hojaDiario() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA);
    hoja.appendRow(['Fecha', 'Mensajes', 'QR', 'QR audio', 'QR texto']);
    hoja.getRange(1, 1, 1, 5).setFontWeight('bold');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function textoFecha(valor) {
  return valor instanceof Date ? Utilities.formatDate(valor, ZONA, 'yyyy-MM-dd') : String(valor);
}

function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

/** Para probar desde el editor: Ejecutar → pruebaContador. Suma 1 mensaje de 3 QR. */
function pruebaContador() {
  Logger.log(doPost({ postData: { contents: JSON.stringify({ qrs: 3, modo: 'audio' }) } }).getContent());
}
