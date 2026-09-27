"use strict";

const CACHE_NAME = "socialbook-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json"
];

// ================================
// INSTALL
// ================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ================================
// ACTIVATE
// ================================

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ================================
// FETCH
// ================================

self.addEventListener("fetch", (event) => {

  const request = event.request;

  // API requests should always use
  // the live backend.
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            message: "You are currently offline."
          }),
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      })
    );

    return;
  }

  // App files use cache-first strategy.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {

      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {

        if (
          !response ||
          response.status !== 200 ||
          response.type === "opaque"
        ) {
          return response;
        }

        const responseClone = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;

      }).catch(() => {

        return caches.match("/index.html");

      });

    })
  );
});

// ================================
// SKIP WAITING
// ================================

self.addEventListener("message", (event) => {

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

});
