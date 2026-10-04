/* Chibwenzi service worker - enables app installation and basic offline shell */
const CACHE = 'chibwenzi-reconnect-20261004-v8';
// Version presentation assets so returning members receive the current brand.
function brandRequest(request) {
    const url = new URL(request.url);
    if (/\/(future-studio\.(css|js)|icon\.svg|apple-touch-icon\.png|icon-(192|512)\.png)$/.test(url.pathname) || /\/assets\/chibwenzi-(mark|icon)/.test(url.pathname)) {
        url.searchParams.set('cb-brand', '20261003-v6');
        return new Request(url, request);
    }
    return request;
}

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE).then(async c => {
        const shell = ['./', './index.html', './manifest.json', './future-studio.css', './future-studio.js', './assets/chibwenzi-mark-v2.svg', './assets/chibwenzi-icon-v2-192.png', './assets/chibwenzi-icon-v2-512.png'];
        await Promise.all(shell.map(async path => {
            const request = new Request(new URL(path, self.location.href));
            const response = await fetch(brandRequest(request));
            if (!response.ok) throw new Error('Offline shell asset unavailable');
            await c.put(request, response);
        }));
    }));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin !== location.origin) return; // API, Firebase and CDNs go straight to network
    // Never serve administration or its private configuration from an offline cache.
    if (/\/admin\.(html|js|css)$/.test(url.pathname) || (url.pathname.endsWith('/index.html') && e.request.cache === 'no-store')) {
        e.respondWith(fetch(e.request, {cache: 'no-store'}));
        return;
    }
    e.respondWith(
        fetch(brandRequest(e.request))
            .then(res => {
                const copy = res.clone();
                caches.open(CACHE).then(c => c.put(e.request, copy));
                return res;
            })
            .catch(() => caches.match(e.request).then(m => m || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
});
