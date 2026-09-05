/* Service worker de Mi plato (Fase 8).
   Cache-first para el "cascarón" de la app: index.html, manifest e íconos. Los datos de la persona
   viven en localStorage, así que no pasan por acá. 7dee136157 lo reemplaza el build con el hash del
   contenido: cada versión nueva usa otro caché y borra los viejos al activarse. */
const VERSION = "7dee136157";
const CACHE = "miplato-" + VERSION;
const SHELL = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-192-maskable.png", "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png", "./icons/favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("miplato-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // navegación: siempre el index cacheado (funciona sin conexión), y se refresca de fondo
  if (req.mode === "navigate") {
    e.respondWith(
      caches.match("./index.html").then(hit => {
        const red = fetch(req).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put("./index.html", r.clone())); return r; }).catch(() => hit);
        return hit || red;
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()));
      return r;
    }).catch(() => hit))
  );
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });
