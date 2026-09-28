/* =========================================================
   VORTEX SOCIAL MEDIA
   ENGINE / VORTEX / SW.JS
========================================================= */

"use strict";

const CACHE_NAME = "vortex-social-v1";

const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

/* INSTALL */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())

  );

});


/* ACTIVATE */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()
      .then(keys => {

        return Promise.all(

          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))

        );

      })
      .then(() => self.clients.claim())

  );

});


/* FETCH */

self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(

    fetch(request)

      .then(response => {

        if (
          response &&
          response.status === 200 &&
          response.type !== "opaque"
        ) {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, copy);
            });

        }

        return response;

      })

      .catch(() => {

        return caches.match(request)
          .then(cached => {

            if (cached) {
              return cached;
            }

            return caches.match("./index.html");

          });

      })

  );

});


/* MESSAGE CONTROL */

self.addEventListener("message", event => {

  if (!event.data) {
    return;
  }

  if (event.data.type === "SKIP_WAITING") {

    self.skipWaiting();

  }

  if (event.data.type === "CLEAR_CACHE") {

    caches.keys()
      .then(keys => {

        Promise.all(
          keys.map(key => caches.delete(key))
        );

      });

  }

});
