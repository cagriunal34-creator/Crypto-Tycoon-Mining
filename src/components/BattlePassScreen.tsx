import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Zap, Gift, Crown, Lock, Check, ChevronRight, Clock } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { BP_REWARDS } from '../constants/gameData';
import { BattlePassReward } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';

function SeasonCountdown({ endsAt }: { endsAt: number }) {
  const [remaining, setRemaining] = React.useState(Math.max(0, endsAt - Date.now()));
  React.useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, endsAt - Date.now())), 60000);
    return () => clearInterval(id);
  }, [endsAt]);
  const days = Math.floor(remaining / (1000 * 86400));
  const hours = Math.floor((remaining % (1000 * 86400)) / (1000 * 3600));
  return <span>{days}g {hours}s</span>;
}

const REWARD_EMOJI_MAP: Record<string, string> = {
  tp: '🎯', btc: '₿', hashboost: '⚡', energy: '🔋', vip_day: '👑', cosmetic: '🎨',
};

function RewardPill({ reward, isClaimed, isUnlocked, onClaim }: {
  reward: BattlePassReward;
  isClaimed: boolean;
  isUnlocked: boolean;
  onClaim: () => void;
}) {
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];
  const gold = '#FFD700';

  const color = reward.isPremium ? gold : a1;

  return (
    <motion.button
      whileTap={isUnlocked && !isClaimed ? { scale: 0.93 } : {}}
      onClick={isUnlocked && !isClaimed ? onClaim : undefined}
      className="flex flex-col items-center gap-1 w-full"
      style={{ opacity: isUnlocked || isClaimed ? 1 : 0.45 }}
    >
      <div className="relative w-12 h-12 rounded-xl flex items-center justify-center text-lg"
        style={{
          background: isClaimed
            ? `linear - gradient(135deg, ${color}20, ${color}10)`
            : isUnlocked
              ? `${color} 18`
              : 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${isClaimed ? color + '60' : isUnlocked ? color + '40' : 'rgba(255,255,255,0.08)'} `,
          boxShadow: isUnlocked && !isClaimed ? `0 0 12px ${color} 30` : 'none',
        }}>
        {isClaimed
          ? <Check size={18} style={{ color }} />
          : !isUnlocked
            ? <Lock size={14} style={{ color: theme.vars['--ct-muted'] }} />
            : <span>{reward.emoji}</span>
        }
        {/* Claim glow pulse */}
        {isUnlocked && !isClaimed && (
          <div className="absolute inset-0 rounded-xl animate-ping opacity-20"
            style={{ background: color }} />
        )}
      </div>
      <div className="text-[8px] font-black text-center leading-tight truncate w-full px-0.5"
        style={{ color: isClaimed ? theme.vars['--ct-muted'] : isUnlocked ? color : theme.vars['--ct-muted'] }}>
        {reward.type === 'tp' && `${reward.value} TP`}
        {reward.type === 'btc' && `${reward.value.toFixed(5)} BTC`}
        {reward.type === 'hashboost' && `+ ${reward.value} Gh`}
        {reward.type === 'energy' && `+ ${reward.value} Enerji`}
        {reward.type === 'vip_day' && `VIP ${reward.value} g`}
        {reward.type === 'cosmetic' && 'Kozmetik'}
      </div>
    </motion.button>
  );
}

export default function BattlePassScreen() {
  const { state, dispatch, isVipActive } = useGame();
  const { theme } = useTheme();
  const { notify } = useNotify();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];
  const a3 = theme.vars['--ct-a3'];
  const gold = '#FFD700';

  const bp = state.battlePass;
  const xpPercent = bp.xpPerLevel > 0 ? (bp.currentXP / bp.xpPerLevel) * 100 : 0;
  const PREMIUM_COST = 3000;

  const handleClaim = (reward: BattlePassReward) => {
    if (reward.isPremium && !bp.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    dispatch({ type: 'BP_CLAIM_REWARD', rewardId: reward.id });
    const labels: Record<string, string> = {
      tp: `+ ${reward.value} TP kazandın!`,
      btc: `+ ${reward.value.toFixed(5)} BTC kazandın!`,
      hashboost: `+ ${reward.value} Gh / s boost kazandın!`,
      energy: `+ ${reward.value} enerji hücresi kazandın!`,
      vip_day: `${reward.value} gün VIP kazandın!`,
    };
    notify({ type: 'success', title: 'Battle Pass Ödülü! 🎁', message: labels[reward.type] || 'Ödül alındı!' });
  };

  const handleBuyPremium = () => {
    if (state.tycoonPoints < PREMIUM_COST) {
      notify({ type: 'warning', title: 'Yetersiz TP', message: `${PREMIUM_COST} TP gerekiyor` });
      return;
    }
    dispatch({ type: 'BP_BUY_PREMIUM' });
    setShowPremiumModal(false);
    notify({ type: 'success', title: 'Premium Pass Aktif! 👑', message: 'Tüm premium ödüller açıldı!' });
  };

  // Group rewards by level
  const rewardsByLevel: Record<number, { free?: BattlePassReward; premium?: BattlePassReward }> = {};
  BP_REWARDS.forEach(r => {
    if (!rewardsByLevel[r.level]) rewardsByLevel[r.level] = {};
    if (r.isPremium) rewardsByLevel[r.level].premium = r;
    else rewardsByLevel[r.level].free = r;
  });

  return (
    <div className="space-y-5 pt-3 pb-12">

      {/* ── Season header ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-5"
        style={{ background: `linear - gradient(135deg, ${a1}10, ${a2}08)`, border: `1px solid ${a1} 25` }}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 pointer-events-none"
          style={{ background: `radial - gradient(circle, ${a1}, transparent)` }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear - gradient(90deg, transparent, ${a1}80, transparent)` }} />

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: a1 }}>⚔ Sezon {bp.season}</div>
            <h2 className="text-2xl font-black leading-none" style={{ color: theme.vars['--ct-text'] }}>Battle Pass</h2>
            <div className="flex items-center gap-1 mt-1">
              <Clock size={10} style={{ color: theme.vars['--ct-muted'] }} />
              <span className="text-[10px]" style={{ color: theme.vars['--ct-muted'] }}>
                <SeasonCountdown endsAt={bp.endsAt} /> kaldı
              </span>
            </div>
          </div>
          <div className="text-right">
            {bp.isPremium ? (
              <div className="px-3 py-1.5 rounded-xl"
                style={{ background: `linear - gradient(135deg, ${gold}20, ${gold}10)`, border: `1px solid ${gold} 35` }}>
                <div className="text-xs font-black" style={{ color: gold }}>👑 Premium</div>
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowPremiumModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-black transition-all"
                style={{ background: `linear - gradient(135deg, ${gold}15, ${gold}08)`, border: `1px solid ${gold} 30`, color: gold }}>
                ✦ Yükselt
                <div className="text-[8px] font-bold opacity-80">{PREMIUM_COST} TP</div>
              </motion.button>
            )}
          </div>
        </div>

        {/* Level & XP */}
        <div className="flex items-end gap-3 mb-3">
          <div>
            <div className="text-[9px] uppercase tracking-widest" style={{ color: theme.vars['--ct-muted'] }}>Seviye</div>
            <div className="text-3xl font-black tabular-nums" style={{ color: theme.vars['--ct-text'] }}>{bp.currentLevel}<span className="text-base" style={{ color: a1 }}>/30</span></div>
          </div>
          <div className="flex-1 pb-1">
            <div className="flex justify-between mb-1">
              <span className="text-[9px]" style={{ color: theme.vars['--ct-muted'] }}>{bp.currentXP} XP</span>
              <span className="text-[9px]" style={{ color: a1 }}>{bp.xpPerLevel} XP</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div className="h-full rounded-full"
                animate={{ width: `${xpPercent}% ` }}
                style={{ background: `linear - gradient(90deg, ${a1}, ${a2})`, boxShadow: `0 0 8px ${a1} 40` }} />
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Alınan Ödül', val: `${bp.claimedRewardIds.length}/${BP_REWARDS.length}` },
            { label: 'TP Bakiyesi', val: `${state.tycoonPoints.toLocaleString()}` },
            { label: 'VIP', val: isVipActive ? '2× XP' : 'Pasif' },
          ].map(s => (
            <div key={s.label} className="text-center p-2 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${a1}10` }}>
              <div className="text-xs font-black" style={{ color: theme.vars['--ct-text'] }}>{s.val}</div>
              <div className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: theme.vars['--ct-muted'] }}>{s.label}</div>
            </div>
          ))}
        </div >
      </div >

      {/* ── Reward tracks ─────────────────────────────────────── */}
      < div className="space-y-1" >
        {/* Track labels */}
        < div className="grid grid-cols-[32px_1fr_1fr] gap-2 px-1 mb-2" >
          <div />
          <div className="text-center">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: a1 }}>✦ Ücretsiz</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: gold }}>👑 Premium</span>
          </div>
        </div >

        {/* Levels 1–30 */}
        {
          Array.from({ length: 30 }, (_, i) => i + 1).map(lvl => {
            const rewards = rewardsByLevel[lvl] || {};
            const isLevelUnlocked = bp.currentLevel >= lvl;
            const isCurrentLevel = bp.currentLevel + 1 === lvl;

            return (
              <div key={lvl}
                className="grid grid-cols-[32px_1fr_1fr] gap-2 items-center py-1.5 px-1 rounded-2xl transition-colors"
                style={{
                  background: isCurrentLevel ? `${a1}08` : lvl % 5 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  border: isCurrentLevel ? `1px solid ${a1}20` : '1px solid transparent',
                }}>
                {/* Level number */}
                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-black tabular-nums"
                    style={{ color: isLevelUnlocked ? a1 : theme.vars['--ct-muted'] }}>
                    {lvl}
                  </div>
                  {isCurrentLevel && (
                    <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: a1, boxShadow: `0 0 4px ${a1}` }} />
                  )}
                </div>

                {/* Free reward */}
                <div>
                  {rewards.free && (
                    <RewardPill
                      reward={rewards.free}
                      isClaimed={bp.claimedRewardIds.includes(rewards.free.id)}
                      isUnlocked={isLevelUnlocked}
                      onClaim={() => handleClaim(rewards.free!)}
                    />
                  )}
                </div>

                {/* Premium reward */}
                <div>
                  {rewards.premium && (
                    <RewardPill
                      reward={rewards.premium}
                      isClaimed={bp.claimedRewardIds.includes(rewards.premium.id)}
                      isUnlocked={isLevelUnlocked && bp.isPremium}
                      onClaim={() => handleClaim(rewards.premium!)}
                    />
                  )}
                </div>
              </div>
            );
          })
        }
      </div >

      {/* ── Premium upgrade modal ──────────────────────────────── */}
      <AnimatePresence>
        {
          showPremiumModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[130] flex items-end justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
              onClick={e => e.target === e.currentTarget && setShowPremiumModal(false)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="w-full max-w-md rounded-t-3xl overflow-hidden"
                style={{ background: theme.vars['--ct-bg'], border: `1px solid ${gold}25`, borderBottom: 'none' }}>
                <div style={{ height: 3, background: `linear-gradient(90deg,${gold},#FFA500,${gold})` }} />
                <div className="p-6 space-y-5">
                  <div className="text-center">
                    <div className="text-4xl mb-2">👑</div>
                    <h3 className="text-xl font-black" style={{ background: `linear-gradient(90deg,${gold},#FFA500)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Premium Battle Pass
                    </h3>
                    <p className="text-sm mt-1" style={{ color: theme.vars['--ct-muted'] }}>Tüm 30 seviye premium ödüllerini aç</p>
                  </div>

                  {/* Perks */}
                  <div className="space-y-2">
                    {[
                      { e: '⚡', t: 'Özel Hashrate Boostları — her 5. seviyede' },
                      { e: '🔋', t: 'Enerji Yenilemeleri — her 3. seviyede' },
                      { e: '₿', t: 'Ekstra BTC Ödülleri — her 10. seviyede' },
                      { e: '👑', t: 'VIP Günler — seviye 10, 20, 30\'da' },
                    ].map(p => (
                      <div key={p.t} className="flex items-center gap-3 p-3 rounded-2xl"
                        style={{ background: `${gold}06`, border: `1px solid ${gold}18` }}>
                        <span className="text-lg">{p.e}</span>
                        <span className="text-xs font-bold" style={{ color: theme.vars['--ct-text'] }}>{p.t}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="text-center p-4 rounded-2xl"
                    style={{ background: `${gold}08`, border: `1px solid ${gold}25` }}>
                    <div className="text-3xl font-black" style={{ color: gold }}>{PREMIUM_COST.toLocaleString()} TP</div>
                    <div className="text-xs mt-1" style={{ color: theme.vars['--ct-muted'] }}>Bakiye: {state.tycoonPoints.toLocaleString()} TP</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowPremiumModal(false)}
                      className="py-3 rounded-2xl text-sm font-bold"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: theme.vars['--ct-muted'] }}>
                      Vazgeç
                    </button>
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={handleBuyPremium}
                      disabled={state.tycoonPoints < PREMIUM_COST}
                      className="py-3 rounded-2xl text-sm font-black"
                      style={state.tycoonPoints >= PREMIUM_COST
                        ? { background: `linear-gradient(135deg,${gold},#FFA500)`, color: '#000' }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }}>
                      👑 Satın Al
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >
    </div >
  );
}
