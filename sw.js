// PARK WOD service worker — self-updating.
//
// Strategy:
//   - App code (navigations + app.js): NETWORK-FIRST with cache fallback.
//     Users always get the latest deploy when online; offline still works
//     from the last cached copy. No more manual cache-version bumps.
//   - Everything else (icons, fonts, manifest): CACHE-FIRST with runtime
//     fill — fast and offline-safe.
const CACHE_NAME = 'parkwod-v13';

// Paths are RELATIVE, resolved against this script's URL. The app is served
// from a project subpath (/ParkWod_2.0/), so absolute paths like '/app.js'
// point at the domain root and 404 — which used to reject cache.addAll and
// leave the worker permanently uninstalled, pinning users to an old build.
const PRECACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // Cache each entry independently: one missing asset degrades offline
      // support for that file instead of failing the whole install.
      .then(cache => Promise.all(PRECACHE.map(p => cache.add(p).catch(() => {}))))
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
  // Compare against the registration scope, not the domain root — on a project
  // subpath the app's own files live at /ParkWod_2.0/app.js, and testing for
  // '/app.js' silently sent app code down the cache-first path below.
  const scopePath = new URL(self.registration.scope).pathname;
  const rel = url.origin === self.location.origin && url.pathname.startsWith(scopePath)
    ? url.pathname.slice(scopePath.length).replace(/^\//, '')
    : null;
  const isAppCode = request.mode === 'navigate' || rel === '' || rel === 'app.js' || rel === 'index.html';

  if (isAppCode) {
    // Network-first: fresh code when online, cached app when offline
    event.respondWith(
      fetch(request)
        .then(response => cachePut(request, response))
        .catch(() =>
          caches.match(request).then(cached =>
            cached || caches.match('./index.html')
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
