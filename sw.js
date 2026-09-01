const CACHE_NAME = 'jetbulary-cache-v119';
const PRECACHE_URLS = [
    './',
    'index.html',
    'manifest.json',
    'icon.png',
    'css/styles.css',
    'js/config.js',
    'js/data/topics.js',
    'js/db.js',
    'js/audio.js',
    'js/stt.js',
    'js/session.js',
    'js/app.js',
    'js/vocab.js',
    'js/game.js',
    'js/conversation.js',
    'js/translator.js',
    'flag_sp.jpg',
    'flag_en.jpg',
    'flag_de.jpg',
    'flag_fr.jpg',
    'flag_it.jpg',
    'flag_pt.jpg',
    'flag_ru.jpg',
    'flag_ca.jpg',
    'flag_eu.jpg',
    'flag_gl.jpg'
];


self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS).catch((err) => console.log('Precache warning:', err));
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Do NOT intercept external API calls (Groq, Google Translate, Ads, etc.)
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    // For HTML navigation requests (app startup / reload)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request).then(cached => cached || caches.match('index.html') || caches.match('./')))
        );
        return;
    }

    // For same-origin static assets
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return networkResponse;
            })
            .catch(() => caches.match(event.request))
    );
});
