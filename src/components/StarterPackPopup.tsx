/**
 * StarterPackPopup — Yeni Oyuncu Başlangıç Paketi
 *
 * Koşullar:
 *  - level === 1 AND btcBalance < 0.0001 AND streak.count < 3
 *  - localStorage'da 'starter_pack_shown_v1' yoksa
 *  - Yükleme bittikten 2sn sonra göster
 *
 * İçerik:
 *  - 3 paket seçeneği (Ücretsiz / Ekonomi / Pro)
 *  - Ücretsiz paket: sadece TP + enerji, hemen alınabilir
 *  - Ekonomi / Pro: satın alma placeholder (future IAP)
 *  - Framer Motion ile tam ekran modal
 */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Trophy, Rocket, Crown, CheckCircle2, Star, Timer, Flame } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';
import { useSoundEffects } from '../hooks/useSoundEffects';

const LS_KEY = 'starter_pack_shown_v1';

interface Pack {
  id: string;
  name: string;
  badge: string;
  price: string;
  priceNote: string;
  color: string;
  glow: string;
  items: { icon: string; label: string; value: string }[];
  cta: string;
  free: boolean;
  popular?: boolean;
}

const PACKS: Pack[] = [
  {
    id: 'free',
    name: 'Başlangıç Hediyesi',
    badge: '🎁',
    price: 'ÜCRETSİZ',
    priceNote: 'Hemen al',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.2)',
    free: true,
    cta: 'Hediyeni Al!',
    items: [
      { icon: '⚡', label: 'Enerji Hücresi',  value: '+10 Enerji'   },
      { icon: '🏆', label: 'Tycoon Puanı',    value: '+500 TP'      },
      { icon: '🔥', label: 'Hız Bonusu',      value: '1 Saatlik %25' },
    ],
  },
  {
    id: 'starter',
    name: 'Starter Pack',
    badge: '⚡',
    price: '₺29',
    priceNote: 'Tek seferlik',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.2)',
    free: false,
    popular: true,
    cta: 'Satın Al',
    items: [
      { icon: '₿',  label: 'BTC Bonusu',      value: '+0.0005 BTC'  },
      { icon: '🏆', label: 'Tycoon Puanı',    value: '+5000 TP'     },
      { icon: '⚡', label: 'Enerji Hücresi',  value: '+50 Enerji'   },
      { icon: '🚀', label: 'Hız Çarpanı',     value: '7 Gün %50'    },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Paketi',
    badge: '👑',
    price: '₺79',
    priceNote: 'En iyi değer',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.25)',
    free: false,
    cta: 'Pro Al',
    items: [
      { icon: '₿',  label: 'BTC Bonusu',      value: '+0.002 BTC'   },
      { icon: '🏆', label: 'Tycoon Puanı',    value: '+20000 TP'    },
      { icon: '⚡', label: 'Enerji',           value: '+200 Enerji'  },
      { icon: '👑', label: 'VIP (7 Gün)',      value: 'Tüm Ayrıcalıklar' },
      { icon: '🎨', label: 'Özel Tema',        value: 'Arctic Dawn'  },
    ],
  },
];

export default function StarterPackPopup() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const { notify } = useNotify();
  const { play } = useSoundEffects();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>('starter');
  const [claimed, setClaimed] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 dakika aciliyet sayacı

  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setCountdown(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  const countMin = Math.floor(countdown / 60);
  const countSec = countdown % 60;

  useEffect(() => {
    if (state.isLoading || !state.user) return;
    try { if (localStorage.getItem(LS_KEY)) return; } catch {}

    // Yeni oyuncu tespiti
    const isNew = (state.level <= 2) && (state.btcBalance < 0.0001) && ((state.streak?.count ?? 0) < 3);
    if (!isNew) {
      try { localStorage.setItem(LS_KEY, '1'); } catch {}
      return;
    }

    const timer = setTimeout(() => setIsOpen(true), 2500);
    return () => clearTimeout(timer);
  }, [state.isLoading, state.user?.uid]);

  const handleClose = () => {
    try { localStorage.setItem(LS_KEY, '1'); } catch {}
    setIsOpen(false);
  };

  const handleClaimFree = () => {
    if (claimed) return;
    dispatch({ type: 'ADD_TP', amount: 500 });
    // Enerji ekle
    dispatch({ type: 'ADD_ENERGY', amount: 10 } as any);
    play('reward');
    setClaimed(true);
    notify({ type: 'success', title: '🎁 Başlangıç Hediyesi!', message: '+500 TP ve +10 Enerji hesabına eklendi!' });
    setTimeout(handleClose, 1600);
  };

  const handleBuy = (pack: Pack) => {
    // Gerçek IAP entegrasyonu gelecekte — şimdilik bilgilendirme
    notify({ type: 'info', title: '🛒 Yakında!', message: `${pack.name} satın alma yakında aktif olacak.` });
    play('click');
  };

  const selectedPack = PACKS.find(p => p.id === selected) || PACKS[1];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)' }}
          onClick={e => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ y: '100%', scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            className="w-full max-w-md relative overflow-hidden"
            style={{
              background: 'rgba(5,7,13,0.99)',
              border: `1px solid ${a1}28`,
              borderRadius: '28px 28px 0 0',
            }}
          >
            {/* Top gradient accent */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${a2}, ${a1}, ${a2})` }} />

            {/* Close */}
            <button onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }}>
              <X size={16} />
            </button>

            <div className="px-5 pt-5 pb-8 space-y-5">

              {/* Header */}
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="text-5xl mb-3">🚀</motion.div>
                <h2 className="text-xl font-black text-white">Hoş Geldin, Madenci!</h2>
                <p className="text-[11px] font-bold mt-1" style={{ color: 'var(--ct-muted)' }}>
                  Başlangıçta seni hızlandıracak paketler
                </p>
              </div>

              {/* Urgency sayacı */}
              <motion.div
                animate={{ opacity: countdown < 60 ? [1, 0.5, 1] : 1 }}
                transition={{ duration: 0.8, repeat: countdown < 60 ? Infinity : 0 }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-2xl"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Flame size={13} className="text-red-400" />
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                  Bu teklif {countMin}:{String(countSec).padStart(2, '0')} sonra sona eriyor
                </span>
                <Timer size={13} className="text-red-400" />
              </motion.div>

              {/* Pack selector tabs */}
              <div className="flex gap-2">
                {PACKS.map(p => (
                  <motion.button key={p.id} whileTap={{ scale: 0.94 }}
                    onClick={() => { setSelected(p.id); play('click'); }}
                    className="flex-1 py-3 rounded-2xl relative text-center"
                    style={{
                      background: selected === p.id ? `${p.color}15` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selected === p.id ? p.color + '40' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.2s',
                    }}>
                    {p.popular && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: p.color, color: '#000' }}>POPÜLER</div>
                    )}
                    <div className="text-lg mb-0.5">{p.badge}</div>
                    <div className="text-[9px] font-black" style={{ color: selected === p.id ? p.color : 'var(--ct-muted)' }}>
                      {p.price}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Selected pack detail */}
              <AnimatePresence mode="wait">
                <motion.div key={selected}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="p-4 rounded-2xl"
                  style={{ background: `${selectedPack.color}08`, border: `1px solid ${selectedPack.color}20`, boxShadow: `0 0 32px ${selectedPack.glow}` }}>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">{selectedPack.badge}</div>
                    <div>
                      <p className="font-black text-white text-sm">{selectedPack.name}</p>
                      <p className="text-[9px] font-bold" style={{ color: selectedPack.color }}>{selectedPack.priceNote}</p>
                    </div>
                    <div className="ml-auto text-xl font-black" style={{ color: selectedPack.color }}>{selectedPack.price}</div>
                  </div>

                  <div className="space-y-2">
                    {selectedPack.items.map((item, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-3 py-2 px-3 rounded-xl"
                        style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <span className="text-base w-6 text-center">{item.icon}</span>
                        <span className="flex-1 text-[11px] font-bold text-white">{item.label}</span>
                        <span className="text-[11px] font-black" style={{ color: selectedPack.color }}>{item.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* CTA */}
              {selectedPack.free ? (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleClaimFree} disabled={claimed}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                  style={{
                    background: claimed ? 'rgba(52,211,153,0.15)' : `linear-gradient(135deg, ${selectedPack.color}, #059669)`,
                    color: claimed ? '#34d399' : '#000',
                    border: claimed ? '1px solid rgba(52,211,153,0.3)' : 'none',
                    boxShadow: claimed ? 'none' : `0 8px 24px ${selectedPack.glow}`,
                  }}>
                  {claimed ? <><CheckCircle2 size={16} /> Alındı!</> : <><Star size={16} /> {selectedPack.cta}</>}
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleBuy(selectedPack)}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${selectedPack.color}cc, ${selectedPack.color}88)`,
                    color: '#000',
                    boxShadow: `0 8px 24px ${selectedPack.glow}`,
                  }}>
                  <Rocket size={16} /> {selectedPack.cta} — {selectedPack.price}
                </motion.button>
              )}

              <button onClick={handleClose}
                className="w-full text-center text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--ct-muted)' }}>
                Şimdi değil
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
