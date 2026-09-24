/* =====================================================================
   SERVICE WORKER DE audiopapel  ·  para que funcione SIN CONEXIÓN
   ---------------------------------------------------------------------
   Un service worker es un pequeño programa que el navegador guarda junto a
   la web y que se pone EN MEDIO de cada petición de la página. Lo usamos
   para guardar una copia de audiopapel en el móvil y servirla cuando no
   hay Internet (en un sótano, en el campo, en modo avión…). Así la web
   instalada en la pantalla de inicio funciona igual en Android que en
   iPhone, con o sin conexión.

   Estrategia:
     · Páginas (HTML): primero la RED, para que las novedades lleguen al
       momento; si no hay red, o tarda más de 4 s, la copia guardada.
     · Lo demás (fuentes, iconos): primero la COPIA, que casi nunca cambia.

   construir.py genera sw.js a partir de este archivo y pone en VERSION una
   huella del contenido de todos los archivos. Si cambia cualquiera, cambia
   sw.js; el navegador lo nota, instala el nuevo, que descarga otra vez
   todo, y borra la copia vieja.
   Solo se tocan peticiones a esta misma web: el contador de Google y
   cualquier otra dirección pasan sin intervenir.
   ===================================================================== */
const VERSION = 'cf1fd30ab931';
const CACHE = 'audiopapel-' + VERSION;
const ARCHIVOS = [
    "./",
    "index.html",
    "audio_en_papel.html",
    "privacidad.html",
    "creditos.html",
    "site.webmanifest",
    "favicon.svg",
    "favicon.ico",
    "apple-touch-icon.png",
    "icono-192.png",
    "icono-512.png",
    "fuentes/fuentes.css",
    "fuentes/Archivo-normal-400_900-latin-ext.woff2",
    "fuentes/Archivo-normal-400_900-latin.woff2",
    "fuentes/AtkinsonHyperlegible-italic-400-latin-ext.woff2",
    "fuentes/AtkinsonHyperlegible-italic-400-latin.woff2",
    "fuentes/AtkinsonHyperlegible-normal-400-latin-ext.woff2",
    "fuentes/AtkinsonHyperlegible-normal-400-latin.woff2",
    "fuentes/AtkinsonHyperlegible-normal-700-latin-ext.woff2",
    "fuentes/AtkinsonHyperlegible-normal-700-latin.woff2",
    "fuentes/IBMPlexMono-normal-400-latin-ext.woff2",
    "fuentes/IBMPlexMono-normal-400-latin.woff2",
    "fuentes/IBMPlexMono-normal-500-latin-ext.woff2",
    "fuentes/IBMPlexMono-normal-500-latin.woff2",
    "fuentes/IBMPlexMono-normal-600-latin-ext.woff2",
    "fuentes/IBMPlexMono-normal-600-latin.woff2",
    "fuentes/Kalam-normal-400-latin-ext.woff2",
    "fuentes/Kalam-normal-400-latin.woff2",
    "fuentes/Kalam-normal-700-latin-ext.woff2",
    "fuentes/Kalam-normal-700-latin.woff2"
  ];
const ESPERA_RED_MS = 4000;

// Instalar: descargar todo. cache: 'reload' se salta la caché HTTP normal,
// para no guardar una versión de hace unos minutos.
self.addEventListener('install', (evento) => {
  evento.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ARCHIVOS.map(ruta => new Request(ruta, { cache: 'reload' })));
    await self.skipWaiting();                  // no esperar a que se cierren las pestañas viejas
  })());
});

// Activar: borrar las copias de versiones anteriores y encargarse ya de las
// páginas abiertas.
self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    for (const nombre of await caches.keys()) {
      if (nombre.startsWith('audiopapel-') && nombre !== CACHE) await caches.delete(nombre);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET' || new URL(peticion.url).origin !== location.origin) return;
  const esPagina = peticion.mode === 'navigate' || peticion.destination === 'document';
  evento.respondWith(esPagina ? primeroLaRed(peticion) : primeroLaCopia(peticion));
});

/** La dirección sin "?…": https://audiopapel.com/?x=1 y https://audiopapel.com/ son la misma página. */
function sinConsulta(peticion) {
  const url = new URL(peticion.url);
  url.search = '';
  return url.href;
}

async function primeroLaRed(peticion) {
  const cache = await caches.open(CACHE);
  const deLaRed = fetch(peticion).then(respuesta => {
    // Solo guardamos respuestas buenas y directas (una redirección no vale como página).
    if (respuesta.ok && !respuesta.redirected) cache.put(sinConsulta(peticion), respuesta.clone());
    return respuesta;
  });
  deLaRed.catch(() => {});                     // si falla, ya lo gestionamos abajo
  try {
    return await Promise.race([
      deLaRed,
      new Promise((_, falla) => setTimeout(() => falla(new Error('la red tarda')), ESPERA_RED_MS)),
    ]);
  } catch (_) {
    const guardada = await cache.match(sinConsulta(peticion));
    return guardada || deLaRed;                // sin copia: esperamos a la red, llegue o no
  }
}

async function primeroLaCopia(peticion) {
  const guardada = await caches.match(peticion, { ignoreSearch: true });
  return guardada || fetch(peticion);
}
