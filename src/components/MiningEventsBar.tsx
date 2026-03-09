import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Wind, Battery, TrendingDown } from 'lucide-react';
import { MiningEvent } from '../types';
import { useTheme } from '../context/ThemeContext';

interface Props {
  events: MiningEvent[];
}

function EventCountdown({ endsAt }: { endsAt: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, endsAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const s = Math.floor(remaining / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return <span>{h}s {m.toString().padStart(2, '0')}d</span>;
  return <span>{m.toString().padStart(2, '0')}:{sec.toString().padStart(2, '0')}</span>;
}

const EVENT_ICONS = {
  flash_pool: Zap,
  hash_storm: Wind,
  energy_surge: Battery,
  block_halving: TrendingDown,
};

const EVENT_COLORS = {
  flash_pool: { bg: 'rgba(255,200,0,0.08)', border: 'rgba(255,200,0,0.25)', text: '#FFD000' },
  hash_storm: { bg: 'rgba(100,200,255,0.08)', border: 'rgba(100,200,255,0.25)', text: '#64C8FF' },
  energy_surge: { bg: 'rgba(79,255,206,0.08)', border: 'rgba(79,255,206,0.25)', text: '#4FFFCE' },
  block_halving: { bg: 'rgba(255,80,80,0.08)', border: 'rgba(255,80,80,0.25)', text: '#FF5050' },
};

export default function MiningEventsBar({ events }: Props) {
  const { theme } = useTheme();
  if (events.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {events.map(ev => {
          const Icon = EVENT_ICONS[ev.type] || Zap;
          const color = EVENT_COLORS[ev.type] || EVENT_COLORS.flash_pool;
          const progress = Math.max(0, (ev.endsAt - Date.now()) / (ev.endsAt - Date.now() + 1)); // rough
          const totalDuration = ev.type === 'hash_storm' ? 30 * 60 * 1000 : 2 * 3600 * 1000;
          const progressPct = Math.max(0, Math.min(100, ((ev.endsAt - Date.now()) / totalDuration) * 100));

          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className="relative overflow-hidden rounded-2xl"
              style={{ background: color.bg, border: `1px solid ${color.border}` }}
            >
              {/* Animated progress underline */}
              <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-1000"
                style={{ width: `${progressPct}%`, background: color.text, boxShadow: `0 0 8px ${color.text}` }} />

              <div className="flex items-center gap-3 px-4 py-3">
                {/* Icon */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${color.text}18`, color: color.text }}>
                  <Icon size={16} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black truncate" style={{ color: color.text }}>
                      {ev.emoji} {ev.label}
                    </span>
                    {ev.multiplier !== 1.0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: `${color.text}18`, color: color.text }}>
                        {ev.multiplier > 1 ? '+' : ''}{((ev.multiplier - 1) * 100).toFixed(0)}% BTC
                      </span>
                    )}
                    {ev.hashBoost > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: `${color.text}18`, color: color.text }}>
                        +{ev.hashBoost} Gh/s
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] mt-0.5 truncate" style={{ color: theme.vars['--ct-muted'] }}>
                    {ev.description}
                  </p>
                </div>

                {/* Countdown */}
                <div className="text-right shrink-0">
                  <div className="text-xs font-black tabular-nums font-mono" style={{ color: color.text }}>
                    <EventCountdown endsAt={ev.endsAt} />
                  </div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: theme.vars['--ct-muted'] }}>kaldı</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
