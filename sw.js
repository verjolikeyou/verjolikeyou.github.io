// Service Worker 100% Hors-Ligne — Programme en 11ème
// Compatible GitHub Pages (sous-dossier ou racine) et PWABuilder Android APK

const CACHE_NAME = 'prog-11eme-offline-v2';

// Fichiers essentiels mis en cache dès l'installation (chemins relatifs ./)
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png',
  './apple-touch-icon.png'
];

// Installation : mise en cache immédiate de tous les fichiers locaux
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CORE_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
        )
      );
    })
  );
  self.skipWaiting();
});

// Activation : suppression des anciens caches et prise de contrôle immédiate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Interception des requêtes : Cache-First 100% hors-ligne, zéro lien externe
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ne jamais mettre en cache ou rediriger vers des liens externes
  if (url.origin !== self.location.origin) {
    return;
  }

  // Pour les navigations (changement de page), toujours servir index.html hors-ligne
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return caches.match('./index.html').then((fallback) => {
          if (fallback) return fallback;
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
            }
            return networkResponse;
          }).catch(() => caches.match('./'));
        });
      })
    );
    return;
  }

  // Stratégie Cache-First pour tous les assets locaux (JS, CSS, icônes, JSON)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Repli de sécurité si hors-ligne et ressource absente
        return caches.match('./index.html');
      });
    })
  );
});
