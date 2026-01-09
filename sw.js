const CACHE = "udm-hr-v1";

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>
      c.addAll([
        "./HR.html",
        "./manifest.json"
      ])
    )
  );
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    fetch(e.request).catch(()=>caches.match(e.request))
  );
});
