const CACHE_NAME = 'hpf-pwa-v4';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/sounds/new-order.mp3',
  '/sounds/urgent.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // /_next/static/ — content-addressed; cache-first in production, skip in dev
  if (url.pathname.startsWith('/_next/static/') && self.location.hostname !== 'localhost') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        });
      })
    );
    return;
  }

  // Skip all other /_next/ traffic (HMR, etc.)
  if (url.pathname.startsWith('/_next/')) return;

  // API Requests: Network First, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch((err) => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            throw err;
          });
        })
    );
    return;
  }

  // Page Navigations & Assets: Stale While Revalidate, fallback to offline.html
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in the background to update the cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const cloned = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
            }
          })
          .catch(() => {
            // Ignore background fetch errors to prevent unhandled promise rejections
          });
        return cachedResponse;
      }

      // Not in cache: fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return networkResponse;
        })
        .catch((err) => {
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          throw err;
        });
    })
  );
});

// Force activation when the client sends SKIP_WAITING (e.g. after update detected)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ─── Web Push & FCM Notification Handling ─────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'HPF Partner Alert',
    body: 'New notification received',
    url: '/branch/dashboard',
    urgency: 'normal'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/maskable-icon.png',
    vibrate: data.urgency === 'urgent' ? [300, 100, 300, 100, 300] : [200, 100, 200],
    sound: data.urgency === 'urgent' ? '/sounds/urgent.mp3' : '/sounds/new-order.mp3',
    data: { url: data.url },
    actions: [
      { action: 'open', title: 'View Order' },
      { action: 'close', title: 'Dismiss' }
    ],
    tag: 'hpf-notification',
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/branch/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
