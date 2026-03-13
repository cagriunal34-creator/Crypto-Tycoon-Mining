/**
 * VipAura — Animasyonlu VIP Görünüm Efekti
 *
 * VIP aktifken ekranın kenarlarında dönen ışık halkası,
 * altın parçacık yağmuru ve alt nav üzerinde glow.
 *
 * App.tsx'e <VipAura /> olarak eklenir — hiçbir prop gerektirmez.
 * VIP kapalıysa hiçbir şey render etmez.
 */
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';

// ── Parçacık tipi ─────────────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}

function generateParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 3,
    size: 2 + Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

// ── Tek parçacık ──────────────────────────────────────────────────────────────
function GoldParticle({ p }: { p: Particle }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${p.x}%`,
        bottom: 0,
        width: p.size,
        height: p.size,
        background: p.color,
        boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
      }}
      animate={{
        y: [0, -(120 + Math.random() * 180)],
        opacity: [0, 0.9, 0.6, 0],
        scale: [0.5, 1.2, 0.8, 0.3],
        x: [(Math.random() - 0.5) * 40],
      }}
      transition={{
        duration: p.duration,
        delay: p.delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2,
        ease: 'easeOut',
      }}
    />
  );
}

export default function VipAura() {
  const { isVipActive, state } = useGame();
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const tier = state.vip?.tier ?? 'silver';
  const isGold = tier === 'gold';

  // Tier'a göre renkler
  const particleColors = isGold
    ? ['#fbbf24', '#f59e0b', '#fcd34d', '#ffffff', '#fde68a']
    : [a1, a2, '#ffffff', a1 + 'cc'];

  const particles = React.useMemo(
    () => generateParticles(isGold ? 18 : 12, particleColors),
    [isGold, a1]
  );

  const borderColor = isGold ? '#fbbf24' : a1;
  const glowColor   = isGold ? 'rgba(251,191,36,0.15)' : `${a1}15`;

  return (
    <AnimatePresence>
      {isVipActive && (
        <>
          {/* ── Köşe kenar ışıkları ── */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos, i) => {
            const isTop    = pos.includes('top');
            const isLeft   = pos.includes('left');
            return (
              <motion.div
                key={pos}
                className="fixed z-[5] pointer-events-none"
                style={{
                  [isTop ? 'top' : 'bottom']: 0,
                  [isLeft ? 'left' : 'right']: 0,
                  width: 120,
                  height: 120,
                  background: `radial-gradient(ellipse at ${isLeft ? '0%' : '100%'} ${isTop ? '0%' : '100%'}, ${borderColor}25 0%, transparent 70%)`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
              />
            );
          })}

          {/* ── Dönen çerçeve halkası (ince border) ── */}
          <motion.div
            className="fixed inset-0 z-[4] pointer-events-none"
            style={{
              border: `1px solid ${borderColor}`,
              borderRadius: 0,
              opacity: 0,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0, 0.12, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* ── Sol ve sağ kenar glow çizgileri ── */}
          {[0, 1].map(side => (
            <motion.div
              key={`edge-${side}`}
              className="fixed top-0 bottom-0 z-[4] pointer-events-none"
              style={{
                [side === 0 ? 'left' : 'right']: 0,
                width: 3,
                background: `linear-gradient(to bottom, transparent, ${borderColor}80, ${borderColor}cc, ${borderColor}80, transparent)`,
              }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: [0.3, 0.8, 0.3], scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{
                opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: side * 0.5 },
                scaleY: { duration: 0.5 },
              }}
            />
          ))}

          {/* ── Üst kenar ── */}
          <motion.div
            className="fixed top-0 left-0 right-0 z-[4] pointer-events-none"
            style={{
              height: 2,
              background: `linear-gradient(90deg, transparent, ${borderColor}cc, ${borderColor}, ${borderColor}cc, transparent)`,
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0.4, 1, 0.4], scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              scaleX: { duration: 0.6 },
            }}
          />

          {/* ── Alt parçacık yağmuru ── */}
          <div className="fixed bottom-0 left-0 right-0 z-[4] pointer-events-none overflow-hidden" style={{ height: 200 }}>
            {particles.map(p => <GoldParticle key={p.id} p={p} />)}
          </div>

          {/* ── VIP rozet (sağ üst köşe) ── */}
          <motion.div
            className="fixed top-14 right-3 z-[10] pointer-events-none"
            initial={{ opacity: 0, scale: 0, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0, x: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <motion.div
              animate={{ boxShadow: [`0 0 8px ${borderColor}60`, `0 0 20px ${borderColor}cc`, `0 0 8px ${borderColor}60`] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full"
              style={{
                background: isGold ? 'rgba(251,191,36,0.12)' : `${a1}12`,
                border: `1px solid ${borderColor}50`,
              }}
            >
              <span style={{ fontSize: 11 }}>{isGold ? '👑' : '⭐'}</span>
              <span className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: borderColor }}>
                VIP {isGold ? 'GOLD' : 'SILVER'}
              </span>
            </motion.div>
          </motion.div>

          {/* ── Ekran merkezi ambient glow ── */}
          <motion.div
            className="fixed inset-0 z-[3] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${glowColor} 0%, transparent 60%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}
    </AnimatePresence>
  );
}
