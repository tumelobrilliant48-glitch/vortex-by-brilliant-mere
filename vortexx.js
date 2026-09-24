/* =========================================================
   VORTEX V16 FINAL — LUXURY GALAXY SERVICE WORKER
   By Brilliant Mere
   ========================================================= */

const CACHE_NAME = "vortex-v16-final-v2";
const RUNTIME_CACHE = "vortex-v16-runtime-v2";
const OFFLINE_URL = "./index.html";

/* =========================================================
   CORE FILES
   ========================================================= */

const PRECACHE = [
  "./",
  "./index.html",
  "./app.html",
  "./manifest.json",
  "./css/vortex.css",
  "./js/vortex.js",
  "./themes/themes.js",
  "./data/videos.json"
];

/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener("install", (event) => {
  console.log("[VORTEX V16] Installing Luxury Galaxy Service Worker...");

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error("[VORTEX V16] Precache failed:", error);
      })
  );
});

/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE
            ) {
              console.log(
                "[VORTEX V16] Removing old cache:",
                cacheName
              );

              return caches.delete(cacheName);
            }

            return Promise.resolve();
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

/* =========================================================
   FETCH ENGINE
   ========================================================= */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /* -------------------------------------------------------
     Ignore unsupported protocols
     ------------------------------------------------------- */

  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    return;
  }

  /* -------------------------------------------------------
     HTML NAVIGATION
     Network first → cache → offline page
     ------------------------------------------------------- */

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();

            caches.open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, clone));

            return response;
          }

          throw new Error("Network response unavailable");
        })
        .catch(async () => {
          const cachedPage =
            await caches.match(request) ||
            await caches.match("./app.html") ||
            await caches.match(OFFLINE_URL) ||
            await caches.match("./");

          return (
            cachedPage ||
            new Response(
              `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport"
                  content="width=device-width,initial-scale=1">
                <title>VORTEX</title>
                <style>
                  body{
                    margin:0;
                    min-height:100vh;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:#050712;
                    color:white;
                    font-family:Arial,sans-serif;
                    text-align:center;
                  }
                  .box{
                    padding:30px;
                    border:1px solid rgba(0,217,255,.25);
                    border-radius:24px;
                    background:rgba(255,255,255,.05);
                  }
                  h1{
                    letter-spacing:5px;
                  }
                </style>
              </head>
              <body>
                <div class="box">
                  <h1>VORTEX</h1>
                  <p>You are offline.</p>
                  <p>Your galaxy will reconnect when the network returns.</p>
                </div>
              </body>
              </html>
              `,
              {
                status: 200,
                headers: {
                  "Content-Type": "text/html;charset=UTF-8"
                }
              }
            )
          );
        })
    );

    return;
  }

  /* -------------------------------------------------------
     JSON / DATA
     Network first → cached data
     ------------------------------------------------------- */

  if (
    url.pathname.includes("/data/") ||
    url.pathname.endsWith(".json")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || !response.ok) {
            throw new Error("JSON network request failed");
          }

          const clone = response.clone();

          caches.open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, clone));

          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );

    return;
  }

  /* -------------------------------------------------------
     CSS / JAVASCRIPT
     Stale while revalidate
     ------------------------------------------------------- */

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkRequest = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();

              caches.open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, clone));
            }

            return response;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkRequest;
      })
    );

    return;
  }

  /* -------------------------------------------------------
     IMAGES
     Cache first → network → cache
     ------------------------------------------------------- */

  if (
    request.destination === "image" ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(
      url.pathname
    )
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (!response || !response.ok) {
              return response;
            }

            const clone = response.clone();

            caches.open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, clone));

            return response;
          })
          .catch(() => {
            return new Response("", {
              status: 404
            });
          });
      })
    );

    return;
  }

  /* -------------------------------------------------------
     FONTS
     Cache first
     ------------------------------------------------------- */

  if (
    request.destination === "font" ||
    /\.(woff|woff2|ttf|otf)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(request)
            .then((response) => {
              if (response && response.ok) {
                const clone = response.clone();

                caches.open(RUNTIME_CACHE)
                  .then((cache) => cache.put(request, clone));
              }

              return response;
            })
        );
      })
    );

    return;
  }

  /* -------------------------------------------------------
     VIDEO / AUDIO / LARGE MEDIA
     Network first → cache fallback
     ------------------------------------------------------- */

  if (
    request.destination === "video" ||
    request.destination === "audio"
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match(request))
    );

    return;
  }

  /* -------------------------------------------------------
     EXTERNAL CDN / OTHER REQUESTS
     Cache first → network
     ------------------------------------------------------- */

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (!response || !response.ok) {
            return response;
          }

          const clone = response.clone();

          caches.open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, clone));

          return response;
        })
        .catch(() => {
          return new Response("", {
            status: 503,
            statusText: "VORTEX resource unavailable offline"
          });
        });
    })
  );
});

/* =========================================================
   MESSAGE CONTROL
   ========================================================= */

self.addEventListener("message", (event) => {
  if (!event.data) {
    return;
  }

  /* Force immediate activation */
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  /* Clear runtime cache */
  if (event.data.type === "CLEAR_RUNTIME_CACHE") {
    event.waitUntil(
      caches.delete(RUNTIME_CACHE)
    );
  }

  /* Clear every VORTEX cache */
  if (event.data.type === "CLEAR_ALL_CACHES") {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) =>
              key.startsWith("vortex-")
            )
            .map((key) =>
              caches.delete(key)
            )
        );
      })
    );
  }
});

/* =========================================================
   BACKGROUND SYNC
   ========================================================= */

self.addEventListener("sync", (event) => {
  if (event.tag === "vortex-background-sync") {
    event.waitUntil(
      Promise.resolve()
        .then(() => {
          console.log(
            "[VORTEX V16] Background sync completed."
          );
        })
    );
  }
});

/* =========================================================
   PUSH NOTIFICATIONS
   ========================================================= */

self.addEventListener("push", (event) => {
  let data = {
    title: "VORTEX",
    body: "Something new is waiting in your galaxy.",
    icon: "./manifest.json",
    badge: "./manifest.json"
  };

  try {
    if (event.data) {
      data = {
        ...data,
        ...event.data.json()
      };
    }
  } catch (error) {
    console.warn(
      "[VORTEX V16] Push data could not be parsed."
    );
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || "VORTEX",
      {
        body:
          data.body ||
          "Something new is waiting in your galaxy.",
        icon: data.icon,
        badge: data.badge,
        data: data.url || "./"
      }
    )
  );
});

/* =========================================================
   NOTIFICATION CLICK
   ========================================================= */

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const target =
      event.notification.data || "./";

    event.waitUntil(
      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      }).then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(target);
        }
      })
    );
  }
);

/* =========================================================
   VORTEX V16 READY
   ========================================================= */

console.log(
  "[VORTEX V16] Luxury Galaxy Service Worker loaded."
);
