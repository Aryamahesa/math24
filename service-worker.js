const CACHE_NAME = 'math24-cache-v2'; // Ubah versi cache jika ada perubahan besar
const urlsToCache = [
    '.',
    'index.html',
    'levels.html',   
    'game.html',     
    'style.css',
    'script.js',
    'manifest.json',
    // === FILE EKSTERNAL YANG DITAMBAHKAN ===
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                // Gunakan {cache: 'reload'} agar selalu mengambil versi terbaru dari jaringan saat instalasi
                const requests = urlsToCache.map(url => new Request(url, {cache: 'reload'}));
                return cache.addAll(requests);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Jika tidak ada di cache, coba ambil dari jaringan
                return fetch(event.request).then(
                    (networkResponse) => {
                        return networkResponse;
                    }
                );
            }
        )
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});