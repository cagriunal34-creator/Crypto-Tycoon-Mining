import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ArrowRight, X, Trophy, Zap, TrendingUp, RotateCcw } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrestigeModal({ isOpen, onClose }: Props) {
  const { state, dispatch, btcToUsd } = useGame();
  const { theme } = useTheme();
  const { notify } = useNotify();
  const [confirmed, setConfirmed] = useState(false);

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];
  const a3 = theme.vars['--ct-a3'];

  const nextPrestigeLevel   = state.prestigeLevel + 1;
  const nextMultiplier      = 1.0 + nextPrestigeLevel * 0.25;
  const btcRetained         = state.btcBalance * 0.20;
  const canPrestige         = state.level >= 10;

  const handlePrestige = () => {
    if (!canPrestige) return;
    dispatch({ type: 'PRESTIGE' });
    setConfirmed(true);
    notify({
      type: 'success',
      title: `Prestige ${nextPrestigeLevel} Başarıldı! 🌟`,
      message: `×${nextMultiplier.toFixed(2)} kalıcı çarpan kazandın!`,
    });
  };

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="w-full max-w-md rounded-t-3xl overflow-hidden"
            style={{ background: theme.vars['--ct-bg'], border: `1px solid ${a1}25`, borderBottom: 'none' }}
          >
            {/* Top shimmer */}
            <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a1}, ${a2}, transparent)` }} />

            {!confirmed ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg,${a1}25,${a2}20)`, border: `1px solid ${a1}35` }}>
                      <Star size={20} style={{ color: a1 }} fill="currentColor" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black" style={{ color: theme.vars['--ct-text'] }}>Prestige</h2>
                      <p className="text-[10px] uppercase tracking-widest" style={{ color: theme.vars['--ct-muted'] }}>Seviye {nextPrestigeLevel}</p>
                    </div>
                  </div>
                  <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/5">
                    <X size={18} style={{ color: theme.vars['--ct-muted'] }} />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 space-y-4">
                  {/* What you GAIN */}
                  <div className="rounded-2xl p-4 space-y-3"
                    style={{ background: `${a3}08`, border: `1px solid ${a3}20` }}>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: a3 }}>✦ Kazanacakların</p>
                    {[
                      { icon: TrendingUp, label: 'Kalıcı BTC çarpanı', val: `×${nextMultiplier.toFixed(2)}`, desc: 'Tüm kazançlarına uygulanır' },
                      { icon: Zap,        label: 'BTC korunur',         val: `%20`, desc: `≈ ${btcToUsd(btcRetained)}` },
                      { icon: Trophy,     label: 'Prestige rozeti',      val: `P${nextPrestigeLevel}`, desc: 'Profilinde görünür' },
                    ].map(({ icon: Icon, label, val, desc }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${a3}15`, color: a3 }}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold" style={{ color: theme.vars['--ct-text'] }}>{label}</div>
                          <div className="text-[10px]" style={{ color: theme.vars['--ct-muted'] }}>{desc}</div>
                        </div>
                        <span className="text-sm font-black" style={{ color: a3 }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* What you LOSE */}
                  <div className="rounded-2xl p-4 space-y-2"
                    style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400">✦ Sıfırlanacaklar</p>
                    {['Seviye & XP', `BTC bakiyenin %80'i (${btcToUsd(state.btcBalance * 0.8)})`, 'Kontratlar & Hashrate', 'Enerji hücreleri'].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-red-300/70">
                        <span className="text-red-400">−</span> {item}
                      </div>
                    ))}
                  </div>

                  {/* Level requirement */}
                  {!canPrestige && (
                    <div className="rounded-2xl p-3 text-center"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-xs font-bold" style={{ color: theme.vars['--ct-muted'] }}>
                        Prestige için <span style={{ color: a1 }}>Seviye 10</span> gerekiyor · Şu an: <span style={{ color: a1 }}>Seviye {state.level}</span>
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleClose}
                      className="py-3 rounded-2xl text-sm font-bold"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: theme.vars['--ct-muted'] }}>
                      Vazgeç
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={!canPrestige}
                      onClick={handlePrestige}
                      className="py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all"
                      style={canPrestige
                        ? { background: `linear-gradient(135deg,${a1},${a2})`, color: '#fff', boxShadow: `0 6px 20px ${a1}40` }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }}>
                      <Star size={16} fill="currentColor" />
                      Prestige Yap!
                    </motion.button>
                  </div>
                </div>
              </>
            ) : (
              /* ── Success state ── */
              <div className="p-8 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                  className="relative w-24 h-24 mx-auto">
                  <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `1px solid ${a1}30`, animation: 'pulse 2s ease infinite' }} />
                  <div className="w-full h-full rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg,${a1}25,${a2}20)`, border: `2px solid ${a1}50` }}>
                    <Star size={48} style={{ color: a1 }} fill="currentColor" />
                  </div>
                </motion.div>

                <div>
                  <h2 className="text-2xl font-black"
                    style={{ background: `linear-gradient(90deg,${theme.vars['--ct-text']},${a1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Prestige {nextPrestigeLevel}!
                  </h2>
                  <p className="text-sm mt-1" style={{ color: theme.vars['--ct-muted'] }}>
                    Artık tüm kazançların <span style={{ color: a1 }}>×{nextMultiplier.toFixed(2)}</span> çarpanıyla artıyor!
                  </p>
                </div>

                <div className="rounded-2xl p-4 space-y-2"
                  style={{ background: `${a1}08`, border: `1px solid ${a1}20` }}>
                  <div className="text-3xl font-black tabular-nums"
                    style={{ background: `linear-gradient(90deg,${theme.vars['--ct-text']},${a1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    ×{nextMultiplier.toFixed(2)}
                  </div>
                  <div className="text-xs font-bold" style={{ color: theme.vars['--ct-muted'] }}>Kalıcı BTC Çarpanı</div>
                </div>

                <button onClick={handleClose}
                  className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg,${a1},${a2})`, color: '#fff' }}>
                  <RotateCcw size={18} />
                  Yeniden Başla!
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
