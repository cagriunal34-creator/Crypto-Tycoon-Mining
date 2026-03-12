import React, { useState } from 'react';
import {
  Zap, Clock, Star, Flame, Gift, Server, Tag, CheckCircle2,
  AlertTriangle, ShoppingBag, TrendingUp, Shield, Play,
  ChevronRight, BarChart3, Cpu, Timer, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame, DynamicMiningItem } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';
import { supabase, TABLES } from '../lib/supabase';

const TIER_CFG: Record<string, { text: string; border: string; bg: string; glow: string; badge: string; icon: any }> = {
  Bronze:  { text: 'text-orange-400',  border: 'border-orange-500/30',  bg: 'bg-orange-500/5',  glow: '#f97316', badge: 'bg-orange-500/20 text-orange-300',  icon: Cpu },
  Silver:  { text: 'text-zinc-300',    border: 'border-zinc-400/30',    bg: 'bg-zinc-500/5',    glow: '#a1a1aa', badge: 'bg-zinc-500/20 text-zinc-300',      icon: Server },
  Gold:    { text: 'text-yellow-400',  border: 'border-yellow-500/30',  bg: 'bg-yellow-500/5',  glow: '#eab308', badge: 'bg-yellow-500/20 text-yellow-300',  icon: Star },
  Diamond: { text: 'text-blue-400',    border: 'border-blue-500/30',    bg: 'bg-blue-500/5',    glow: '#3b82f6', badge: 'bg-blue-500/20 text-blue-300',      icon: Sparkles },
  Flash:   { text: 'text-red-400',     border: 'border-red-500/30',     bg: 'bg-red-500/5',     glow: '#ef4444', badge: 'bg-red-500/20 text-red-300',        icon: Zap },
  default: { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', glow: '#10b981', badge: 'bg-emerald-500/20 text-emerald-300', icon: Server },
};

function earningsProgress(totalEarned: number, maxEarnings: number): number {
  if (!maxEarnings || maxEarnings <= 0) return 0;
  return Math.min(100, (totalEarned / maxEarnings) * 100);
}

function AdBoostCard({ onBoost }: { onBoost: () => void }) {
  const [watching, setWatching] = useState(false);
  const handleWatch = () => {
    if (watching) return;
    setWatching(true);
    onBoost();
    setTimeout(() => setWatching(false), 3000);
  };
  return (
    <motion.div className="rounded-2xl p-4 relative overflow-hidden"
      style={{ background: '#10b98108', border: '1px solid #10b98125' }} whileHover={{ scale: 1.005 }}>
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 pointer-events-none"
        style={{ background: '#10b981', filter: 'blur(16px)' }} />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#10b98115', border: '1px solid #10b98130' }}>
            <Play size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-widest">Reklam İzle → Hızlandır</p>
            <p className="text-[10px] font-mono mt-0.5 text-zinc-400">2 saatlik madencilik kazancını <span className="text-emerald-400">anında al</span></p>
          </div>
        </div>
        <button onClick={handleWatch} disabled={watching}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shrink-0"
          style={{ background: '#10b981', color: '#000', boxShadow: '0 4px 12px #10b98140' }}>
          {watching ? <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Play size={11} />}
          {watching ? 'Yükleniyor' : '+2 Saat'}
        </button>
      </div>
    </motion.div>
  );
}

function MarketCard({ item, idx, onPurchase, usdRate }: { item: DynamicMiningItem; idx: number; onPurchase: (item: DynamicMiningItem) => void; usdRate: number }) {
  const { state } = useGame();
  const cfg = TIER_CFG[item.tier] || TIER_CFG.default;
  const TierIcon = cfg.icon;
  const dailyUsd = (item.daily_btc || 0) * usdRate;
  const amortDays = item.price_usd > 0 && dailyUsd > 0 ? Math.ceil(item.price_usd / dailyUsd) : null;
  const returnRate = item.return_rate || 0.25;
  const maxEarningUsd = (item.price_usd || 0) * returnRate;
  const canAfford = (state.btcBalance || 0) * usdRate >= (item.price_usd || 0) || (state.tycoonPoints || 0) >= (item.price || 0);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
      className={cn('relative rounded-2xl border overflow-hidden', cfg.border, cfg.bg)}>
      <div className="absolute top-0 left-0 right-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.glow}, transparent)` }} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${cfg.glow}15`, border: `1px solid ${cfg.glow}30` }}>
              <TierIcon size={18} style={{ color: cfg.glow }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={cn('text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full', cfg.badge)}>{item.tier}</span>
                {(item.tier === 'Gold' || item.tier === 'Diamond') && <Star size={9} style={{ color: cfg.glow }} />}
              </div>
              <h3 className="text-white font-black text-sm leading-tight">{item.name}</h3>
              {item.description && <p className="text-zinc-500 text-[10px] mt-0.5">{item.description}</p>}
            </div>
          </div>
          <div className="text-right shrink-0 ml-2">
            {item.price_usd > 0 ? (
              <><p className={cn('text-xl font-black tabular-nums', cfg.text)}>${item.price_usd.toFixed(2)}</p><p className="text-zinc-600 text-[8px] font-bold uppercase">USD</p></>
            ) : (
              <><p className={cn('text-xl font-black tabular-nums', cfg.text)}>{item.price}</p><p className="text-zinc-600 text-[8px] font-bold uppercase">TP</p></>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[
            { label: 'Hash', value: `${item.hashrate}`, unit: 'GH/s', icon: Zap },
            { label: 'Günlük', value: `$${dailyUsd.toFixed(3)}`, unit: '', icon: TrendingUp },
            { label: 'Ömür', value: `${item.duration_days || 30}`, unit: 'gün', icon: Clock },
            { label: 'Enerji', value: `${item.energy_cost || 0}`, unit: '/s', icon: Flame },
          ].map((stat, si) => {
            const SIcon = stat.icon;
            return (
              <div key={si} className="bg-black/20 rounded-xl p-2 text-center">
                <SIcon size={10} className="mx-auto mb-1" style={{ color: cfg.glow }} />
                <p className="text-white font-black text-[10px] tabular-nums">{stat.value}<span className="text-[7px] text-zinc-600">{stat.unit}</span></p>
                <p className="text-zinc-600 text-[7px] font-bold uppercase mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Amortisman & tavan */}
        <div className="flex gap-2 mb-3">
          {amortDays && (
            <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/20">
              <Timer size={9} style={{ color: cfg.glow }} />
              <span className="text-[9px] font-bold text-zinc-400">Amortisman: <span style={{ color: cfg.glow }}>{amortDays}g</span></span>
            </div>
          )}
          <div className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/20">
            <Shield size={9} className="text-zinc-500" />
            <span className="text-[9px] font-bold text-zinc-400">Max: <span className="text-zinc-300">${maxEarningUsd.toFixed(2)}</span></span>
          </div>
        </div>

        {/* Return rate bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[8px] font-bold mb-1">
            <span className="text-zinc-500">Kullanıcı kazanç payı</span>
            <span style={{ color: cfg.glow }}>{Math.round(returnRate * 100)}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/5">
            <div className="h-full rounded-full" style={{ width: `${returnRate * 100}%`, background: cfg.glow }} />
          </div>
        </div>

        {/* Buy button */}
        <button onClick={() => onPurchase(item)} disabled={!canAfford}
          className={cn('w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2',
            canAfford ? 'text-black hover:brightness-110' : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5')}
          style={canAfford ? { background: `linear-gradient(135deg, ${cfg.glow}, ${cfg.glow}BB)`, boxShadow: `0 4px 20px ${cfg.glow}35` } : {}}>
          {canAfford ? <><ShoppingBag size={13} />Satın Al {item.price_usd > 0 ? `— $${item.price_usd.toFixed(2)}` : `— ${item.price} TP`}</> : 'Yetersiz Bakiye'}
        </button>
      </div>
    </motion.div>
  );
}

export default function MiningShop({ onPurchaseSuccess, onWatchAd }: { onPurchaseSuccess: () => void; onWatchAd: () => void }) {
  const { state, dispatch, redeemPromoCode, adBoostMining } = useGame();
  const { notify } = useNotify();
  const [activeTab, setActiveTab] = useState<'buy' | 'owned' | 'promo'>('buy');
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{ success: boolean; message: string } | null>(null);
  const dynamicItems = state.dynamicMiningItems || [];
  const usdRate = state.usdRate || 91200;

  const handlePurchase = (item: DynamicMiningItem) => {
    const returnRate = item.return_rate || 0.25;
    const durationDays = item.duration_days || 30;
    const maxEarningsBtc = item.price_usd > 0
      ? (item.price_usd * returnRate) / usdRate
      : (item.daily_btc || 0) * durationDays * returnRate;

    const priceInBtc = item.price_usd > 0 ? item.price_usd / usdRate : 0;
    const cost = item.price_usd > 0 ? priceInBtc : (item.price || 0);

    dispatch({
      type: 'PURCHASE_CONTRACT',
      contract: {
        id: `${item.id}-${Date.now()}`,
        name: item.name,
        tier: (item.tier as any) || 'Bronze',
        hashRate: item.hashrate || 100,
        purchasedAt: Date.now(),
        durationDays,
        condition: 100,
        lastMaintenance: Date.now(),
        purchasePriceUsd: item.price_usd || 0,
        maxEarningsBtc,
        totalEarnedBtc: 0,
        dailyBtcTarget: item.daily_btc || 0,
      },
      cost: cost,
    });
    if (state.user?.uid) {
      supabase.from(TABLES.TRANSACTIONS).insert({
        user_id: state.user.uid, username: state.username, type: 'buy_item',
        amount: item.price_usd || item.price || 0, status: 'approved',
        note: `Cihaz: ${item.name} (${item.tier}) — Max kazanç: ${maxEarningsBtc.toFixed(8)} BTC`,
        created_at: new Date().toISOString(),
      }).then(() => {});
    }
    notify({ type: 'success', title: '⛏️ Cihaz Eklendi!', message: `${item.name} filonuza katıldı.` });
    onPurchaseSuccess();
  };

  const handleAdBoost = () => {
    adBoostMining(2);
    notify({ type: 'mining', title: '⚡ Hızlandırma!', message: '2 saatlik madencilik kazancın eklendi.' });
    onWatchAd();
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoResult(null);
    const result = await redeemPromoCode(promoCode.trim());
    setPromoResult(result);
    if (result.success) { notify({ type: 'success', title: '🎁 Promo!', message: result.message }); setPromoCode(''); }
    else notify({ type: 'warning', title: 'Geçersiz Kod', message: result.message });
    setPromoLoading(false);
  };

  const tabs = [
    { id: 'buy' as const, label: 'Market', count: dynamicItems.length },
    { id: 'owned' as const, label: 'Filom', count: state.ownedContracts?.length || 0 },
    { id: 'promo' as const, label: 'Promo', count: null },
  ];

  return (
    <div className="space-y-4 pt-2 pb-8">
      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all',
              activeTab === tab.id ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30' : 'bg-white/5 text-zinc-400 hover:bg-white/10')}>
            {tab.label}
            {tab.count !== null && (
              <span className={cn('ml-1.5 px-1.5 py-0.5 rounded-full text-[8px]',
                activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-500')}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Market */}
      {activeTab === 'buy' && (
        <div className="space-y-3">
          <AdBoostCard onBoost={handleAdBoost} />
          {dynamicItems.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                <ShoppingBag size={26} className="text-zinc-600" />
              </div>
              <p className="font-black text-zinc-500 text-xs uppercase tracking-widest">Henüz ürün eklenmedi</p>
              <p className="text-zinc-600 text-[9px] font-bold uppercase">Admin panelinden ekipman eklendikçe görünecek</p>
            </div>
          ) : dynamicItems.map((item, idx) => (
            <MarketCard key={item.id} item={item} idx={idx} onPurchase={handlePurchase} usdRate={usdRate} />
          ))}
        </div>
      )}

      {/* Filom */}
      {activeTab === 'owned' && (
        <div className="space-y-3">
          {(!state.ownedContracts || state.ownedContracts.length === 0) ? (
            <div className="flex flex-col items-center py-16 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center"><Server size={26} className="text-zinc-600" /></div>
              <p className="font-black text-zinc-500 text-xs uppercase tracking-widest">Filo boş</p>
              <p className="text-zinc-600 text-[9px] font-bold uppercase">Market'ten ilk cihazını al</p>
              <button onClick={() => setActiveTab('buy')} className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black">
                Market'e Git <ChevronRight size={11} />
              </button>
            </div>
          ) : state.ownedContracts.map((contract, idx) => {
            const cfg = TIER_CFG[contract.tier] || TIER_CFG.default;
            const TierIcon = cfg.icon;
            const daysLeft = Math.max(0, contract.durationDays - Math.floor((Date.now() - contract.purchasedAt) / 86400000));
            const earnPct = earningsProgress(contract.totalEarnedBtc || 0, contract.maxEarningsBtc || 0);
            const conditionPct = contract.condition || 100;
            const isExpired = daysLeft === 0 || conditionPct <= 0;
            const isCapped = earnPct >= 100;
            const remainingUsd = Math.max(0, ((contract.maxEarningsBtc || 0) - (contract.totalEarnedBtc || 0))) * usdRate;

            return (
              <motion.div key={contract.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                className={cn('rounded-2xl border p-4 relative overflow-hidden', cfg.border, isExpired || isCapped ? 'opacity-50' : cfg.bg)}>
                {(isExpired || isCapped) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl z-10">
                    <div className="text-center">
                      <p className="text-xs font-black text-white uppercase tracking-widest">{isCapped ? '✅ Tavan Doldu' : '⏰ Süresi Bitti'}</p>
                      <p className="text-[9px] text-zinc-400 mt-1">Bu cihaz artık kazanç sağlamıyor</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${cfg.glow}15`, border: `1px solid ${cfg.glow}30` }}>
                      <TierIcon size={16} style={{ color: cfg.glow }} />
                    </div>
                    <div>
                      <span className={cn('text-[8px] font-black uppercase tracking-widest', cfg.text)}>{contract.tier}</span>
                      <h3 className="text-white font-black text-sm">{contract.name}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-black text-sm tabular-nums', cfg.text)}>{contract.hashRate} GH/s</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Clock size={8} className="text-zinc-600" /><span className="text-[8px] font-bold text-zinc-500">{daysLeft} gün</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Kazanılan', value: `$${((contract.totalEarnedBtc || 0) * usdRate).toFixed(3)}`, color: cfg.glow },
                    { label: 'Kalan', value: `$${remainingUsd.toFixed(3)}`, color: '#a1a1aa' },
                    { label: 'Durum', value: `%${conditionPct.toFixed(0)}`, color: conditionPct > 60 ? '#10b981' : conditionPct > 30 ? '#f59e0b' : '#ef4444' },
                  ].map((s, i) => (
                    <div key={i} className="bg-black/20 rounded-xl p-2 text-center">
                      <p className="text-[11px] font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-zinc-600 text-[7px] font-bold uppercase mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Kazanç tavanı bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-bold">
                    <span className="flex items-center gap-1 text-zinc-500"><BarChart3 size={8} /> Kazanç tavanı</span>
                    <span style={{ color: earnPct >= 80 ? '#ef4444' : cfg.glow }}>%{earnPct.toFixed(1)}{earnPct >= 80 && ' ⚠️'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${earnPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ background: earnPct >= 80 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : `linear-gradient(90deg, ${cfg.glow}88, ${cfg.glow})` }} />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold">
                    <span className="flex items-center gap-1 text-zinc-500"><Shield size={8} /> Cihaz durumu</span>
                    <span style={{ color: conditionPct > 60 ? '#10b981' : conditionPct > 30 ? '#f59e0b' : '#ef4444' }}>%{conditionPct.toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${conditionPct}%`, background: conditionPct > 60 ? '#10b981' : conditionPct > 30 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Promo */}
      {activeTab === 'promo' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Tag size={18} className="text-emerald-400" /></div>
              <div><p className="font-black text-white text-sm">Promo Kodu Kullan</p><p className="text-zinc-500 text-[10px]">BTC ve TP ödülleri kazan</p></div>
            </div>
            <div className="space-y-3">
              <input type="text" value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                onKeyDown={e => e.key === 'Enter' && handleRedeemPromo()}
                placeholder="PROMO KODUNU GİR..."
                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-black text-sm uppercase tracking-widest placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-colors" />
              <button onClick={handleRedeemPromo} disabled={!promoCode.trim() || promoLoading}
                className="w-full h-12 rounded-xl bg-emerald-500 text-black font-black text-sm uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                {promoLoading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Gift size={16} />}
                {promoLoading ? 'Kontrol Ediliyor...' : 'Kodu Kullan'}
              </button>
            </div>
            <AnimatePresence>
              {promoResult && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={cn('flex items-center gap-3 p-4 rounded-xl border', promoResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30')}>
                  {promoResult.success ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={18} className="text-red-400 shrink-0" />}
                  <p className={cn('text-sm font-bold', promoResult.success ? 'text-emerald-300' : 'text-red-300')}>{promoResult.message}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3">Nasıl Çalışır?</p>
            {['Admin panelinden oluşturulan kodları gir', 'Her kodu sadece bir kez kullanabilirsin', 'Kodlar BTC ve/veya TP ödülü içerebilir', 'Süresi dolmuş kodlar geçersizdir'].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-zinc-500 text-[10px] font-bold">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
