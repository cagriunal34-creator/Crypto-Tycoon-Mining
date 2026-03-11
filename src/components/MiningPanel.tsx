/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Zap, ChevronRight, HelpCircle, Info, Gift,
  FileText, ZapOff, Flame, Bell, Star, TrendingUp, Crown
} from 'lucide-react';
import { LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame, energyToHashScale } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import LiveEarningsCard from './LiveEarningsCard';
import ProgressionPanel from './ProgressionPanel';
import MiningEventsBar from './MiningEventsBar';
import PrestigePanel from './PrestigePanel';
import BTC3D from './BTC3D';
import SocialFeed from './SocialFeed';
import BatteryWidget from './BatteryWidget';

function useHashHistory(current: number) {
  const [history, setHistory] = React.useState<{ time: string; speed: number }[]>(
    Array.from({ length: 8 }, (_, i) => ({
      time: i === 7 ? 'Şimdi' : `-${(7 - i) * 5}s`,
      speed: current * (0.85 + Math.random() * 0.2),
    }))
  );
  React.useEffect(() => {
    const id = setInterval(() => {
      const jitter = (Math.random() - 0.5) * 0.08 * current;
      const newPoint = { time: 'Şimdi', speed: Math.max(0, current + jitter) };
      setHistory(prev => {
        const updated = [...prev.slice(1), newPoint];
        return updated.map((p, i) => ({ ...p, time: i === updated.length - 1 ? 'Şimdi' : `-${(updated.length - 1 - i) * 5}s` }));
      });
    }, 5000);
    return () => clearInterval(id);
  }, [current]);
  return history;
}

function useCountdown(endsAt: number) {
  const [remaining, setRemaining] = React.useState(Math.max(0, endsAt - Date.now()));
  React.useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, endsAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const s = Math.floor(remaining / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function MiningPanel({
  onOpenContracts,
  onWatchAd,
  onOpenPrestige,
  onNavigate,
}: {
  onOpenContracts: () => void;
  onWatchAd: () => void;
  onOpenPrestige: () => void;
  onNavigate: (screen: string) => void;
}) {
  const { 
    state, btcToUsd, effectiveHashRate, energyScale, currentBtcPerSecond, isVipActive,
    dailyEarnedPct, dailyCapReached, isVipCapExempt, dailyEarnedBtc 
  } = useGame();
  const { notify, requestPushPermission, pushEnabled } = useNotify();
  const { theme } = useTheme();

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];
  const a3 = theme.vars['--ct-a3'];

  const energyPercentage = Math.round((state.energyCells / state.maxEnergyCells) * 100);
  const happyHourCountdown = useCountdown(state.happyHourEndsAt);
  const chartData = useHashHistory(effectiveHashRate);

  // Active events (non-expired)
  const now = Date.now();
  const activeEvents = state.activeMiningEvents.filter(ev => ev.endsAt > now);

  // Energy color: red < 30%, yellow 30-60%, green/accent > 60%
  const energyColor = energyPercentage < 30 ? '#EF4444'
    : energyPercentage < 60 ? '#F59E0B'
      : a1;

  const handleWatchAd = () => {
    onWatchAd();
    notify({ type: 'mining', title: 'Reklam izleniyor…', message: '+2 enerji hücresi ve +10 TP kazanacaksın.' });
  };

  return (
    <div className="space-y-4 pt-4 pb-12">

      {/* ── Mining Events ─────────────────────────────────────── */}
      <MiningEventsBar events={activeEvents} />

      {/* ── Happy Hour Banner ─────────────────────────────────── */}
      <AnimatePresence>
        {state.happyHourActive && activeEvents.length === 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="relative overflow-hidden rounded-2xl"
              style={{ background: 'rgba(255,150,0,0.06)', border: '1px solid rgba(255,150,0,0.25)' }}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500 blur-lg opacity-40 animate-pulse rounded-full" />
                    <Flame size={18} className="text-orange-400 relative z-10" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-orange-100 uppercase tracking-widest">Mutlu Saatler</h4>
                    <p className="text-[10px] text-orange-500/80 font-mono">×1.2 KAZANÇ AKTIF</p>
                  </div>
                </div>
                <div className="text-sm font-black text-orange-400 font-mono">{happyHourCountdown}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center py-4">
        <BTC3D />
      </div>

      {/* ── Push notification prompt ───────────────────────────── */}
      <AnimatePresence>
        {!pushEnabled && (
          <motion.button initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            onClick={() => requestPushPermission()}
            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group"
            style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderLeft: '3px solid rgb(59,130,246)' }}>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Bell size={16} /></div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">Bildirimler</p>
              <p className="text-[10px] text-blue-400/60">Enerji dolduğunda, etkinlik başladığında haber al</p>
            </div>
            <ChevronRight size={16} className="text-blue-500/50 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Operational Overview ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Average Equipment Condition */}
        <div className="glass-card p-3 flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className={`p-2 rounded-lg ${state.ownedContracts.length === 0 ? 'bg-zinc-800 text-zinc-500' :
            (state.ownedContracts.reduce((acc, c) => acc + c.condition, 0) / (state.ownedContracts.length || 1)) > 80 ? 'bg-emerald-500/10 text-emerald-400' :
              (state.ownedContracts.reduce((acc, c) => acc + c.condition, 0) / (state.ownedContracts.length || 1)) > 40 ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-red-500/10 text-red-400'
            }`}>
            <TrendingUp size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Durum</p>
            <p className="text-xs font-black truncate">
              {state.ownedContracts.length > 0
                ? `%${(state.ownedContracts.reduce((acc, c) => acc + c.condition, 0) / state.ownedContracts.length).toFixed(1)} Sağlık`
                : 'Cihaz Yok'}
            </p>
          </div>
        </div>

        {/* Electricity Cost */}
        <div className="glass-card p-3 flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
            <Zap size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Gider</p>
            <p className="text-xs font-black truncate">
              {Math.floor(state.farmSettings.baseElectricityCost * (1 - (state.farmSettings.powerSupplyLevel - 1) * 0.1))} TP/dk
            </p>
          </div>
        </div>
      </div>

      {/* ── Live Earnings ──────────────────────────────────────── */}
      <LiveEarningsCard />

      {/* ── Prestige Panel ────────────────────────────────────── */}
      <PrestigePanel onOpenPrestige={onOpenPrestige} />

      {/* ── Progression ───────────────────────────────────────── */}
      <ProgressionPanel />

      {/* ── Mining Status ─────────────────────────────────────── */}
      <div className="text-center space-y-2 py-1">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: `${a1}0A`, border: `1px solid ${a1}30` }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: a1, boxShadow: `0 0 8px ${a1}` }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: a1 }}>
            Madencilik Aktif
          </span>
          {state.prestigeLevel > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: `${a1}15`, border: `1px solid ${a1}25` }}>
              <Star size={8} style={{ color: a1 }} fill="currentColor" />
              <span className="text-[8px] font-black" style={{ color: a1 }}>×{state.prestigeMultiplier.toFixed(2)}</span>
            </div>
          )}
          {isVipActive && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)' }}>
              <Crown size={8} style={{ color: '#FFD700' }} fill="currentColor" />
              <span className="text-[8px] font-black" style={{ color: '#FFD700' }}>
                {state.vip.tier === 'gold' ? 'GOLD' : 'SILVER'}
              </span>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tighter" style={{ color: theme.vars['--ct-text'] }}>
            <span style={{ color: a1 }}>.</span>MINING
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: theme.vars['--ct-muted'] }}>
            {effectiveHashRate.toFixed(1)} GH/S · {Math.floor(state.energyCells)}/{state.maxEnergyCells} CELL · {energyPercentage}% GÜÇ
          </p>
          {energyPercentage < 30 && (
            <p className="text-[10px] font-black text-red-400 animate-pulse mt-1">
              ⚠ Düşük enerji — hashrate %{Math.round(energyScale * 100)} kapasitede
            </p>
          )}
        </div>
      </div>

      {/* ── Hashrate Chart ─────────────────────────────────────── */}
      <div className="rounded-2xl p-1 relative overflow-hidden"
        style={{ background: `${a1}05`, border: `1px solid ${a1}15` }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${a1}50, transparent)` }} />
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 rounded-full" style={{ background: a1 }} />
              <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.vars['--ct-muted'] }}>Hashrate Monitörü</h3>
            </div>
            <div className="px-2 py-1 rounded-lg font-mono font-black text-xs"
              style={{ background: `${a1}12`, border: `1px solid ${a1}25`, color: a1 }}>
              {effectiveHashRate.toFixed(1)} GH/s
            </div>
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={a1} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={a1} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Line type="monotone" dataKey="speed" stroke={a1} strokeWidth={2}
                  dot={{ r: 2, fill: '#050505', stroke: a1, strokeWidth: 2 }}
                  activeDot={{ r: 4, fill: a1, stroke: '#fff' }}
                  isAnimationActive={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', border: `1px solid ${a1}30`, borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: a1, fontFamily: 'monospace' }}
                  formatter={(v: number) => [`${v.toFixed(1)} GH/s`, 'Hız']}
                  labelStyle={{ display: 'none' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Energy → Hashrate indicator */}
          <div className="flex items-center gap-3 pt-1" style={{ borderTop: `1px solid ${a1}10` }}>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: theme.vars['--ct-muted'] }}>Enerji Etkisi</div>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div className="h-full rounded-full"
                animate={{ width: `${energyScale * 100}%` }}
                style={{ background: `linear-gradient(90deg,${energyColor},${energyColor}AA)` }} />
            </div>
            <div className="text-[9px] font-black tabular-nums" style={{ color: energyColor }}>
              {Math.round(energyScale * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* ── Energy Cells ───────────────────────────────────────── */}
      <div className="rounded-2xl p-5 space-y-4 relative overflow-hidden"
        style={{ background: `${energyColor}05`, border: `1px solid ${energyColor}20` }}>
        <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-10"
          style={{ background: energyColor, filter: 'blur(24px)' }} />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} fill="currentColor" style={{ color: energyColor }} />
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: theme.vars['--ct-text'] }}>Güç Ünitesi</span>
            </div>
            <p className="text-[10px] font-mono" style={{ color: theme.vars['--ct-muted'] }}>
              {Math.floor(state.energyCells)}/{state.maxEnergyCells} · Hashrate {Math.round(energyScale * 100)}%
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-2xl font-black tabular-nums" style={{ color: theme.vars['--ct-text'] }}>
              {energyPercentage}<span className="text-sm" style={{ color: energyColor }}>%</span>
            </span>
            <button onClick={(e) => { e.stopPropagation(); handleWatchAd(); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black transition-all"
              style={{ background: `${a1}12`, border: `1px solid ${a1}25`, color: a1 }}>
              <span>+2 HÜCRE</span>
              <div className="px-1 py-0.5 rounded text-[7px] font-black" style={{ background: a1, color: '#000' }}>AD</div>
            </button>
          </div>
        </div>

        {/* ── Gerçek Pil Görseli (BatteryWidget) + Hücre Grid ── */}
        <div className="flex items-center gap-4 relative z-10">

          {/* Animasyonlu pil — admin panelinden kontrol edilir */}
          <div className="flex-shrink-0">
            <BatteryWidget
              level={energyPercentage}
              staticDisplay={true}
              showPercent={false}
              className=""
            />
          </div>

          {/* Hücre grid — her hücre bir pil gibi */}
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: state.maxEnergyCells }).map((_, i) => {
                const isActive = i < Math.floor(state.energyCells);
                const isFading = i === Math.floor(state.energyCells) && state.energyCells % 1 > 0;
                return (
                  <div key={i} className="h-6 rounded-md relative overflow-hidden transition-all duration-300"
                    style={{
                      background: isActive ? `linear-gradient(180deg, ${energyColor}33, ${energyColor}11)` : 'rgba(0,0,0,0.4)',
                      border: `1px solid ${isActive ? energyColor + '60' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: isActive ? `0 0 8px ${energyColor}20` : 'none',
                    }}>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                           <div className="w-[60%] h-[2px] rounded-full opacity-30" style={{ background: energyColor }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ background: energyColor, boxShadow: `0 0 10px ${energyColor}` }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hashrate bar */}
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.38)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                animate={{ width: `${energyScale * 100}%` }}
                style={{ background: `linear-gradient(90deg,${energyColor},${energyColor}AA)` }} />
            </div>
            <div className="flex justify-between items-center px-0.5">
              <p className="text-[9px] font-bold tracking-tight" style={{ color: theme.vars['--ct-muted'] }}>
                HASH MOTORU VERİMLİLİĞİ
              </p>
              <div className="text-[9px] font-black tabular-nums" style={{ color: energyColor }}>
                {Math.round(energyScale * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Energy → Hashrate explanation */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl relative z-10"
          style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${energyColor}15` }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${energyColor}10` }}>
            <TrendingUp size={12} style={{ color: energyColor }} />
          </div>
          <p className="text-[10px] leading-tight" style={{ color: theme.vars['--ct-muted'] }}>
            Piller doldukça verimlilik artar. Her pil <span className="text-white font-bold">1 SAAT</span> madencilik sağlar. 
            Güncel: <span style={{ color: energyColor, fontWeight: 900 }}>%{Math.round(energyScale * 100)} KAPASİTE</span>
          </p>
        </div>
      </div>

      <SocialFeed />
      
      {/* ── Daily Cap Progress ─────────────────────────────────── */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ 
          background: dailyCapReached ? 'rgba(239,68,68,0.04)' : `${a1}04`, 
          border: `1px solid ${dailyCapReached ? 'rgba(239,68,68,0.2)' : a1 + '15'}` 
        }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className={dailyCapReached ? "text-red-400" : ""} style={{ color: dailyCapReached ? undefined : a1 }} />
            <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.vars['--ct-muted'] }}>Günlük Kazanç Limiti</h3>
          </div>
          <span className="text-[10px] font-mono font-black" style={{ color: dailyCapReached ? '#EF4444' : a1 }}>
            {dailyCapReached ? 'LİMİT DOLDU' : `%${dailyEarnedPct.toFixed(1)}`}
          </span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${dailyEarnedPct}%` }}
            className="h-full rounded-full"
            style={{ background: dailyCapReached ? 'linear-gradient(90deg, #EF4444, #B91C1C)' : `linear-gradient(90deg, ${a1}, ${a2})` }} />
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest" style={{ color: theme.vars['--ct-muted'] }}>
          <span>{dailyEarnedBtc.toFixed(8)} BTC</span>
          <span>Hedef: $1.00</span>
        </div>
        {dailyCapReached && !isVipCapExempt && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
             className="pt-2 mt-2 border-t border-red-400/10 flex items-center justify-between gap-2">
             <p className="text-[9px] font-bold text-red-400">Günlük kazanç limitine ulaştın!</p>
             <button onClick={() => onNavigate('vip')} className="text-[9px] font-black bg-red-400 text-black px-2 py-0.5 rounded uppercase">VIP OL</button>
           </motion.div>
        )}
      </div>

      {/* ── Estimated Earnings ─────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: `${a1}04`, border: `1px solid ${a1}12` }}>
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ background: 'rgba(0,0,0,0.2)', borderBottom: `1px solid ${a1}10` }}>
          <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.vars['--ct-muted'] }}>Tahmini Getiri</h3>
          <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded"
            style={{ background: `${a1}12`, border: `1px solid ${a1}20`, color: a1 }}>
            1 BTC = ${state.usdRate.toLocaleString()}
          </span>
        </div>
        {[
          { label: 'SAATLİK', secs: 3600 },
          { label: 'GÜNLÜK', secs: 86400 },
          { label: 'AYLIK', secs: 2592000 },
        ].map(({ label, secs }, i, arr) => {
          const btc = currentBtcPerSecond * secs;
          return (
            <div key={label} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${a1}08` : 'none' }}>
              <span className="text-[10px] font-black tracking-wider" style={{ color: theme.vars['--ct-muted'] }}>{label}</span>
              <div className="text-right">
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-xs font-mono font-black" style={{ color: theme.vars['--ct-text'] }}>{btc.toFixed(8)}</span>
                  <span className="text-[9px] font-black" style={{ color: a1 }}>BTC</span>
                </div>
                <span className="text-[9px] font-mono" style={{ color: theme.vars['--ct-muted'] }}>{btcToUsd(btc)}</span>
              </div>
            </div>
          );
        })}
        {/* Prestige multiplier note */}
        {state.prestigeMultiplier > 1 && (
          <div className="px-4 py-2 text-center" style={{ borderTop: `1px solid ${a1}10`, background: `${a1}05` }}>
            <span className="text-[9px]" style={{ color: theme.vars['--ct-muted'] }}>
              Prestige ×{state.prestigeMultiplier.toFixed(2)} çarpanı dahildir
              <Star size={8} className="inline ml-1" style={{ color: a1 }} fill="currentColor" />
            </span>
          </div>
        )}
      </div>

      {/* ── Halving Progress ───────────────────────────────────── */}
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: 'rgba(255,150,0,0.04)', border: '1px solid rgba(255,150,0,0.15)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZapOff size={14} className="text-orange-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.vars['--ct-muted'] }}>Halving Geri Sayımı</h3>
          </div>
          <span className="text-[10px] text-orange-500 font-mono font-black">#{state.nextHalvingBlock.toLocaleString()}</span>
        </div>
        <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, ((state.currentBlock - (state.nextHalvingBlock - 210000)) / 210000) * 100))}%` }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #FF6A00, #FFD000)' }} />
        </div>
        <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest" style={{ color: theme.vars['--ct-muted'] }}>
          <span>Blok: {state.currentBlock.toLocaleString()}</span>
          <span>Kalan: {(state.nextHalvingBlock - state.currentBlock).toLocaleString()}</span>
        </div>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────── */}
      <div className="space-y-3">
        {/* New Features Quick Access */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onNavigate('vip')}
            className="group py-3 rounded-2xl relative overflow-hidden transition-all active:scale-95 flex flex-col items-center gap-1.5"
            style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}>
            <Crown size={18} style={{ color: '#FFD700' }} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: theme.vars['--ct-text'] }}>VIP</span>
          </button>
          <button onClick={() => onNavigate('battlepass')}
            className="group py-3 rounded-2xl relative overflow-hidden transition-all active:scale-95 flex flex-col items-center gap-1.5"
            style={{ background: `${a1}08`, border: `1px solid ${a1}20` }}>
            <Star size={18} style={{ color: a1 }} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: theme.vars['--ct-text'] }}>Pass</span>
          </button>
          <button onClick={() => onNavigate('marketplace')}
            className="group py-3 rounded-2xl relative overflow-hidden transition-all active:scale-95 flex flex-col items-center gap-1.5"
            style={{ background: `${a2}08`, border: `1px solid ${a2}20` }}>
            <FileText size={18} style={{ color: a2 }} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: theme.vars['--ct-text'] }}>Pazar</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleWatchAd}
            className="group py-4 rounded-2xl relative overflow-hidden transition-all active:scale-95"
            style={{ background: `${a3}08`, border: `1px solid ${a3}20` }}>
            <div className="flex flex-col items-center gap-1.5">
              <Gift size={18} style={{ color: a3 }} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.vars['--ct-text'] }}>Günlük Bonus</span>
            </div>
          </button>
          <button onClick={onOpenContracts}
            className="group py-4 rounded-2xl relative overflow-hidden transition-all active:scale-95"
            style={{ background: `${a2}08`, border: `1px solid ${a2}20` }}>
            <div className="flex flex-col items-center gap-1.5">
              <FileText size={18} style={{ color: a2 }} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.vars['--ct-text'] }}>Market</span>
            </div>
          </button>
        </div>

        <motion.button whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-2xl relative overflow-hidden font-black text-sm uppercase tracking-widest text-white"
          style={{ background: `linear-gradient(135deg,${a1},${a2})`, boxShadow: `0 6px 20px ${a1}35` }}>
          <div className="flex items-center justify-center gap-2">
            <Zap size={16} fill="currentColor" className="animate-pulse" />
            <span>Hızlandırılmış Madencilik</span>
          </div>
        </motion.button>
      </div>

      <div className="flex items-center justify-center gap-6 pb-4 opacity-40 hover:opacity-80 transition-opacity">
        <button className="flex items-center gap-1 text-[10px] hover:text-white transition-colors" style={{ color: theme.vars['--ct-muted'] }}>
          <HelpCircle size={11} /><span>YARDIM</span>
        </button>
        <button className="flex items-center gap-1 text-[10px] hover:text-white transition-colors" style={{ color: theme.vars['--ct-muted'] }}>
          <Info size={11} /><span>NEDİR?</span>
        </button>
      </div>
    </div>
  );
}
