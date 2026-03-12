// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDAL6MM6rCU7W03V90-ypKDsYsXzK3_7M8",
    authDomain: "cryptotycoonmining.firebaseapp.com",
    projectId: "cryptotycoonmining",
    storageBucket: "cryptotycoonmining.firebasestorage.app",
    messagingSenderId: "64861457497",
    appId: "1:64861457497:android:fa4f56c141f788fd9e7548"
});

const messaging = firebase.messaging();

// ── FCM Arka Plan Mesajları ───────────────────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] FCM arka plan mesajı:', payload);
    const notificationTitle = payload.notification?.title || 'Crypto Tycoon';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: payload.data?.tag || 'fcm',
        data: payload.data || {},
        requireInteraction: payload.data?.requireInteraction === 'true',
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// ── Bildirime tıklanınca uygulamayı aç ───────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const screen = event.notification.data?.screen || 'panel';
    const urlToOpen = self.location.origin + '/?screen=' + screen;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Zaten açık sekme varsa onu öne getir
            for (const client of clientList) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    client.postMessage({ type: 'NAVIGATE', screen });
                    return client.focus();
                }
            }
            // Açık sekme yoksa yeni aç
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});

// ── Uygulama mesajlarını dinle (zamanlı bildirimler) ─────────────────────────
let scheduledTimers = {};

self.addEventListener('message', (event) => {
    if (!event.data) return;

    // Günlük hatırlatıcı zamanla
    if (event.data.type === 'SCHEDULE_DAILY_REMINDER') {
        const delayMs = event.data.delayMs || (20 * 60 * 60 * 1000);
        
        // Önceki zamanlayıcıyı iptal et
        if (scheduledTimers.dailyReminder) {
            clearTimeout(scheduledTimers.dailyReminder);
        }
        
        scheduledTimers.dailyReminder = setTimeout(() => {
            self.registration.showNotification('🎁 Geri Dön, Madenci!', {
                body: 'Günlük ödülün ve madencilerin seni bekliyor. Streak\'ini kaybetme!',
                icon: '/logo192.png',
                badge: '/logo192.png',
                tag: 'daily-reminder',
                requireInteraction: false,
                data: { screen: 'panel' },
            });
        }, delayMs);
    }

    // Depo dolma zamanlaması
    if (event.data.type === 'SCHEDULE_STORE_FULL') {
        const delayMs = event.data.delayMs;
        const btcAmount = event.data.btcAmount || '?';
        
        if (scheduledTimers.storeFull) clearTimeout(scheduledTimers.storeFull);
        
        scheduledTimers.storeFull = setTimeout(() => {
            self.registration.showNotification('⛏️ Depon Doldu!', {
                body: `${btcAmount} BTC seni bekliyor. Hemen topla!`,
                icon: '/logo192.png',
                badge: '/logo192.png',
                tag: 'store-full',
                requireInteraction: true,
                data: { screen: 'panel' },
            });
        }, delayMs);
    }

    // Zamanlayıcıyı iptal et (uygulama tekrar açıldığında)
    if (event.data.type === 'CANCEL_SCHEDULED') {
        const key = event.data.key;
        if (key && scheduledTimers[key]) {
            clearTimeout(scheduledTimers[key]);
            delete scheduledTimers[key];
        }
    }
});
