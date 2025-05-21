const CACHE_NAME = 'ludo-pwa-cache-v4'; // Increased version number
const DYNAMIC_CACHE = 'ludo-dynamic-cache-v2';

// Assets that need to be available offline
const urlsToCache = [
  '/vite.svg',
  '/manifest.json'
];

// Function to determine if a request is for an HTML file
const isHtmlRequest = (request) => {
  return request.headers.get('accept')?.includes('text/html') || 
         request.url.endsWith('.html') ||
         request.url.endsWith('/');
};

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Ensure new service worker takes control immediately
      self.clients.claim()
    ])
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first strategy for HTML and API requests
  if (isHtmlRequest(event.request) || 
      event.request.url.includes('/api/') || 
      event.request.url.includes('socket.io') ||
      event.request.headers.get('accept')?.includes('application/json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful HTML responses
          if (response.ok && isHtmlRequest(event.request)) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for other static assets
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            if (response.status === 200) {
              const responseToCache = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          });
      })
  );
});
