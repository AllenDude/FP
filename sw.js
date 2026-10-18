// Bump this number if you ever need to force every phone to drop its old cache
const CACHE = "orencio-order-v1";

const SHELL = [
    "./",
    "index.html",
    "style.css",
    "script.js",
    "items.json",
    "manifest.json",
    "icon-192.png",
    "icon-512.png"
];

self.addEventListener("install", (event) => {

    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(
                SHELL.map(url => new Request(url, { cache: "reload" }))
            ))
            .then(() => self.skipWaiting())
    );

});

self.addEventListener("activate", (event) => {

    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );

});

// Online: always load the newest files (so edits to items.json show up).
// Offline: fall back to the last copy that was saved.
self.addEventListener("fetch", (event) => {

    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    // items.json is requested as items.json?v=<time>, so store it without the query
    const key = new Request(url.origin + url.pathname);

    event.respondWith(
        fetch(request)
            .then(response => {

                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => cache.put(key, copy));
                }

                return response;

            })
            .catch(() =>
                caches.match(key).then(hit => hit || caches.match("index.html"))
            )
    );

});
