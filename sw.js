/* =========================================================
   VORTEX OMNIVERSE
   SERVICE WORKER
   Offline • Cache • Updates • Push • Background Sync
   ========================================================= */

"use strict";

const CACHE_VERSION = "vortex-omniverse-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const OFFLINE_PAGE = "./index.html";

const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",

  "./style.css",

  "./auth.js",
  "./comments.js",
  "./chat.js",
  "./notifications.js",
  "./games.js",
  "./groups.js",
  "./media.js",
  "./friends.js",
  "./profile.js",
  "./events.js",
  "./vault.js",
  "./themes.js",
  "./Backend.js",

  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(CORE_FILES))
      .catch(error => {
        console.warn("[VORTEX SW] Core cache warning:", error);
      })
      .then(() => self.skipWaiting())
  );
});

/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => {
              return (
                key !== STATIC_CACHE &&
                key !== RUNTIME_CACHE &&
                key !== IMAGE_CACHE
              );
            })
            .map(key => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /*
   * Only handle normal HTTP/HTTPS requests.
   */
  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    return;
  }

  /*
   * HTML/navigation:
   * Network first, offline cache fallback.
   */
  if (
    request.mode === "navigate" ||
    request.destination === "document"
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  /*
   * Images:
   * Cache first.
   */
  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  /*
   * JavaScript/CSS/fonts:
   * Cache first with network fallback.
   */
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font"
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  /*
   * Everything else:
   * Stale/cache first, then network.
   */
  event.respondWith(staleWhileRevalidate(request));
});

/* =========================================================
   NETWORK FIRST
   ========================================================= */

async function networkFirst(request) {
  try {
    const response = await fetch(request);

    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);

      await cache.put(
        request,
        response.clone()
      );
    }

    return response;

  } catch (error) {
    const cached = await caches.match(request);

    if (cached) {
      return cached;
    }

    const offline = await caches.match(OFFLINE_PAGE);

    if (offline) {
      return offline;
    }

    return new Response(
      createOfflineHTML(),
      {
        status: 503,
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      }
    );
  }
}

/* =========================================================
   CACHE FIRST
   ========================================================= */

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      const cache = await caches.open(cacheName);

      await cache.put(
        request,
        response.clone()
      );
    }

    return response;

  } catch (error) {
    return new Response("", {
      status: 504,
      statusText: "Offline"
    });
  }
}

/* =========================================================
   STALE WHILE REVALIDATE
   ========================================================= */

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(response => {
      if (response && response.ok) {
        cache.put(
          request,
          response.clone()
        );
      }

      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkPromise;

  if (networkResponse) {
    return networkResponse;
  }

  return new Response("", {
    status: 504,
    statusText: "Offline"
  });
}

/* =========================================================
   OFFLINE HTML
   ========================================================= */

function createOfflineHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport"
      content="width=device-width,
               initial-scale=1,
               maximum-scale=1,
               user-scalable=no">

<meta name="theme-color" content="#050712">

<title>VORTEX — Offline</title>

<style>
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  width: 100%;
  min-height: 100%;
  background: #050712;
  color: white;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.vortex-offline {
  width: min(430px, 100%);
  text-align: center;
  padding: 35px 25px;
  border-radius: 28px;
  background:
    linear-gradient(
      145deg,
      rgba(0,217,255,.10),
      rgba(139,77,255,.12)
    );
  border: 1px solid rgba(0,217,255,.25);
  box-shadow:
    0 0 50px rgba(0,217,255,.08),
    inset 0 0 30px rgba(139,77,255,.04);
}

.logo {
  width: 90px;
  height: 90px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 34px;
  font-weight: 900;
  background:
    radial-gradient(
      circle,
      #00d9ff 0%,
      #3478ff 35%,
      #8b4dff 70%,
      transparent 72%
    );
  box-shadow:
    0 0 35px rgba(0,217,255,.35),
    0 0 65px rgba(139,77,255,.25);
  animation: vortexSpin 5s linear infinite;
}

h1 {
  margin: 0 0 10px;
  letter-spacing: 3px;
  font-size: 28px;
}

p {
  color: #aeb7ce;
  line-height: 1.6;
  margin: 8px 0;
}

button {
  margin-top: 22px;
  border: 0;
  border-radius: 14px;
  padding: 13px 22px;
  color: white;
  font-weight: 800;
  background:
    linear-gradient(
      135deg,
      #00d9ff,
      #3478ff,
      #8b4dff
    );
  cursor: pointer;
}

@keyframes vortexSpin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
</head>

<body>

<div class="vortex-offline">

  <div class="logo">
    V
  </div>

  <h1>VORTEX</h1>

  <p>
    You're currently offline.
  </p>

  <p>
    Some downloaded VORTEX features may still
    be available while you reconnect.
  </p>

  <button onclick="location.reload()">
    Try Again
  </button>

</div>

</body>
</html>
`;
}

/* =========================================================
   MESSAGE HANDLER
   ========================================================= */

self.addEventListener("message", event => {
  const data = event.data || {};

  switch (data.type) {

    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "CLEAR_CACHE":
      event.waitUntil(clearAllCaches());
      break;

    case "CACHE_URLS":
      if (Array.isArray(data.urls)) {
        event.waitUntil(cacheURLs(data.urls));
      }
      break;

    case "GET_VERSION":
      if (event.source) {
        event.source.postMessage({
          type: "SW_VERSION",
          version: CACHE_VERSION
        });
      }
      break;

    default:
      break;
  }
});

/* =========================================================
   CACHE URLS
   ========================================================= */

async function cacheURLs(urls) {
  const cache = await caches.open(RUNTIME_CACHE);

  const validURLs = urls.filter(Boolean);

  await Promise.all(
    validURLs.map(async url => {
      try {
        const request = new Request(
          url,
          {
            method: "GET",
            credentials: "same-origin"
          }
        );

        const response = await fetch(request);

        if (response.ok) {
          await cache.put(
            request,
            response.clone()
          );
        }

      } catch (error) {
        console.warn(
          "[VORTEX SW] Could not cache:",
          url
        );
      }
    })
  );
}

/* =========================================================
   CLEAR ALL CACHES
   ========================================================= */

async function clearAllCaches() {
  const keys = await caches.keys();

  await Promise.all(
    keys.map(key => caches.delete(key))
  );
}

/* =========================================================
   BACKGROUND SYNC
   ========================================================= */

self.addEventListener("sync", event => {

  if (event.tag === "vortex-sync") {
    event.waitUntil(syncVortex());
  }

  if (event.tag === "vortex-upload") {
    event.waitUntil(syncUploads());
  }

});

/* =========================================================
   VORTEX SYNC
   ========================================================= */

async function syncVortex() {

  try {

    const clients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: "window"
    });

    clients.forEach(client => {
      client.postMessage({
        type: "VORTEX_BACKGROUND_SYNC"
      });
    });

  } catch (error) {
    console.warn(
      "[VORTEX SW] Background sync failed:",
      error
    );
  }
}

/* =========================================================
   UPLOAD SYNC
   ========================================================= */

async function syncUploads() {

  try {

    const clients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: "window"
    });

    clients.forEach(client => {
      client.postMessage({
        type: "VORTEX_UPLOAD_SYNC"
      });
    });

  } catch (error) {
    console.warn(
      "[VORTEX SW] Upload sync failed:",
      error
    );
  }
}

/* =========================================================
   PUSH NOTIFICATIONS
   ========================================================= */

self.addEventListener("push", event => {

  let data = {};

  try {
    data = event.data
      ? event.data.json()
      : {};
  } catch (error) {

    try {
      data = {
        title: "VORTEX",
        body: event.data
          ? event.data.text()
          : "You have a new VORTEX notification."
      };
    } catch {
      data = {};
    }
  }

  const title =
    data.title ||
    "VORTEX";

  const options = {
    body:
      data.body ||
      "You have a new notification.",

    icon:
      data.icon ||
      "./icons/icon-192.png",

    badge:
      data.badge ||
      "./icons/icon-192.png",

    image:
      data.image || undefined,

    tag:
      data.tag ||
      "vortex-notification",

    renotify: true,

    data: {
      url:
        data.url ||
        "./index.html",

      notificationId:
        data.notificationId ||
        null
    },

    actions:
      Array.isArray(data.actions)
        ? data.actions
        : []
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

/* =========================================================
   NOTIFICATION CLICK
   ========================================================= */

self.addEventListener(
  "notificationclick",
  event => {

    event.notification.close();

    const data =
      event.notification.data || {};

    const targetURL =
      data.url ||
      "./index.html";

    event.waitUntil(
      openVortexPage(targetURL)
    );
  }
);

/* =========================================================
   OPEN VORTEX PAGE
   ========================================================= */

async function openVortexPage(url) {

  const clients =
    await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

  /*
   * Reuse an existing VORTEX window.
   */
  for (const client of clients) {

    try {

      const clientURL =
        new URL(client.url);

      const target =
        new URL(
          url,
          self.location.origin
        );

      if (
        clientURL.origin === target.origin
      ) {

        await client.focus();

        if (
          typeof client.navigate === "function"
        ) {
          await client.navigate(
            target.href
          );
        }

        return;
      }

    } catch (error) {
      /* Ignore invalid client URL */
    }
  }

  /*
   * Open a new window if no existing
   * VORTEX window is available.
   */
  if (
    self.clients.openWindow
  ) {
    return self.clients.openWindow(
      new URL(
        url,
        self.location.origin
      ).href
    );
  }
}

/* =========================================================
   NOTIFICATION CLOSE
   ========================================================= */

self.addEventListener(
  "notificationclose",
  event => {

    /*
     * Hook reserved for analytics or
     * notification state synchronization.
     */

  }
);

/* =========================================================
   ONLINE / OFFLINE BROADCAST
   ========================================================= */

self.addEventListener(
  "fetch",
  () => {
    /*
     * Fetch interception itself provides
     * offline handling.
     */
  }
);

/* =========================================================
   PERIODIC CACHE CLEANUP
   ========================================================= */

async function cleanupRuntimeCache() {

  const cache =
    await caches.open(RUNTIME_CACHE);

  const requests =
    await cache.keys();

  const MAX_RUNTIME_ITEMS = 80;

  if (
    requests.length <=
    MAX_RUNTIME_ITEMS
  ) {
    return;
  }

  const removeCount =
    requests.length -
    MAX_RUNTIME_ITEMS;

  for (
    let i = 0;
    i < removeCount;
    i++
  ) {

    await cache.delete(
      requests[i]
    );
  }
}

/* =========================================================
   ACTIVATE CLEANUP
   ========================================================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(
      Promise.all([
        cleanupRuntimeCache(),
        self.clients.claim()
      ])
    );
  }
);

/* =========================================================
   VORTEX SERVICE WORKER READY
   ========================================================= */

console.log(
  "[VORTEX SW] Service Worker active:",
  CACHE_VERSION
);
