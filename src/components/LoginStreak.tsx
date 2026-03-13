/**
 * LoginStreak v2 — 28 Günlük Ödül Takvimi
 *
 * - 4 haftalık kayan ödül döngüsü
 * - Her 7. gün süper bonus
 * - Streak koruma kalkanı (günde 1 kez kaçırma hakkı)
 * - Görsel takvim grid
 * - Tema rengiyle tam uyumlu
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Gift, CheckCircle2, Zap, Coins, Trophy, Flame, Shield, X, Star, Crown } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

// ── 28 günlük ödül şeması (4 hafta döngüsü) ──────────────────────────────────
const DAILY_REWARDS = [
  // Hafta 1
  { day: 1,  type: 'tp',     value: 200,       label: '200 TP',        icon: 'tp'  },
  { day: 2,  type: 'tp',     value: 400,       label: '400 TP',        icon: 'tp'  },
  { day: 3,  type: 'energy', value: 8,         label: '8 Enerji',      icon: 'energy' },
  { day: 4,  type: 'tp',     value: 600,       label: '600 TP',        icon: 'tp'  },
  { day: 5,  type: 'btc',   value: 0.000003,  label: '0.000003 BTC',  icon: 'btc' },
  { day: 6,  type: 'tp',     value: 1000,      label: '1000 TP',       icon: 'tp'  },
  { day: 7,  type: 'super',  value: 0.00002,   label: '0.00002 BTC 🌟', icon: 'super' },
  // Hafta 2
  { day: 8,  type: 'tp',     value: 300,       label: '300 TP',        icon: 'tp'  },
  { day: 9,  type: 'energy', value: 12,        label: '12 Enerji',     icon: 'energy' },
  { day: 10, type: 'tp',     value: 750,       label: '750 TP',        icon: 'tp'  },
  { day: 11, type: 'btc',   value: 0.000005,  label: '0.000005 BTC',  icon: 'btc' },
  { day: 12, type: 'tp',     value: 1200,      label: '1200 TP',       icon: 'tp'  },
  { day: 13, type: 'energy', value: 20,        label: '20 Enerji',     icon: 'energy' },
  { day: 14, type: 'super',  value: 0.00005,   label: '0.00005 BTC 👑', icon: 'super' },
  // Hafta 3
  { day: 15, type: 'tp',     value: 500,       label: '500 TP',        icon: 'tp'  },
  { day: 16, type: 'btc',   value: 0.000008,  label: '0.000008 BTC',  icon: 'btc' },
  { day: 17, type: 'energy', value: 15,        label: '15 Enerji',     icon: 'energy' },
  { day: 18, type: 'tp',     value: 1500,      label: '1500 TP',       icon: 'tp'  },
  { day: 19, type: 'btc',   value: 0.00001,   label: '0.00001 BTC',   icon: 'btc' },
  { day: 20, type: 'tp',     value: 2000,      label: '2000 TP',       icon: 'tp'  },
  { day: 21, type: 'super',  value: 0.0001,    label: '0.0001 BTC 🔥',  icon: 'super' },
  // Hafta 4
  { day: 22, type: 'tp',     value: 800,       label: '800 TP',        icon: 'tp'  },
  { day: 23, type: 'energy', value: 24,        label: '24 Enerji',     icon: 'energy' },
  { day: 24, type: 'btc',   value: 0.000015,  label: '0.000015 BTC',  icon: 'btc' },
  { day: 25, type: 'tp',     value: 2500,      label: '2500 TP',       icon: 'tp'  },
  { day: 26, type: 'btc',   value: 0.00002,   label: '0.00002 BTC',   icon: 'btc' },
  { day: 27, type: 'tp',     value: 3000,      label: '3000 TP',       icon: 'tp'  },
  { day: 28, type: 'super',  value: 0.0003,    label: '0.0003 BTC 💎',  icon: 'super' },
];

const WEEK_LABELS = ['Hafta 1', 'Hafta 2', 'Hafta 3', 'Hafta 4'];

function todayStr() { return new Date().toISOString().split('T')[0]; }
function toDateStr(val: number | string | null | undefined): string | null {
  if (!val) return null;
  try { return new Date(val).toISOString().split('T')[0]; } catch { return null; }
}

function RewardIcon({ icon, size = 16, color }: { icon: string; size?: number; color: string }) {
  if (icon === 'tp')     return <Trophy size={size} style={{ color }} />;
  if (icon === 'btc')    return <Coins  size={size} style={{ color }} />;
  if (icon === 'energy') return <Zap    size={size} style={{ color }} />;
  if (icon === 'super')  return <Star   size={size} style={{ color }} fill={color} />;
  return <Gift size={size} style={{ color }} />;
}

const LS_SHIELD_KEY = 'streak_shield_used_v1';

export default function LoginStreak() {
  const { state, claimStreakReward } = useGame();
  const { notify } = useNotify();
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const [isOpen, setIsOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const shownRef = useRef(false);

  // Streak kalkanı: Bir gün kaçırma hakkı
  const shieldUsedDate = (() => { try { return localStorage.getItem(LS_SHIELD_KEY) || ''; } catch { return ''; } })();
  const canUseShield = shieldUsedDate !== todayStr() && (state.streak?.count ?? 0) >= 3;

  useEffect(() => {
    if (state.isLoading || !state.user) return;
    if (shownRef.current) return;
    const lastClaimDate = toDateStr(state.streak?.lastClaim);
    const today = todayStr();
    if (lastClaimDate !== today) {
      const timer = setTimeout(() => {
        const recheck = toDateStr(state.streak?.lastClaim);
        if (recheck !== today && !shownRef.current) {
          shownRef.current = true;
          // Hangi haftayı göster
          const dayInCycle = (state.streak?.count ?? 0) % 28;
          setActiveWeek(Math.floor(dayInCycle / 7));
          setIsOpen(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      shownRef.current = true;
    }
  }, [state.isLoading, state.user?.uid, state.streak?.lastClaim]);

  const handleClaim = async () => {
    if (claiming || claimed) return;
    setClaiming(true);
    try {
      await claimStreakReward();
      setClaimed(true);
      const dayIndex = (state.streak?.count ?? 0) % 28;
      const reward = DAILY_REWARDS[dayIndex];
      notify({ type: 'success', title: '🎁 Günlük Ödül!', message: `${reward.label} hesabına eklendi. ${state.streak?.count ?? 0 + 1}. gün serisi!` });
      setTimeout(() => setIsOpen(false), 1400);
    } catch {
      notify({ type: 'warning', title: 'Hata', message: 'Ödül alınırken sorun oluştu.' });
      setClaiming(false);
    }
  };

  const handleUseShield = () => {
    try { localStorage.setItem(LS_SHIELD_KEY, todayStr()); } catch {}
    notify({ type: 'success', title: '🛡️ Kalkan Kullanıldı!', message: 'Streak\'in bugün korundu. Yarın devam et!' });
    setIsOpen(false);
  };

  const streakCount = state.streak?.count ?? 0;
  const dayInCycle = streakCount % 28;
  const currentDayNum = dayInCycle + 1; // 1-28
  const alreadyClaimed = toDateStr(state.streak?.lastClaim) === todayStr();
  const todayReward = DAILY_REWARDS[dayInCycle];

  // Hafta bazlı günler (0-indexed slice)
  const weekDays = DAILY_REWARDS.slice(activeWeek * 7, activeWeek * 7 + 7);

  return (
    <AnimatePresence>
      {isOpen && !alreadyClaimed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ scale: 0.88, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="w-full max-w-sm relative overflow-hidden"
            style={{
              background: 'rgba(6,8,14,0.98)',
              border: `1px solid ${a1}30`,
              borderRadius: 28,
              boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${a1}10`,
            }}
          >
            {/* Top accent */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${a2}, ${a1}, ${a2})` }} />

            {/* Close */}
            <button onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/5 transition-colors z-10"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }}>
              <X size={16} />
            </button>

            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-5">
                <motion.div
                  animate={claimed ? { scale: [1, 1.3, 1] } : { rotate: [0, -8, 8, -4, 4, 0] }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: `${a1}18`, border: `1px solid ${a1}30` }}
                >
                  {claimed
                    ? <CheckCircle2 size={32} style={{ color: a1 }} />
                    : <Calendar size={32} style={{ color: a1 }} />
                  }
                </motion.div>
                <h2 className="text-xl font-black text-white mb-1">
                  {claimed ? 'Ödül Alındı! 🎉' : 'Günlük Giriş Ödülü'}
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <Flame size={14} style={{ color: '#f87171' }} />
                  <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#f87171' }}>
                    {streakCount} Günlük Seri
                  </span>
                </div>
              </div>

              {/* Bugünün ödülü — büyük vurgu */}
              {!claimed && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="mb-5 p-4 rounded-2xl text-center"
                  style={{
                    background: todayReward.type === 'super' ? `linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.06))` : `${a1}10`,
                    border: `1px solid ${todayReward.type === 'super' ? 'rgba(251,191,36,0.3)' : a1 + '25'}`,
                  }}
                >
                  <div className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--ct-muted, #71717a)' }}>
                    {currentDayNum}. GÜN ÖDÜLÜ
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: todayReward.type === 'super' ? 'rgba(251,191,36,0.15)' : `${a1}18` }}>
                      <RewardIcon icon={todayReward.icon} size={24}
                        color={todayReward.type === 'super' ? '#fbbf24' : a1} />
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-black" style={{ color: todayReward.type === 'super' ? '#fbbf24' : a1 }}>
                        {todayReward.label}
                      </div>
                      {todayReward.type === 'super' && (
                        <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">⭐ Haftalık Büyük Ödül!</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Hafta tab'ları */}
              <div className="flex gap-1 mb-3 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {WEEK_LABELS.map((label, wi) => {
                  const weekStart = wi * 7 + 1;
                  const weekDone = streakCount >= (wi + 1) * 7;
                  const weekActive = Math.floor(dayInCycle / 7) === wi;
                  return (
                    <button key={wi} onClick={() => setActiveWeek(wi)}
                      className="flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all"
                      style={{
                        background: activeWeek === wi ? `${a1}18` : 'transparent',
                        color: activeWeek === wi ? a1 : weekDone ? '#34d399' : 'var(--ct-muted, #71717a)',
                        border: activeWeek === wi ? `1px solid ${a1}30` : '1px solid transparent',
                      }}>
                      {weekDone ? '✓' : `H${wi + 1}`}
                    </button>
                  );
                })}
              </div>

              {/* 7 günlük grid */}
              <div className="grid grid-cols-7 gap-1.5 mb-5">
                {weekDays.map((r) => {
                  const globalDay = r.day; // 1-28
                  const isDone = streakCount >= globalDay;
                  const isToday = globalDay === currentDayNum;
                  const isSuper = r.type === 'super';

                  return (
                    <motion.div
                      key={r.day}
                      whileHover={isToday ? { scale: 1.08 } : {}}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl relative"
                      style={{
                        background: isToday
                          ? isSuper ? 'rgba(251,191,36,0.12)' : `${a1}12`
                          : isDone ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
                        border: isToday
                          ? `1px solid ${isSuper ? 'rgba(251,191,36,0.4)' : a1 + '40'}`
                          : isDone ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(255,255,255,0.05)',
                        boxShadow: isToday && !isSuper ? `0 0 12px ${a1}25` : isToday && isSuper ? '0 0 12px rgba(251,191,36,0.2)' : 'none',
                      }}
                    >
                      {isDone && !isToday && (
                        <CheckCircle2 size={10} className="absolute top-1 right-1 text-emerald-500" />
                      )}
                      <span className="text-[7px] font-black" style={{ color: isToday ? (isSuper ? '#fbbf24' : a1) : 'var(--ct-muted, #555)' }}>
                        {r.day}
                      </span>
                      <RewardIcon icon={r.icon} size={14}
                        color={isToday ? (isSuper ? '#fbbf24' : a1) : isDone ? '#34d399' : '#3f3f46'} />
                    </motion.div>
                  );
                })}
              </div>

              {/* Streak koruma kalkanı */}
              {canUseShield && !claimed && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleUseShield}
                  className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 mb-3 text-xs font-black"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}
                >
                  <Shield size={15} /> Streak Kalkanı Kullan
                  <span className="text-[9px] opacity-60">(bugünü koru)</span>
                </motion.button>
              )}

              {/* CTA */}
              {!claimed ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${a1}, ${a2})`,
                    color: '#000',
                    boxShadow: `0 8px 24px ${a1}40`,
                    opacity: claiming ? 0.7 : 1,
                  }}
                >
                  {claiming ? (
                    <><div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" /> Alınıyor...</>
                  ) : (
                    <><Gift size={16} /> Ödülü Al!</>
                  )}
                </motion.button>
              ) : (
                <div className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-black"
                  style={{ background: `${a1}15`, border: `1px solid ${a1}30`, color: a1 }}>
                  <CheckCircle2 size={16} /> Harika! Yarın tekrar gel 🚀
                </div>
              )}

              <p className="text-center text-[9px] font-bold mt-3 uppercase tracking-widest" style={{ color: 'var(--ct-muted, #52525b)' }}>
                28 günlük döngü · {28 - currentDayNum + 1} gün kaldı
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
