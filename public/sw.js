// Cache version — bump on every deploy that changes static assets.
const CACHE_NAME = 'hpf-pwa-v6';
const OFFLINE_URL = '/offline.html';

// Only precache guaranteed-static files.
// Do NOT include '/' (homepage) — it is server-rendered with live DB data.
// Caching '/' causes stale hero backgrounds, banners and other admin-controlled
// content to be served until the user refreshes twice (stale-while-revalidate).
const STATIC_ASSETS = [
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
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Socket.IO — MUST bypass SW (corrupts wire protocol)
  if (url.pathname.startsWith('/socket.io/')) return;

  // 2. API routes — always network only; never cache auth/session/order data
  if (url.pathname.startsWith('/api/')) return;

  // 3. Cross-origin (Cloudinary, Google Fonts, CDNs) — let browser handle
  if (url.origin !== self.location.origin) return;

  // 4. /_next/static/ — cache-first (content-addressed, safe to cache forever)
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

  // 5. Skip all other /_next/ traffic (HMR, RSC payloads, etc.)
  if (url.pathname.startsWith('/_next/')) return;

  // 6. Page navigations — NETWORK-FIRST so admin-controlled content (hero
  //    background, banners, settings) is always fresh. Fall back to cache only
  //    when offline, and only if we have a cached copy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response for offline fallback on future visits
          if (response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() =>
          // Offline: return cached page if available, otherwise generic offline page
          caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // 7. Same-origin assets (fonts, images, etc.) — stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
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
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return networkResponse;
        })
        .catch(() => Response.error());
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
    try { data = { ...defaults, ...event.data.json() }; }
    catch { data = { ...defaults, body: event.data.text() }; }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
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
    })
  );
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
          if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
