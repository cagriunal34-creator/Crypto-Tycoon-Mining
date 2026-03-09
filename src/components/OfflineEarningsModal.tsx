import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Zap, TrendingUp, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { BattlePassReward } from '../types';
import { useTheme } from '../context/ThemeContext';

export default function OfflineEarningsModal({ earnings, onClose }: { earnings: number; onClose: () => void }) {
  const { state, btcToUsd } = useGame();
  const { theme } = useTheme();

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];
  const a3 = theme.vars['--ct-a3'];


  const handleClaim = () => {
    onClose();
  };

  const earned = earnings;

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
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: theme.vars['--ct-bg'], border: `1px solid ${a1}30` }}
          >
            {/* Top glow bar */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${a2}, ${a1}, ${a3})` }} />

            {/* Header */}
            <div className="relative p-6 pb-4 text-center overflow-hidden">
              {/* Background orbs */}
              <div className="absolute inset-0 pointer-events-none">
                <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', background: `${a1}10`, filter: 'blur(40px)' }} />
              </div>

              {/* Moon icon with ring */}
              <div className="relative inline-flex items-center justify-center mb-4">
                <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: `1px solid ${a1}30`, animation: 'pulse 2s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', width: 64, height: 64, borderRadius: '50%', border: `1px solid ${a1}50` }} />
                <div className="relative w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${a1}20, ${a2}15)`, border: `1px solid ${a1}40` }}>
                  <Moon size={28} style={{ color: a1 }} />
                </div>
              </div>

              <h2 className="text-xl font-black mb-1" style={{ color: theme.vars['--ct-text'] }}>
                Hoş Geldin! 👋
              </h2>
              <p className="text-sm" style={{ color: theme.vars['--ct-muted'] }}>
                {hoursAway >= 1
                  ? `${hoursAway.toFixed(1)} saat boyunca çevrimdışıydın`
                  : `Kısa süre çevrimdışıydın`}
              </p>
            </div>

            {/* Earnings display */}
            <div className="px-6 pb-4">
              <div className="rounded-2xl p-5 text-center space-y-3 relative overflow-hidden"
                style={{ background: `${a1}08`, border: `1px solid ${a1}20` }}>
                {/* Shimmer */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                  <div style={{
                    position: 'absolute', top: 0, left: '-60%', width: '40%', height: '100%',
                    background: `linear-gradient(105deg, transparent 40%, ${a1}10 50%, transparent 60%)`,
                    animation: 'shimmer 3s ease-in-out infinite',
                  }} />
                </div>

                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.vars['--ct-muted'] }}>
                  Çevrimdışı Madencilik Kazancı
                </p>

                {/* BTC amount */}
                <div className="space-y-1">
                  <div className="text-4xl font-black tabular-nums"
                    style={{ background: `linear-gradient(90deg, ${theme.vars['--ct-text']}, ${a1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    +{earned.toFixed(8)}
                  </div>
                  <div className="text-lg font-bold" style={{ color: a1 }}>BTC</div>
                  <div className="text-sm" style={{ color: theme.vars['--ct-muted'] }}>
                    ≈ {btcToUsd(earned)}
                  </div>
                </div>

                {/* Mini stats row */}
                <div className="grid grid-cols-3 gap-2 pt-2" style={{ borderTop: `1px solid ${a1}15` }}>
                  {[
                    { label: 'Hashrate', val: `${state.totalHashRate.toFixed(0)} Gh/s` },
                    { label: 'Süre', val: `${Math.min(hoursAway, 8).toFixed(1)}s` },
                    { label: 'Çarpan', val: `×${state.prestigeMultiplier.toFixed(2)}` },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-xs font-black" style={{ color: theme.vars['--ct-text'] }}>{s.val}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: theme.vars['--ct-muted'] }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note about 8h cap */}
              <p className="text-[10px] text-center mt-2" style={{ color: theme.vars['--ct-muted'] }}>
                * Çevrimdışı kazanç maks. 8 saat ile sınırlıdır
              </p>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 space-y-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleClaim}
                className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all"
                style={{ background: `linear-gradient(135deg, ${a1}, ${a2})`, color: '#fff', boxShadow: `0 8px 24px ${a1}40` }}>
                <Zap size={20} fill="currentColor" />
                <span>Kazancı Topla!</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
