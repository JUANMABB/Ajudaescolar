/* Ajudaescolar · trabajador de fondo (service worker)
   Guarda una copia de la web en el iPad para que funcione sin internet.
   - Páginas: primero intenta la versión nueva de internet; si no hay conexión, usa la copia guardada.
   - Fuentes, iconos y estilos: usa la copia guardada (cambian muy poco).
   Al publicar cambios importantes, subir el número de VERSION para renovar la copia. */

const VERSION = "0.1.0";
const CACHE = "ajudaescolar-" + VERSION;
const FILES = [
  "./",
  "index.html",
  "pruebas/lapiz.html",
  "pruebas/voces.html",
  "manifest.webmanifest",
  "assets/base.css",
  "assets/fonts/Andika-Regular.woff2",
  "assets/fonts/Andika-Bold.woff2",
  "assets/fonts/AtkinsonHyperlegible-Regular.woff2",
  "assets/fonts/AtkinsonHyperlegible-Bold.woff2",
  "assets/icons/icon-180.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ajudaescolar-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  const isPage = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isPage) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});
