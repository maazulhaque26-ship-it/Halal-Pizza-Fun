// Cache version — bump this string on every deploy that changes static assets.
// Pattern: hpf-pwa-vYYYYMMDD or hpf-pwa-vN
const CACHE_NAME = 'hpf-pwa-v5';
const OFFLINE_URL = '/offline.html';

// Only precache files that are guaranteed to exist at deploy time.
// Sound files are NOT precached: they may not exist and a single missing
// file causes cache.addAll() to throw, aborting the entire SW install.
const STATIC_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // ── Socket.IO MUST bypass the SW completely ──────────────────────────────
  // Intercepting Socket.IO polling requests (/socket.io/?EIO=4&transport=polling&...)
  // corrupts the Socket.IO wire protocol because the SW returns stale/wrong responses.
  if (url.pathname.startsWith('/socket.io/')) return;

  // ── API requests: network only, no caching ───────────────────────────────
  // Reasons:
  //  1. Stale auth data (session, tokens) creates security bugs on shared devices.
  //  2. Order/inventory data must always be fresh.
  //  3. POST/PATCH/DELETE are already excluded by the GET check above, but GET
  //     API calls are just as dangerous to cache (e.g. /api/auth/session).
  if (url.pathname.startsWith('/api/')) return;

  // ── /_next/static/ — cache-first (content-addressed, safe to cache forever)
  if (url.pathname.startsWith('/_next/static/') && self.location.hostname !== 'localhost') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Skip all other /_next/ traffic (HMR WebSockets, RSC, etc.) ──────────
  if (url.pathname.startsWith('/_next/')) return;

  // ── Skip cross-origin requests (CDN assets, Cloudinary images, etc.) ─────
  if (url.origin !== self.location.origin) return;

  // ── Page navigations & same-origin assets: stale-while-revalidate ────────
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache immediately; revalidate in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const cloned = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Not cached yet — go to network
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return networkResponse;
        })
        .catch(() => {
          // Navigation requests fall back to offline page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          // Non-navigation resources (fonts, images) just fail
          return Response.error();
        });
    })
  );
});

// ─── Message (skip waiting on demand) ────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const defaults = {
    title: 'HPF Partner Alert',
    body: 'New notification received',
    url: '/branch/dashboard',
    urgency: 'normal',
  };

  let data = defaults;
  if (event.data) {
    try {
      data = { ...defaults, ...event.data.json() };
    } catch {
      data = { ...defaults, body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/maskable-icon.png',
    vibrate: data.urgency === 'urgent' ? [300, 100, 300, 100, 300] : [200, 100, 200],
    data: { url: data.url },
    actions: [
      { action: 'open', title: 'View Order' },
      { action: 'close', title: 'Dismiss' },
    ],
    tag: 'hpf-notification',
    renotify: true,
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ─── Notification Click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/branch/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
