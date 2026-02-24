const CACHE_NAME = 'scanner-pwa-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('fetch', (event) => {
    // Basic network-first strategy, falling back to cache
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
