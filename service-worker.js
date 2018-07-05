var dataCacheName = 'restaurant-v1';
var cacheName = 'restaurant-pwa';
var filesToCache = [
    '/',
    '/index.html',
    'css/styles.css',
    'js/dbhelper.js',
    'js/restaurant_info.js',
    'restaurant.html',
    'js/localforage.min.js',
    'manifest.json',
    'js/main.js',
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== cacheName && key !== dataCacheName) {
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});
self.addEventListener('sync', event => {
    if (event.tag === 'sync-reviews') {
        console.log('SYNCING REVIEWS')
        event.waitUntil(
            broadcast({ action: 'send-reviews' })
        )
    }
})
self.addEventListener('fetch', function (e) {
    if (e.pathname === '/') {
        e.respondWith(
            caches.open(dataCacheName).then(function (cache) {
                return fetch(e.request).then(function (response) {
                    cache.put(e.request.url, response.clone());
                    return response;
                });
            })
        );
    } else {
        e.respondWith(
            caches.match(e.request).then(function (response) {
                return response || fetch(e.request);
            })
        );
    }
});
