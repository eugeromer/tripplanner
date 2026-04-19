const CACHE_NAME = 'tabi-v1';
const ASSETS = [
  '/tabi/app.html',
  '/tabi/index.html',
  '/tabi/app.css',
  '/tabi/app.js',
  '/tabi/index.css',
  '/tabi/index.js',
  '/tabi/frame_5.svg',
  '/tabi/tabi-icon.webp'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(names =>
    Promise.all(names.map(n => n !== CACHE_NAME && caches.delete(n)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(r => {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(e.request, r.clone()));
      return r;
    })).catch(() => caches.match('/tabi/index.html'))
  );
});
