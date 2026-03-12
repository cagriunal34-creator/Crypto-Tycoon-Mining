/**
 * usePushNotifications — Akıllı Push Bildirim Sistemi
 *
 * Tetikleyiciler:
 *  1. Depo dolu  — madenciler max kapasiteye ulaştığında
 *  2. Enerji düşük — enerji %20'nin altına düştüğünde
 *  3. Günlük giriş hatırlatması — 20 saattir giriş yoksa
 *  4. Hacker saldırısı — aktif saldırı varsa (acil!)
 *  5. Level atlandı — seviye yükseltildiğinde kutlama
 *  6. Guild etkinliği — guild savaşı başladığında/bittiğinde
 *  7. Kontrat süresi doluyor — 1 saat kaldıysa uyarı
 */

import { useEffect, useRef, useCallback } from 'react';
import { requestForToken, onMessageListener } from '../lib/firebase';

// ── Bildirim şablonları ───────────────────────────────────────────────────────

const TEMPLATES = {
  storeFull: (btcAmount: string) => ({
    title: '⛏️ Depon Doldu!',
    body: `${btcAmount} BTC seni bekliyor. Hemen topla!`,
    tag: 'store-full',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: { screen: 'panel' },
  }),
  energyLow: (level: number) => ({
    title: '⚡ Enerji Kritik Seviyede!',
    body: `Enerji %${level} — madencilerin yavaşlıyor. Şarj et!`,
    tag: 'energy-low',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: { screen: 'panel' },
  }),
  dailyReminder: () => ({
    title: '🎁 Günlük Ödülün Seni Bekliyor!',
    body: 'Streak\'ini kaybetme — bugün giriş yapmayı unutma.',
    tag: 'daily-reminder',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: { screen: 'panel' },
  }),
  hackerAlert: () => ({
    title: '🚨 Hacker Saldırısı!',
    body: 'Sunucularına saldırı var! Hemen savunmaya geç.',
    tag: 'hacker-alert',
    requireInteraction: true,
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: { screen: 'panel' },
  }),
  levelUp: (level: number) => ({
    title: `🎉 Seviye ${level} Oldu!`,
    body: 'Yeni seviye bonuslarını toplamayı unutma!',
    tag: 'level-up',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: { screen: 'panel' },
  }),
  contractExpiring: (name: string) => ({
    title: '📋 Kontrat Bitiyor!',
    body: `"${name}" kontratının 1 saati kaldı. Tamamla!`,
    tag: 'contract-expiring',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: { screen: 'contracts' },
  }),
  guildBattleStart: (guildName: string) => ({
    title: '⚔️ Guild Savaşı Başladı!',
    body: `${guildName} guildi savaşa hazır. Katıl ve savaş!`,
    tag: 'guild-battle',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: { screen: 'social' },
  }),
} as const;

// ── Yardımcı: tarayıcı bildirimi gönder ──────────────────────────────────────

function sendLocalNotification(options: {
  title: string;
  body: string;
  tag: string;
  icon?: string;
  badge?: string;
  requireInteraction?: boolean;
  data?: Record<string, string>;
}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  // Sekme aktifse gösterme (zaten oyun açık)
  if (document.visibilityState === 'visible') return;

  try {
    // Service Worker üzerinden gönder (daha güvenilir)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(options.title, {
          body: options.body,
          tag: options.tag,
          icon: options.icon,
          badge: options.badge,
          requireInteraction: options.requireInteraction ?? false,
          data: options.data,
          // vibrate sadece mobilde çalışır
          ...(('vibrate' in navigator) ? { vibrate: [200, 100, 200] } : {}),
        } as any);
      });
    } else {
      // Fallback: doğrudan Notification API
      new Notification(options.title, {
        body: options.body,
        tag: options.tag,
        icon: options.icon,
        requireInteraction: options.requireInteraction ?? false,
      });
    }
  } catch (err) {
    console.warn('Bildirim gönderilemedi:', err);
  }
}

// ── localStorage yardımcıları ─────────────────────────────────────────────────

const LS = {
  get: (key: string): number => {
    try { return parseInt(localStorage.getItem(key) || '0', 10); } catch { return 0; }
  },
  set: (key: string, value: number) => {
    try { localStorage.setItem(key, String(value)); } catch {}
  },
};

const KEYS = {
  lastStoreFullNotif: 'pn_store_full',
  lastEnergyNotif:    'pn_energy_low',
  lastDailyNotif:     'pn_daily',
  lastHackerNotif:    'pn_hacker',
  lastLevelNotif:     'pn_level',
  fcmToken:           'pn_fcm_token',
  lastLogin:          'pn_last_login',
};

const COOLDOWNS = {
  storeFull:    30 * 60 * 1000,   // 30 dakika
  energyLow:    60 * 60 * 1000,   // 1 saat
  daily:        20 * 60 * 60 * 1000, // 20 saat
  hacker:        5 * 60 * 1000,   // 5 dakika
  level:        10 * 60 * 1000,   // 10 dakika (sadece 1 level notifi)
};

function isCooldownOver(key: string, cooldownMs: number): boolean {
  const last = LS.get(key);
  return Date.now() - last > cooldownMs;
}

// ── Ana Hook ──────────────────────────────────────────────────────────────────

interface GameSnapshot {
  btcBalance: number;
  btcPerSecond: number;         // saniyede kazanım
  energyLevel: number;          // 0-100
  level: number;
  hackerActive: boolean;
  contracts: Array<{ name: string; expiresAt: number }>;
  guildBattleActive: boolean;
  guildName: string;
  storageCapacityHours: number; // kaç saatlik depo var
}

export function usePushNotifications(game: GameSnapshot | null) {
  const prevLevelRef = useRef<number>(0);
  const permissionRef = useRef<NotificationPermission>('default');
  const storageCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── FCM token al ────────────────────────────────────────────────────────────
  const initFCM = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const cachedToken = localStorage.getItem(KEYS.fcmToken);
    if (cachedToken) return; // zaten var

    try {
      const token = await requestForToken();
      if (token) {
        localStorage.setItem(KEYS.fcmToken, token);
        console.log('[Push] FCM token alındı');
        // Token'ı Supabase'e kaydet (backend push için)
        // await supabase.from('push_tokens').upsert({ user_id, token });
      }
    } catch (err) {
      console.warn('[Push] FCM token hatası:', err);
    }
  }, []);

  // İzin verilince FCM'i başlat
  useEffect(() => {
    if ('Notification' in window) {
      permissionRef.current = Notification.permission;
      if (Notification.permission === 'granted') {
        initFCM();
        // Son giriş zamanını kaydet
        LS.set(KEYS.lastLogin, Date.now());
      }
    }
  }, [initFCM]);

  // FCM arka plan mesaj dinleyici
  useEffect(() => {
    try {
      onMessageListener((payload) => {
        // Uygulama açıkken FCM mesajı gelirse toast olarak göster
        // (bu NotificationContext.notify ile yapılabilir)
        console.log('[Push] Ön plan FCM mesajı:', payload);
      });
    } catch {}
  }, []);

  // ── Oyun durumu değişikliklerini izle ───────────────────────────────────────
  useEffect(() => {
    if (!game) return;
    if (Notification.permission !== 'granted') return;

    const now = Date.now();

    // ① DEPO DOLU kontrolü
    // btcPerSecond * storageCapacityHours*3600 = max kapasite
    if (game.btcPerSecond > 0 && game.storageCapacityHours > 0) {
      const maxCapacity = game.btcPerSecond * game.storageCapacityHours * 3600;
      const fillRatio = game.btcBalance / maxCapacity;

      if (fillRatio >= 0.95 && isCooldownOver(KEYS.lastStoreFullNotif, COOLDOWNS.storeFull)) {
        const btcStr = game.btcBalance.toFixed(6);
        sendLocalNotification(TEMPLATES.storeFull(btcStr));
        LS.set(KEYS.lastStoreFullNotif, now);
      }

      // Depo dolmadan önce zamanlayıcı kur (kalan süre hesapla)
      if (storageCheckTimerRef.current) clearTimeout(storageCheckTimerRef.current);
      if (fillRatio < 0.95 && game.btcPerSecond > 0) {
        const remaining = (maxCapacity - game.btcBalance) / game.btcPerSecond;
        const msUntilFull = remaining * 1000;
        // Dolmadan 2 dakika önce bildirim gönder
        const notifDelay = msUntilFull - 2 * 60 * 1000;
        if (notifDelay > 0 && notifDelay < 24 * 60 * 60 * 1000) {
          storageCheckTimerRef.current = setTimeout(() => {
            if (isCooldownOver(KEYS.lastStoreFullNotif, COOLDOWNS.storeFull)) {
              sendLocalNotification(TEMPLATES.storeFull(game.btcBalance.toFixed(6)));
              LS.set(KEYS.lastStoreFullNotif, Date.now());
            }
          }, notifDelay);
        }
      }
    }

    // ② ENERJİ DÜŞÜK
    if (game.energyLevel > 0 && game.energyLevel <= 20) {
      if (isCooldownOver(KEYS.lastEnergyNotif, COOLDOWNS.energyLow)) {
        sendLocalNotification(TEMPLATES.energyLow(game.energyLevel));
        LS.set(KEYS.lastEnergyNotif, now);
      }
    }

    // ③ HACKER SALDIRISI
    if (game.hackerActive) {
      if (isCooldownOver(KEYS.lastHackerNotif, COOLDOWNS.hacker)) {
        sendLocalNotification(TEMPLATES.hackerAlert());
        LS.set(KEYS.lastHackerNotif, now);
      }
    }

    // ④ LEVEL ATLAMAYI izle
    if (prevLevelRef.current > 0 && game.level > prevLevelRef.current) {
      if (isCooldownOver(KEYS.lastLevelNotif, COOLDOWNS.level)) {
        sendLocalNotification(TEMPLATES.levelUp(game.level));
        LS.set(KEYS.lastLevelNotif, now);
      }
    }
    prevLevelRef.current = game.level;

    // ⑤ KONTRAT süresi doluyor
    game.contracts.forEach(contract => {
      const timeLeft = contract.expiresAt - now;
      if (timeLeft > 0 && timeLeft <= 60 * 60 * 1000) {
        const key = `pn_contract_${contract.name.slice(0, 10)}`;
        if (isCooldownOver(key, 2 * 60 * 60 * 1000)) {
          sendLocalNotification(TEMPLATES.contractExpiring(contract.name));
          LS.set(key, now);
        }
      }
    });

    // ⑥ GUILD SAVAŞI
    if (game.guildBattleActive && game.guildName) {
      const key = 'pn_guild_battle';
      if (isCooldownOver(key, 4 * 60 * 60 * 1000)) {
        sendLocalNotification(TEMPLATES.guildBattleStart(game.guildName));
        LS.set(key, now);
      }
    }

    return () => {
      if (storageCheckTimerRef.current) clearTimeout(storageCheckTimerRef.current);
    };
  }, [game]);

  // ── Günlük hatırlatıcı — uygulama açıldığında kontrol ──────────────────────
  useEffect(() => {
    if (Notification.permission !== 'granted') return;

    // Zamanlanmış günlük bildirim (kullanıcı uygulamayı kapattıktan 20 saat sonra)
    const scheduleDailyReminder = () => {
      const lastLogin = LS.get(KEYS.lastLogin);
      if (!lastLogin) return;

      const hoursSinceLogin = (Date.now() - lastLogin) / (1000 * 60 * 60);

      // Eğer 20+ saat geçtiyse ve cooldown bittiyse
      if (hoursSinceLogin >= 20 && isCooldownOver(KEYS.lastDailyNotif, COOLDOWNS.daily)) {
        sendLocalNotification(TEMPLATES.dailyReminder());
        LS.set(KEYS.lastDailyNotif, Date.now());
      }
    };

    // Sayfa kapanmadan önce giriş zamanını kaydet
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        LS.set(KEYS.lastLogin, Date.now());

        // Service Worker'a 20 saat sonra bildirim gönderme talimatı ver
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_DAILY_REMINDER',
            delayMs: 20 * 60 * 60 * 1000,
          });
        }
      } else if (document.visibilityState === 'visible') {
        LS.set(KEYS.lastLogin, Date.now());
        scheduleDailyReminder();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ── İzin iste (dışarıdan çağrılabilir) ──────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') {
      await initFCM();
      return true;
    }
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    if (result === 'granted') {
      permissionRef.current = 'granted';
      LS.set(KEYS.lastLogin, Date.now());
      await initFCM();
      return true;
    }
    return false;
  }, [initFCM]);

  return { requestPermission };
}
