import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Check, Clock, Zap, Star, Shield, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';

const PLANS = [
  {
    tier: 'silver' as const,
    label: 'Silver VIP',
    emoji: '🥈',
    color: '#C0C0C0',
    cost30: 5000,
    cost7: 1500,
    perks: [
      'Reklam yok',
      '%20 bonus BTC kazancı',
      'Gümüş avatar çerçevesi',
      'Öncelikli destek',
    ],
  },
  {
    tier: 'gold' as const,
    label: 'Gold VIP',
    emoji: '👑',
    color: '#FFD700',
    cost30: 12000,
    cost7: 3500,
    isPopular: true,
    perks: [
      'Reklam yok',
      '%50 bonus BTC kazancı',
      'Altın avatar çerçevesi',
      'Özel lonca rozeti',
      '2× Battle Pass XP',
      'Marketplace 0 komisyon',
    ],
  },
];

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [rem, setRem] = React.useState(Math.max(0, expiresAt - Date.now()));
  React.useEffect(() => {
    const id = setInterval(() => setRem(Math.max(0, expiresAt - Date.now())), 60000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const d = Math.floor(rem / 86400000);
  const h = Math.floor((rem % 86400000) / 3600000);
  return <span>{d}g {h}s</span>;
}

export default function VIPScreen() {
  const { state, dispatch, isVipActive, vipBtcBonus } = useGame();
  const { theme } = useTheme();
  const { notify } = useNotify();
  const [confirmPlan, setConfirmPlan] = useState<{ tier: 'silver' | 'gold'; days: number; cost: number } | null>(null);

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const handleActivate = () => {
    if (!confirmPlan) return;
    if (state.tycoonPoints < confirmPlan.cost) {
      notify({ type: 'warning', title: 'Yetersiz TP', message: `${confirmPlan.cost.toLocaleString()} TP gerekiyor` });
      return;
    }
    dispatch({ type: 'VIP_ACTIVATE', tier: confirmPlan.tier, days: confirmPlan.days, cost: confirmPlan.cost });
    setConfirmPlan(null);
    notify({
      type: 'success',
      title: `${confirmPlan.tier === 'gold' ? '👑 Gold' : '🥈 Silver'} VIP Aktif!`,
      message: `${confirmPlan.days} gün VIP avantajlarının tadını çıkar!`,
    });
  };

  return (
    <div className="space-y-5 pt-3 pb-12">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(192,192,192,0.05))', border: '1px solid rgba(255,215,0,0.2)' }}>
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full animate-pulse"
              style={{ background: '#FFD700', top: `${15 + i * 14}%`, left: `${5 + i * 16}%`, opacity: 0.3 + i * 0.05, animationDelay: `${i * 0.4}s` }} />
          ))}
        </div>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #FFD700, transparent)' }} />

        <div className="text-5xl mb-3">👑</div>
        <h2 className="text-2xl font-black mb-1"
          style={{ background: 'linear-gradient(90deg, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          VIP Üyelik
        </h2>
        <p className="text-sm" style={{ color: theme.vars['--ct-muted'] }}>
          Madenciliğini bir üst seviyeye taşı
        </p>

        {/* Active badge */}
        {isVipActive && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.35)' }}>
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-black text-yellow-400">
              {state.vip.tier === 'gold' ? '👑 Gold VIP' : '🥈 Silver VIP'} Aktif
            </span>
            <span className="text-[9px] text-yellow-400/70">
              · <Countdown expiresAt={state.vip.expiresAt} /> kaldı
            </span>
          </motion.div>
        )}
      </div>

      {/* ── Active VIP stats ───────────────────────────────────── */}
      {isVipActive && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: '₿', label: 'BTC Bonus', val: `+${Math.round((vipBtcBonus - 1) * 100)}%` },
            { emoji: '⭐', label: 'BP XP',    val: state.vip.tier === 'gold' ? '2×' : '1×' },
            { emoji: '🏪', label: 'Komisyon', val: state.vip.tier === 'gold' ? '%0' : 'Normal' },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-2xl"
              style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)' }}>
              <div className="text-xl mb-1">{s.emoji}</div>
              <div className="text-sm font-black text-yellow-400">{s.val}</div>
              <div className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: theme.vars['--ct-muted'] }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Plans ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {PLANS.map(plan => {
          const isCurrentPlan = isVipActive && state.vip.tier === plan.tier;
          const c = plan.color;

          return (
            <div key={plan.tier} className="relative rounded-3xl overflow-hidden"
              style={{
                background: `${c}07`,
                border: `1.5px solid ${isCurrentPlan ? c + '60' : c + '25'}`,
                boxShadow: isCurrentPlan ? `0 0 24px ${c}20` : 'none',
              }}>
              {plan.isPopular && (
                <div className="absolute top-3 right-3">
                  <div className="px-2 py-0.5 rounded-full text-[8px] font-black"
                    style={{ background: `${c}20`, border: `1px solid ${c}40`, color: c }}>
                    ✦ EN POPÜLER
                  </div>
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Plan header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `${c}15`, border: `1px solid ${c}30` }}>
                    {plan.emoji}
                  </div>
                  <div>
                    <div className="font-black text-base" style={{ color: isCurrentPlan ? c : theme.vars['--ct-text'] }}>
                      {plan.label}
                      {isCurrentPlan && <span className="text-[9px] ml-2 px-1.5 py-0.5 rounded-full"
                        style={{ background: `${c}20`, color: c }}>AKTİF</span>}
                    </div>
                    <div className="text-[10px]" style={{ color: theme.vars['--ct-muted'] }}>
                      {plan.perks.length} ayrıcalık
                    </div>
                  </div>
                </div>

                {/* Perks list */}
                <div className="space-y-2">
                  {plan.perks.map(perk => (
                    <div key={perk} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${c}18` }}>
                        <Check size={9} style={{ color: c }} />
                      </div>
                      <span className="text-xs" style={{ color: theme.vars['--ct-text'] }}>{perk}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1" style={{ borderTop: `1px solid ${c}15` }}>
                  {[
                    { days: 7,  cost: plan.cost7,  label: '7 Gün' },
                    { days: 30, cost: plan.cost30, label: '30 Gün' },
                  ].map(opt => {
                    const canAfford = state.tycoonPoints >= opt.cost;
                    return (
                      <motion.button key={opt.days}
                        whileTap={canAfford ? { scale: 0.96 } : {}}
                        onClick={() => canAfford && setConfirmPlan({ tier: plan.tier, days: opt.days, cost: opt.cost })}
                        className="py-3 rounded-2xl text-center transition-all"
                        style={canAfford
                          ? { background: `${c}12`, border: `1px solid ${c}30`, cursor: 'pointer' }
                          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'not-allowed', opacity: 0.5 }}>
                        <div className="text-xs font-black" style={{ color: canAfford ? c : theme.vars['--ct-muted'] }}>
                          {opt.cost.toLocaleString()} TP
                        </div>
                        <div className="text-[9px]" style={{ color: theme.vars['--ct-muted'] }}>{opt.label}</div>
                        {!canAfford && (
                          <div className="text-[8px] text-red-400 mt-0.5">
                            -{(opt.cost - state.tycoonPoints).toLocaleString()} TP
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Comparison table ───────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="text-sm font-black" style={{ color: theme.vars['--ct-text'] }}>Plan Karşılaştırması</h3>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {[
            { label: 'Reklam',         free: '✗', silver: '✓', gold: '✓' },
            { label: 'BTC Bonus',      free: '—', silver: '+20%', gold: '+50%' },
            { label: 'Battle Pass XP', free: '1×', silver: '1×', gold: '2×' },
            { label: 'Marketplace',    free: '+5%', silver: '+5%', gold: '%0' },
            { label: 'Avatar',         free: 'Standart', silver: 'Gümüş', gold: 'Altın' },
          ].map(row => (
            <div key={row.label} className="grid grid-cols-4 px-5 py-3 text-xs">
              <div style={{ color: theme.vars['--ct-muted'] }}>{row.label}</div>
              <div className="text-center" style={{ color: theme.vars['--ct-muted'] }}>{row.free}</div>
              <div className="text-center font-bold" style={{ color: '#C0C0C0' }}>{row.silver}</div>
              <div className="text-center font-bold" style={{ color: '#FFD700' }}>{row.gold}</div>
            </div>
          ))}
          <div className="grid grid-cols-4 px-5 py-2 text-[8px] font-black uppercase tracking-widest">
            <div style={{ color: theme.vars['--ct-muted'] }}></div>
            <div className="text-center" style={{ color: theme.vars['--ct-muted'] }}>Ücretsiz</div>
            <div className="text-center" style={{ color: '#C0C0C0' }}>Silver</div>
            <div className="text-center" style={{ color: '#FFD700' }}>Gold</div>
          </div>
        </div>
      </div>

      {/* ── Confirm modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {confirmPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={e => e.target === e.currentTarget && setConfirmPlan(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{ background: theme.vars['--ct-bg'], border: `1px solid ${confirmPlan.tier === 'gold' ? '#FFD700' : '#C0C0C0'}30` }}>
              <div style={{ height: 3, background: confirmPlan.tier === 'gold' ? 'linear-gradient(90deg,#FFD700,#FFA500)' : 'linear-gradient(90deg,#C0C0C0,#888)' }} />
              <div className="p-6 text-center space-y-4">
                <div className="text-4xl">{confirmPlan.tier === 'gold' ? '👑' : '🥈'}</div>
                <div>
                  <h3 className="text-lg font-black" style={{ color: theme.vars['--ct-text'] }}>
                    {confirmPlan.tier === 'gold' ? 'Gold VIP' : 'Silver VIP'} — {confirmPlan.days} Gün
                  </h3>
                  <p className="text-sm mt-1" style={{ color: theme.vars['--ct-muted'] }}>
                    Hesabından <span style={{ color: confirmPlan.tier === 'gold' ? '#FFD700' : '#C0C0C0', fontWeight: 800 }}>
                      {confirmPlan.cost.toLocaleString()} TP
                    </span> düşülecek
                  </p>
                </div>
                <div className="p-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-sm font-black" style={{ color: theme.vars['--ct-text'] }}>
                    Bakiye: {state.tycoonPoints.toLocaleString()} TP
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: theme.vars['--ct-muted'] }}>
                    → Kalan: {(state.tycoonPoints - confirmPlan.cost).toLocaleString()} TP
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setConfirmPlan(null)}
                    className="py-3 rounded-2xl text-sm font-bold"
                    style={{ background: 'rgba(255,255,255,0.05)', color: theme.vars['--ct-muted'] }}>
                    Vazgeç
                  </button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleActivate}
                    className="py-3 rounded-2xl text-sm font-black"
                    style={{ background: confirmPlan.tier === 'gold' ? 'linear-gradient(135deg,#FFD700,#FFA500)' : 'linear-gradient(135deg,#C0C0C0,#888)', color: '#000' }}>
                    Onayla
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
