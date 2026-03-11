import React, { useState } from 'react';
import { Zap, Clock, Star, Flame, Gift, Server, Tag, CheckCircle2, AlertTriangle, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';
import { supabase, TABLES } from '../lib/supabase';

const TIER_COLORS: Record<string, { text: string; border: string; bg: string; glow: string }> = {
  Bronze:   { text: 'text-orange-400',  border: 'border-orange-500/30',  bg: 'bg-orange-500/5',    glow: '#f97316' },
  Silver:   { text: 'text-zinc-300',    border: 'border-zinc-400/30',    bg: 'bg-zinc-500/5',      glow: '#a1a1aa' },
  Gold:     { text: 'text-yellow-400',  border: 'border-yellow-500/30',  bg: 'bg-yellow-500/5',    glow: '#eab308' },
  Diamond:  { text: 'text-blue-400',    border: 'border-blue-500/30',    bg: 'bg-blue-500/5',      glow: '#3b82f6' },
  Flash:    { text: 'text-red-400',     border: 'border-red-500/30',     bg: 'bg-red-500/5',       glow: '#ef4444' },
  default:  { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5',   glow: '#10b981' },
};

export default function MiningShop({ onPurchaseSuccess, onWatchAd }: { onPurchaseSuccess: () => void; onWatchAd: () => void }) {
  const { state, dispatch, redeemPromoCode } = useGame();
  const { notify } = useNotify();
  const [activeTab, setActiveTab] = useState<'buy' | 'owned' | 'promo'>('buy');
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{ success: boolean; message: string } | null>(null);

  // Use dynamic items from admin, fallback to static if empty
  const dynamicItems = state.dynamicMiningItems || [];

  const handlePurchase = (item: typeof dynamicItems[0]) => {
    if (!item.price) return;
    dispatch({
      type: 'PURCHASE_CONTRACT',
      contract: {
        id: `${item.id}-${Date.now()}`,
        name: item.name,
        tier: (item.tier as any) || 'Bronze',
        hashRate: item.hashrate || 100,
        purchasedAt: Date.now(),
        durationDays: 30,
        condition: 100,
        lastMaintenance: Date.now(),
      },
      cost: item.price,
    });

    // Log to Supabase
    if (state.user?.uid) {
      supabase.from(TABLES.TRANSACTIONS).insert({
        user_id: state.user.uid,
        username: state.username,
        type: 'buy_item',
        amount: item.price,
        status: 'approved',
        note: `Satın alındı: ${item.name}`,
        created_at: new Date().toISOString(),
      }).then(() => {});
    }

    notify({ type: 'success', title: 'Satın Alındı!', message: `${item.name} madencilik ekipmanın eklendi.` });
    onPurchaseSuccess();
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoResult(null);
    const result = await redeemPromoCode(promoCode.trim());
    setPromoResult(result);
    if (result.success) {
      notify({ type: 'success', title: 'Promo Kodu Kullanıldı!', message: result.message });
      setPromoCode('');
    } else {
      notify({ type: 'warning', title: 'Geçersiz Kod', message: result.message });
    }
    setPromoLoading(false);
  };

  const tabs = [
    { id: 'buy', label: `Market (${dynamicItems.length})` },
    { id: 'owned', label: `Sahip Olunan (${state.ownedContracts?.length || 0})` },
    { id: 'promo', label: 'Promo Kodu' },
  ] as const;

  return (
    <div className="space-y-4 pt-2 pb-8">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn("px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0",
              activeTab === tab.id
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                : "bg-white/5 text-zinc-400 hover:bg-white/10")}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Buy Tab */}
      {activeTab === 'buy' && (
        <div className="space-y-3">
          {dynamicItems.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                <ShoppingBag size={26} className="text-zinc-600" />
              </div>
              <p className="font-black text-zinc-500 text-xs uppercase tracking-widest">Henüz ürün eklenmedi</p>
              <p className="text-zinc-600 text-[9px] font-bold uppercase">Admin panelinden ekipman eklendikçe burada görünecek</p>
            </div>
          )}
          {dynamicItems.map((item, idx) => {
            const tierColors = TIER_COLORS[item.tier] || TIER_COLORS.default;
            const canAfford = (state.tycoonPoints || 0) >= (item.price || 0);
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className={cn("relative rounded-2xl border overflow-hidden", tierColors.border, tierColors.bg)}>
                <div className="absolute top-0 left-0 right-0 h-px opacity-50" style={{ background: `linear-gradient(90deg, transparent, ${tierColors.glow}, transparent)` }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", tierColors.text, tierColors.border, tierColors.bg)}>
                          {item.tier}
                        </span>
                        {item.tier === 'Gold' || item.tier === 'Diamond' ? <Star size={11} className={tierColors.text} /> : null}
                      </div>
                      <h3 className="text-white font-black text-sm">{item.name}</h3>
                      {item.description && <p className="text-zinc-500 text-[10px] mt-0.5">{item.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className={cn("text-xl font-black tabular-nums", tierColors.text)}>${item.price?.toFixed(2)}</p>
                      <p className="text-zinc-600 text-[8px] font-bold uppercase">TP gerekli</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Hashrate', value: `${item.hashrate} GH/s`, icon: Zap },
                      { label: 'Günlük BTC', value: item.daily_btc?.toFixed(8) || '—', icon: Server },
                      { label: 'Enerji', value: `${item.energy_cost || 0}/s`, icon: Flame },
                    ].map((stat, si) => {
                      const StatIcon = stat.icon;
                      return (
                        <div key={si} className="bg-white/5 rounded-xl p-2.5 text-center">
                          <StatIcon size={12} className={cn("mx-auto mb-1", tierColors.text)} />
                          <p className="text-white font-black text-[10px] tabular-nums">{stat.value}</p>
                          <p className="text-zinc-600 text-[8px] font-bold uppercase">{stat.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford}
                    className={cn(
                      "w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95",
                      canAfford
                        ? "text-black hover:brightness-110 shadow-lg"
                        : "bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5"
                    )}
                    style={canAfford ? { background: `linear-gradient(135deg, ${tierColors.glow}, ${tierColors.glow}99)`, boxShadow: `0 4px 20px ${tierColors.glow}30` } : {}}>
                    {canAfford ? `Satın Al — $${item.price?.toFixed(2)}` : 'Yetersiz Bakiye'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Owned Tab */}
      {activeTab === 'owned' && (
        <div className="space-y-3">
          {(!state.ownedContracts || state.ownedContracts.length === 0) ? (
            <div className="flex flex-col items-center py-16 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                <Server size={26} className="text-zinc-600" />
              </div>
              <p className="font-black text-zinc-500 text-xs uppercase tracking-widest">Henüz ekipman yok</p>
              <p className="text-zinc-600 text-[9px] font-bold uppercase">Market'ten ilk ekipmanını satın al</p>
            </div>
          ) : (
            state.ownedContracts.map((contract, idx) => {
              const tierColors = TIER_COLORS[contract.tier] || TIER_COLORS.default;
              const daysLeft = Math.max(0, contract.durationDays - Math.floor((Date.now() - contract.purchasedAt) / 86400000));
              return (
                <motion.div key={contract.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className={cn("rounded-2xl border p-4", tierColors.border, tierColors.bg)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={cn("text-[8px] font-black uppercase tracking-widest", tierColors.text)}>{contract.tier}</span>
                      <h3 className="text-white font-black text-sm mt-0.5">{contract.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-black text-sm tabular-nums", tierColors.text)}>{contract.hashRate} GH/s</p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <Clock size={9} className="text-zinc-600" />
                        <span className="text-[9px] font-bold text-zinc-500">{daysLeft} gün kaldı</span>
                      </div>
                    </div>
                  </div>
                  {/* Condition bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[8px] text-zinc-600 font-bold mb-1">
                      <span>Durum</span><span>%{(contract.condition || 100).toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${contract.condition || 100}%`, background: tierColors.glow }} />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Promo Code Tab */}
      {activeTab === 'promo' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Tag size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-black text-white text-sm">Promo Kodu Kullan</p>
                <p className="text-zinc-500 text-[10px]">BTC ve TP ödülleri kazan</p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                onKeyDown={e => e.key === 'Enter' && handleRedeemPromo()}
                placeholder="PROMO KODUNU GİR..."
                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-black text-sm uppercase tracking-widest placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <button
                onClick={handleRedeemPromo}
                disabled={!promoCode.trim() || promoLoading}
                className="w-full h-12 rounded-xl bg-emerald-500 text-black font-black text-sm uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                {promoLoading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Gift size={16} />}
                {promoLoading ? 'Kontrol Ediliyor...' : 'Kodu Kullan'}
              </button>
            </div>

            <AnimatePresence>
              {promoResult && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={cn("flex items-center gap-3 p-4 rounded-xl border",
                    promoResult.success ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30")}>
                  {promoResult.success
                    ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    : <AlertTriangle size={18} className="text-red-400 shrink-0" />}
                  <p className={cn("text-sm font-bold", promoResult.success ? "text-emerald-300" : "text-red-300")}>
                    {promoResult.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3">Nasıl Çalışır?</p>
            <div className="space-y-2">
              {[
                'Admin panelinden oluşturulan kodları gir',
                'Her kodu sadece bir kez kullanabilirsin',
                'Kodlar BTC ve/veya TP ödülü içerebilir',
                'Süresi dolmuş kodlar geçersiz sayılır',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-zinc-500 text-[10px] font-bold">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
