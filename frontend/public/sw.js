const CACHE_VERSION = 'trackmate-v4';
const STATIC_CACHE = 'trackmate-static-v4';
const OFFLINE_URL = '/offline.html';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/favicons/android-chrome-192x192.png',
  '/favicons/android-chrome-512x512.png',
  '/favicons/favicon-32x32.png',
  '/logo%20vertical.png',
  '/logohorigental.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy: Network-first for navigation and assets, offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests, API calls, and Vite dev server module requests
  if (request.method !== 'GET') return;
  if (
    request.url.includes('/api/') ||
    request.url.includes('/socket.io/') ||
    request.url.includes('/src/') ||
    request.url.includes('/node_modules/') ||
    request.url.includes('/@vite/') ||
    request.url.includes('/@react-refresh')
  ) {
    return;
  }

  // Navigation requests — network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) — network first, cache fallback
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.url.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|ttf|ico)$/)
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || new Response('', { status: 503 }))
        )
    );
    return;
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'Bus Update', body: 'New location details received', url: '/' };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      console.warn('Push parse error:', e);
      try {
        data.body = event.data.text();
      } catch (textErr) {
        // quiet fail
      }
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo%20vertical.png',
    badge: data.badge || '/favicons/android-chrome-192x192.png',
    image: data.image || undefined,
    data: {
      url: data.url
    },
    // Adding tag allows coalescing multiple rapid updates into one
    tag: data.tag || 'whereismybus-update',
    renotify: true,
    requireInteraction: true, // Keeps notification visible until clicked
    vibrate: data.tag === 'sos-alert' ? [500, 200, 500, 200, 500] : [200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
