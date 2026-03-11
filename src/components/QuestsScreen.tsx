/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckCircle, Gift, Zap, Users, PlayCircle, Award, Star, Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';

interface QuestDef {
  id: string;
  title: string;
  description: string;
  reward: { tp?: number; speedBoost?: number; unit: string };
  target: number;
  getProgress: (state: any) => number;
  icon: React.ElementType;
}

const QUEST_DEFS: QuestDef[] = [
  {
    id: 'q_ads',
    title: 'Reklam İzle',
    description: 'Bugün 3 reklam izleyerek enerji topla.',
    reward: { tp: 50, unit: 'TP' },
    target: 3,
    getProgress: s => s.questProgress?.adsWatched || 0,
    icon: PlayCircle,
  },
  {
    id: 'q_contract',
    title: 'Sözleşme Sahibi Ol',
    description: 'Herhangi bir madencilik sözleşmesi satın al.',
    reward: { tp: 150, unit: 'TP' },
    target: 1,
    getProgress: s => s.questProgress?.contractsPurchased || 0,
    icon: Zap,
  },
  {
    id: 'q_referral',
    title: 'Referans Gücü',
    description: '1 arkadaşını uygulamaya davet et.',
    reward: { tp: 250, unit: 'TP' },
    target: 1,
    getProgress: s => s.questProgress?.referralsDone || 0,
    icon: Users,
  },
  {
    id: 'q_streak',
    title: 'Sadık Madenci',
    description: 'Uygulamayı 3 gün üst üste ziyaret et.',
    reward: { speedBoost: 10, unit: '% Hız' },
    target: 3,
    getProgress: s => s.loginStreak || 0,
    icon: Award,
  },
];

export default function QuestsScreen() {
  const { state, dispatch } = useGame();
  const { notify } = useNotify();
  const claimed = state.questProgress?.claimedQuestIds || [];

  const handleClaim = (quest: QuestDef) => {
    dispatch({
      type: 'CLAIM_QUEST',
      questId: quest.id,
      reward: { tp: quest.reward.tp, speedBoost: quest.reward.speedBoost },
    });
    notify({
      type: 'success',
      title: 'Ödül Alındı!',
      message: `+${quest.reward.tp || quest.reward.speedBoost} ${quest.reward.unit} kazandın.`,
    });
  };

  return (
    <div className="space-y-6 pt-2 pb-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight">Günlük Görevler</h2>
        <p className="text-xs text-zinc-500">Görevleri tamamla, ekstra ödülleri topla.</p>
      </div>

      {/* Progress summary */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Tamamlanan</p>
          <p className="text-2xl font-black">{claimed.length} <span className="text-zinc-600 text-base">/ {QUEST_DEFS.length}</span></p>
        </div>
        <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${(claimed.length / QUEST_DEFS.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {QUEST_DEFS.map(quest => {
          const Icon = quest.icon;
          const progress = quest.getProgress(state);
          const isCompleted = progress >= quest.target;
          const isClaimed = claimed.includes(quest.id);
          const pct = Math.min((progress / quest.target) * 100, 100);

          return (
            <div
              key={quest.id}
              className={cn(
                'glass-card rounded-2xl p-4 border transition-all duration-300',
                isCompleted && !isClaimed ? 'border-emerald-500/50 bg-emerald-500/5' :
                isClaimed ? 'border-white/5 opacity-60' : 'border-white/5'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    isClaimed ? 'bg-emerald-500/10 text-emerald-500' :
                    isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-zinc-500'
                  )}>
                    {isClaimed ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{quest.title}</h4>
                    <p className="text-[10px] text-zinc-500 leading-tight">{quest.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-xs font-black text-emerald-500">
                    +{quest.reward.tp || quest.reward.speedBoost} {quest.reward.unit}
                  </div>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Ödül</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-bold">{Math.min(progress, quest.target)} / {quest.target}</span>
                  <span className="text-[10px] text-zinc-500 font-bold">%{Math.round(pct)}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    className={cn('h-full rounded-full', isCompleted ? 'bg-emerald-500' : 'bg-zinc-700')}
                  />
                </div>
              </div>

              {isCompleted && !isClaimed && (
                <button
                  onClick={() => handleClaim(quest)}
                  className="w-full mt-3 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold transition-all active:scale-95 hover:brightness-110 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  Ödülü Al
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Achievements */}
      <div className="pt-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight">Başarımlar</h3>
          <span className="text-[10px] text-zinc-500 font-bold">12 / 48</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center relative group overflow-hidden">
              {i < 3 ? (
                <>
                  <Award size={22} className="text-yellow-500" />
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#050505] flex items-center justify-center">
                    <CheckCircle size={7} className="text-white" />
                  </div>
                </>
              ) : (
                <Lock size={18} className="text-zinc-700" />
              )}
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center p-2 text-center">
                <p className="text-[7px] font-bold text-white">Başarım {i + 1}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
