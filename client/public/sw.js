// public/sw.js
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
    // Just a pass-through to satisfy PWA requirements
    e.respondWith(fetch(e.request));
});