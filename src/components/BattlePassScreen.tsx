/**
 * BattlePassScreen v2 — Yeni Sezon, Animasyonlu
 *
 * Yenilikler v1 vs v2:
 * - 50 seviyeli tam sezon yolu (free + premium şerit)
 * - Yatay scroll rail (aktif seviye ortada)
 * - Sezon teması + animasyonlu banner
 * - XP progress bar + canlı sayaç
 * - Ödül claim animasyonu (patlama efekti)
 * - Premium karşılaştırma modal
 * - Sezon geçmişi tab
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, Zap, Gift, Crown, Lock, Check, ChevronRight,
  Clock, Flame, Trophy, Sparkles, ArrowRight, Info
} from 'lucide-react';
import { useGame, INITIAL_STATE } from '../context/GameContext';
import { BP_REWARDS, SEASON_2_REWARDS } from '../constants/gameData';
import { BattlePassReward } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';
import { useSoundEffects } from '../hooks/useSoundEffects';

// ── Sezon countdown ───────────────────────────────────────────────────────────
function useCountdown(endsAt: number) {
  const [rem, setRem] = useState(Math.max(0, endsAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setRem(Math.max(0, endsAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return {
    d: Math.floor(rem / 86400000),
    h: Math.floor((rem % 86400000) / 3600000),
    m: Math.floor((rem % 3600000) / 60000),
    s: Math.floor((rem % 60000) / 1000),
  };
}

// ── Ödül kartı ────────────────────────────────────────────────────────────────
function RewardCard({
  reward, isClaimed, isUnlocked, isPremiumUser, onClaim, animateIn
}: {
  reward: BattlePassReward;
  isClaimed: boolean;
  isUnlocked: boolean;
  isPremiumUser: boolean;
  onClaim: () => void;
  animateIn?: boolean;
}) {
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const gold = '#f59e0b';
  const color = reward.isPremium ? gold : a1;
  const canClaim = isUnlocked && !isClaimed && (!reward.isPremium || isPremiumUser);

  return (
    <motion.button
      whileTap={canClaim ? { scale: 0.9 } : {}}
      onClick={canClaim ? onClaim : undefined}
      className="flex flex-col items-center gap-1.5 shrink-0"
      style={{ width: 60, opacity: canClaim || isClaimed ? 1 : 0.4 }}
      initial={animateIn ? { scale: 0, opacity: 0 } : false}
      animate={animateIn ? { scale: 1, opacity: canClaim || isClaimed ? 1 : 0.4 } : {}}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
        style={{
          background: isClaimed
            ? `${color}20`
            : canClaim
              ? `${color}18`
              : 'rgba(255,255,255,0.04)',
          border: `2px solid ${isClaimed ? color + '70' : canClaim ? color + '50' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: canClaim ? `0 0 16px ${color}40` : 'none',
        }}>
        {isClaimed
          ? <Check size={20} style={{ color }} strokeWidth={3} />
          : (!isUnlocked || (reward.isPremium && !isPremiumUser))
            ? <Lock size={14} style={{ color: theme.vars['--ct-muted'] }} />
            : <span style={{ fontSize: 22 }}>{reward.emoji}</span>
        }
        {canClaim && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ background: color, opacity: 0.12 }}
            animate={{ opacity: [0.08, 0.22, 0.08] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        {reward.isPremium && !isPremiumUser && !isClaimed && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: gold, border: '1px solid #000' }}>
            <Crown size={8} color="#000" />
          </div>
        )}
      </div>
      <div className="text-[7px] font-black text-center leading-tight w-full truncate px-0.5"
        style={{ color: isClaimed ? theme.vars['--ct-muted'] : canClaim ? color : theme.vars['--ct-muted'] }}>
        {reward.type === 'tp'        && `${reward.value.toLocaleString()} TP`}
        {reward.type === 'btc'       && `${(reward.value as number).toFixed(5)}`}
        {reward.type === 'hashboost' && `+${reward.value} Gh`}
        {reward.type === 'energy'    && `+${reward.value} ⚡`}
        {reward.type === 'vip_day'   && `VIP ${reward.value}g`}
        {reward.type === 'cosmetic'  && 'Kozmetik'}
      </div>
    </motion.button>
  );
}

// ── Claim patlama animasyonu ──────────────────────────────────────────────────
function ClaimBurst({ color }: { color: string }) {
  return (
    <motion.div className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center">
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360;
        const dist = 80 + Math.random() * 60;
        return (
          <motion.div key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ background: color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * dist,
              y: Math.sin((angle * Math.PI) / 180) * dist,
              opacity: 0,
              scale: 0.2,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        );
      })}
    </motion.div>
  );
}

type BPTab = 'season' | 'rewards' | 'history';

export default function BattlePassScreen() {
  const { state, dispatch, isVipActive } = useGame();
  const { theme } = useTheme();
  const { notify } = useNotify();
  const { play } = useSoundEffects();
  const railRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<BPTab>('season');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [burstColor, setBurstColor] = useState<string | null>(null);
  const [lastClaimed, setLastClaimed] = useState<number | null>(null);

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];
  const gold = '#f59e0b';

  const bp = state.battlePass || INITIAL_STATE.battlePass;
  const isSeason2 = (bp.season ?? 1) >= 2;
  const rewards = isSeason2 ? SEASON_2_REWARDS : BP_REWARDS;
  const totalLevels = rewards.length;

  const xpPercent = bp.xpPerLevel > 0
    ? Math.min(100, (bp.currentXP / bp.xpPerLevel) * 100)
    : 0;

  const PREMIUM_COST = 3000;
  const endsAt = bp.endsAt || (Date.now() + 30 * 24 * 3600 * 1000);
  const { d, h, m, s } = useCountdown(endsAt);

  // Aktif seviyeyi ortaya kaydır
  useEffect(() => {
    if (!railRef.current) return;
    const activeLvl = bp.currentLevel;
    const cardW = 72; // card + gap
    const scrollTo = Math.max(0, activeLvl * cardW - railRef.current.clientWidth / 2);
    railRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
  }, [bp.currentLevel, tab]);

  const handleClaim = (reward: BattlePassReward) => {
    if (reward.isPremium && !bp.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    dispatch({ type: 'BP_CLAIM_REWARD', rewardId: reward.id });
    play('reward');

    const color = reward.isPremium ? gold : a1;
    setBurstColor(color);
    setLastClaimed(reward.level);
    setTimeout(() => setBurstColor(null), 700);

    const labels: Record<string, string> = {
      tp:        `+${(reward.value as number).toLocaleString()} TP kazandın! 🎯`,
      btc:       `+${(reward.value as number).toFixed(6)} BTC kazandın! ₿`,
      hashboost: `+${reward.value} Gh/s boost kazandın! ⚡`,
      energy:    `+${reward.value} enerji hücresi kazandın! 🔋`,
      vip_day:   `${reward.value} gün VIP kazandın! 👑`,
      cosmetic:  'Kozmetik ödül alındı! 🎨',
    };
    notify({ type: 'success', title: '🎁 Battle Pass Ödülü!', message: labels[reward.type] || 'Ödül alındı!' });
  };

  const handleBuyPremium = () => {
    if (state.tycoonPoints < PREMIUM_COST) {
      notify({ type: 'warning', title: 'Yetersiz TP', message: `${PREMIUM_COST.toLocaleString()} TP gerekiyor` });
      return;
    }
    dispatch({ type: 'BP_BUY_PREMIUM' });
    play('purchase');
    setShowPremiumModal(false);
    notify({ type: 'success', title: '👑 Premium Pass Aktif!', message: 'Tüm premium ödüller açıldı!' });
  };

  const claimedCount = bp.claimedRewardIds?.length ?? 0;
  const totalFree    = rewards.filter(r => !r.isPremium).length;
  const totalPrem    = rewards.filter(r => r.isPremium).length;

  return (
    <div className="space-y-4 pt-2 pb-24">

      {/* ── Claim burst overlay ── */}
      <AnimatePresence>
        {burstColor && <ClaimBurst key="burst" color={burstColor} />}
      </AnimatePresence>

      {/* ── Sezon Hero Banner ── */}
      <motion.div
        className="relative overflow-hidden rounded-[1.75rem] p-5"
        style={{ background: `linear-gradient(135deg, ${a1}14, ${a2}08)`, border: `1px solid ${a1}25` }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Arka plan dekorasyon */}
        <motion.div
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Star size={80} style={{ color: a1, opacity: 0.07 }} />
        </motion.div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${a1}18`, border: `1px solid ${a1}30` }}>
            <Flame size={22} style={{ color: a1 }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">
                Sezon {bp.season ?? 1}
              </span>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: `${a1}20`, color: a1, border: `1px solid ${a1}30` }}>
                AKTİF
              </span>
              {bp.isPremium && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: `${gold}20`, color: gold, border: `1px solid ${gold}30` }}>
                  👑 PREMİUM
                </span>
              )}
            </div>
            <div className="text-[10px] font-bold flex items-center gap-1 mt-0.5"
              style={{ color: 'var(--ct-muted)' }}>
              <Clock size={10} />
              {d}g {h}s {m}d {s}s kaldı
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-white">
              Seviye {bp.currentLevel} / {totalLevels}
            </span>
            <span className="text-[10px] font-bold" style={{ color: a1 }}>
              {bp.currentXP} / {bp.xpPerLevel} XP
            </span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${a1}, ${a2})`, boxShadow: `0 0 10px ${a1}60` }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Alınan',  value: claimedCount,  color: a1      },
            { label: 'Ücretsiz', value: totalFree,    color: '#34d399' },
            { label: 'Premium', value: totalPrem,     color: gold     },
          ].map(s => (
            <div key={s.label} className="text-center py-2 rounded-xl"
              style={{ background: `${s.color}0c`, border: `1px solid ${s.color}20` }}>
              <div className="text-sm font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Tab bar ── */}
      <div className="flex p-1 gap-1 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([
          { id:'season',  label:'🔥 Sezon Yolu' },
          { id:'rewards', label:'🎁 Ödüller'     },
          { id:'history', label:'📜 Geçmiş'      },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            style={{
              background: tab === t.id ? `${a1}18` : 'transparent',
              color:      tab === t.id ? a1 : 'var(--ct-muted)',
              border:     tab === t.id ? `1px solid ${a1}30` : '1px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══ SEZON YOLU ══ */}
        {tab === 'season' && (
          <motion.div key="season"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Row labels */}
            <div className="flex mb-2 px-1">
              <div className="flex-1 text-[8px] font-black uppercase tracking-widest text-center py-1.5 rounded-l-xl"
                style={{ color: a1, background: `${a1}10`, border: `1px solid ${a1}20` }}>
                🆓 Ücretsiz Şerit
              </div>
              <div className="flex-1 text-[8px] font-black uppercase tracking-widest text-center py-1.5 rounded-r-xl"
                style={{ color: gold, background: `${gold}10`, border: `1px solid ${gold}20` }}>
                👑 Premium Şerit
              </div>
            </div>

            {/* Horizontal rail */}
            <div ref={railRef} className="overflow-x-auto pb-2 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex gap-2 px-2" style={{ width: 'max-content' }}>
                {rewards.map((reward, idx) => {
                  const isUnlocked = bp.currentLevel >= reward.level;
                  const isClaimed  = bp.claimedRewardIds?.includes(reward.id) ?? false;
                  const isActive   = bp.currentLevel === reward.level;
                  return (
                    <div key={reward.id} className="flex flex-col items-center gap-1">
                      {/* Level badge */}
                      <div className="text-[8px] font-black rounded-full w-5 h-5 flex items-center justify-center"
                        style={{
                          background: isActive ? a1 : isUnlocked ? `${a1}20` : 'rgba(255,255,255,0.05)',
                          color: isActive ? '#000' : isUnlocked ? a1 : 'var(--ct-muted)',
                        }}>
                        {reward.level}
                      </div>

                      {/* Free row */}
                      {!reward.isPremium && (
                        <RewardCard
                          reward={reward} isClaimed={isClaimed}
                          isUnlocked={isUnlocked} isPremiumUser={bp.isPremium}
                          onClaim={() => handleClaim(reward)}
                          animateIn={isActive}
                        />
                      )}
                      {reward.isPremium && (
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}>
                          <span className="text-[10px]">—</span>
                        </div>
                      )}

                      {/* Connector line */}
                      {idx < rewards.length - 1 && (
                        <div className="w-0.5 h-3 rounded-full"
                          style={{ background: isUnlocked ? `${a1}40` : 'rgba(255,255,255,0.06)' }} />
                      )}

                      {/* Premium row */}
                      {reward.isPremium && (
                        <RewardCard
                          reward={reward} isClaimed={isClaimed}
                          isUnlocked={isUnlocked} isPremiumUser={bp.isPremium}
                          onClaim={() => handleClaim(reward)}
                          animateIn={isActive}
                        />
                      )}
                      {!reward.isPremium && (
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}>
                          <span className="text-[10px]">—</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Premium CTA */}
            {!bp.isPremium && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowPremiumModal(true)}
                className="w-full py-4 mt-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${gold}cc, ${gold}88)`,
                  color: '#000',
                  boxShadow: `0 8px 24px ${gold}30`,
                }}
              >
                <Crown size={16} /> Premium Pass Al — {PREMIUM_COST.toLocaleString()} TP
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ══ ÖDÜLLER LİSTESİ ══ */}
        {tab === 'rewards' && (
          <motion.div key="rewards"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-2">
            {rewards.filter(r => {
              const isUnlocked = bp.currentLevel >= r.level;
              const isClaimed  = bp.claimedRewardIds?.includes(r.id) ?? false;
              return isUnlocked && !isClaimed;
            }).length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-sm font-black text-white">Tüm mevcut ödüller alındı!</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--ct-muted)' }}>
                  Daha fazla ödül için XP kazan
                </p>
              </div>
            )}
            {rewards.map((r, i) => {
              const isUnlocked = bp.currentLevel >= r.level;
              const isClaimed  = bp.claimedRewardIds?.includes(r.id) ?? false;
              const canClaim   = isUnlocked && !isClaimed && (!r.isPremium || bp.isPremium);
              if (!canClaim) return null;
              const color = r.isPremium ? gold : a1;
              return (
                <motion.div key={r.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl"
                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${color}15` }}>
                    {r.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-white">{r.label}</p>
                    <p className="text-[9px] font-bold" style={{ color: 'var(--ct-muted)' }}>
                      Seviye {r.level} {r.isPremium ? '· 👑 Premium' : '· 🆓 Ücretsiz'}
                    </p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleClaim(r)}
                    className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}>
                    Al!
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ══ GEÇMİŞ SEZONLAR ══ */}
        {tab === 'history' && (
          <motion.div key="history"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3">
            {[
              { season: 1, level: 32, premium: false, ended: 'Şub 2026', reward: '12.500 TP + 0.00045 BTC' },
            ].map((h, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black shrink-0"
                  style={{ background: `${a1}15`, color: a1 }}>
                  S{h.season}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-white">Sezon {h.season}</p>
                  <p className="text-[9px]" style={{ color: 'var(--ct-muted)' }}>
                    {h.ended} · Seviye {h.level} · {h.premium ? '👑 Premium' : '🆓 Ücretsiz'}
                  </p>
                </div>
                <p className="text-[9px] font-black text-right" style={{ color: a1 }}>{h.reward}</p>
              </div>
            ))}
            <p className="text-center text-[10px]" style={{ color: 'var(--ct-muted)' }}>
              Gelecekteki sezonlar burada görünecek
            </p>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Premium Modal ── */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowPremiumModal(false)}
          >
            <motion.div
              className="w-full max-w-md overflow-hidden"
              style={{ background: '#0d1117', border: `1px solid ${gold}30`, borderRadius: '28px 28px 0 0' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, ${gold}80, ${gold}, ${gold}80)` }} />
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl mb-2">👑</motion.div>
                  <h2 className="text-xl font-black text-white">Premium Pass</h2>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--ct-muted)' }}>
                    Tüm premium ödülleri açın
                  </p>
                </div>
                {/* Compare */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Ücretsiz', perks: [`${totalFree} ödül`, 'Temel ödüller', 'Sezon ilerlemesi'], color: a1, cost: 'ÜCRETSİZ' },
                    { label: 'Premium',  perks: [`${totalLevels} ödül`, 'BTC + VIP ödüller', '2× XP kazanımı'], color: gold, cost: `${PREMIUM_COST.toLocaleString()} TP` },
                  ].map(p => (
                    <div key={p.label} className="p-4 rounded-2xl"
                      style={{ background: `${p.color}0a`, border: `1px solid ${p.color}25` }}>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: p.color }}>{p.label}</p>
                      {p.perks.map((pk, i) => (
                        <div key={i} className="flex items-center gap-1.5 mb-1">
                          <Check size={10} style={{ color: p.color }} />
                          <span className="text-[9px] text-white/70">{pk}</span>
                        </div>
                      ))}
                      <div className="mt-3 text-xs font-black" style={{ color: p.color }}>{p.cost}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-center font-bold" style={{ color: 'var(--ct-muted)' }}>
                  Bakiyen: {state.tycoonPoints.toLocaleString()} TP
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleBuyPremium}
                  disabled={state.tycoonPoints < PREMIUM_COST}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{
                    background: `linear-gradient(135deg, ${gold}cc, ${gold}88)`,
                    color: '#000',
                    boxShadow: `0 8px 24px ${gold}30`,
                  }}>
                  <Crown size={16} /> Premium Al — {PREMIUM_COST.toLocaleString()} TP
                </motion.button>
                <button onClick={() => setShowPremiumModal(false)}
                  className="w-full text-center text-[10px] font-bold uppercase"
                  style={{ color: 'var(--ct-muted)' }}>
                  Şimdi değil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
