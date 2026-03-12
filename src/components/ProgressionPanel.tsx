/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Zap, Flame, Trophy, Star, TrendingUp, ChevronRight } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

const LEVEL_PERKS: Record<number, string[]> = {
  1: ['Temel Madencilik', 'Günlük Bonus'],
  2: ['Hız +5%', 'Görev Sistemi'],
  3: ['Şans Çarkı', 'Referral Bonusu +10%'],
  4: ['Mining Farm', 'Hız +10%', 'Flash Teklifler'],
  5: ['Prestige Modu', 'Hız +20%', 'Özel Görevler'],
};

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;
  const bonus = Math.min(streak * 5, 50); // max %50 bonus
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
    >
      <Flame size={12} className="text-orange-500" fill="currentColor" />
      <span className="text-[10px] text-orange-500 font-bold">{streak} Günlük Seri · +%{bonus}</span>
    </motion.div>
  );
}

export default function ProgressionPanel() {
  const { state } = useGame();
  const { theme } = useTheme();
  
  const a1 = theme.vars['--ct-a1'];
  
  const xpPercent = Math.round((state.xp / state.xpToNextLevel) * 100);
  const nextPerks = LEVEL_PERKS[state.level + 1] || ['Max seviyeye ulaştın!'];

  return (
    <div className="glass-card rounded-xl p-4 space-y-4 border border-white/5">
      {/* Level + Streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 blur-md rounded-full" style={{ background: `${a1}30` }}></div>
            <div className="relative w-12 h-12 rounded-lg bg-[#0a0a0a] border flex items-center justify-center shadow-lg"
                 style={{ borderColor: `${a1}40`, boxShadow: `0 0 15px ${a1}20` }}>
              <span className="text-xl font-black italic" style={{ color: a1, filter: `drop-shadow(0 0 5px ${a1}80)` }}>{state.level}</span>
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
              <Star size={10} className="text-yellow-500" fill="currentColor" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-tight uppercase">SEVİYE {state.level}</h3>
              <div className="px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest"
                   style={{ background: `${a1}10`, borderColor: `${a1}20`, color: a1 }}>
                {state.rankTitle}
              </div>
            </div>
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
              {state.xp} / {state.xpToNextLevel} XP
            </p>
          </div>
        </div>
        <StreakBadge streak={state.loginStreak} />
      </div>

      {/* XP Bar - Laser Style */}
      <div className="space-y-2">
        <div className="h-1.5 w-full bg-[#0a0a0a] rounded-full overflow-hidden border border-white/5 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full relative"
            style={{ background: a1 }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full blur-[2px] shadow-[0_0_10px_#fff]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/50"></div>
          </motion.div>
        </div>
        <div className="flex justify-between text-[8px] text-zinc-500 font-mono uppercase tracking-widest">
          <span>PROGRESS: {xpPercent}%</span>
          <span>NEXT: {state.xpToNextLevel - state.xp} XP</span>
        </div>
      </div>

      {/* Next level perks - Tech Chips */}
      <div className="bg-[#0a0a0a]/50 rounded-lg p-3 space-y-2 border border-white/5">
        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
          <Trophy size={10} className="text-yellow-500" />
          <span>Seviye {state.level + 1} Kilit Açılımları</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {nextPerks.map((perk) => (
            <span key={perk} className="px-2 py-1 rounded bg-yellow-500/5 border border-yellow-500/20 text-[9px] text-yellow-500 font-mono font-bold tracking-tight shadow-[0_0_10px_rgba(234,179,8,0.05)]">
              {perk}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
