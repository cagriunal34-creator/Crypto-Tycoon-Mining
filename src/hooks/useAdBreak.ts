/**
 * useAdBreak — Interstitial & Rewarded Interstitial hook
 * Seviye atlama, doğal bekleme anlarında kullanılır.
 *
 * Kullanım:
 *   const { showInterstitial, showRewardedInterstitial } = useAdBreak();
 *   // Seviye geçişinde:
 *   showInterstitial({ beforeAd: () => pauseGame(), afterAd: () => resumeGame() });
 *   // Ödüllü geçiş:
 *   showRewardedInterstitial({ adViewed: () => grantBonus() });
 */
import { useCallback } from 'react';
import { googleAds, InterstitialAdCallbacks, RewardedAdCallbacks } from '../lib/googleAds';
import { useGame } from '../context/GameContext';

export function useAdBreak() {
  const { state } = useGame();
  const cfg = (state as any).googleAdsConfig;

  const showInterstitial = useCallback((callbacks: InterstitialAdCallbacks = {}) => {
    if (!cfg?.interstitialEnabled) return false;
    return googleAds.showInterstitial(callbacks);
  }, [cfg]);

  const showRewardedInterstitial = useCallback((callbacks: RewardedAdCallbacks = {}) => {
    if (!cfg?.rewardedInterstitialEnabled) return false;
    return googleAds.showRewardedInterstitial(callbacks);
  }, [cfg]);

  const showRewarded = useCallback((callbacks: RewardedAdCallbacks = {}) => {
    if (!cfg?.rewardedEnabled) return false;
    return googleAds.showRewarded(callbacks);
  }, [cfg]);

  const isAdReady = googleAds.isReady();

  return {
    showInterstitial,
    showRewardedInterstitial,
    showRewarded,
    isAdReady,
    cfg,
  };
}
