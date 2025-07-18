// Nama cache dibuat lebih spesifik dan versi dinaikkan
const CACHE_NAME = 'math24-cache-v3'; 

// Daftar URL yang akan di-cache, dengan path yang sudah diperbaiki
const urlsToCache = [
    // Aset Lokal (dengan path /math24/)
    '/math24/',
    '/math24/index.html',
    '/math24/levels.html',
    '/math24/game.html',
    '/math24/style.css',
    '/math24/script.js',
    '/math24/manifest.json',

    // Aset Eksternal (CDN)
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    
    // --- FILE FONT AWESOME (PENTING UNTUK OFFLINE) ---
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-regular-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-brands-400.woff2'
];

// Event 'install': Dijalankan saat service worker pertama kali dipasang
self.addEventListener('install', event => {
    self.skipWaiting(); // Memaksa service worker baru untuk aktif lebih cepat
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache dibuka. Memulai caching aset...');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                // Menampilkan error di console jika ada file yang gagal di-cache
                console.error('Gagal melakukan caching saat instalasi:', error);
            })
    );
});

// Event 'activate': Dijalankan setelah service worker aktif
// Berguna untuk membersihkan cache lama
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});


// Event 'fetch': Dijalankan setiap kali ada permintaan sumber daya (gambar, css, js, dll)
self.addEventListener('fetch', event => {
    event.respondWith(
        // 1. Coba cari di cache terlebih dahulu
        caches.match(event.request)
            .then(response => {
                // Jika ditemukan di cache, langsung kembalikan dari cache
                if (response) {
                    return response;
                }
                // Jika tidak ada, coba ambil dari jaringan
                return fetch(event.request);
            }
        )
    );
});