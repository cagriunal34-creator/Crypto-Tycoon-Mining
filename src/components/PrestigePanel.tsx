import React from 'react';
import { motion } from 'motion/react';
import { Star, ChevronRight, Lock } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onOpenPrestige: () => void;
}

export default function PrestigePanel({ onOpenPrestige }: Props) {
  const { state, canPrestige } = useGame();
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const nextMultiplier = 1.0 + (state.prestigeLevel + 1) * 0.25;

  // Only show if level >= 5 (teaser) or already prestiged
  if (state.level < 5 && state.prestigeLevel === 0) return null;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onOpenPrestige}
      className="w-full text-left overflow-hidden rounded-2xl transition-all"
      style={{
        background: canPrestige
          ? `linear-gradient(135deg, ${a1}10, ${a2}08)`
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${canPrestige ? a1 + '35' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: canPrestige ? `0 0 24px ${a1}15` : 'none',
      }}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div className="relative shrink-0">
          {canPrestige && (
            <div className="absolute inset-0 rounded-xl blur-md opacity-60"
              style={{ background: `linear-gradient(135deg,${a1},${a2})` }} />
          )}
          <div className="relative w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: canPrestige
                ? `linear-gradient(135deg,${a1}25,${a2}20)`
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${canPrestige ? a1 + '40' : 'rgba(255,255,255,0.07)'}`,
            }}>
            {canPrestige
              ? <Star size={22} style={{ color: a1 }} fill="currentColor" />
              : <Lock size={18} style={{ color: theme.vars['--ct-muted'] }} />
            }
          </div>
          {/* Prestige level badge */}
          {state.prestigeLevel > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black"
              style={{ background: `linear-gradient(135deg,${a1},${a2})`, color: '#fff', boxShadow: `0 0 8px ${a1}` }}>
              {state.prestigeLevel}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-black" style={{ color: canPrestige ? theme.vars['--ct-text'] : theme.vars['--ct-muted'] }}>
              Prestige {state.prestigeLevel > 0 ? `${state.prestigeLevel} → ${state.prestigeLevel + 1}` : ''}
            </span>
            {canPrestige && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse"
                style={{ background: `${a1}18`, color: a1, border: `1px solid ${a1}30` }}>
                HAZIR!
              </span>
            )}
          </div>
          {canPrestige ? (
            <p className="text-[10px]" style={{ color: theme.vars['--ct-muted'] }}>
              Sıfırla ve <span style={{ color: a1, fontWeight: 800 }}>×{nextMultiplier.toFixed(2)}</span> kalıcı BTC çarpanı kazan
            </p>
          ) : (
            <p className="text-[10px]" style={{ color: theme.vars['--ct-muted'] }}>
              <span style={{ color: a1 }}>Seviye 10</span> gerekiyor · Şu an Lv.{state.level} · 
              {' '}<span style={{ color: a1 }}>×{nextMultiplier.toFixed(2)}</span> çarpan kazanacaksın
            </p>
          )}
        </div>

        {/* Multiplier badge + arrow */}
        <div className="flex items-center gap-2 shrink-0">
          {state.prestigeMultiplier > 1 && (
            <div className="px-2 py-1 rounded-lg text-center"
              style={{ background: `${a1}12`, border: `1px solid ${a1}25` }}>
              <div className="text-xs font-black" style={{ color: a1 }}>×{state.prestigeMultiplier.toFixed(2)}</div>
              <div className="text-[7px] uppercase tracking-wider" style={{ color: theme.vars['--ct-muted'] }}>aktif</div>
            </div>
          )}
          <ChevronRight size={16} style={{ color: theme.vars['--ct-muted'] }} />
        </div>
      </div>

      {/* Progress bar to next prestige (if can't prestige yet) */}
      {!canPrestige && (
        <div className="px-4 pb-4">
          <div className="flex justify-between mb-1">
            <span className="text-[9px]" style={{ color: theme.vars['--ct-muted'] }}>
              Lv.{state.level} / 10
            </span>
            <span className="text-[9px]" style={{ color: a1 }}>
              {10 - state.level} seviye kaldı
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(state.level / 10) * 100}%` }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg,${a1},${a2})` }}
            />
          </div>
        </div>
      )}
    </motion.button>
  );
}
