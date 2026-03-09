/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Zap } from 'lucide-react';
import { useGame } from '../context/GameContext';

/**
 * Animates a number smoothly from previous to current value.
 */
function useAnimatedValue(value: number, duration = 800) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef(value);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = startRef.current;
    const to = value;
    if (Math.abs(to - from) < 1e-12) return;

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        startRef.current = to;
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return display;
}

/**
 * Main live earnings card — shows BTC balance that ticks upward in real time.
 */
export default function LiveEarningsCard() {
  const { state, btcToUsd, formatBtc, effectiveHashRate } = useGame();
  const [sessionEarned, setSessionEarned] = useState(0);
  const [prevBalance, setPrevBalance] = useState(state.btcBalance);

  // Track session earnings
  useEffect(() => {
    const diff = state.btcBalance - prevBalance;
    if (diff > 0) {
      setSessionEarned(prev => prev + diff);
    }
    setPrevBalance(state.btcBalance);
  }, [state.btcBalance]);

  // Animated values
  const animatedBtc = useAnimatedValue(state.btcBalance);
  const animatedTp = useAnimatedValue(state.tycoonPoints);

  const usdValue = btcToUsd(animatedBtc);
  const btcFormatted = formatBtc(animatedBtc);

  // BTC/s for real-time display
  const btcPerSecond = effectiveHashRate * 1e-9 * 0.5 * (state.happyHourActive ? 1.2 : 1);
  const btcPer5s = (btcPerSecond * 5).toFixed(10);

  return (
    <div className="space-y-3">
      {/* Main Balance Card - Futuristic */}
      <div className="relative group">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500/30 to-emerald-700/30 rounded-2xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
        <div className="relative bg-[#080808] rounded-2xl p-5 space-y-4 border border-white/5">

          {/* Background Grid */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 rounded-2xl"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>

          {/* Live indicator */}
          <div className="relative flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-sm animate-pulse"></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full relative z-10" />
              </div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em]">Canlı Bakiye</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <TrendingUp size={10} className="text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-mono font-bold">+{(btcPerSecond * 3600).toFixed(12)} BTC/s</span>
            </div>
          </div>

          {/* USD — Primary big number */}
          <div className="relative z-10 space-y-1">
            <div className="text-4xl font-black tracking-tighter tabular-nums text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {usdValue}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-mono text-zinc-400 tabular-nums tracking-tight">{btcFormatted}</span>
              <span className="text-xs font-bold text-emerald-500">BTC</span>
            </div>
          </div>

          {/* Session earned */}
          <AnimatePresence>
            {sessionEarned > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex items-center gap-1.5 pt-2 border-t border-white/5"
              >
                <Zap size={10} className="text-emerald-500" fill="currentColor" />
                <span className="text-[10px] text-emerald-500 font-mono">
                  SESSION: +{formatBtc(sessionEarned)} BTC
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* TP Card & Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel rounded-xl p-4 space-y-1 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={40} /></div>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">TycoonPoints</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tabular-nums text-white">{Math.floor(animatedTp).toLocaleString()}</span>
            <span className="text-[10px] text-emerald-500 font-bold">TP</span>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 space-y-1 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={40} /></div>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Tahmini Günlük</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tabular-nums text-white">{btcToUsd(btcPerSecond * 86400)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
