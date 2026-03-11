/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Shield, Users, Zap, Trophy, Crown, 
  ChevronRight, Info, Gift, Plus, Search,
  X, CheckCircle2, TrendingUp, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame, Guild } from '../context/GameContext';
import { GUILD_GOALS } from '../constants/gameData';
import { useNotify } from '../context/NotificationContext';

type GuildTab = 'overview' | 'members' | 'goals';

export default function GuildScreen() {
  const { 
    state, createGuildInFirestore, joinGuildInFirestore, 
    leaveGuildInFirestore, donateToGuildInFirestore, claimGuildReward 
  } = useGame();
  const { notify } = useNotify();

  const [activeTab, setActiveTab] = useState<GuildTab>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGoalDetails, setShowGoalDetails] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [badge, setBadge] = useState('🛡️');

  const userGuild = state.guilds.find(g => g.id === state.userGuildId);

  const handleCreate = async () => {
    if (name.length < 3) return notify({ type: 'warning', title: 'Hata', message: 'Lonca adı en az 3 karakter olmalıdır.' });
    try {
      await createGuildInFirestore(name, desc, badge, 1000);
      notify({ type: 'success', title: 'Başarılı', message: 'Lonca başarıyla kuruldu!' });
      setShowCreateModal(false);
    } catch (e: any) {
      notify({ type: 'warning', title: 'Hata', message: e.message });
    }
  };

  const handleClaimReward = async (goalId: string, btcValue: number) => {
    try {
      await claimGuildReward(goalId, btcValue);
      notify({ type: 'success', title: 'Ödül Alındı!', message: 'Ödülünüz bakiyenize eklendi.' });
    } catch (e: any) {
      notify({ type: 'warning', title: 'Hata', message: e.message });
    }
  };

  if (!userGuild) {
    return (
      <div className="space-y-6 pt-4 pb-20">
        {/* Empty State / Join/Create */}
        <div className="text-center space-y-4 py-8">
          <div className="w-20 h-20 rounded-[2.5rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield size={40} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Bir Loncaya Katıl</h2>
          <p className="text-zinc-500 text-sm max-w-[280px] mx-auto italic">
            Madencilerle güçlerini birleştir, ortak hedeflere ulaş ve özel BTC ödülleri kazan!
          </p>
          <div className="flex flex-col gap-3 pt-4 px-4">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full py-4 bg-emerald-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg"
            >
              <Plus size={18} />
              Yeni Lonca Kur (1,000 TP)
            </button>
          </div>
        </div>

        {/* Guild List */}
        <div className="px-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Aktif Loncalar</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Search size={12} className="text-zinc-500" />
              <input type="text" placeholder="Ara..." className="bg-transparent border-none text-[10px] focus:outline-none text-zinc-300 w-20" />
            </div>
          </div>
          
          <div className="grid gap-3">
            {state.guilds.length === 0 ? (
              <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
                <p className="text-xs text-zinc-600 font-bold italic">Henüz lonca bulunmuyor...</p>
              </div>
            ) : (
              state.guilds.map(guild => (
                <motion.div 
                  key={guild.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    try {
                      await joinGuildInFirestore(guild);
                      notify({ type: 'success', title: 'Loncaya Katıldın!', message: `${guild.name} ailesine hoş geldin.` });
                    } catch (e: any) {
                      notify({ type: 'warning', title: 'Hata', message: e.message });
                    }
                  }}
                  className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/[0.05] transition-all"
                >
                  <div className="text-2xl w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                    {guild.badge}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">{guild.name}</h4>
                    <p className="text-[10px] text-zinc-500">
                      {guild.members} Üye · {(guild.totalHash / 1000).toFixed(1)} TH/s
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-emerald-500 px-2 py-1 rounded-lg bg-emerald-500/10">Lv.{guild.level}</span>
                    <p className="text-[8px] text-zinc-600 mt-1 uppercase font-bold tracking-widest">Katıl</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Create Guild Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <h3 className="text-sm font-bold text-white">Yeni Lonca Kur</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={18} className="text-zinc-400" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Lonca Adı</label>
                    <input 
                      value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50" 
                      placeholder="Örn: Bitcoin Baronları"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Badge (Emoji)</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {['🛡️', '⚔️', '💎', '👑', '🚀', '🔥', '⚡', '🦁', '🦅', '🦈'].map(b => (
                        <button key={b} onClick={() => setBadge(b)} className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all", badge === b ? "bg-emerald-500/20 border border-emerald-500" : "bg-white/5 border border-white/10")}>{b}</button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4">
                    <button 
                      onClick={handleCreate}
                      className="w-full py-4 bg-emerald-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg"
                    >
                      Lonca Kur (1,000 TP)
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Guild Dashboard (Joined)
  return (
    <div className="space-y-6 pt-4 pb-24">
      {/* Guild Header */}
      <div className="relative p-6 rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Shield size={120} />
        </div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="text-4xl w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
            {userGuild.badge}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black tracking-tight text-white mb-1 uppercase italic leading-none">{userGuild.name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-emerald-500 text-black px-2 py-0.5 rounded italic">LV.{userGuild.level}</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sıralama #{userGuild.rank}</span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-6 space-y-1.5">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500">
            <span>Tecrübe (XP)</span>
            <span>{Math.floor(userGuild.xp).toLocaleString()} / {userGuild.xpToNextLevel.toLocaleString()}</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(userGuild.xp / userGuild.xpToNextLevel) * 100}%` }}
              className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
        {[
          { id: 'overview', label: 'Genel Bakış', icon: Info },
          { id: 'members', label: 'Üyeler', icon: Users },
          { id: 'goals', label: 'Hedefler', icon: Trophy },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as GuildTab)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
              activeTab === tab.id ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-400"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-3xl">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Üyeler</p>
                  <p className="text-xl font-black text-white">{userGuild.members} / 25</p>
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-3xl">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Toplam Güç</p>
                  <p className="text-xl font-black text-blue-400">{(userGuild.totalHash / 1000).toFixed(1)} TH/s</p>
                </div>
              </div>

              <div className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                    <Crown size={20} className="text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Lonca Lideri</p>
                    <p className="text-sm font-bold text-white">{(state.guilds.find(g => g.id === state.userGuildId) as any)?.owner_id === state.user.uid ? 'Sen' : 'Anonim Lider'}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  "{userGuild.description || 'Loncaya henüz bir açıklama girilmemiş.'}"
                </p>
              </div>

              {/* Donation Section */}
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Zap size={16} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Lonca Bağışı</h4>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500">{state.tycoonPoints.toLocaleString()} TP Mevcut</span>
                </div>
                <p className="text-[10px] text-zinc-400">TycoonPoint bağışlayarak loncanın XP kazanmasını sağlayabilir ve seviye atlatabilirsin.</p>
                <div className="grid grid-cols-2 gap-2">
                  {[500, 2500].map(amount => (
                    <button 
                       key={amount}
                       onClick={async () => {
                         try {
                           await donateToGuildInFirestore(amount);
                           notify({ type: 'success', title: 'Bağış Yapıldı!', message: `${amount} TP bağışlandı.` });
                         } catch (e: any) {
                           notify({ type: 'warning', title: 'Hata', message: e.message });
                         }
                       }}
                       className="py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black hover:bg-white/10 transition-all flex flex-col items-center gap-1"
                    >
                      <span className="text-white">{amount.toLocaleString()} TP</span>
                      <span className="text-emerald-500/60 text-[8px]">+{amount * 0.5} XP</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (window.confirm('Loncadan ayrılmak istediğine emin misin?')) {
                    try {
                      await leaveGuildInFirestore(userGuild.id);
                      notify({ type: 'info', title: 'Ayrıldın', message: 'Loncadan ayrıldın.' });
                    } catch (e: any) {
                      notify({ type: 'warning', title: 'Hata', message: e.message });
                    }
                  }
                }}
                className="w-full py-4 text-xs font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors"
              >
                Loncadan Ayrıl
              </button>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-3">
              <div className="glass-card rounded-2xl p-4 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-black">
                     {state.username?.slice(0, 2).toUpperCase()}
                   </div>
                   <div>
                     <p className="text-sm font-bold text-white">{state.username} (Sen)</p>
                     <p className="text-[10px] text-emerald-500 font-bold">Üye · Lv.{state.level}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-black text-white">{state.totalHashRate.toFixed(1)} GH/s</p>
                   <p className="text-[8px] text-zinc-500 uppercase font-bold">Katkı</p>
                 </div>
              </div>

              <div className="flex items-center gap-2 py-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Diğer Üyeler</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
                <Users size={24} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-600 font-bold italic">Diğer üyeler gizlenmiş...</p>
                <p className="text-[10px] text-zinc-700 mt-1">Gelecek güncellemede tüm üye listesi aktif olacak.</p>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Ortak Hedefler</h3>
                <TrendingUp size={14} className="text-zinc-500" />
              </div>

              <div className="grid gap-3">
                {GUILD_GOALS.map(goal => {
                  const isClaimed = state.claimedGuildRewards?.includes(goal.id);
                  let progress = 0;
                  let currentVal = 0;

                  if (goal.type === 'hashrate') {
                    currentVal = userGuild.totalHash;
                    progress = (currentVal / goal.requirement) * 100;
                  } else if (goal.type === 'members') {
                    currentVal = userGuild.members;
                    progress = (currentVal / goal.requirement) * 100;
                  } else if (goal.type === 'level') {
                    currentVal = userGuild.level;
                    progress = (currentVal / goal.requirement) * 100;
                  }

                  const isComplete = progress >= 100;

                  return (
                    <motion.div 
                      key={goal.id}
                      className={cn(
                        "p-5 rounded-[2rem] border transition-all relative overflow-hidden",
                        isClaimed ? "bg-white/[0.01] border-white/5 opacity-60" : 
                        isComplete ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.03] border-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", isComplete ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-zinc-500")}>
                            {isComplete ? <CheckCircle2 size={20} /> : <Zap size={20} />}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{goal.label}</h4>
                            <p className="text-[10px] text-zinc-500 max-w-[150px] leading-tight mt-0.5">{goal.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-yellow-500 justify-end">
                            <Gift size={12} />
                            <span className="text-[11px] font-black italic">
                              {goal.reward.type === 'btc' ? `${goal.reward.value.toFixed(8)} BTC` : `${goal.reward.value} TP`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 relative z-10">
                         <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-500 px-1">
                            <span>İlerleme: %{Math.min(100, Math.floor(progress))}</span>
                            <span>{Math.floor(currentVal)} / {goal.requirement}</span>
                         </div>
                         <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden p-0.5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, progress)}%` }}
                              className={cn("h-full rounded-full", isComplete ? "bg-emerald-500" : "bg-blue-500")} 
                            />
                         </div>
                      </div>

                      {!isClaimed && isComplete && (
                        <button 
                          onClick={() => handleClaimReward(goal.id, goal.reward.type === 'btc' ? goal.reward.value : 0)}
                          className="mt-4 w-full py-3 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        >
                          Ödülünü Al
                        </button>
                      )}

                      {isClaimed && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] font-black uppercase text-emerald-500/50">
                           <CheckCircle2 size={10} /> Alındı
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 flex items-center gap-3">
                <Info size={16} className="text-zinc-500 min-w-[16px]" />
                <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                  Hedef ödülleri tüm lonca üyeleri için geçerlidir ancak her üye ödülü sadece bir kez talep edebilir.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
