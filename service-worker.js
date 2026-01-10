const CACHE_NAME = 'aman-mobile-shop-v3';
const ASSETS = [
    './',
    './index.html',
    './explore.html',
    './cart.html',
    './profile.html',
    './orders.html',
    './wishlist.html',
    './notifications.html',
    './help-support.html',
    './address.html',
    './assets/css/style.css',
    './assets/js/index-main.js',
    './assets/js/utils.js',
    './assets/js/main.js',
    './manifest.json',
    './assets/icons/icon-192.jpg',
    './assets/icons/icon-512.jpg',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
