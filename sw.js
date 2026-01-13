const CACHE_NAME = "udm-hr-v3"; // ← 每次重大更新一定要 +1

const ASSETS = [
  "./",
  "./index.html",
  "./HR.html",
  "./Leave.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

/* ===== 安裝 ===== */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // ← 立刻啟用新 SW
});

/* ===== 啟用（清舊快取） ===== */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim(); // ← 立刻接管頁面
});

/* ===== 抓取策略 ===== */
/* HTML → network first */
/* 其他 → cache first */
self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
  }
});
