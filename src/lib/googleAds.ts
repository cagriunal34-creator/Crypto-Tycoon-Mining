/**
 * Google Ads Manager — H5 Games Ads API
 * Web uygulamaları için tam AdMob eşdeğeri.
 * Desteklenen formatlar: Banner, Interstitial, Rewarded, Rewarded Interstitial, App Open, Native
 *
 * Dökümantasyon: https://developers.google.com/ad-placement/apis/adbreak
 */

// ─── Type Definitions ───────────────────────────────────────────────────────

export type AdBreakType =
  | 'preroll'       // Uygulama açılışı
  | 'start'         // Oyun başlangıcı
  | 'pause'         // Oyun durduğunda
  | 'next'          // Seviye geçişi (Interstitial)
  | 'browse'        // İçerik gezerken
  | 'reward'        // Ödüllü reklam (kullanıcı seçer)
  | 'rewarded-interstitial'; // Ödüllü geçiş (otomatik gösterilir)

export interface AdBreakStatus {
  breakStatus:
    | 'notReady'
    | 'timeout'
    | 'error'
    | 'noAdPreloaded'
    | 'frequencyCapped'
    | 'ignored'
    | 'dismissed'
    | 'viewed'
    | 'other';
}

export interface RewardedAdCallbacks {
  beforeReward?: (showAdFn: () => void) => void;
  adViewed?: () => void;
  adDismissed?: () => void;
  adBreakDone?: (info: AdBreakStatus) => void;
}

export interface InterstitialAdCallbacks {
  beforeAd?: () => void;
  afterAd?: () => void;
  adBreakDone?: (info: AdBreakStatus) => void;
}

export interface GoogleAdsConfig {
  publisherId: string;          // ca-pub-XXXXXXXXXX
  bannerSlotId: string;
  interstitialSlotId: string;
  rewardedSlotId: string;
  rewardedInterstitialSlotId: string;
  appOpenSlotId: string;
  nativeSlotId: string;
  bannerEnabled: boolean;
  interstitialEnabled: boolean;
  rewardedEnabled: boolean;
  rewardedInterstitialEnabled: boolean;
  appOpenEnabled: boolean;
  nativeEnabled: boolean;
  testMode: boolean;
  bannerPosition: 'top' | 'bottom';
  bannerAutoRefresh: boolean;
  bannerRefreshSeconds: number;
  interstitialFrequencyMinutes: number;
}

export const DEFAULT_ADS_CONFIG: GoogleAdsConfig = {
  publisherId: 'ca-pub-6329108306834809',
  bannerSlotId: '3631061424',
  interstitialSlotId: '1622865249',
  rewardedSlotId: '5303235747',
  rewardedInterstitialSlotId: '5199293961',
  appOpenSlotId: '1220520508',
  nativeSlotId: '6472847183',
  bannerEnabled: false,        // İlk açılışta hepsini test modunda dene, sonra aç
  interstitialEnabled: false,
  rewardedEnabled: true,
  rewardedInterstitialEnabled: false,
  appOpenEnabled: false,
  nativeEnabled: false,
  testMode: true,              // ⚠️ Yayına almadan önce false yap
  bannerPosition: 'bottom',
  bannerAutoRefresh: true,
  bannerRefreshSeconds: 30,
  interstitialFrequencyMinutes: 5,
};

// ─── Test Ad Unit IDs (Google Resmi) ────────────────────────────────────────
// testMode: true olduğunda bu ID'ler override olarak kullanılır
export const TEST_AD_UNITS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  rewardedInterstitial: 'ca-app-pub-3940256099942544/6978759866',
  appOpen: 'ca-app-pub-3940256099942544/9257395921',
  native: 'ca-app-pub-3940256099942544/2247696110',
};

// ─── Global type augmentation ────────────────────────────────────────────────
declare global {
  interface Window {
    adsbygoogle: any[];
    adBreak: (params: any) => void;
    adConfig: (params: any) => void;
    __adsScriptLoaded?: boolean;
    __adsConfigured?: boolean;
  }
}

// ─── Script Loader ───────────────────────────────────────────────────────────
export function loadAdScript(publisherId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.__adsScriptLoaded) { resolve(); return; }
    if (!publisherId) { reject(new Error('Publisher ID gerekli')); return; }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      window.__adsScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('AdSense script yüklenemedi'));
    document.head.appendChild(script);
  });
}

// ─── Ad Configuration ────────────────────────────────────────────────────────
export function configureAds(preload = true): void {
  if (window.__adsConfigured) return;
  window.adsbygoogle = window.adsbygoogle || [];
  (window.adsbygoogle as any).push({
    google_ad_client: undefined, // publisherId zaten script URL'de
  });

  if (typeof window.adConfig === 'function') {
    window.adConfig({
      preloadAdBreaks: preload ? 'on' : 'off',
      sound: 'on',
    });
    window.__adsConfigured = true;
  }
}

// ─── Ad Manager Class ────────────────────────────────────────────────────────
class GoogleAdsManager {
  private config: GoogleAdsConfig = DEFAULT_ADS_CONFIG;
  private initialized = false;
  private lastInterstitialAt = 0;

  async init(cfg: GoogleAdsConfig): Promise<void> {
    this.config = cfg;
    if (!cfg.publisherId || (!cfg.testMode && !cfg.publisherId.startsWith('ca-pub-'))) {
      console.warn('[GoogleAds] Geçersiz Publisher ID');
      return;
    }
    try {
      await loadAdScript(cfg.publisherId);
      configureAds(true);
      this.initialized = true;
      console.info('[GoogleAds] Hazır ✓');
    } catch (e) {
      console.error('[GoogleAds] Başlatma hatası:', e);
    }
  }

  isReady(): boolean {
    return this.initialized && typeof window.adBreak === 'function';
  }

  // ── Interstitial (Geçiş Reklamı) ──────────────────────────────────────────
  showInterstitial(callbacks: InterstitialAdCallbacks = {}): boolean {
    if (!this.isReady() || !this.config.interstitialEnabled) return false;

    const minutesSinceLast = (Date.now() - this.lastInterstitialAt) / 60000;
    if (minutesSinceLast < this.config.interstitialFrequencyMinutes) return false;

    this.lastInterstitialAt = Date.now();

    window.adBreak({
      type: 'next',
      name: 'level-transition',
      beforeAd: callbacks.beforeAd,
      afterAd: callbacks.afterAd,
      adBreakDone: (info: AdBreakStatus) => {
        callbacks.adBreakDone?.(info);
        if (info.breakStatus !== 'viewed') {
          this.lastInterstitialAt = 0; // gösterilmediyse sayacı sıfırla
        }
      },
    });
    return true;
  }

  // ── Rewarded Ad (Ödüllü Reklam) ───────────────────────────────────────────
  showRewarded(callbacks: RewardedAdCallbacks = {}): boolean {
    if (!this.isReady() || !this.config.rewardedEnabled) return false;

    window.adBreak({
      type: 'reward',
      name: 'watch-ad-reward',
      beforeReward: callbacks.beforeReward ?? ((show) => show()),
      adViewed: callbacks.adViewed,
      adDismissed: callbacks.adDismissed,
      adBreakDone: callbacks.adBreakDone,
    });
    return true;
  }

  // ── Rewarded Interstitial (Ödüllü Geçiş) ─────────────────────────────────
  showRewardedInterstitial(callbacks: RewardedAdCallbacks = {}): boolean {
    if (!this.isReady() || !this.config.rewardedInterstitialEnabled) return false;

    window.adBreak({
      type: 'reward',
      name: 'rewarded-interstitial',
      beforeReward: callbacks.beforeReward ?? ((show) => show()),
      adViewed: callbacks.adViewed,
      adDismissed: callbacks.adDismissed,
      adBreakDone: callbacks.adBreakDone,
    });
    return true;
  }

  // ── App Open Ad (Uygulama Açılış) ─────────────────────────────────────────
  showAppOpen(callbacks: InterstitialAdCallbacks = {}): boolean {
    if (!this.isReady() || !this.config.appOpenEnabled) return false;

    window.adBreak({
      type: 'preroll',
      name: 'app-open',
      adBreakDone: callbacks.adBreakDone,
    });
    return true;
  }

  getConfig(): GoogleAdsConfig {
    return this.config;
  }

  updateConfig(partial: Partial<GoogleAdsConfig>): void {
    this.config = { ...this.config, ...partial };
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────
export const googleAds = new GoogleAdsManager();
export default googleAds;
