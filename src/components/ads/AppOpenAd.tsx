/**
 * AppOpenAd — Uygulama Açılış Reklamı
 * Uygulama ilk açıldığında veya arka plandan döndüğünde gösterilir.
 * Yükleme ekranının üzerinde çıkar, kullanıcı kapatabilir.
 */
import React, { useEffect, useState, useRef } from 'react';
import { X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { googleAds } from '../../lib/googleAds';
import { useGame } from '../../context/GameContext';

const CLOSE_DELAY = 5; // saniye — kullanıcı kapatabilmeden önce

export default function AppOpenAd() {
  const { state } = useGame();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(CLOSE_DELAY);
  const [adShown, setAdShown] = useState(false);
  const timerRef = useRef<any>(null);
  const shownRef = useRef(false);

  const cfg = (state as any).googleAdsConfig;
  const enabled = cfg?.appOpenEnabled ?? false;

  useEffect(() => {
    if (!enabled || shownRef.current) return;

    // Uygulama ilk yüklendiğinde kısa gecikme ile göster
    const timeout = setTimeout(() => {
      if (!googleAds.isReady()) return;

      shownRef.current = true;
      setVisible(true);
      setCountdown(CLOSE_DELAY);

      googleAds.showAppOpen({
        adBreakDone: (info) => {
          if (info.breakStatus === 'viewed') {
            setAdShown(true);
          }
        },
      });

      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, 1200);

    // Arka plandan dönüş için visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden && shownRef.current) {
        // İkinci kez arka plandan dönünce tekrar göster (isteğe bağlı)
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeout);
      clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  const handleClose = () => {
    if (countdown > 0) return;
    setVisible(false);
    clearInterval(timerRef.current);
  };

  if (!enabled) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
        >
          {/* Header */}
          <div className="w-full max-w-sm px-4 flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Reklam</span>
            <button
              onClick={handleClose}
              disabled={countdown > 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all"
              style={{
                background: countdown > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                color: countdown > 0 ? '#71717a' : '#fff',
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {countdown > 0 ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-zinc-600 flex items-center justify-center text-[8px] font-black">
                    {countdown}
                  </span>
                  Bekle
                </>
              ) : (
                <>
                  <X size={10} />
                  Kapat
                </>
              )}
            </button>
          </div>

          {/* Ad slot */}
          <div
            className="w-full max-w-sm mx-4 rounded-3xl overflow-hidden"
            style={{ background: '#111', minHeight: 300, border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)' }}
              >
                <Play size={28} className="text-emerald-500 ml-1" />
              </div>
              <div>
                <p className="text-white font-black text-sm uppercase tracking-tight">Reklam Yükleniyor</p>
                <p className="text-zinc-500 text-[9px] font-bold mt-1">Google Ads tarafından sunulmaktadır</p>
              </div>
              {/* Google App Open ad renders here via adBreak API */}
              <ins
                className="adsbygoogle"
                style={{ display: 'block', width: '100%', minHeight: 200 }}
                data-ad-client={(state as any).googleAdsConfig?.publisherId || ''}
                data-ad-slot={(state as any).googleAdsConfig?.appOpenSlotId || ''}
                data-ad-format="auto"
              />
            </div>
          </div>

          {/* Footer */}
          <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-4">
            Bu reklam {CLOSE_DELAY} saniye sonra kapatılabilir
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
