/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Trophy, Crown, Zap, Users, Copy, Share2,
  ChevronUp, ChevronDown, Minus, Star, Shield, X, User
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
    state, dispatch, donateToGuildInFirestore,
    leaveGuildInFirestore, createGuildInFirestore, joinGuildInFirestore
  } = useGame();
  const { notify } = useNotify();
  const [activeTab, setActiveTab] = React.useState<LeaderboardTab>('weekly');
  const [copied, setCopied] = React.useState(false);
  const [showCreateGuild, setShowCreateGuild] = React.useState(false);
  const [selectedGuild, setSelectedGuild] = React.useState<Guild | null>(null);

  // Create Guild Form State
  const [guildName, setGuildName] = React.useState('');
  const [guildDesc, setGuildDesc] = React.useState('');
  const [guildBadge, setGuildBadge] = React.useState('🛡️');

  // Redeem Code State
  const [redeemCode, setRedeemCode] = React.useState('');

  const handleCreateGuild = async () => {
    if (guildName.trim().length < 3) {
      notify({ type: 'warning', title: 'Hata', message: 'Lonca adı en az 3 karakter olmalı.' });
      return;
    }
    try {
      await createGuildInFirestore(guildName, guildDesc, guildBadge, 1000);
      notify({ type: 'success', title: 'Başarılı', message: 'Lonca başarıyla kuruldu!' });
      setShowCreateGuild(false);
      setGuildName('');
      setGuildDesc('');
    } catch (e) {
      notify({ type: 'warning', title: 'Yetersiz TP', message: 'Lonca kurmak için 1000 TP gerekiyor.' });
    }
  };

  const handleJoinGuild = async (guild: Guild) => {
    try {
      await joinGuildInFirestore(guild);
      notify({ type: 'success', title: 'Loncaya Katıldın!', message: `${guild.name} ailesine hoş geldin.` });
      if (selectedGuild) setSelectedGuild(null);
    } catch (e) {
      notify({ type: 'warning', title: 'Hata', message: 'Loncaya katılamadın.' });
    }
  };

  const handleLeaveGuild = async (guildId: string) => {
    try {
      await leaveGuildInFirestore(guildId);
      notify({ type: 'info', title: 'Loncadan Ayrıldın', message: 'Artık bir loncan yok.' });
      if (selectedGuild) setSelectedGuild(null);
    } catch (e) {
      notify({ type: 'warning', title: 'Hata', message: 'Ayrılma işlemi başarısız.' });
    }
  };

  const handleDonate = async (amount: number) => {
    try {
      await donateToGuildInFirestore(amount);
      notify({ type: 'success', title: 'Bağış Yapıldı!', message: `${amount.toLocaleString()} TP loncaya xp kazandırdı.` });
      // Minor local sync for UX
      if (selectedGuild) {
        setSelectedGuild({ ...selectedGuild, xp: selectedGuild.xp + amount * 0.5 });
      }
    } catch (e) {
      notify({ type: 'warning', title: 'Hata', message: 'Bağış başarısız. TP yetersiz olabilir.' });
    }
  };

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
    notify({ type: 'success', title: 'Başarılı', message: 'Kod uygulandı! +1000 TP ve %5 Hız Bonusu kazandın.' });
    setRedeemCode('');
  };

  const leaders = state.leaderboard || [];
  const topThree = (leaders || []).slice(0, 3);
  const others = (leaders || []).slice(3);
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
      {/* Create Guild Modal */}
      <AnimatePresence>
        {showCreateGuild && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className="text-sm font-bold text-white">Yeni Lonca Kur</h3>
                <button onClick={() => setShowCreateGuild(false)} className="text-zinc-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Lonca Adı</label>
                  <input
                    type="text"
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                    placeholder="Örn: Bitcoin Baronları"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Açıklama</label>
                  <textarea
                    value={guildDesc}
                    onChange={(e) => setGuildDesc(e.target.value)}
                    placeholder="Loncanı tanıtan kısa bir yazı..."
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Rozet Seç</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['🛡️', '⚔️', '💎', '👑', '🚀', '🔥', '⚡', '🦁', '🦅', '🦈'].map(badge => (
                      <button
                        key={badge}
                        onClick={() => setGuildBadge(badge)}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all border",
                          guildBadge === badge
                            ? "bg-emerald-500/20 border-emerald-500 text-white scale-110"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-zinc-400">Kurulum Ücreti:</span>
                    <span className={cn("font-bold font-mono", state.tycoonPoints >= 1000 ? "text-emerald-400" : "text-red-400")}>
                      1,000 TP
                    </span>
                  </div>
                  <button
                    onClick={handleCreateGuild}
                    disabled={state.tycoonPoints < 1000}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lonca Oluştur
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guild Details Modal */}
      <AnimatePresence>
        {selectedGuild && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedGuild(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedGuild.badge}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedGuild.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-300 font-bold px-1.5 py-0.5 rounded bg-white/10">LV.{selectedGuild.level}</span>
                      <span className="text-[10px] text-zinc-400">Sıralama #{selectedGuild.rank}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedGuild(null)} className="text-zinc-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase">Gelişim</h4>
                    <span className="text-[9px] font-mono text-zinc-500">{selectedGuild.xp} / {selectedGuild.xpToNextLevel} XP</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(selectedGuild.xp / selectedGuild.xpToNextLevel) * 100}%` }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase">Açıklama</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {selectedGuild.description || "Bu lonca için henüz bir açıklama girilmemiş."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Lider</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Crown size={10} className="text-emerald-500" />
                      </div>
                      <p className="text-xs font-bold truncate">
                        {selectedGuild.ownerId === state.userId ? 'Sen' : 'Anonim Lider'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Toplam Güç</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Zap size={10} className="text-blue-500" />
                      </div>
                      <p className="text-xs font-bold truncate">
                        {(selectedGuild.totalHash / 1000).toFixed(1)}k Gh/s
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase">Üyeler ({selectedGuild.members})</h4>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-black">{state.user?.displayName?.slice(0,2).toUpperCase() || 'M'}</div>
                          <p className="text-xs font-bold">{state.user?.displayName || 'Sen'}</p>
                       </div>
                       <span className="text-[9px] font-black text-emerald-500 uppercase">ÜYE</span>
                    </div>
                    {selectedGuild.members > 1 && (
                       <p className="text-center py-4 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">ve diğer {selectedGuild.members - 1} üye...</p>
                    )}
                  </div>
                </div>

                {state.userGuildId === selectedGuild.id && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase">Sıralama Bağışı</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[100, 500].map(amount => (
                        <button
                          key={amount}
                          onClick={() => handleDonate(amount)}
                          className="py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black hover:bg-white/10 transition-all flex flex-col items-center"
                        >
                          <span className="text-emerald-400">{amount} TP</span>
                          <span className="text-[8px] text-zinc-500">+{amount * 0.5} XP</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (state.userGuildId === selectedGuild.id) {
                        handleLeaveGuild(selectedGuild.id);
                      } else {
                        handleJoinGuild(selectedGuild);
                      }
                    }}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all",
                      state.userGuildId === selectedGuild.id
                        ? "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20"
                        : "bg-emerald-500 text-black"
                    )}
                  >
                    {state.userGuildId === selectedGuild.id ? 'Loncadan Ayrıl' : 'Loncaya Katıl'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Redeem Code Section */}
      {!state.redeemedReferralCode && (
        <div className="glass-card rounded-xl p-4 space-y-3 border border-white/5">
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
        <div className="flex items-end justify-center gap-2 py-4">
          {[leaders[1], leaders[0], leaders[2]].map((leader, i) => {
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

      {/* Guilds */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-blue-400" />
            <h3 className="text-sm font-black">Loncalar</h3>
          </div>
          <button
            onClick={() => setShowCreateGuild(true)}
            className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest hover:text-emerald-400 transition-colors"
          >
            Lonca Kur
          </button>
        </div>
        {(state.guilds || []).map(guild => {
          const isJoined = state.userGuildId === guild.id;
          return (
            <div
              key={guild.id}
              onClick={() => setSelectedGuild(guild)}
              className={cn(
                "glass-card rounded-2xl p-4 flex items-center gap-3 transition-all cursor-pointer hover:bg-white/5",
                isJoined ? "border-emerald-500/50 bg-emerald-500/10" : ""
              )}
            >
              <div className="text-2xl">{guild.badge}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm font-bold", isJoined ? "text-emerald-400" : "")}>{guild.name}</p>
                  <span className="text-[8px] text-yellow-500 font-bold border border-yellow-500/30 px-1.5 py-0.5 rounded-full">
                    #{guild.rank}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">{guild.members} üye · {(guild.totalHash / 1000).toFixed(0)}k Gh/s toplam</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isJoined) {
                    handleLeaveGuild(guild.id);
                  } else {
                    handleJoinGuild(guild);
                  }
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-bold active:scale-95 transition-all",
                  isJoined
                    ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                )}
              >
                {isJoined ? 'Ayrıl' : 'Katıl'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
