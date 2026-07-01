/*
  Safe service worker for local PWA development.
  - Caches same-origin static assets only.
  - Never throws on failed fetch/cache operations.
*/

const CACHE_NAME = "life-runner-v1";

const PRECACHE_URLS = [
  "./",
  "./labyrinth.html",
  "./favicon.ico",
  "./assets/vendor/three.min.js",
].filter(Boolean);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const valid = PRECACHE_URLS.filter((u) => new URL(u, self.location.href).origin === self.location.origin);
      await Promise.all(valid.map(async (url) => {
        try {
          const req = new Request(url, { cache: "reload" });
          const res = await fetch(req);
          if (res && res.ok) {
            await cache.put(req, res.clone());
          }
        } catch (_) {
          // Ignore individual precache failures in dev.
        }
      }));
    } catch (_) {
      // Avoid install-time crash.
    }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
        return Promise.resolve();
      }));
    } catch (_) {
      // Ignore cleanup failures.
    }
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Do not intercept cross-origin requests.
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) {
        return cached;
      }

      const network = await fetch(req);
      if (network && network.ok && req.method === "GET") {
        cache.put(req, network.clone()).catch(() => {});
      }
      return network;
    } catch (_) {
      const fallback = await caches.match("./labyrinth.html");
      if (fallback) {
        return fallback;
      }
      return new Response("Offline", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      });
    }
  })());
});
