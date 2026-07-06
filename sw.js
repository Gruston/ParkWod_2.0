// PARK WOD service worker — self-updating.
//
// Strategy:
//   - App code (navigations + app.js): NETWORK-FIRST with cache fallback.
//     Users always get the latest deploy when online; offline still works
//     from the last cached copy. No more manual cache-version bumps.
//   - Everything else (icons, fonts, manifest): CACHE-FIRST with runtime
//     fill — fast and offline-safe.
const CACHE_NAME = 'parkwod-v12'; // final manual bump; updates now flow automatically

const PRECACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache successful responses; include opaque ones so no-cors font requests
// (fonts.googleapis.com / fonts.gstatic.com) work offline too.
function cachePut(request, response) {
  if (response && (response.ok || response.type === 'opaque')) {
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
  }
  return response;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isAppCode = request.mode === 'navigate' || url.pathname === '/app.js' || url.pathname === '/index.html' || url.pathname === '/';

  if (isAppCode) {
    // Network-first: fresh code when online, cached app when offline
    event.respondWith(
      fetch(request)
        .then(response => cachePut(request, response))
        .catch(() =>
          caches.match(request).then(cached =>
            cached || caches.match('/index.html')
          )
        )
    );
    return;
  }

  // Cache-first for static assets and fonts
  event.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request).then(response => cachePut(request, response))
    )
  );
});
