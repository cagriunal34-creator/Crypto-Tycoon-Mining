/**
 * AdRewardModal — Ödüllü Reklam Modalı (Google Ads Entegreli)
 * Kullanıcı "Reklamı Başlat"a tıklar → Google Rewarded Ad gösterilir
 * → İzlenirse adRewardBtc + adRewardTp verilir.
 * Admin panelinden ödül miktarları Supabase'den yüklenir.
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, CheckCircle2, XCircle, Gift, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { googleAds } from '../lib/googleAds';
import { useGame } from '../context/GameContext';
import { supabase } from '../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type AdState = 'idle' | 'loading' | 'showing' | 'success' | 'dismissed' | 'error';

export default function AdRewardModal({ isOpen, onClose }: Props) {
  const { 
    state, dispatch, 
    dailyCapReached, isVipCapExempt 
  } = useGame();
  const [adState, setAdState] = useState<AdState>('idle');
  const [earnedBtc, setEarnedBtc] = useState(0);
  const [earnedTp, setEarnedTp] = useState(0);
  const closingRef = useRef(false);

  // Ödül değerleri: state'den (admin paneli → Supabase → GameContext)
  const rewardBtc = state.adRewardBtc || 0;
  const rewardTp = state.adRewardTp || 0;
  const rewardEnabled = (state as any).adRewardEnabled !== false;
  const dailyLimit = (state as any).adRewardDailyLimit || 10;

  const useGoogleAds = googleAds.isReady() && (state as any).googleAdsConfig?.rewardedEnabled;

  const isLimitReached = dailyCapReached;

  useEffect(() => {
    if (!isOpen) {
      setAdState('idle');
      closingRef.current = false;
    }
  }, [isOpen]);

  const handleWatchAd = async () => {
    if (!rewardEnabled) return;
    setAdState('loading');

    if (useGoogleAds) {
      // ── Google Ads Rewarded ──────────────────────────────────────────
      const shown = googleAds.showRewarded({
        beforeReward: (showAdFn) => {
          setAdState('showing');
          showAdFn();
        },
        adViewed: async () => {
          // Ödül ver
          await grantReward();
          setAdState('success');
        },
        adDismissed: () => {
          setAdState('dismissed');
        },
        adBreakDone: (info) => {
          if (info.breakStatus === 'error' || info.breakStatus === 'notReady') {
            // Google Ads mevcut değil → kendi simülasyonuna düş
            runSimulatedAd();
          }
        },
      });

      if (!shown) {
        runSimulatedAd();
      }
    } else {
      // ── Simülasyon (Google Ads yoksa) ───────────────────────────────
      runSimulatedAd();
    }
  };

  const runSimulatedAd = () => {
    setAdState('showing');
    const duration = (state as any).adRewardDuration || 30;
    setTimeout(async () => {
      await grantReward();
      setAdState('success');
    }, Math.min(duration * 1000, 5000)); // dev'de 5sn ile sınırla
  };

  const grantReward = async () => {
    setEarnedBtc(rewardBtc);
    setEarnedTp(rewardTp);

    // BTC ekle
    if (rewardBtc > 0) {
      dispatch({ type: 'ADD_BTC', amount: rewardBtc, label: 'Reklam Ödülü' } as any);
    }
    // TP ekle
    if (rewardTp > 0) {
      dispatch({ type: 'ADD_TP', amount: rewardTp });
    }

    // Supabase'e kaydet (opsiyonel - izleme sayısı)
    try {
      if (state.user?.uid) {
        await supabase.rpc('increment_ad_watch_count', {
          user_id: state.user.uid,
        });
      }
    } catch (_) {
      // RPC yoksa sessizce geç
    }
  };

  const a1 = '#10b981';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-[2rem] overflow-hidden shadow-2xl"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${a1}22` }}>
                  <Gift size={18} style={{ color: a1 }} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-white uppercase tracking-widest">ÖDÜLLÜ REKLAM</p>
                  <p className="text-[8px] font-bold text-zinc-500 uppercase">İZLE VE KAZAN</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                <X size={16} className="text-zinc-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {/* Ad preview area */}
              <div
                className="w-full rounded-2xl flex items-center justify-center mb-6 overflow-hidden"
                style={{ height: 180, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {adState === 'idle' && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Play size={22} className="text-zinc-400 ml-1" />
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hazır mısın?</p>
                  </div>
                )}
                {adState === 'loading' && (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw size={24} className="text-zinc-400 animate-spin" />
                    <p className="text-[10px] font-black text-zinc-500 uppercase">Reklam Yükleniyor</p>
                  </div>
                )}
                {adState === 'showing' && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center animate-pulse" style={{ background: `${a1}22` }}>
                      <Play size={22} style={{ color: a1 }} className="ml-1" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: a1 }}>Reklam Oynatılıyor...</p>
                    <p className="text-[8px] text-zinc-600 font-bold">Ödülünü almak için izlemeyi tamamla</p>
                  </div>
                )}
                {adState === 'success' && (
                  <div className="flex flex-col items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 14 }}
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: `${a1}22` }}
                    >
                      <CheckCircle2 size={28} style={{ color: a1 }} />
                    </motion.div>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: a1 }}>Tebrikler! Ödülün Eklendi</p>
                  </div>
                )}
                {adState === 'dismissed' && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500/10">
                      <XCircle size={28} className="text-red-400" />
                    </div>
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Reklam Kapatıldı</p>
                    <p className="text-[8px] text-zinc-600 font-bold">Ödül için reklamı izlemeyi tamamla</p>
                  </div>
                )}
                {adState === 'error' && (
                  <div className="flex flex-col items-center gap-3">
                    <XCircle size={24} className="text-zinc-600" />
                    <p className="text-[10px] font-black text-zinc-500 uppercase">Reklam Yüklenemedi</p>
                  </div>
                )}
              </div>

              {/* Reward pills */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,153,0,0.08)', border: '1px solid rgba(255,153,0,0.12)' }}>
                  <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    ₿ PARA ÖDÜLÜ
                  </p>
                  <p className="text-sm font-black text-orange-300 tabular-nums">
                    {rewardBtc > 0 ? rewardBtc.toFixed(10) : '0.0000000000'} BTC
                  </p>
                </div>
                <div className="p-4 rounded-2xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}>
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    ⬡ TP ÖDÜLÜ
                  </p>
                  <p className="text-sm font-black text-indigo-300 tabular-nums">
                    +{rewardTp > 0 ? rewardTp : 0} TP
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              {(adState === 'idle' || adState === 'dismissed' || adState === 'error') && (
                <div className="space-y-3">
                  {isLimitReached && (
                    <p className="text-[10px] font-bold text-red-400 text-center bg-red-400/10 py-2 rounded-xl border border-red-400/20">
                      Günlük $1 kazanç limitine ulaştın.<br/>
                      Daha fazla kazanmak için VIP al!
                    </p>
                  )}
                  <button
                    onClick={handleWatchAd}
                    disabled={!rewardEnabled || isLimitReached}
                    className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg disabled:opacity-40"
                    style={{ background: a1, color: '#000', boxShadow: `0 8px 24px ${a1}44` }}
                  >
                    <Play size={16} className="ml-1" />
                    REKLAMI BAŞLAT
                  </button>
                </div>
              )}
              {adState === 'success' && (
                <button
                  onClick={onClose}
                  className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: `${a1}18`, color: a1, border: `1px solid ${a1}44` }}
                >
                  <CheckCircle2 size={16} />
                  Harika! Kapat
                </button>
              )}
              {adState === 'showing' && (
                <div
                  className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#52525b' }}
                >
                  <RefreshCw size={14} className="animate-spin" />
                  Reklam oynatılıyor...
                </div>
              )}

              <p className="text-center text-[8px] text-zinc-600 font-bold mt-3 uppercase tracking-widest">
                Günlük {dailyLimit} kez kullanılabilir · Google Ads
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
