// Service Worker: macht die App offline nutzbar.
// Seite: erst Netz, sonst Cache. Dateien mit Hash, Bilder und Schriften: erst Cache, dann Netz.
const CACHE = 'mt-v3';
// Relative Pfade, damit die App auch in einem Unterordner (GitHub Pages) funktioniert.
const ROOT = self.registration.scope;
const SHELL = [
  './',
  'manifest.webmanifest',
  'damask.svg',
  'logo.svg',
  'favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(ROOT, copy));
          return response;
        })
        .catch(() => caches.match(ROOT))
    );
    return;
  }

  const cacheable =
    url.origin === self.location.origin ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';
  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then(
      cached =>
        cached ||
        fetch(request).then(response => {
          if (response.ok || response.type === 'opaque') {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
