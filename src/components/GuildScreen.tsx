/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Zap, Trophy, Crown, 
  ChevronRight, Info, Gift, Plus, Search,
  X, CheckCircle2, TrendingUp, Star, Swords, Clock, Flame, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useGame, Guild } from '../context/GameContext';
import { GUILD_GOALS } from '../constants/gameData';
import { useNotify } from '../context/NotificationContext';
import { supabase, TABLES } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type GuildTab = 'overview' | 'members' | 'goals' | 'battle';

export default function GuildScreen({ userId }: { userId?: string | null }) {
  const { 
    state, createGuildInFirestore, joinGuildInFirestore, 
    leaveGuildInFirestore, donateToGuildInFirestore, claimGuildReward 
  } = useGame();
  const { notify } = useNotify();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<GuildTab>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGoalDetails, setShowGoalDetails] = useState<string | null>(null);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [joiningGuildId, setJoiningGuildId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [badge, setBadge] = useState('🛡️');

  const userGuild = state.guilds.find(g => g.id === state.userGuildId);

  const handleCreate = async () => {
    if (name.length < 3) return notify({ type: 'warning', title: t('common.error'), message: t('guild.notify.error_name_min') });
    if (isCreating) return;
    try {
      setIsCreating(true);
      await createGuildInFirestore(name, desc, badge, 1000);
      notify({ type: 'success', title: t('common.success'), message: t('guild.notify.create_success') });
      setShowCreateModal(false);
    } catch (e: any) {
      notify({ type: 'warning', title: t('common.error'), message: e.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClaimReward = async (goalId: string, rewardValue: number) => {
    try {
      await claimGuildReward(goalId, rewardValue);
      notify({ type: 'success', title: t('guild.goals.claim_btn'), message: t('guild.notify.reward_claimed') });
    } catch (e: any) {
      notify({ type: 'warning', title: t('common.error'), message: e.message });
    }
  };

  // Fetch Guild Members & Leader
  const [leaderName, setLeaderName] = useState(t('common.loading') + '...');

  useEffect(() => {
    if (state.userGuildId) {
      const fetchGuildStats = async () => {
        setLoadingMembers(true);
        try {
          // 1. Fetch Members
          const { data: members, error: memErr } = await supabase
            .from(TABLES.PROFILES)
            .select('id, username, level, totalHashRate')
            .eq('userGuildId', state.userGuildId)
            .neq('id', state.user?.uid); 

          if (memErr) throw memErr;
          setMembersList(members || []);

          // 2. Fetch Leader Name if not self
          const currentGuild = state.guilds.find(g => g.id === state.userGuildId);
          const ownerId = (currentGuild as any)?.owner_id;
          
          if (ownerId === state.user?.uid) {
            setLeaderName(t('guild.members.me'));
          } else if (ownerId) {
            const { data: ownerData } = await supabase
              .from(TABLES.PROFILES)
              .select('username')
              .eq('id', ownerId)
              .single();
            setLeaderName(ownerData?.username || t('common.anonymous'));
          }
        } catch (e) {
          console.error("Error fetching guild data:", e);
        } finally {
          setLoadingMembers(false);
        }
      };
      fetchGuildStats();
    }
  }, [state.userGuildId, state.user?.uid, state.guilds, t]);

  if (!userGuild) {
    return (
      <div className="space-y-6 pt-4 pb-20">
        {/* Empty State / Join/Create */}
        <div className="text-center space-y-4 py-8">
          <div className="w-20 h-20 rounded-[2.5rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield size={40} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">{t('guild.join_title')}</h2>
          <p className="text-zinc-500 text-sm max-w-[280px] mx-auto italic">
            {t('guild.join_desc')}
          </p>
          <div className="flex flex-col gap-3 pt-4 px-4">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full py-4 bg-emerald-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg"
            >
              <Plus size={18} />
              {t('guild.btn.create')} (1,000 TP)
            </button>
          </div>
        </div>

        {/* Guild List */}
        <div className="px-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">{t('guild.active_guilds')}</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Search size={12} className="text-zinc-500" />
              <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('guild.search_placeholder')}
                  className="bg-transparent border-none text-[10px] focus:outline-none text-zinc-300 w-20"
                />
            </div>
          </div>
          
          <div className="grid gap-3">
            {state.guilds.length === 0 ? (
              <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
                <p className="text-xs text-zinc-600 font-bold italic">{t('guild.no_guilds')}</p>
              </div>
            ) : (
              state.guilds
                .filter(g => !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(guild => (
                <motion.div 
                  key={guild.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                     if (joiningGuildId) return;
                     try {
                        setJoiningGuildId(guild.id);
                        await joinGuildInFirestore(guild);
                        notify({ type: 'success', title: t('common.success'), message: `${guild.name} ${t('guild.notify.join_success')}` });
                     } catch (e: any) {
                        notify({ type: 'warning', title: t('common.error'), message: e.message });
                     } finally {
                        setJoiningGuildId(null);
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
                      {guild.members} {t('guild.members_count')} · {(guild.totalHash / 1000).toFixed(1)} TH/s
                    </p>
                  </div>
                   <div className="text-right">
                     <span className="text-[10px] font-black text-emerald-500 px-2 py-1 rounded-lg bg-emerald-500/10">Lv.{guild.level}</span>
                     <p className="text-[8px] text-zinc-600 mt-1 uppercase font-bold tracking-widest">
                       {joiningGuildId === guild.id ? t('guild.joining') : t('guild.join_btn')}
                     </p>
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
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-sm bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <h3 className="text-sm font-bold text-white">{t('guild.modal.create_title')}</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={18} className="text-zinc-400" />
                  </button>
                </div>
                  <div className="p-6 space-y-5">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t('guild.modal.name_label')}</label>
                     <input 
                       value={name} onChange={e => setName(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50" 
                       placeholder={t('guild.modal.name_placeholder')}
                     />
                   </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t('guild.modal.badge_label')}</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {['🛡️', '⚔️', '💎', '👑', '🚀', '🔥', '⚡', '🦁', '🦅', '🦈'].map(b => (
                        <button key={b} onClick={() => setBadge(b)} className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all", badge === b ? "bg-emerald-500/20 border border-emerald-500" : "bg-white/5 border border-white/10")}>{b}</button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4">
                    <button 
                      onClick={handleCreate}
                      disabled={isCreating}
                      className="w-full py-4 bg-emerald-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                    >
                      {isCreating ? t('guild.modal.creating') : `${t('guild.btn.create')} (1,000 TP)`}
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
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('guild.dashboard.rank_label')} #{userGuild.rank}</span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-6 space-y-1.5">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500">
            <span>{t('guild.dashboard.xp_label')}</span>
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
          { id: 'overview', label: t('guild.tabs.overview'), icon: Info },
          { id: 'members', label: t('guild.tabs.members'), icon: Users },
          { id: 'goals', label: t('guild.tabs.goals'), icon: Trophy },
          { id: 'battle', label: t('guild.tabs.battle'), icon: Swords },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as GuildTab)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
              activeTab === tab.id
                ? tab.id === 'battle'
                  ? "bg-red-500/15 text-red-400 shadow-lg border border-red-500/20"
                  : "bg-white/10 text-white shadow-lg"
                : "text-zinc-500 hover:text-zinc-400"
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
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('guild.tabs.members')}</p>
                  <p className="text-xl font-black text-white">{userGuild.members} / 25</p>
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-3xl">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('guild.dashboard.total_power')}</p>
                  <p className="text-xl font-black text-blue-400">{(userGuild.totalHash / 1000).toFixed(1)} TH/s</p>
                </div>
              </div>

              <div className="p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                    <Crown size={20} className="text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t('guild.members.leader_label')}</p>
                    <p className="text-sm font-bold text-white uppercase italic tracking-tight">{leaderName}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  "{userGuild.description || t('guild.no_description')}"
                </p>
              </div>

              {/* Donation Section */}
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Zap size={16} />
                    <h4 className="text-xs font-black uppercase tracking-widest">{t('guild.donation.title')}</h4>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500">{state.tycoonPoints.toLocaleString()} {t('guild.donation.available_label')}</span>
                </div>
                <p className="text-[10px] text-zinc-400">{t('guild.donation.desc')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[500, 2500].map(amount => (
                    <button 
                       key={amount}
                       onClick={async () => {
                         try {
                           await donateToGuildInFirestore(amount);
                           notify({ type: 'success', title: t('guild.notify.donate_success_title'), message: `${amount} TP ${t('guild.notify.donate_success_msg')}` });
                         } catch (e: any) {
                           notify({ type: 'warning', title: t('common.error'), message: e.message });
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
                  if (window.confirm(t('guild.leave_confirm'))) {
                    try {
                      await leaveGuildInFirestore(userGuild.id);
                      notify({ type: 'info', title: t('guild.notify.leave_title'), message: t('guild.notify.leave_msg') });
                    } catch (e: any) {
                      notify({ type: 'warning', title: t('common.error'), message: e.message });
                    }
                  }
                }}
                className="w-full py-4 text-xs font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors"
              >
                {t('guild.leave_btn')}
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
                     <p className="text-sm font-bold text-white">{state.username} ({t('guild.members.me')})</p>
                     <p className="text-[10px] text-emerald-500 font-bold">{t('guild.members.member_label')} · Lv.{state.level}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-black text-white">{state.totalHashRate.toFixed(1)} GH/s</p>
                   <p className="text-[8px] text-zinc-500 uppercase font-bold">{t('guild.members.contribution')}</p>
                 </div>
              </div>

              <div className="flex items-center gap-2 py-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t('guild.members.other_label')}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="grid gap-3">
                {loadingMembers ? (
                  <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse">
                    <p className="text-xs text-zinc-600 font-bold italic">{t('common.loading')}...</p>
                  </div>
                ) : membersList.length === 0 ? (
                  <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
                    <Users size={24} className="mx-auto text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-600 font-bold italic">{t('guild.members.no_others')}</p>
                  </div>
                ) : (
                  membersList.map(member => (
                    <div key={member.id} className="glass-card rounded-2xl p-4 flex items-center justify-between bg-white/[0.02] border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-zinc-400">
                          {member.username?.slice(0, 2).toUpperCase() || '??'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{member.username || t('common.anonymous')}</p>
                          <p className="text-[10px] text-zinc-500">{t('guild.members.member_label')} · Lv.{member.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-zinc-400">{member.totalHashRate?.toFixed(1) || '0.0'} GH/s</p>
                        <p className="text-[8px] text-zinc-600 uppercase font-bold">{t('guild.members.contribution')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">{t('guild.goals.title')}</h3>
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
                            <span>{t('guild.goals.progress_label')}: %{Math.min(100, Math.floor(progress))}</span>
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
                          onClick={() => handleClaimReward(goal.id, goal.reward.value)}
                          className="mt-4 w-full py-3 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        >
                          {t('guild.goals.claim_btn')}
                        </button>
                      )}

                      {isClaimed && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] font-black uppercase text-emerald-500/50">
                           <CheckCircle2 size={10} /> {t('guild.goals.claimed_label')}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 flex items-center gap-3">
                <Info size={16} className="text-zinc-500 min-w-[16px]" />
                <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                  {t('guild.goals.footer_info')}
                </p>
              </div>
            </div>
          )}

          {/* ══════════ SAVAŞ SEKMESİ ══════════ */}
          {activeTab === 'battle' && (
            <GuildBattleTab
              userGuild={userGuild}
              allGuilds={state.guilds}
              userHashRate={state.totalHashRate}
              userGuildId={state.userGuildId}
              userId={state.user?.uid ?? null}
              notify={notify}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GuildBattleTab — Haftalık Lonca Savaşı
// ══════════════════════════════════════════════════════════════════════════════

const BATTLE_STORAGE_KEY = 'guild_battle_state_v1';
const SUPABASE_SYNC_INTERVAL_MS = 10_000; // 10 saniye

interface BattleState {
  phase: 'idle' | 'active' | 'finished';
  startedAt: number;
  endsAt: number;
  challengedGuildId: string | null;
  myGuildScore: number;
  enemyGuildScore: number;
  lastContributed: number;
  contributions: { time: number; hash: number }[];
  supabaseId: string | null; // Supabase'deki kayıt ID'si
  lastSyncedAt: number;       // Son başarılı sync zamanı
}

const DEFAULT_BATTLE: BattleState = {
  phase: 'idle',
  startedAt: 0,
  endsAt: 0,
  challengedGuildId: null,
  myGuildScore: 0,
  enemyGuildScore: 0,
  lastContributed: 0,
  contributions: [],
  supabaseId: null,
  lastSyncedAt: 0,
};

const BATTLE_DURATION_MS = 48 * 60 * 60 * 1000;
const CONTRIBUTE_COOLDOWN_MS = 60 * 1000;

// ── Supabase sync yardımcısı ──────────────────────────────────────────────────
async function syncBattleToSupabase(
  b: BattleState,
  myGuildId: string,
  userId: string,
): Promise<string | null> {
  try {
    const payload = {
      my_guild_id:       myGuildId,
      enemy_guild_id:    b.challengedGuildId,
      my_guild_score:    b.myGuildScore,
      enemy_guild_score: b.enemyGuildScore,
      phase:             b.phase,
      started_at:        new Date(b.startedAt).toISOString(),
      ends_at:           new Date(b.endsAt).toISOString(),
      started_by:        userId,
      contributions:     b.contributions,
      updated_at:        new Date().toISOString(),
    };

    if (b.supabaseId) {
      // Güncelle
      await supabase.from('guild_battles').update(payload).eq('id', b.supabaseId);
      return b.supabaseId;
    } else {
      // Yeni kayıt
      const { data, error } = await supabase
        .from('guild_battles')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select('id')
        .single();
      if (error) throw error;
      return data?.id ?? null;
    }
  } catch (err) {
    console.warn('[GuildBattle] Supabase sync hatası:', err);
    return b.supabaseId;
  }
}

function GuildBattleTab({ userGuild, allGuilds, userHashRate, userGuildId, userId, notify }: {
  userGuild: Guild;
  allGuilds: Guild[];
  userHashRate: number;
  userGuildId: string | null;
  userId: string | null;
  notify: any;
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const a1 = theme.vars['--ct-a1'];

  // ── Lonca sahibi mi? ─────────────────────────────────────────────────────────
  const isOwner = userId != null && (userGuild as any).owner_id === userId;

  const [battle, setBattle] = React.useState<BattleState>(() => {
    try {
      const saved = localStorage.getItem(BATTLE_STORAGE_KEY);
      if (saved) return { ...DEFAULT_BATTLE, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_BATTLE;
  });

  // Önce localStorage'a yaz, ardından Supabase'e sync koy
  const saveBattle = React.useCallback((b: BattleState) => {
    setBattle(b);
    try { localStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(b)); } catch {}
  }, []);

  // ── 10 saniyelik Supabase sync ───────────────────────────────────────────────
  const syncTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerSync = React.useCallback((current: BattleState) => {
    if (!userGuildId || !userId || current.phase === 'idle') return;
    syncBattleToSupabase(current, userGuildId, userId).then(id => {
      if (id && id !== current.supabaseId) {
        const updated = { ...current, supabaseId: id, lastSyncedAt: Date.now() };
        setBattle(updated);
        try { localStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(updated)); } catch {}
      } else if (id) {
        const updated = { ...current, lastSyncedAt: Date.now() };
        setBattle(updated);
        try { localStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(updated)); } catch {}
      }
    });
  }, [userGuildId, userId]);

  React.useEffect(() => {
    if (battle.phase === 'idle') {
      if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = null; }
      return;
    }
    // Hemen bir kez sync et
    triggerSync(battle);
    // Sonra her 10 sn'de bir
    syncTimerRef.current = setInterval(() => {
      setBattle(prev => { triggerSync(prev); return prev; });
    }, SUPABASE_SYNC_INTERVAL_MS);
    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current); };
  }, [battle.phase, triggerSync]);

  // ── Savaş bitişi kontrolü ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (battle.phase === 'active' && Date.now() > battle.endsAt) {
      const finished = { ...battle, phase: 'finished' as const };
      saveBattle(finished);
      triggerSync(finished);
    }
  }, [battle, saveBattle, triggerSync]);

  // ── Countdown ────────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = React.useState('');
  const [syncStatus, setSyncStatus] = React.useState<'synced' | 'pending' | 'error'>('pending');

  React.useEffect(() => {
    if (battle.phase !== 'active') return;
    const interval = setInterval(() => {
      const remaining = battle.endsAt - Date.now();
      if (remaining <= 0) {
        const finished = { ...battle, phase: 'finished' as const };
        saveBattle(finished);
        triggerSync(finished);
        clearInterval(interval);
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
      // Sync durumu güncelle
      const secsSinceSync = (Date.now() - battle.lastSyncedAt) / 1000;
      setSyncStatus(secsSinceSync < 15 ? 'synced' : secsSinceSync < 30 ? 'pending' : 'error');
    }, 1000);
    return () => clearInterval(interval);
  }, [battle.phase, battle.endsAt, battle.lastSyncedAt, battle, saveBattle, triggerSync]);

  const enemyGuild = allGuilds.find(g => g.id === battle.challengedGuildId);
  const canContribute = battle.phase === 'active' &&
    Date.now() - battle.lastContributed > CONTRIBUTE_COOLDOWN_MS;

  // ── Savaş başlat (sadece lonca sahibi) ──────────────────────────────────────
  const handleChallenge = (guild: Guild) => {
    if (!isOwner) return;
    const now = Date.now();
    const newBattle: BattleState = {
      ...DEFAULT_BATTLE,
      phase: 'active',
      startedAt: now,
      endsAt: now + BATTLE_DURATION_MS,
      challengedGuildId: guild.id,
      myGuildScore: userGuild.totalHash,
      enemyGuildScore: guild.totalHash * 0.9,
    };
    saveBattle(newBattle);
    // İlk sync hemen
    triggerSync(newBattle);
    notify({ type: 'success', title: `⚔️ ${t('guild.notify.battle_start_title')}`, message: `${guild.name} ${t('guild.notify.battle_start_msg')}` });
  };

  const handleContribute = () => {
    if (!canContribute) return;
    const contribution = userHashRate;
    const enemyProgress = battle.enemyGuildScore * (1 + Math.random() * 0.05);
    const updated: BattleState = {
      ...battle,
      myGuildScore: battle.myGuildScore + contribution,
      enemyGuildScore: enemyProgress,
      lastContributed: Date.now(),
      contributions: [...battle.contributions, { time: Date.now(), hash: contribution }].slice(-20),
    };
    saveBattle(updated);
    notify({ type: 'mining', title: `⚡ ${t('guild.notify.contribute_success_title')}`, message: `+${contribution.toFixed(0)} GH/s ${t('guild.notify.contribute_success_msg')}` });
  };

  const handleReset = () => {
    const finished = { ...battle, phase: 'finished' as const };
    triggerSync(finished);
    setTimeout(() => saveBattle(DEFAULT_BATTLE), 300);
  };

  const myPct = battle.myGuildScore + battle.enemyGuildScore > 0
    ? Math.round((battle.myGuildScore / (battle.myGuildScore + battle.enemyGuildScore)) * 100)
    : 50;

  const challengeable = allGuilds.filter(g => g.id !== userGuildId).slice(0, 5);

  // ── IDLE ────────────────────────────────────────────────────────────────────
  if (battle.phase === 'idle') return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative p-5 rounded-[1.5rem] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(251,146,60,0.05))', border: '1px solid rgba(239,68,68,0.15)' }}>
        <div className="absolute top-0 right-0 opacity-5"><Swords size={100} /></div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Swords size={20} className="text-red-400" />
          </div>
          <div>
            <div className="text-sm font-black text-white">{t('guild.battle.title')}</div>
            <div className="text-[10px] text-zinc-500">{t('guild.battle.desc')}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { icon: '⚔️', label: t('guild.battle.duration_label'), sub: t('guild.battle.duration_sub') },
            { icon: '🏆', label: t('guild.battle.reward_label'), sub: t('guild.battle.reward_sub') },
            { icon: '⚡', label: t('guild.battle.metric_label'), sub: t('guild.battle.metric_sub') },
          ].map(item => (
            <div key={item.label} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-base mb-1">{item.icon}</div>
              <div className="text-[10px] font-black text-white">{item.label}</div>
              <div className="text-[9px] text-zinc-600">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sadece lonca sahibi görebilir / başlatabilir */}
      {!isOwner ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <Shield size={16} className="text-zinc-600 shrink-0" />
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            {t('guild.battle.owner_only')}
          </p>
        </div>
      ) : (
        <div>
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Target size={12} /> {t('guild.battle.challengeable_title')}
          </div>
          {challengeable.length === 0 ? (
            <div className="p-6 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-zinc-600 text-sm">{t('guild.battle.no_guilds')}</div>
            </div>
          ) : (
            <div className="space-y-2">
              {challengeable.map((guild, i) => {
                const isStronger = guild.totalHash > userGuild.totalHash;
                return (
                  <motion.div key={guild.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-2xl">{guild.badge}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{guild.name}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: isStronger ? 'rgba(239,68,68,0.12)' : 'rgba(52,211,153,0.12)', color: isStronger ? '#f87171' : '#34d399' }}>
                            {isStronger ? '▲ ' + t('guild.battle.stronger') : '▼ ' + t('guild.battle.weaker')}
                          </span>
                        </div>
                        <div className="text-[9px] text-zinc-600">{guild.members} {t('guild.members_count')} · {(guild.totalHash / 1000).toFixed(1)} TH/s</div>
                      </div>
                      <motion.button whileTap={{ scale: 0.93 }} onClick={() => handleChallenge(guild)}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5"
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                        <Swords size={11} /> {t('guild.tabs.battle')}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── ACTIVE ──────────────────────────────────────────────────────────────────
  if (battle.phase === 'active') return (
    <div className="space-y-4">
      {/* Countdown + Sync status */}
      <div className="flex items-center justify-between p-4 rounded-2xl"
        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <div className="flex items-center gap-2">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Flame size={18} className="text-red-400" />
          </motion.div>
          <span className="text-xs font-black text-red-400 uppercase tracking-widest">{t('guild.battle.active_status')}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Sync göstergesi */}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full"
              style={{ background: syncStatus === 'synced' ? '#34d399' : syncStatus === 'pending' ? '#fbbf24' : '#f87171',
                       boxShadow: `0 0 4px ${syncStatus === 'synced' ? '#34d399' : syncStatus === 'pending' ? '#fbbf24' : '#f87171'}` }} />
            <span className="text-[8px] font-bold uppercase tracking-widest"
              style={{ color: syncStatus === 'synced' ? '#34d399' : syncStatus === 'pending' ? '#fbbf24' : '#f87171' }}>
              {syncStatus === 'synced' ? 'Sync' : syncStatus === 'pending' ? 'Sync...' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-black" style={{ fontFamily: 'monospace', color: '#f87171' }}>
            <Clock size={13} />{timeLeft}
          </div>
        </div>
      </div>

      {/* VS Kartı */}
      <div className="p-5 rounded-[1.5rem]" style={{ background: 'rgba(8,8,12,0.9)', border: '1px solid rgba(239,68,68,0.12)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <div className="text-3xl mb-1">{userGuild.badge}</div>
            <div className="text-[11px] font-black text-white truncate max-w-[90px]">{userGuild.name}</div>
            <div className="text-[9px] text-zinc-500">{t('guild.members.me')}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-lg font-black text-red-400">VS</div>
            <Swords size={16} className="text-red-500" />
          </div>
          <div className="text-center flex-1">
            <div className="text-3xl mb-1">{enemyGuild?.badge || '⚔️'}</div>
            <div className="text-[11px] font-black text-white truncate max-w-[90px]">{enemyGuild?.name || t('guild.battle.enemy')}</div>
            <div className="text-[9px] text-zinc-500">{t('guild.battle.enemy')}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1.5">
            <span style={{ color: a1 }}>{myPct}%</span>
            <span className="text-zinc-600">{t('guild.battle.metric_label')}</span>
            <span className="text-red-400">{100 - myPct}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div animate={{ width: `${myPct}%` }} transition={{ type: 'spring', stiffness: 60 }}
              className="h-full rounded-l-full"
              style={{ background: `linear-gradient(90deg, ${a1}, ${theme.vars['--ct-a2']})`, boxShadow: `0 0 10px ${a1}60` }} />
            <div className="flex-1 rounded-r-full" style={{ background: 'rgba(239,68,68,0.4)' }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl text-center" style={{ background: `${a1}08`, border: `1px solid ${a1}20` }}>
            <div className="text-[9px] font-bold text-zinc-500 mb-1">{t('guild.battle.your_score')}</div>
            <div className="text-base font-black" style={{ color: a1 }}>{(battle.myGuildScore / 1000).toFixed(1)} TH</div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="text-[9px] font-bold text-zinc-500 mb-1">{t('guild.battle.enemy_score')}</div>
            <div className="text-base font-black text-red-400">{(battle.enemyGuildScore / 1000).toFixed(1)} TH</div>
          </div>
        </div>
      </div>

      {/* Katkı Butonu */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={handleContribute} disabled={!canContribute}
        className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
        style={canContribute
          ? { background: `linear-gradient(135deg, ${a1}, ${theme.vars['--ct-a2']})`, color: '#000', boxShadow: `0 8px 24px ${a1}40` }
          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#52525b' }}>
        <Zap size={18} fill={canContribute ? 'currentColor' : 'none'} />
        {canContribute ? `+${userHashRate.toFixed(0)} GH/s ${t('guild.battle.contribute_btn')}` : t('guild.battle.cooldown_msg')}
      </motion.button>

      {/* Son Katkılar */}
      {battle.contributions.length > 0 && (
        <div>
          <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">{t('guild.battle.recent_contributions')}</div>
          <div className="space-y-1.5">
            {[...battle.contributions].reverse().slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-[10px] text-zinc-500">
                  {new Date(c.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] font-black" style={{ color: a1 }}>+{c.hash.toFixed(0)} GH/s</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── FINISHED ────────────────────────────────────────────────────────────────
  const won = battle.myGuildScore >= battle.enemyGuildScore;
  return (
    <div className="space-y-4">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14 }}
        className="p-8 rounded-[2rem] text-center"
        style={{
          background: won
            ? `linear-gradient(135deg, ${a1}12, ${theme.vars['--ct-a2']}08)`
            : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.04))',
          border: `1px solid ${won ? a1 : '#f87171'}25`,
        }}>
        <motion.div animate={{ rotate: won ? [0, -10, 10, -5, 5, 0] : [] }}
          transition={{ duration: 0.6, delay: 0.3 }} className="text-6xl mb-4">
          {won ? '🏆' : '💀'}
        </motion.div>
        <div className="text-2xl font-black mb-2" style={{ color: won ? a1 : '#f87171' }}>
          {won ? t('guild.battle.victory') : t('guild.battle.defeat')}
        </div>
        <div className="text-sm text-zinc-400 mb-6">
          {won ? `${userGuild.name} ${t('guild.battle.victory_msg')}` : `${enemyGuild?.name || t('guild.battle.enemy')} ${t('guild.battle.defeat_msg')}`}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-xl" style={{ background: `${a1}08`, border: `1px solid ${a1}20` }}>
            <div className="text-[9px] text-zinc-500 mb-1">{t('guild.battle.your_score')}</div>
            <div className="text-base font-black" style={{ color: a1 }}>{(battle.myGuildScore / 1000).toFixed(1)} TH</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="text-[9px] text-zinc-500 mb-1">{t('guild.battle.enemy_score')}</div>
            <div className="text-base font-black text-red-400">{(battle.enemyGuildScore / 1000).toFixed(1)} TH</div>
          </div>
        </div>
        {won && (
          <div className="p-3 rounded-2xl mb-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <div className="text-xs font-black text-amber-400">🎁 {t('guild.battle.reward_title')}</div>
            <div className="text-[10px] text-zinc-500 mt-1">{t('guild.battle.reward_desc')}</div>
          </div>
        )}
        {isOwner && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleReset}
            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
            style={{ background: `linear-gradient(135deg, ${a1}, ${theme.vars['--ct-a2']})`, color: '#000' }}>
            {t('guild.battle.restart_btn')}
          </motion.button>
        )}
        {!isOwner && (
          <div className="text-[10px] text-zinc-600">{t('guild.battle.wait_owner')}</div>
        )}
      </motion.div>
    </div>
  );
}
