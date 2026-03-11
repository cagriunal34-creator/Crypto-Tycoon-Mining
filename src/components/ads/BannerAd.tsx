/**
 * BannerAd — Google AdSense Banner Bileşeni
 * Belirli aralıklarla otomatik yenilenir.
 * Position: 'top' | 'bottom' (sticky)
 */
import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';

interface BannerAdProps {
  slotId?: string;
  format?: 'auto' | 'banner' | 'rectangle' | 'leaderboard';
  className?: string;
  style?: React.CSSProperties;
}

export default function BannerAd({
  slotId,
  format = 'auto',
  className = '',
  style,
}: BannerAdProps) {
  const { state } = useGame();
  const insRef = useRef<HTMLModElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval>>();

  const cfg = (state as any).googleAdsConfig;
  const publisherId = cfg?.publisherId || state.bannerAdUnitId?.split('/')[0] || '';
  const effectiveSlotId = slotId || cfg?.bannerSlotId || state.bannerAdUnitId || '';
  const enabled = cfg?.bannerEnabled ?? false;
  const refreshSecs = cfg?.bannerRefreshSeconds ?? 30;
  const autoRefresh = cfg?.bannerAutoRefresh ?? true;

  const pushAd = () => {
    try {
      if (!insRef.current) return;
      // Temizle ve yeniden oluştur
      insRef.current.innerHTML = '';
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setLoaded(true);
      setError(false);
    } catch (e) {
      setError(true);
    }
  };

  useEffect(() => {
    if (!enabled || !effectiveSlotId || !publisherId) return;
    if (!window.adsbygoogle) return;

    pushAd();

    if (autoRefresh && refreshSecs >= 30) {
      refreshTimerRef.current = setInterval(() => {
        pushAd();
      }, refreshSecs * 1000);
    }

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [enabled, effectiveSlotId, publisherId]);

  if (!enabled || !effectiveSlotId || !publisherId) return null;
  if (error) return null;

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ minHeight: 50, ...style }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={effectiveSlotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      {!loaded && (
        <div className="h-[50px] flex items-center justify-center bg-black/5 text-zinc-400 text-[9px] font-bold uppercase tracking-widest">
          Reklam yükleniyor...
        </div>
      )}
    </div>
  );
}

// ─── Sticky Banner (Fixed Position) ─────────────────────────────────────────
export function StickyBannerAd({ position = 'bottom' }: { position?: 'top' | 'bottom' }) {
  const { state } = useGame();
  const cfg = (state as any).googleAdsConfig;
  const enabled = cfg?.bannerEnabled ?? false;
  const pos = cfg?.bannerPosition ?? position;

  if (!enabled) return null;

  return (
    <div
      className="fixed left-0 right-0 z-40 max-w-md mx-auto"
      style={{
        [pos === 'top' ? 'top' : 'bottom']: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <BannerAd format="banner" />
    </div>
  );
}
