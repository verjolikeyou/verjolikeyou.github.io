// Service Worker 100% Hors-Ligne — Programme en 11ème (VerjoOnlyElevenProgram)
// Compatible GitHub Pages (sous-dossier ou racine) et PWABuilder Android APK
// Inclut : Cache Hors-Ligne + Notifications Push + Rappels Quotidiens Hors-Ligne + Notification Instantanée à l'installation

const CACHE_NAME = 'prog-11eme-offline-v3';
const NOTIF_DB_NAME = 'verjo-eleven-notif-db';
const NOTIF_STORE_NAME = 'state';

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

// Messages quotidiens différents chaque jour pour rappeler de regarder VerjoOnlyElevenProgram
const DAILY_REMINDERS = [
  {
    title: 'VerjoOnlyElevenProgram — Rappel du jour 📚',
    body: "N'oublie pas de regarder VerjoOnlyElevenProgram aujourd'hui pour réviser tes leçons !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Exercices ✏️',
    body: "C'est le moment de pratiquer tes exercices sur VerjoOnlyElevenProgram !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Lecture & Dictée 📖',
    body: "As-tu relu ta lecture ou ta dictée préparée sur VerjoOnlyElevenProgram aujourd'hui ?"
  },
  {
    title: 'VerjoOnlyElevenProgram — Mathématiques 🧮',
    body: "Quelques calculs et du système métrique t'attendent dans VerjoOnlyElevenProgram !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Leçons de chose 🐾',
    body: "Découvre ou relis les leçons de chose et les animaux sur VerjoOnlyElevenProgram !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Français 🔤',
    body: "Révise l'orthographe, la grammaire et la conjugaison dans VerjoOnlyElevenProgram !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Atelier Dessin 🎨',
    body: "Envie de dessiner et d'apprendre en t'amusant ? Ouvre VerjoOnlyElevenProgram !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Hors-ligne 📲',
    body: "Même sans internet, VerjoOnlyElevenProgram est prêt pour ta petite révision du jour !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Champion du jour 🏆',
    body: "5 minutes sur VerjoOnlyElevenProgram suffisent pour garder ton avance en 11ème !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Méthode Boscher ✨',
    body: "Passe faire un tour sur VerjoOnlyElevenProgram et choisis ta leçon du jour !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Conjugaison ✍️',
    body: "Révise le verbe avoir au présent et les pronoms personnels sur VerjoOnlyElevenProgram !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Soustractions 📐',
    body: "Entraîne-toi sur les soustractions avec et sans retenue dans VerjoOnlyElevenProgram !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Articles définis 📝',
    body: "N'oublie pas le, la, l' et les sur VerjoOnlyElevenProgram !"
  },
  {
    title: 'VerjoOnlyElevenProgram — Révision Express ⭐',
    body: "Un petit coup d'oeil sur VerjoOnlyElevenProgram aujourd'hui pour tout retenir !"
  }
];

// Helpers IndexedDB (fonctionne 100% hors-ligne même quand l'application est fermée)
function openNotifDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NOTIF_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(NOTIF_STORE_NAME)) {
        db.createObjectStore(NOTIF_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getNotifState(key, defaultValue = null) {
  try {
    const db = await openNotifDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(NOTIF_STORE_NAME, 'readonly');
      const req = tx.objectStore(NOTIF_STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : defaultValue);
      req.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}

async function setNotifState(key, value) {
  try {
    const db = await openNotifDB();
    await new Promise((resolve) => {
      const tx = db.transaction(NOTIF_STORE_NAME, 'readwrite');
      tx.objectStore(NOTIF_STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore storage errors silently
  }
}

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

async function checkNotificationPermission() {
  if (typeof Notification !== 'undefined' && Notification.permission) {
    return Notification.permission === 'granted';
  }
  return await getNotifState('notifPermissionGranted', false);
}

// Notification instantanée lors de la première installation de l'application
async function sendInstantInstallNotification(forceIfNotSent = true) {
  if (!(await checkNotificationPermission())) return;
  const alreadySent = await getNotifState('installedNotifSent', false);
  if (alreadySent && forceIfNotSent) return;

  await setNotifState('installedNotifSent', true);
  await setNotifState('appInstalled', true);

  return self.registration.showNotification('VerjoOnlyElevenProgram installé ! 🎉', {
    body: "Bravo ! L'application VerjoOnlyElevenProgram est installée. Tu recevras un rappel différent chaque jour, même hors-ligne !",
    icon: './pwa-192x192.png',
    badge: './pwa-192x192.png',
    tag: 'verjo-first-install',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: './' }
  });
}

// Envoi d'une notification différente chaque jour (même fermé et offline, si installé & accepté)
async function checkAndSendDailyReminder() {
  if (!(await checkNotificationPermission())) return;

  const isInstalled = await getNotifState('appInstalled', false);
  if (!isInstalled) return;

  const today = getTodayKey();
  const lastDate = await getNotifState('lastDailyDate', '');
  if (lastDate === today) return;

  const savedIndex = await getNotifState('dailyIndex', getDayOfYear());
  const index = Number.isInteger(savedIndex)
    ? savedIndex % DAILY_REMINDERS.length
    : getDayOfYear() % DAILY_REMINDERS.length;
  const reminder = DAILY_REMINDERS[index];

  await setNotifState('lastDailyDate', today);
  await setNotifState('dailyIndex', (index + 1) % DAILY_REMINDERS.length);

  return self.registration.showNotification(reminder.title, {
    body: reminder.body,
    icon: './pwa-192x192.png',
    badge: './pwa-192x192.png',
    tag: 'verjo-daily-reminder-' + today,
    renotify: true,
    vibrate: [150, 80, 150],
    data: { url: './' }
  });
}

// Programmation de déclencheurs locaux hors-ligne (TimestampTrigger si supporté) pour les 14 prochains jours
async function scheduleUpcomingOfflineTriggers() {
  if (!(await checkNotificationPermission())) return;
  if (typeof TimestampTrigger === 'undefined') return;

  const isInstalled = await getNotifState('appInstalled', false);
  if (!isInstalled) return;

  try {
    const existing = await self.registration.getNotifications({ includeTriggered: true });
    const existingTags = new Set(existing.map((n) => n.tag));
    const baseDay = getDayOfYear();

    for (let offset = 1; offset <= 14; offset++) {
      const target = new Date();
      target.setDate(target.getDate() + offset);
      target.setHours(9, 0, 0, 0);

      const y = target.getFullYear();
      const m = String(target.getMonth() + 1).padStart(2, '0');
      const d = String(target.getDate()).padStart(2, '0');
      const tag = `verjo-scheduled-${y}-${m}-${d}`;

      if (!existingTags.has(tag)) {
        const msg = DAILY_REMINDERS[(baseDay + offset) % DAILY_REMINDERS.length];
        await self.registration.showNotification(msg.title, {
          body: msg.body,
          icon: './pwa-192x192.png',
          badge: './pwa-192x192.png',
          tag,
          showTrigger: new TimestampTrigger(target.getTime()),
          data: { url: './' }
        });
      }
    }
  } catch {
    // TimestampTrigger non disponible sur ce navigateur — PeriodicSync/Sync prennent le relais
  }
}

// Installation : mise en cache immédiate de tous les fichiers locaux
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CORE_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
        )
      );
    }).then(() => setNotifState('swInstalledAt', Date.now()))
  );
  self.skipWaiting();
});

// Activation : suppression des anciens caches, prise de contrôle immédiate et notification de première installation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
      .then(() => self.clients.claim())
      .then(async () => {
        const alreadyInstalled = await getNotifState('appInstalled', false);
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const hasClients = clients && clients.length > 0;
        if (alreadyInstalled || hasClients) {
          await sendInstantInstallNotification(true);
          await scheduleUpcomingOfflineTriggers();
        }
      })
  );
});

// Réception de messages Push (même lorsque le site est fermé, si l'utilisateur a accepté les notifications)
self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    if (!(await checkNotificationPermission())) return;

    const reminder = DAILY_REMINDERS[getDayOfYear() % DAILY_REMINDERS.length];
    let title = reminder.title;
    let body = reminder.body;
    let url = './';

    if (event.data) {
      try {
        const payload = event.data.json();
        if (payload.title) title = payload.title;
        if (payload.body) body = payload.body;
        if (payload.url) url = payload.url;
      } catch {
        const text = event.data.text();
        if (text) body = text;
      }
    }

    await self.registration.showNotification(title, {
      body,
      icon: './pwa-192x192.png',
      badge: './pwa-192x192.png',
      tag: 'verjo-push-' + getTodayKey(),
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url }
    });
  })());
});

// Synchronisation périodique en arrière-plan (rappel quotidien même fermé et offline)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'verjo-daily-reminder') {
    event.waitUntil(
      checkAndSendDailyReminder().then(() => scheduleUpcomingOfflineTriggers())
    );
  }
});

// Background Sync fallback
self.addEventListener('sync', (event) => {
  if (event.tag === 'verjo-daily-check') {
    event.waitUntil(
      checkAndSendDailyReminder().then(() => scheduleUpcomingOfflineTriggers())
    );
  }
});

// Clic sur une notification : ouvre ou ramène au premier plan VerjoOnlyElevenProgram
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Communication avec la page (permission acceptée, app installée, vérification quotidienne)
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'APP_INSTALLED') {
    event.waitUntil((async () => {
      await setNotifState('appInstalled', true);
      if (data.granted) {
        await setNotifState('notifPermissionGranted', true);
      }
      await sendInstantInstallNotification(true);
      await scheduleUpcomingOfflineTriggers();
    })());
  } else if (data.type === 'NOTIF_PERMISSION_GRANTED') {
    event.waitUntil((async () => {
      await setNotifState('notifPermissionGranted', true);
      if (data.installed) {
        await setNotifState('appInstalled', true);
      }
      await sendInstantInstallNotification(true);
      await scheduleUpcomingOfflineTriggers();
    })());
  } else if (data.type === 'CHECK_DAILY_NOTIF') {
    event.waitUntil((async () => {
      if (data.granted) {
        await setNotifState('notifPermissionGranted', true);
      }
      if (data.installed) {
        await setNotifState('appInstalled', true);
      }
      await checkAndSendDailyReminder();
      await scheduleUpcomingOfflineTriggers();
    })());
  }
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
