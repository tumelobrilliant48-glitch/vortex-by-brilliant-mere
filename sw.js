// sw.js - VORTEX PWA Service Worker
// By Brilliant Tumelo Mere
// Offline + Install + Vault cache private + disappearing notifications

const CACHE_NAME = 'vortex-v5-by-brilliant-tumelo-mere';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/reels.css',
  './css/themes.css',
  './core/app.js',
  './core/router.js',
  './core/security.js',
  './core/monetization.js',
  './engine/vortex.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Vault - private, no cache network only
  if (url.pathname.includes('/vault') || url.pathname.includes('/api/vault')) {
    e.respondWith(fetch(e.request).catch(() => new Response('Vault offline - private items require online', { status: 503 })));
    return;
  }

  // Network first for API
  if (url.pathname.includes('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          // clone to cache for offline fallback except vault
          const clone = r.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache first for assets
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((r) => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return r;
      }).catch(() => {
        // Offline fallback
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// PUSH NOTIFICATIONS - disappearing but keep sensitive
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data.json(); } catch { data = { title: 'VORTEX', body: e.data.text() }; }
  
  const isVault = data.is_vault || false;
  
  const options = {
    body: data.body || 'New message',
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-192.png',
    tag: isVault ? 'vault-keep' : 'vortex-temp',
    requireInteraction: isVault, // vault stays until interact
    data: { url: data.url || './#messages', is_vault: isVault }
  };

  e.waitUntil(self.registration.showNotification(data.title || 'VORTEX', options));

  // Disappearing but keep sensitive - auto close if not vault after 3 sec
  if (!isVault) {
    setTimeout(() => {
      self.registration.getNotifications({ tag: 'vortex-temp' }).then(notifs => {
        notifs.forEach(n => n.close());
      });
    }, 3000);
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data.url || './';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((clis) => {
      const c = clis.find((cli) => cli.url.includes(self.location.origin));
      if (c) return c.focus().then(() => c.navigate(url));
      return clients.openWindow(url);
    })
  );
});
