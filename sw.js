// Service Worker 100% Hors-Ligne — Programme en 11ème (VerjoOnlyElevenProgram)
// Compatible GitHub Pages (sous-dossier ou racine) et PWABuilder Android APK
// Inclut : Cache Hors-Ligne + Notifications Push + Rappels Horaires Hors-Ligne (toutes les 1h) + Notification Instantanée à l'installation

const CACHE_NAME = 'prog-11eme-offline-v4';
const NOTIF_DB_NAME = 'verjo-eleven-notif-db';
const NOTIF_STORE_NAME = 'state';
const ONE_HOUR_MS = 60 * 60 * 1000;
const HOURLY_SCHEDULE_COUNT = 48; // Programme les 48 prochaines heures (1 notification / heure)

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

// Tous les 8 PDF du programme (chemins relatifs ./, ./pdfs/, ./pdf/)
const PDF_ASSETS = [
  "./carot.pdf",
  "./pdfs/carot.pdf",
  "./pdf/carot.pdf",
  "./Carot.pdf",
  "./pdfs/Carot.pdf",
  "./pdf/Carot.pdf",
  "./school%20bag.pdf",
  "./pdfs/school%20bag.pdf",
  "./pdf/school%20bag.pdf",
  "./school_bag.pdf",
  "./pdfs/school_bag.pdf",
  "./pdf/school_bag.pdf",
  "./School%20bag.pdf",
  "./pdfs/School%20bag.pdf",
  "./pdf/School%20bag.pdf",
  "./Etape%20d%27une%20fille.pdf",
  "./pdfs/Etape%20d%27une%20fille.pdf",
  "./pdf/Etape%20d%27une%20fille.pdf",
  "./Etape_d_une_fille.pdf",
  "./pdfs/Etape_d_une_fille.pdf",
  "./pdf/Etape_d_une_fille.pdf",
  "./etape%20d%27une%20fille.pdf",
  "./pdfs/etape%20d%27une%20fille.pdf",
  "./pdf/etape%20d%27une%20fille.pdf",
  "./Fille.pdf",
  "./pdfs/Fille.pdf",
  "./pdf/Fille.pdf",
  "./fille.pdf",
  "./pdfs/fille.pdf",
  "./pdf/fille.pdf",
  "./crayon.pdf",
  "./pdfs/crayon.pdf",
  "./pdf/crayon.pdf",
  "./Crayon.pdf",
  "./pdfs/Crayon.pdf",
  "./pdf/Crayon.pdf",
  "./crayon1.pdf",
  "./pdfs/crayon1.pdf",
  "./pdf/crayon1.pdf",
  "./Crayon1.pdf",
  "./pdfs/Crayon1.pdf",
  "./pdf/Crayon1.pdf",
  "./princesse.pdf",
  "./pdfs/princesse.pdf",
  "./pdf/princesse.pdf",
  "./Princesse.pdf",
  "./pdfs/Princesse.pdf",
  "./pdf/Princesse.pdf",
  "./princesse1.pdf",
  "./pdfs/princesse1.pdf",
  "./pdf/princesse1.pdf",
  "./Princesse1.pdf",
  "./pdfs/Princesse1.pdf",
  "./pdf/Princesse1.pdf"
];

// Librairie PDF.js locale + CDN pour rendu canvas 100% hors-ligne dans l'APK
const PDFJS_ASSETS = [
  "./pdf.min.js",
  "./pdf.worker.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"
];

const TRUSTED_CDN_ORIGINS = new Set([
  'https://cdnjs.cloudflare.com',
  'https://cdn.jsdelivr.net'
]);

async function isValidPdfResponse(res) {
  if (!res || !res.ok) return false;
  try {
    const buf = await res.clone().arrayBuffer();
    if (!buf || buf.byteLength < 5) return false;
    const b = new Uint8Array(buf, 0, Math.min(buf.byteLength, 16));
    for (let i = 0; i <= b.length - 5; i++) {
      if (b[i] === 0x25 && b[i + 1] === 0x50 && b[i + 2] === 0x44 && b[i + 3] === 0x46 && b[i + 4] === 0x2D) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

async function cacheAssetSafely(cache, url) {
  try {
    const res = await fetch(new Request(url, { cache: 'reload' }));
    if (!res || !res.ok) return;
    if (url.toLowerCase().endsWith('.pdf')) {
      if (await isValidPdfResponse(res)) {
        await cache.put(url, res);
      }
      return;
    }
    await cache.put(url, res);
  } catch {
    // Ignore unavailable candidate path silently
  }
}

// Messages différents qui tournent à chaque notification pour rappeler de regarder VerjoOnlyElevenProgram
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

function getTodayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getHourKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  return `${y}-${m}-${d}-${h}`;
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getHourIndex(date = new Date()) {
  return Math.floor(date.getTime() / ONE_HOUR_MS);
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

  const now = Date.now();
  await setNotifState('installedNotifSent', true);
  await setNotifState('appInstalled', true);
  await setNotifState('lastHourlyNotifAt', now);
  await setNotifState('lastHourKey', getHourKey());

  return self.registration.showNotification('VerjoOnlyElevenProgram installé ! 🎉', {
    body: "Bravo ! L'application VerjoOnlyElevenProgram est installée. Tu recevras un rappel différent chaque heure, même hors-ligne !",
    icon: './pwa-192x192.png',
    badge: './pwa-192x192.png',
    tag: 'verjo-first-install',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: './' }
  });
}

// Envoi d'une notification différente chaque heure (même fermé et offline, si installé & accepté)
async function checkAndSendHourlyReminder() {
  if (!(await checkNotificationPermission())) return;

  const isInstalled = await getNotifState('appInstalled', false);
  if (!isInstalled) return;

  const now = Date.now();
  const currentHourKey = getHourKey();
  const lastHourKey = await getNotifState('lastHourKey', '');
  const lastHourlyAt = await getNotifState('lastHourlyNotifAt', 0);

  if (lastHourKey === currentHourKey) return;
  if (lastHourlyAt && now - lastHourlyAt < ONE_HOUR_MS) return;

  const savedHourlyIndex = await getNotifState('hourlyIndex', null);
  const savedDailyIndex = await getNotifState('dailyIndex', getHourIndex());
  const rawIndex = Number.isInteger(savedHourlyIndex)
    ? savedHourlyIndex
    : Number.isInteger(savedDailyIndex)
      ? savedDailyIndex
      : getHourIndex();

  const index = ((rawIndex % DAILY_REMINDERS.length) + DAILY_REMINDERS.length) % DAILY_REMINDERS.length;
  const reminder = DAILY_REMINDERS[index];
  const nextIndex = (index + 1) % DAILY_REMINDERS.length;

  await setNotifState('lastHourlyNotifAt', now);
  await setNotifState('lastHourKey', currentHourKey);
  await setNotifState('lastDailyDate', getTodayKey());
  await setNotifState('hourlyIndex', nextIndex);
  await setNotifState('dailyIndex', nextIndex);

  return self.registration.showNotification(reminder.title, {
    body: reminder.body,
    icon: './pwa-192x192.png',
    badge: './pwa-192x192.png',
    tag: 'verjo-hourly-reminder-' + currentHourKey,
    renotify: true,
    vibrate: [150, 80, 150],
    data: { url: './' }
  });
}

// Alias conservé pour compatibilité avec les appels existants
async function checkAndSendDailyReminder() {
  return checkAndSendHourlyReminder();
}

// Programmation de déclencheurs locaux hors-ligne (TimestampTrigger si supporté) toutes les 1 heure (48h d'avance)
async function scheduleUpcomingOfflineTriggers() {
  if (!(await checkNotificationPermission())) return;
  if (typeof TimestampTrigger === 'undefined') return;

  const isInstalled = await getNotifState('appInstalled', false);
  if (!isInstalled) return;

  try {
    const existing = await self.registration.getNotifications({ includeTriggered: true });
    const existingTags = new Set(existing.map((n) => n.tag));
    const lastHourlyAt = await getNotifState('lastHourlyNotifAt', 0);
    const baseHour = getHourIndex();

    for (let offset = 1; offset <= HOURLY_SCHEDULE_COUNT; offset++) {
      const target = new Date();
      target.setMinutes(0, 0, 0);
      target.setHours(target.getHours() + offset);

      // Évite de déclencher trop tôt juste après la notification d'installation ou la dernière notif
      if (lastHourlyAt && target.getTime() - lastHourlyAt < ONE_HOUR_MS / 2) {
        continue;
      }

      const hourKey = getHourKey(target);
      const tag = `verjo-scheduled-${hourKey}`;

      if (!existingTags.has(tag)) {
        const msg = DAILY_REMINDERS[(baseHour + offset) % DAILY_REMINDERS.length];
        await self.registration.showNotification(msg.title, {
          body: msg.body,
          icon: './pwa-192x192.png',
          badge: './pwa-192x192.png',
          tag,
          renotify: true,
          vibrate: [150, 80, 150],
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
      const allUrls = [...CORE_ASSETS, ...PDF_ASSETS, ...PDFJS_ASSETS];
      return Promise.allSettled(
        allUrls.map((url) => cacheAssetSafely(cache, url))
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

    const reminder = DAILY_REMINDERS[getHourIndex() % DAILY_REMINDERS.length];
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

    await setNotifState('lastHourlyNotifAt', Date.now());
    await setNotifState('lastHourKey', getHourKey());

    await self.registration.showNotification(title, {
      body,
      icon: './pwa-192x192.png',
      badge: './pwa-192x192.png',
      tag: 'verjo-push-' + getHourKey(),
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url }
    });
  })());
});

// Synchronisation périodique en arrière-plan (rappel horaire même fermé et offline)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'verjo-hourly-reminder' || event.tag === 'verjo-daily-reminder') {
    event.waitUntil(
      checkAndSendHourlyReminder().then(() => scheduleUpcomingOfflineTriggers())
    );
  }
});

// Background Sync fallback
self.addEventListener('sync', (event) => {
  if (event.tag === 'verjo-hourly-check' || event.tag === 'verjo-daily-check') {
    event.waitUntil(
      checkAndSendHourlyReminder().then(() => scheduleUpcomingOfflineTriggers())
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

// Communication avec la page (permission acceptée, app installée, vérification horaire / quotidienne)
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
  } else if (data.type === 'CHECK_HOURLY_NOTIF' || data.type === 'CHECK_DAILY_NOTIF') {
    event.waitUntil((async () => {
      if (data.granted) {
        await setNotifState('notifPermissionGranted', true);
      }
      if (data.installed) {
        await setNotifState('appInstalled', true);
      }
      await checkAndSendHourlyReminder();
      await scheduleUpcomingOfflineTriggers();
    })());
  }
});

// Interception des requêtes : Cache-First 100% hors-ligne (PDF + PDF.js CDN + Assets locaux)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isTrustedCdn = TRUSTED_CDN_ORIGINS.has(url.origin);

  if (!isSameOrigin && !isTrustedCdn) {
    return;
  }

  if (isSameOrigin && event.request.mode === 'navigate') {
    event.waitUntil(
      checkAndSendHourlyReminder().then(() => scheduleUpcomingOfflineTriggers())
    );

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

  const isPdfRequest = url.pathname.toLowerCase().endsWith('.pdf');
  const isScriptRequest = url.pathname.toLowerCase().endsWith('.js') || url.pathname.toLowerCase().endsWith('.mjs');

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(async (networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          if (isPdfRequest) {
            if (await isValidPdfResponse(networkResponse)) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
          } else {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
        }
        return networkResponse;
      }).catch(() => {
        if (isPdfRequest || isScriptRequest || isTrustedCdn) {
          return new Response('', { status: 503, statusText: 'Offline Resource Unavailable' });
        }
        return caches.match('./index.html');
      });
    })
  );
});
