// Cache version — bump on every deploy that changes static assets.
// v8: force-bust stale socket.io transport config + CORS fix deploy
const CACHE_NAME = 'hpf-pwa-v8';
const OFFLINE_URL = '/offline.html';

// Only precache guaranteed-static files.
// Do NOT include '/' (homepage) — it is server-rendered with live DB data.
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
  //    Covers both same-origin proxy paths and direct Render connections.
  if (url.pathname.startsWith('/socket.io/')) return;
  if (url.hostname.includes('onrender.com')) return;

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

  // 6. Page navigations — NETWORK-FIRST so admin-controlled content is always fresh.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // 7. Same-origin assets — stale-while-revalidate
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

// ─── Message (skip waiting + resubscribe triggers) ────────────────────────────
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
    orderId: null,
    icon: '/icons/icon-192x192.png',
  };

  let data = defaults;
  if (event.data) {
    try { data = { ...defaults, ...event.data.json() }; }
    catch { data = { ...defaults, body: event.data.text() }; }
  }

  // ── Unique tag per order ──────────────────────────────────────────────────
  // Using orderId in the tag means:
  //   • Each order gets its OWN notification entry in the system tray (no replacing)
  //   • Re-notifying for the SAME orderId replaces that card (not duplicates)
  //   • renotify:true ensures sound/vibration fires even if tag already exists
  const tag = data.orderId
    ? `hpf-order-${data.orderId}`
    : `hpf-notification-${Date.now()}`;

  const isUrgent = data.urgency === 'urgent';

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:      data.body,
      icon:      data.icon || '/icons/icon-192x192.png',
      badge:     '/icons/maskable-icon.png',
      vibrate:   isUrgent ? [300, 100, 300, 100, 300] : [200, 100, 200],
      data:      { url: data.url, orderId: data.orderId },
      actions: [
        { action: 'open',  title: '👁 View Order' },
        { action: 'close', title: 'Dismiss' },
      ],
      tag,
      renotify:            true,   // Always fire sound/vibration even if tag exists
      requireInteraction:  true,   // Stay until user taps (critical for kitchen alerts)
      silent:              false,
      timestamp:           Date.now(),
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
        // 1. If a tab is already open at or near the target URL — focus it
        for (const client of clientList) {
          if ('focus' in client) {
            const clientUrl = new URL(client.url);
            const target    = new URL(targetUrl, self.location.origin);
            // Focus if origins match (same app) — always prefer existing tab
            if (clientUrl.origin === target.origin) {
              return client.focus().then((focused) => {
                // Navigate the focused tab to the correct screen
                if (focused && 'navigate' in focused) {
                  return focused.navigate(targetUrl);
                }
              });
            }
          }
        }
        // 2. No open tab — open a new window
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ─── Notification Close ───────────────────────────────────────────────────────
// Allows analytics tracking of dismissed notifications (optional, non-blocking)
self.addEventListener('notificationclose', (_event) => {
  // Future: could POST to /api/push/dismissed for analytics
});

// ─── Push Subscription Change ─────────────────────────────────────────────────
// Fired when the browser invalidates the existing push subscription
// (e.g. after browser updates, VAPID key rotation, or periodic rotation by the push service).
// We MUST renew the subscription and update the server, or push stops working.
self.addEventListener('pushsubscriptionchange', (event) => {
  const oldSub = event.oldSubscription;

  // Re-subscribe using the same VAPID key from the old subscription.
  // applicationServerKey is stored inside the subscription object by the browser.
  const resubscribePromise = self.registration.pushManager
    .subscribe({
      userVisibleOnly: true,
      applicationServerKey: oldSub?.options?.applicationServerKey,
    })
    .then((newSub) => {
      const newSubJson = newSub.toJSON();
      console.log('[SW] pushsubscriptionchange — sending new subscription to server');

      // POST to our /api/push/resubscribe endpoint.
      // This endpoint uses oldEndpoint as proof-of-prior-subscription (no session needed).
      return fetch('/api/push/resubscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldEndpoint:     oldSub?.endpoint,
          newSubscription: newSubJson,
        }),
      });
    })
    .catch((err) => {
      console.error('[SW] pushsubscriptionchange failed — messaging active clients:', err);
      // Fallback: message active page clients so PwaManager can re-subscribe
      // via the fully-authenticated flow (with session cookie).
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'PUSH_RESUBSCRIBE_REQUIRED' }));
      });
    });

  event.waitUntil(resubscribePromise);
});
