/* Ajudaescolar · trabajador de fondo (service worker)
   Guarda una copia de la web en el iPad para que funcione sin internet.
   - Páginas: primero intenta la versión nueva de internet; si no hay conexión, usa la copia guardada.
   - Fuentes, iconos y estilos: usa la copia guardada (cambian muy poco).
   Al publicar cambios importantes, subir el número de VERSION para renovar la copia.

   Las páginas se guardan con su dirección "limpia" (sin .html), que es la que sirve Cloudflare.
   Nunca se guarda ni se entrega una respuesta que venga de una redirección: Safari la rechaza
   al abrir una página y la web dejaría de funcionar sin conexión. */

const VERSION = "0.1.1";
const CACHE = "ajudaescolar-" + VERSION;
const FILES = [
  "./",
  "pruebas/lapiz",
  "pruebas/voces",
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

// Dirección limpia: /pruebas/lapiz.html -> /pruebas/lapiz ; /index.html -> /
function cleanKey(url) {
  const u = new URL(url, self.location.href);
  u.search = ""; u.hash = "";
  u.pathname = u.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  return u.href;
}

// Copia sin la marca de "redirigida", para que Safari la acepte
async function clean(res) {
  if (!res || !res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const f of FILES) {
      const res = await clean(await fetch(f, { cache: "no-cache" }));
      if (res.ok) await cache.put(cleanKey(f), res);
    }
    await self.skipWaiting();
  })());
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
  const key = cleanKey(req.url);

  const isPage = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isPage) {
    event.respondWith((async () => {
      try {
        const res = await clean(await fetch(req));
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
        return res;
      } catch (e) {
        return (await caches.match(key)) || (await caches.match(cleanKey("./"))) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(key);
    if (cached) return cached;
    const res = await clean(await fetch(req));
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
    return res;
  })());
});
