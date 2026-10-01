/* =========================================================
   VORTEX SOCIAL APP
   sw.js
   Service Worker
   Created by Brilliant Tumelo Mere
   ========================================================= */

"use strict";

const CACHE_NAME = "vortex-social-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener("install", event => {

    console.log("VORTEX Service Worker installing...");

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(APP_FILES);

            })
            .then(() => {

                return self.skipWaiting();

            })

    );

});


/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames
                        .filter(
                            name =>
                                name !== CACHE_NAME
                        )
                        .map(
                            name =>
                                caches.delete(name)
                        )

                );

            })
            .then(() => {

                return self.clients.claim();

            })

    );

});


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }


    event.respondWith(

        fetch(event.request)

            .then(response => {

                /*
                 * Keep a fresh copy of successful
                 * network responses in the cache.
                 */

                if (
                    response &&
                    response.status === 200 &&
                    response.type === "basic"
                ) {

                    const responseClone =
                        response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {

                            cache.put(
                                event.request,
                                responseClone
                            );

                        });

                }

                return response;

            })

            .catch(() => {

                /*
                 * If the network is unavailable,
                 * return the cached version.
                 */

                return caches.match(
                    event.request
                );

            })

    );

});


/* =========================================================
   MESSAGE HANDLER
   ========================================================= */

self.addEventListener("message", event => {

    if (!event.data) {
        return;
    }


    if (
        event.data.type ===
        "VORTEX_SKIP_WAITING"
    ) {

        self.skipWaiting();

    }


    if (
        event.data.type ===
        "VORTEX_CLEAR_CACHE"
    ) {

        caches.delete(
            CACHE_NAME
        );

    }

});
