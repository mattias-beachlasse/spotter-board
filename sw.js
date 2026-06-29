const CACHE = "spotterboard-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for the app shell (so updates show up when online),
// cache-first for everything else, cache as offline fallback throughout.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const accept = e.request.headers.get("accept") || "";
  const isHTML = e.request.mode === "navigate" || accept.includes("text/html");
  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return resp;
      }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r =>
        r || fetch(e.request).then(resp => {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, cp));
          return resp;
        })
      )
    );
  }
});
