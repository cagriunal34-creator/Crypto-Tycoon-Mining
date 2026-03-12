/**
 * SocialScreen — Geliştirilmiş Referral + Leaderboard
 */
import React from 'react';
import { Trophy, Crown, Zap, Users, Copy, Share2, ChevronUp, ChevronDown, Minus, Tag, Gift, CheckCircle2, MessageCircle, Twitter, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

type Tab = 'referral' | 'leaderboard';

const MILESTONES = [
  { count: 1,  label: 'İlk Davet',      tpReward: 500,   speedBonus: 5,  badge: '🌱', color: '#34d399' },
  { count: 3,  label: 'Ekip Kurucu',    tpReward: 1500,  speedBonus: 10, badge: '⚡', color: '#fbbf24' },
  { count: 5,  label: 'Ağ Ustası',      tpReward: 3000,  speedBonus: 15, badge: '💎', color: '#60a5fa' },
  { count: 10, label: 'İnfluencer',     tpReward: 7500,  speedBonus: 25, badge: '👑', color: '#a78bfa' },
  { count: 25, label: 'Efsane Davetçi', tpReward: 25000, speedBonus: 50, badge: '🔥', color: '#f87171' },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={16} className="text-yellow-400" fill="currentColor" />;
  if (rank === 2) return <span className="text-sm font-black text-zinc-300">#2</span>;
  if (rank === 3) return <span className="text-sm font-black text-amber-600">#3</span>;
  return <span className="text-xs font-black text-zinc-500">#{rank}</span>;
}

function ChangeIcon({ change }: { change: string }) {
  if (change === 'up') return <ChevronUp size={12} className="text-emerald-500" />;
  if (change === 'down') return <ChevronDown size={12} className="text-red-400" />;
  return <Minus size={10} className="text-zinc-600" />;
}

export default function SocialScreen() {
  const { state, dispatch, redeemPromoCode } = useGame();
  const { notify } = useNotify();
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const [activeTab, setActiveTab] = React.useState<Tab>('referral');
  const [lbTab, setLbTab] = React.useState('weekly');
  const [copied, setCopied] = React.useState(false);
  const [redeemCode, setRedeemCode] = React.useState('');
  const [promoCode, setPromoCode] = React.useState('');
  const [promoLoading, setPromoLoading] = React.useState(false);
  const [promoResult, setPromoResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [claimedMilestones, setClaimedMilestones] = React.useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('claimed_milestones_v1') || '[]'); } catch { return []; }
  });

  const referralCount = state.referralCount || 0;
  const referralLink = `https://cryptotycoon.app/?ref=${state.referralCode}`;
  const nextMilestone = MILESTONES.find(m => referralCount < m.count);
  const progressToNext = nextMilestone ? Math.min(100, (referralCount / nextMilestone.count) * 100) : 100;

  const handleClaimMilestone = (m: typeof MILESTONES[0]) => {
    if (referralCount < m.count || state.claimedMilestones?.includes(m.count)) return;
    
    // Dispatch to context for global state and DB sync
    dispatch({ 
      type: 'CLAIM_MILESTONE', 
      milestone: m.count, 
      tpReward: m.tpReward 
    });
    
    notify({ 
      type: 'success', 
      title: `${m.badge} Milestone Kazanıldı!`, 
      message: `+${m.tpReward.toLocaleString()} TP ve %${m.speedBonus} hız bonusu!` 
    });
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(state.referralCode); }
    catch { const el = document.createElement('textarea'); el.value = state.referralCode; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); }
    setCopied(true);
    notify({ type: 'success', title: 'Kopyalandı!', message: 'Referans kodun panoya kopyalandı.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`⛏️ CryptoTycoon'a katıl! Kodum: ${state.referralCode}\n${referralLink}`)}`, '_blank');
  const handleShareTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`⛏️ CryptoTycoon'da BTC madenciliği! Referans kodum: ${state.referralCode} 🚀`)}`, '_blank');
  const handleShareNative = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'CryptoTycoon', text: `Kodum: ${state.referralCode}`, url: referralLink }); return; } catch {} }
    handleCopy();
  };

  const handleRedeemReferral = () => {
    if (!redeemCode.trim()) return notify({ type: 'warning', title: 'Hata', message: 'Lütfen bir kod girin.' });
    if (redeemCode === state.referralCode) return notify({ type: 'warning', title: 'Hata', message: 'Kendi kodunu kullanamazsın.' });
    if (state.redeemedReferralCode) return notify({ type: 'warning', title: 'Hata', message: 'Zaten bir kod kullandın.' });
    dispatch({ type: 'APPLY_REFERRAL_CODE', code: redeemCode });
    notify({ type: 'success', title: '🎉 Kod Uygulandı!', message: `+${(state.globalSettings as any)?.referralTpReward ?? 1000} TP ve %5 Hız Bonusu kazandın.` });
    setRedeemCode('');
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoResult(null);
    const result = await redeemPromoCode(promoCode.trim());
    setPromoResult(result);
    if (result.success) { notify({ type: 'success', title: 'Promo Kodu Kullanıldı!', message: result.message }); setPromoCode(''); }
    else notify({ type: 'warning', title: 'Geçersiz Kod', message: result.message });
    setPromoLoading(false);
  };

  const leaders = state.leaderboard || [];
  const myEntry: any = leaders.find((l: any) => l.isCurrentUser) || leaders[0] || { rank: '?', avatar: '👤', name: 'Madenci', rankTitle: 'Yeni', level: 1, hashRate: 0, btcMined: 0, change: 'same' };

  return (
    <div className="space-y-4 pt-2 pb-20">
      {/* Tab Bar */}
      <div className="flex p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[{ id: 'referral', label: '👥 Referral' }, { id: 'leaderboard', label: '🏆 Sıralama' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as Tab)}
            className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
            style={{ background: activeTab === t.id ? `${a1}18` : 'transparent', color: activeTab === t.id ? a1 : 'var(--ct-muted)', border: activeTab === t.id ? `1px solid ${a1}30` : '1px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'referral' && (
          <motion.div key="referral" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-[1.75rem] p-5" style={{ background: `linear-gradient(135deg, ${a1}12, ${a2}08)`, border: `1px solid ${a1}25` }}>
              <div className="absolute top-0 right-0 opacity-5 pointer-events-none"><Users size={130} /></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${a1}18`, border: `1px solid ${a1}30` }}>
                  <Rocket size={20} style={{ color: a1 }} />
                </div>
                <div>
                  <div className="text-sm font-black text-white">Arkadaşlarını Davet Et</div>
                  <div className="text-[10px]" style={{ color: 'var(--ct-muted)' }}>Her davet = daha fazla güç</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Davet', value: referralCount, color: a1 },
                  { label: 'TP Kazanıldı', value: (referralCount * 250).toLocaleString(), color: '#fbbf24' },
                  { label: 'Hız Bonusu', value: `%${Math.min(referralCount * 5, 50)}`, color: '#a78bfa' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-2xl text-center" style={{ background: 'rgba(0,0,0,0.25)' }}>
                    <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--ct-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 px-4 py-3 rounded-xl font-mono text-sm font-bold tracking-[0.2em]" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${a1}30`, color: a1 }}>
                  {state.referralCode || '------'}
                </div>
                <motion.button whileTap={{ scale: 0.93 }} onClick={handleCopy} className="p-3 rounded-xl transition-all"
                  style={{ background: copied ? a1 : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? a1 : 'rgba(255,255,255,0.1)'}`, color: copied ? '#000' : 'var(--ct-muted)' }}>
                  <Copy size={16} />
                </motion.button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleShareWhatsApp} className="py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black" style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366' }}>
                  <MessageCircle size={13} /> WhatsApp
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleShareTwitter} className="py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black" style={{ background: 'rgba(29,161,242,0.1)', border: '1px solid rgba(29,161,242,0.2)', color: '#1da1f2' }}>
                  <Twitter size={13} /> Twitter
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleShareNative} className="py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black" style={{ background: `${a1}10`, border: `1px solid ${a1}25`, color: a1 }}>
                  <Share2 size={13} /> Paylaş
                </motion.button>
              </div>
            </div>

            {/* Milestones */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>🎯 Davet Milestone'ları</div>
                {nextMilestone && <div className="text-[9px] font-bold" style={{ color: a1 }}>{nextMilestone.count - referralCount} davet daha → {nextMilestone.badge}</div>}
              </div>
              {nextMilestone && (
                <div className="mb-3">
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }} transition={{ duration: 0.8 }}
                      className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${a1}, ${a2})`, boxShadow: `0 0 8px ${a1}60` }} />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold mt-1" style={{ color: 'var(--ct-muted)' }}>
                    <span>{referralCount} davet</span><span>{nextMilestone.count} davet</span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {MILESTONES.map((m, i) => {
                  const reached = referralCount >= m.count;
                  const claimed = state.claimedMilestones?.includes(m.count);
                  return (
                    <motion.div key={m.count} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl"
                      style={{ background: claimed ? `${m.color}08` : reached ? `${m.color}06` : 'rgba(255,255,255,0.02)', border: `1px solid ${claimed ? m.color + '25' : reached ? m.color + '18' : 'rgba(255,255,255,0.05)'}`, opacity: !reached && !claimed ? 0.6 : 1 }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: `${m.color}15`, filter: !reached ? 'grayscale(1)' : 'none' }}>
                        {claimed ? '✅' : reached ? m.badge : '🔒'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-white">{m.label}</span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${m.color}18`, color: m.color }}>{m.count} davet</span>
                        </div>
                        <div className="text-[9px] mt-0.5" style={{ color: 'var(--ct-muted)' }}>+{m.tpReward.toLocaleString()} TP · %{m.speedBonus} hız</div>
                      </div>
                      {claimed ? (
                        <div className="text-[9px] font-black flex items-center gap-1" style={{ color: m.color }}><CheckCircle2 size={13} /> Alındı</div>
                      ) : reached ? (
                        <motion.button whileTap={{ scale: 0.93 }} onClick={() => handleClaimMilestone(m)} className="px-3 py-1.5 rounded-xl text-[10px] font-black" style={{ background: `${m.color}20`, border: `1px solid ${m.color}40`, color: m.color }}>Al!</motion.button>
                      ) : (
                        <div className="text-[9px] font-bold" style={{ color: 'var(--ct-muted)' }}>{m.count - referralCount} kaldı</div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Kod girişleri */}
            <div className="space-y-3">
              {!state.redeemedReferralCode ? (
                <div className="p-4 rounded-2xl space-y-3" style={{ background: `${a1}06`, border: `1px solid ${a1}18` }}>
                  <div className="flex items-center gap-2">
                    <Zap size={14} style={{ color: a1 }} />
                    <span className="text-xs font-black text-white">Arkadaşın Kodunu Gir</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold ml-auto" style={{ background: `${a1}18`, color: a1 }}>+1000 TP</span>
                  </div>
                  <div className="flex gap-2">
                    <input value={redeemCode} onChange={e => setRedeemCode(e.target.value.toUpperCase())} placeholder="Kodu gir..."
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }} />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleRedeemReferral} disabled={!redeemCode.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-black disabled:opacity-40" style={{ background: a1, color: '#000' }}>Uygula</motion.button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-black text-emerald-400">Referral kodu kullanıldı</div>
                    <div className="text-[9px] mt-0.5" style={{ color: 'var(--ct-muted)' }}>Kod: <span className="font-mono font-bold text-white">{state.redeemedReferralCode}</span></div>
                  </div>
                </div>
              )}
              <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2"><Tag size={14} className="text-amber-400" /><span className="text-xs font-black text-white">Promosyon Kodu</span></div>
                <div className="flex gap-2">
                  <input value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }} placeholder="PROMO KODUNU GİR..."
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleRedeemPromo} disabled={!promoCode.trim() || promoLoading}
                    className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 disabled:opacity-40" style={{ background: '#fbbf24', color: '#000' }}>
                    {promoLoading ? <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Gift size={13} />}
                    {promoLoading ? '...' : 'Kullan'}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {promoResult && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className={cn('text-[10px] font-bold', promoResult.success ? 'text-emerald-400' : 'text-red-400')}>
                      {promoResult.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {[['weekly', 'Haftalık'], ['alltime', 'Tüm Zamanlar']].map(([id, label]) => (
                <button key={id} onClick={() => setLbTab(id)} className="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all"
                  style={{ background: lbTab === id ? 'rgba(255,255,255,0.08)' : 'transparent', color: lbTab === id ? '#fff' : 'var(--ct-muted)' }}>{label}</button>
              ))}
            </div>
            {leaders.length > 0 && (
              <div className="flex items-end justify-center gap-2 py-4">
                {[leaders[1], leaders[0], leaders[2]].map((leader: any, i: number) => {
                  if (!leader) return <div key={i} className="flex-1" />;
                  const heights = ['h-16', 'h-20', 'h-14'];
                  const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                  const podiumColors = ['bg-zinc-600', 'bg-yellow-500', 'bg-amber-600'];
                  return (
                    <div key={leader.rank} className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-zinc-800 flex items-center justify-center text-xs font-black text-white">{leader.avatar}</div>
                      <p className="text-[9px] font-bold text-zinc-300 text-center truncate max-w-[60px]">{leader.name}</p>
                      <div className={cn('w-full rounded-t-xl flex items-center justify-center', heights[i], podiumColors[i])}><RankBadge rank={rank} /></div>
                    </div>
                  );
                })}
              </div>
            )}
            {leaders.length === 0 ? (
              <div className="py-12 text-center"><Trophy size={32} className="text-zinc-700 mx-auto mb-3" /><p className="text-zinc-500 text-sm font-bold">Sıralama yükleniyor...</p></div>
            ) : (
              <div className="space-y-2">
                {leaders.slice(3).map((leader: any, index: number) => (
                  <motion.div key={leader.rank} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="w-6 text-center"><RankBadge rank={leader.rank} /></div>
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-black text-zinc-300">{leader.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{leader.name}</p>
                      <p className="text-[9px]" style={{ color: 'var(--ct-muted)' }}>Lv.{leader.level} · {Math.floor(leader.hashRate)} GH/s</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold font-mono text-emerald-400">{leader.btcMined?.toFixed(5)} BTC</p>
                      <div className="flex justify-end"><ChangeIcon change={leader.change} /></div>
                    </div>
                  </motion.div>
                ))}
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 border-t border-dashed border-white/10" />
                  <span className="text-[9px] font-bold" style={{ color: 'var(--ct-muted)' }}>SEN</span>
                  <div className="flex-1 border-t border-dashed border-white/10" />
                </div>
                <motion.div animate={{ boxShadow: [`0 0 0px ${a1}00`, `0 0 16px ${a1}20`, `0 0 0px ${a1}00`] }} transition={{ duration: 3, repeat: Infinity }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: `${a1}06`, border: `1px solid ${a1}20` }}>
                  <div className="w-6 text-center"><span className="text-xs font-black text-zinc-500">#{myEntry.rank}</span></div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: `${a1}20`, border: `1px solid ${a1}30`, color: a1 }}>{myEntry.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: a1 }}>{myEntry.name} (Sen)</p>
                    <p className="text-[9px]" style={{ color: 'var(--ct-muted)' }}>Lv.{myEntry.level} · {myEntry.hashRate?.toFixed(0)} GH/s</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold font-mono" style={{ color: a1 }}>{myEntry.btcMined?.toFixed(5)} BTC</p>
                    <div className="flex justify-end"><ChangeIcon change="up" /></div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
