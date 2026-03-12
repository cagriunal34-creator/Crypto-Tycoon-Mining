/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Zap, ChevronRight, HelpCircle, Info, Gift,
  FileText, ZapOff, Flame, Bell, Star, TrendingUp, Crown,
  Gauge, Timer, AlertTriangle, Snowflake, ShoppingCart
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

// ── Overclock Card ─────────────────────────────────────────────────────────
function OverclockCard({ isActive, isCooldown, multiplier, secondsLeft, cooldownSecondsLeft, cfg, tycoonPoints, onActivate, accentColor, theme }: {
  isActive: boolean; isCooldown: boolean; multiplier: number;
  secondsLeft: number; cooldownSecondsLeft: number;
  cfg: any; tycoonPoints: number; onActivate: () => void;
  accentColor: string; theme: any;
}) {
  const canAfford = tycoonPoints >= (cfg?.costTp || 0);
  const canActivate = !isActive && !isCooldown && canAfford;

  const boostPct = Math.round((cfg?.multiplier - 1) * 100);
  const penaltyPct = Math.round((1 - cfg?.penalty) * 100);

  // Renk: aktif=sarı, cooldown=mavi, normal=accent
  const color = isActive ? '#F59E0B' : isCooldown ? '#60A5FA' : accentColor;
  const Icon = isActive ? Gauge : isCooldown ? Snowflake : Zap;

  // Progress için kalan süre yüzdesi
  const totalSecs = isActive
    ? (cfg?.durationMinutes || 120) * 60
    : (cfg?.cooldownMinutes || 240) * 60;
  const remaining = isActive ? secondsLeft : cooldownSecondsLeft;
  const progressPct = isActive || isCooldown ? Math.max(0, (remaining / totalSecs) * 100) : 0;

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}s ${m.toString().padStart(2, '0')}dk`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{ background: `${color}07`, border: `1px solid ${color}25` }}
      animate={isActive ? { boxShadow: [`0 0 0px ${color}00`, `0 0 18px ${color}30`, `0 0 0px ${color}00`] } : {}}
      transition={isActive ? { duration: 2, repeat: Infinity } : {}}
    >
      {/* Glow blob */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 pointer-events-none"
        style={{ background: color, filter: 'blur(20px)' }} />

      {/* Progress bar (aktif veya cooldown iken) */}
      {(isActive || isCooldown) && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `${color}15` }}>
          <motion.div className="h-full" style={{ background: color }}
            animate={{ width: `${progressPct}%` }} transition={{ duration: 1 }} />
        </div>
      )}

      <div className="flex items-center justify-between relative z-10">
        {/* Sol: ikon + başlık */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <motion.div
              animate={isActive ? { rotate: [0, 15, -15, 0] } : {}}
              transition={isActive ? { duration: 0.5, repeat: Infinity, repeatDelay: 1.5 } : {}}>
              <Icon size={18} style={{ color }} />
            </motion.div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: theme.vars['--ct-text'] }}>
                Overclock
              </span>
              {isActive && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse"
                  style={{ background: `${color}20`, color }}>AKTİF</span>
              )}
              {isCooldown && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: `${color}20`, color }}>COOLDOWN</span>
              )}
            </div>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: theme.vars['--ct-muted'] }}>
              {isActive
                ? `⚡ +${boostPct}% · ${formatTime(secondsLeft)} kaldı`
                : isCooldown
                  ? `❄️ −${penaltyPct}% ceza · ${formatTime(cooldownSecondsLeft)} kaldı`
                  : `+${boostPct}% hashrate · ${cfg?.durationMinutes}dk · ${cfg?.costTp} TP`}
            </p>
          </div>
        </div>

        {/* Sağ: Büyük multiplier + buton */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xl font-black tabular-nums" style={{ color }}>
            {isActive ? `×${multiplier.toFixed(2)}` : isCooldown ? `×${multiplier.toFixed(2)}` : `×${cfg?.multiplier?.toFixed(1) || '1.5'}`}
          </span>
          <button
            onClick={onActivate}
            disabled={!canActivate}
            className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed"
            style={canActivate
              ? { background: color, color: '#000', boxShadow: `0 4px 16px ${color}40` }
              : { background: `${color}15`, color: `${color}60`, border: `1px solid ${color}20` }
            }>
            {isActive ? 'Aktif' : isCooldown ? `❄️ ${formatTime(cooldownSecondsLeft)}` : canAfford ? 'Başlat' : `${cfg?.costTp} TP Yok`}
          </button>
        </div>
      </div>

      {/* Alt bilgi satırı (sadece normal durumda) */}
      {!isActive && !isCooldown && (
        <div className="flex items-center gap-4 mt-3 pt-3 relative z-10"
          style={{ borderTop: `1px solid ${color}15` }}>
          {[
            { label: 'Süre', val: `${cfg?.durationMinutes}dk`, icon: Timer },
            { label: 'Cooldown', val: `${cfg?.cooldownMinutes}dk`, icon: Snowflake },
            { label: 'Ceza', val: `-${penaltyPct}%`, icon: AlertTriangle },
            { label: 'Maliyet', val: `${cfg?.costTp} TP`, icon: Zap },
          ].map((item, i) => {
            const ItemIcon = item.icon;
            return (
              <div key={i} className="flex items-center gap-1">
                <ItemIcon size={9} style={{ color: `${color}80` }} />
                <span className="text-[8px] font-bold" style={{ color: theme.vars['--ct-muted'] }}>
                  {item.label}: <span style={{ color: `${color}CC` }}>{item.val}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
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
    state, dispatch, btcToUsd, effectiveHashRate, energyScale, currentBtcPerSecond, isVipActive,
    dailyEarnedPct, dailyCapReached, isVipCapExempt, dailyEarnedBtc,
    activateOverclock, isOverclockActive, isOverclockCooldown,
    overclockMultiplier, overclockSecondsLeft, cooldownSecondsLeft
  } = useGame();
  const { notify, requestPushPermission, pushEnabled } = useNotify();
  const { theme } = useTheme();

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];
  const a3 = theme.vars['--ct-a3'];

  const energyPercentage = Math.round((state.energyCells / state.maxEnergyCells) * 100);
  const happyHourCountdown = useCountdown(state.happyHourEndsAt);
  const chartData = useHashHistory(effectiveHashRate);

  // Active events (non-expired) — local game events
  const now = Date.now();
  const activeLocalEvents = state.activeMiningEvents.filter(ev => ev.endsAt > now);

  // Admin-driven game events from Supabase (realtime synced)
  const adminGameEvents = (state.activeGameEvents || []).filter(ev => ev.active).map(ev => ({
    id: `admin-${ev.id}`,
    type: (ev.type as any) || 'flash_pool',
    label: ev.name,
    emoji: ev.type === 'multiplier' ? '⚡' : ev.type === 'bonus_tp' ? '🎯' : '💰',
    description: `${ev.multiplier > 1 ? `+${((ev.multiplier - 1) * 100).toFixed(0)}% BTC çarpanı` : 'Özel etkinlik'} — Admin tarafından başlatıldı`,
    multiplier: ev.multiplier || 1.0,
    hashBoost: 0,
    endsAt: ev.ends_at ? new Date(ev.ends_at).getTime() : now + 86400000,
    startsAt: new Date(ev.created_at).getTime(),
  }));

  const activeEvents = [...activeLocalEvents, ...adminGameEvents];

  // Energy color: red < 30%, yellow 30-60%, green/accent > 60%
  const energyColor = energyPercentage < 30 ? '#EF4444'
    : energyPercentage < 60 ? '#F59E0B'
      : a1;

  const handleWatchAd = () => {
    onWatchAd();
    notify({ type: 'mining', title: 'Reklam izleniyor…', message: '+2 enerji hücresi ve +10 TP kazanacaksın.' });
  };

  return (
    <div className="space-y-6 pt-4 pb-12">
      {/* Top Banner Area (Full Width) */}
      <div className="space-y-4">
        <MiningEventsBar events={activeEvents} />
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
      </div>

      {/* Main Grid Content */}
      <div className={cn("grid gap-6", "lg:grid-cols-12 lg:items-start")}>
        
        {/* Left Column: Visuals & Core Status (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-8 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `${a1}05` }} />
            <BTC3D />
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3"
                   style={{ background: `${a1}10`, borderColor: `${a1}20` }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: a1 }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: a1 }}>Sistem Aktif</span>
              </div>
              <h3 className="text-3xl font-black italic tracking-tighter text-white">
                {effectiveHashRate.toFixed(1)} <span className="text-lg" style={{ color: a1 }}>GH/S</span>
              </h3>
            </div>
          </div>

          <LiveEarningsCard />
          <SocialFeed />
        </div>

        {/* Right Column: Controls & Charts (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Row: Quick Stats & Battery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <BatteryWidget
                level={energyPercentage}
                staticDisplay={true}
                showPercent={true}
                className="premium-glass p-6 rounded-3xl"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-4 flex flex-col gap-2">
                  <TrendingUp size={16} style={{ color: a1 }} />
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>Donanım Sağlığı</span>
                  <span className="text-sm font-black text-white">
                    {state.ownedContracts.length > 0
                      ? `%${(state.ownedContracts.reduce((acc, c) => acc + c.condition, 0) / state.ownedContracts.length).toFixed(1)}`
                      : 'N/A'}
                  </span>
                </div>
                <div className="glass-card p-4 flex flex-col gap-2">
                  <Zap size={16} className="text-yellow-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>Enerji Gideri</span>
                  <span className="text-sm font-black text-white">
                    {Math.floor(state.farmSettings.baseElectricityCost * (1 - (state.farmSettings.powerSupplyLevel - 1) * 0.1))} TP/dk
                  </span>
                </div>
              </div>
            </div>

            <div className="premium-glass p-1 rounded-3xl overflow-hidden min-h-[240px]">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 rounded-full" style={{ background: a1 }} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>Canlı Hashrate</h3>
                  </div>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={chartData}>
                      <Line type="monotone" dataKey="speed" stroke={a1} strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Interaction Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.overclockConfig?.enabled && (
              <OverclockCard
                isActive={isOverclockActive}
                isCooldown={isOverclockCooldown}
                multiplier={overclockMultiplier}
                secondsLeft={overclockSecondsLeft}
                cooldownSecondsLeft={cooldownSecondsLeft}
                cfg={state.overclockConfig}
                tycoonPoints={state.tycoonPoints}
                onActivate={() => {
                  const result = activateOverclock();
                  if (result.success) {
                    notify({ type: 'mining', title: '⚡ Overclock Aktif!', message: result.message });
                  } else {
                    notify({ type: 'warning', title: 'Overclock', message: result.message });
                  }
                }}
                accentColor={a1}
                theme={theme}
              />
            )}
            <ProgressionPanel />
          </div>

          {/* Bottom Row: Rewards & Caps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PrestigePanel onOpenPrestige={onOpenPrestige} />
            <div className="premium-glass p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} style={{ color: dailyCapReached ? '#EF4444' : a1 }} />
                  <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>Günlük Limit</h3>
                </div>
                <span className="text-xs font-black italic text-white">{dailyEarnedBtc.toFixed(8)} BTC</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyEarnedPct}%` }}
                  className="h-full"
                  style={{ background: dailyCapReached ? '#EF4444' : a1 }}
                />
              </div>
              <p className="text-[10px] font-bold text-center uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>
                {dailyCapReached ? 'Günlük kazanç limitine ulaşıldı' : `Kapasite: %${dailyEarnedPct.toFixed(1)}`}
              </p>
            </div>
          </div>

        </div>
      </div>

      <div className="flex items-center justify-center gap-8 opacity-30 pt-8 pb-4">
        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:opacity-100 transition-opacity">
          <HelpCircle size={14} /><span>Yardım Merkezi</span>
        </button>
        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:opacity-100 transition-opacity">
          <Info size={14} /><span>Sistem Rehberi</span>
        </button>
      </div>

      {/* Action Buttons - Absolute bottom for user request */}
      <div className="flex justify-center w-full pt-4 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg px-4">
          <button onClick={() => onNavigate('vip')} className="premium-glass p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/5 transition-all">
            <Crown size={20} className="text-yellow-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">VIP</span>
          </button>
          <button onClick={() => onNavigate('battlepass')} className="premium-glass p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/5 transition-all">
            <Star size={20} style={{ color: a1 }} />
            <span className="text-[10px] font-black uppercase tracking-widest">PASS</span>
          </button>
          <button onClick={() => onNavigate('marketplace')} className="premium-glass p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/5 transition-all">
            <ShoppingCart size={20} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">PAZAR</span>
          </button>
          <button onClick={handleWatchAd} className="premium-glass p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-amber-500/10 transition-all group relative overflow-hidden"
            style={{ border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div className="absolute inset-0 bg-amber-500/5 blur-xl group-hover:bg-amber-500/10 transition-colors" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative z-10"
            >
              <Gift size={20} className="text-amber-500" />
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 relative z-10">BONUS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
