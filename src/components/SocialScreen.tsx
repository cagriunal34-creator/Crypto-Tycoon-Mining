/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Trophy, Crown, Zap, Users, Copy, Share2,
  ChevronUp, ChevronDown, Minus, Star, Shield, X, User,
  Tag, Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame, Guild } from '../context/GameContext';
import { LeaderboardUser } from '../types';
import { useNotify } from '../context/NotificationContext';

type LeaderboardTab = 'weekly' | 'alltime' | 'friends';

interface LeaderEntry {
  rank: number;
  name: string;
  btcMined: number;
  hashRate: number;
  level: number;
  change: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
  avatar: string;
}


function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={16} className="text-yellow-400" fill="currentColor" />;
  if (rank === 2) return <span className="text-sm font-black text-zinc-300">#2</span>;
  if (rank === 3) return <span className="text-sm font-black text-amber-600">#3</span>;
  return <span className="text-xs font-black text-zinc-500">#{rank}</span>;
}

function ChangeIcon({ change }: { change: LeaderEntry['change'] }) {
  if (change === 'up') return <ChevronUp size={12} className="text-emerald-500" />;
  if (change === 'down') return <ChevronDown size={12} className="text-red-400" />;
  return <Minus size={10} className="text-zinc-600" />;
}

export default function SocialScreen() {
  const {
    state, dispatch,
    redeemPromoCode
  } = useGame();
  const { notify } = useNotify();
  const [activeTab, setActiveTab] = React.useState<LeaderboardTab>('weekly');
  const [copied, setCopied] = React.useState(false);

  // Redeem Code State
  const [redeemCode, setRedeemCode] = React.useState('');
  const [promoCode, setPromoCode] = React.useState('');
  const [promoLoading, setPromoLoading] = React.useState(false);
  const [promoResult, setPromoResult] = React.useState<{ success: boolean; message: string } | null>(null);



  const handleRedeemCode = () => {
    if (!redeemCode.trim()) {
      notify({ type: 'warning', title: 'Hata', message: 'Lütfen bir kod girin.' });
      return;
    }
    if (redeemCode === state.referralCode) {
      notify({ type: 'warning', title: 'Hata', message: 'Kendi kodunu kullanamazsın.' });
      return;
    }
    if (state.redeemedReferralCode) {
      notify({ type: 'warning', title: 'Hata', message: 'Zaten bir kod kullandın.' });
      return;
    }

    dispatch({ type: 'APPLY_REFERRAL_CODE', code: redeemCode });
    notify({ type: 'success', title: 'Başarılı', message: `Kod uygulandı! +${(state.globalSettings as any)?.referralTpReward ?? 1000} TP ve %5 Hız Bonusu kazandın.` });
    setRedeemCode('');
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

  const leaders = state.leaderboard || [];
  // Tab'a göre liderboard filtresi
  const visibleLeaders = activeTab === 'friends'
    ? leaders.filter(l => l.isCurrentUser) // Sadece kendin (arkadaş sistemi henüz yok)
    : leaders;
  const topThree = (visibleLeaders || []).slice(0, 3);
  const others = (visibleLeaders || []).slice(3);
  const myEntry = (leaders || []).find(l => l.isCurrentUser) || leaders[0] || { rank: '?', avatar: '👤', name: 'Madenci', rankTitle: 'Yeni', level: 1, hashRate: 0, btcMined: 0 };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(state.referralCode);
    } catch {
      const el = document.createElement('textarea');
      el.value = state.referralCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    notify({ type: 'success', title: 'Kopyalandı!', message: 'Referans kodun panoya kopyalandı.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CryptoTycoon',
          text: `CryptoTycoon'a katıl ve birlikte BTC kazan! Kodum: ${state.referralCode}`,
          url: window.location.href,
        });
      } catch { }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-8 relative">

      {/* Referral Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border border-emerald-500/20 p-5 space-y-4">
        <div className="absolute top-0 right-0 opacity-10">
          <Users size={120} className="text-emerald-500" />
        </div>

        <div className="relative">
          <h2 className="text-base font-black">Arkadaşlarını Davet Et</h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Her davet için <span className="text-emerald-400 font-bold">+250 TP</span> ve
            <span className="text-emerald-400 font-bold"> %5 Hız Bonusu</span> kazan.
          </p>
        </div>

        <div className="relative flex items-center gap-2">
          <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm font-bold tracking-widest text-emerald-400">
            {state.referralCode}
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              'p-3 rounded-xl border transition-all active:scale-95',
              copied ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/10 text-zinc-400'
            )}
          >
            <Copy size={16} />
          </button>
          <button
            onClick={handleShare}
            className="p-3 rounded-xl bg-emerald-500 text-black border border-emerald-500 active:scale-95 transition-all"
          >
            <Share2 size={16} />
          </button>
        </div>

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Toplam Davet</p>
            <p className="text-2xl font-black">{state.referralCount}</p>
          </div>
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Kazanılan TP</p>
            <p className="text-2xl font-black text-emerald-400">{(state.referralCount * 250).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Hız Bonusu</p>
            <p className="text-2xl font-black text-emerald-400">%{Math.min(state.referralCount * 5, 50)}</p>
          </div>
        </div>
      </div>

      {/* Promo Code & Redeem Code Integrated Section */}
      <div className="space-y-4">
        {!state.redeemedReferralCode && (
          <div className="glass-card rounded-xl p-4 space-y-3 border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              <h3 className="text-sm font-black">Referans Kodu Gir</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                placeholder="Arkadaşının kodu..."
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <button
                onClick={handleRedeemCode}
                disabled={!redeemCode.trim()}
                className="px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Uygula
              </button>
            </div>
            <p className="text-[10px] text-zinc-500">
              Bir arkadaşının kodunu girerek <span className="text-emerald-400 font-bold">1000 TP</span> ve <span className="text-emerald-400 font-bold">%5 Hız Bonusu</span> kazanabilirsin.
            </p>
          </div>
        )}

        <div className="glass-card rounded-xl p-4 space-y-3 border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-emerald-400" />
            <h3 className="text-sm font-black">Promosyon Kodu</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
              placeholder="PROMO KODUNU GİR..."
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <button
              onClick={handleRedeemPromo}
              disabled={!promoCode.trim() || promoLoading}
              className="px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {promoLoading ? <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Gift size={14} />}
              {promoLoading ? '...' : 'Kullan'}
            </button>
          </div>
          <AnimatePresence>
            {promoResult && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className={cn("text-[10px] font-bold", promoResult.success ? "text-emerald-400" : "text-red-400")}
              >
                {promoResult.message}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="text-[10px] text-zinc-500">
            Özel ödüller için promosyon kodunu buraya girin.
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400" />
            <h3 className="text-sm font-black">Sıralama</h3>
          </div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Canlı • Her 5dk güncellenir</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
          {(['weekly', 'alltime', 'friends'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 text-[10px] font-bold rounded-lg transition-all',
                activeTab === tab ? 'bg-zinc-800 text-white' : 'text-zinc-500'
              )}
            >
              {tab === 'weekly' ? 'Haftalık' : tab === 'alltime' ? 'Tüm Zamanlar' : 'Arkadaşlar'}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {activeTab === 'friends' && visibleLeaders.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-zinc-500 text-sm font-bold">Arkadaş sistemi yakında geliyor!</p>
            <p className="text-zinc-600 text-[10px] mt-1">Referans koduyla davet ettiğin kişiler burada görünecek.</p>
          </div>
        )}
        <div className="flex items-end justify-center gap-2 py-4">
          {[visibleLeaders[1], visibleLeaders[0], visibleLeaders[2]].map((leader, i) => {
            if (!leader) return null;
            const heights = ['h-16', 'h-20', 'h-14'];
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const colors = ['bg-zinc-600', 'bg-yellow-500', 'bg-amber-600'];
            return (
              <div key={leader.rank} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-zinc-800 flex items-center justify-center text-xs font-black text-white">
                  {leader.avatar}
                </div>
                <p className="text-[9px] font-bold text-zinc-300 text-center leading-tight">{leader.name}</p>
                <p className="text-[7px] font-black text-emerald-500/80 text-center uppercase tracking-tighter mb-1">{leader.rankTitle}</p>
                <div className={cn('w-full rounded-t-xl flex items-center justify-center', heights[i], colors[i])}>
                  <RankBadge rank={rank} />
                </div>
              </div>
            );
          })}
        </div>

        {/* List */}
        <div className="space-y-2">
          {leaders.slice(3).map((leader, index) => (
            <motion.div
              key={leader.rank}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.03)" }}
              className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 cursor-default"
            >
              <div className="w-6 text-center">
                <RankBadge rank={leader.rank} />
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-black text-zinc-300">
                {leader.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold truncate">{leader.name}</p>
                  <span className="text-[7px] font-black text-emerald-500/60 uppercase px-1 rounded bg-emerald-500/5 border border-emerald-500/10">{leader.rankTitle}</span>
                </div>
                <p className="text-[9px] text-zinc-500">Lv.{leader.level} · {Math.floor(leader.hashRate)} Gh/s</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold font-mono text-emerald-400">
                  {leader.btcMined.toFixed(5)} BTC
                </p>
                <div className="flex items-center justify-end">
                  <ChangeIcon change={leader.change} />
                </div>
              </div>
            </motion.div>
          ))}

          {/* Separator */}
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 border-t border-dashed border-white/10" />
            <span className="text-[9px] text-zinc-600 font-bold">SEN</span>
            <div className="flex-1 border-t border-dashed border-white/10" />
          </div>

          {/* Current user */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              boxShadow: ["0 0 0px rgba(16, 185, 129, 0)", "0 0 15px rgba(16, 185, 129, 0.15)", "0 0 0px rgba(16, 185, 129, 0)"],
              borderColor: ["rgba(16, 185, 129, 0.2)", "rgba(16, 185, 129, 0.6)", "rgba(16, 185, 129, 0.2)"]
            }}
            transition={{
              y: { type: "spring", stiffness: 300, damping: 24 },
              boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              borderColor: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border-emerald-500/20 bg-emerald-500/5"
          >
            <div className="w-6 text-center">
              <span className="text-xs font-black text-zinc-500">#{myEntry.rank}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-black text-emerald-400">
              {myEntry.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold truncate text-emerald-400">{myEntry.name} (Sen)</p>
                <span className="text-[7px] font-black text-emerald-400 px-1 rounded bg-emerald-500/20 border border-emerald-500/30">{myEntry.rankTitle}</span>
              </div>
              <p className="text-[9px] text-zinc-500">Lv.{myEntry.level} · {myEntry.hashRate.toFixed(0)} Gh/s</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold font-mono text-emerald-400">
                {myEntry.btcMined.toFixed(5)} BTC
              </p>
              <div className="flex items-center justify-end">
                <ChangeIcon change="up" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      </div>
  );
}
