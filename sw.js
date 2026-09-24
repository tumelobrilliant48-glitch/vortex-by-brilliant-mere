// VORTEX V17 - NUCLEAR CACHE KILLER - STARS THEME
const CACHE_NAME = "vortex-v17-nuclear-"+Date.now();

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
