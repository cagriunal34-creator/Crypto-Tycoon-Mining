import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Zap, TrendingUp, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { BattlePassReward } from '../types';
import { useTheme } from '../context/ThemeContext';

export default function OfflineEarningsModal({ 
  earnings, 
  onClose,
  onWatchAd 
}: { 
  earnings: number; 
  onClose: () => void;
  onWatchAd: () => void;
}) {
  const { state, btcToUsd } = useGame();
  const { theme } = useTheme();

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];
  const a3 = theme.vars['--ct-a3'];

  const handleClaimNormal = () => {
    onClose();
  };

  const handleClaimDouble = () => {
    onWatchAd(); // This will trigger the ad and then grant reward (handled in GameContext)
    onClose();
  };

  const earned = earnings;
  const doubleEarned = earnings * 2;

  // Calculate hours away from elapsed time
  const estimatedBtcPerSec = state.totalHashRate * 1e-9 * 0.5 * state.prestigeMultiplier;
  const hoursAway = earned > 0
    ? Math.min(8, (earned / (estimatedBtcPerSec || 0.00000001)) / 3600)
    : 0;

  return (
    <AnimatePresence>
      {earnings > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl"
            style={{ background: theme.vars['--ct-bg'], border: `1px solid ${a1}30` }}
          >
            {/* Top glow bar */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${a2}, ${a1}, ${a3})` }} />

            {/* Header */}
            <div className="relative p-6 pb-4 text-center overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', width: 220, height: 220, borderRadius: '50%', background: `${a1}15`, filter: 'blur(50px)' }} />
              </div>

              <div className="relative inline-flex items-center justify-center mb-6">
                <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', border: `1px solid ${a1}30`, animation: 'pulse 2s ease-in-out infinite' }} />
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${a1}25, ${a2}15)`, border: `1px solid ${a1}40` }}>
                  <Moon size={32} style={{ color: a1 }} />
                </div>
              </div>

              <h2 className="text-2xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
                Uykusu Gelmeyen Maden! ⛏️
              </h2>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: theme.vars['--ct-muted'] }}>
                Siz uyurken {hoursAway.toFixed(1)} saat kazandınız
              </p>
            </div>

            {/* Earnings display */}
            <div className="px-6 pb-6">
              <div className="rounded-3xl p-6 text-center space-y-4 relative overflow-hidden"
                style={{ background: `${a1}05`, border: `1px solid ${a1}15` }}>
                
                <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: a1 }}>
                  Toplam Biriken
                </p>

                <div className="space-y-1">
                  <div className="text-4xl font-black tabular-nums tracking-tighter"
                    style={{ color: '#fff' }}>
                    {earned.toFixed(8)}
                  </div>
                  <div className="text-xs font-black" style={{ color: theme.vars['--ct-muted'] }}>BTC</div>
                  <div className="text-sm font-bold opacity-60" style={{ color: a1 }}>
                    ≈ {btcToUsd(earned)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: `1px solid ${a1}10` }}>
                  {[
                    { label: 'Hashrate', val: `${state.totalHashRate.toFixed(0)} Gh/s` },
                    { label: 'Verim', val: '%50' },
                    { label: 'Çarpan', val: `×${state.prestigeMultiplier.toFixed(2)}` },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="text-[10px] font-black text-white">{s.val}</div>
                      <div className="text-[8px] font-bold uppercase opacity-40 mt-0.5 tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ad Promo Area */}
            <div className="px-6 pb-6">
               <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleClaimDouble}
                className="w-full py-4 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1 transition-all relative group overflow-hidden"
                style={{ background: `linear-gradient(135deg, #fbbf24, #f59e0b)`, color: '#000', boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  <span className="uppercase tracking-widest">Reklam İzle & 2× Al!</span>
                </div>
                <span className="text-[10px] font-bold opacity-70">HEMEN {doubleEarned.toFixed(8)} BTC AL</span>
              </motion.button>
              
              <button
                onClick={handleClaimNormal}
                className="w-full py-4 mt-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-white/5 opacity-40 hover:opacity-100"
                style={{ color: theme.vars['--ct-muted'] }}>
                Normal Topla
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
   )}
    </AnimatePresence>
  );
}
