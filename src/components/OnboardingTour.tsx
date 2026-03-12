/**
 * OnboardingTour — Yeni Kullanıcı Rehberi
 *
 * 6 adımlı spotlight turu. Her adım:
 *  - Hedef elementi highlight eder (data-tour attribute)
 *  - Konumuna göre tooltip gösterir
 *  - "İleri / Atla / Bitir" kontrolü
 *
 * Gösterim koşulu: localStorage'da 'onboarding_done' yoksa
 * yeni kayıt veya level=1 & btcBalance=0 kullanıcılarda açılır.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Zap, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LS_KEY = 'onboarding_done_v1';

export interface TourStep {
  target: string;        // data-tour="xxx" attribute
  title: string;
  body: string;
  emoji: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const STEPS: TourStep[] = [
  {
    target: 'mining-panel',
    title: 'Madencilik Paneli',
    body: 'Burası komuta merkezin. Hash gücün her saniye BTC üretiyor — ne kadar güçlü rig, o kadar çok kazanç!',
    emoji: '⛏️',
    position: 'center',
  },
  {
    target: 'energy-bar',
    title: 'Enerji Göstergesi',
    body: 'Madencilik enerji tüketir. Enerji biterse üretim durur. Reklam izleyerek veya bekleyerek yenileyebilirsin.',
    emoji: '⚡',
    position: 'bottom',
  },
  {
    target: 'btc-balance',
    title: 'BTC Bakiyen',
    body: 'Ürettiğin tüm Bitcoin burada birikir. Cüzdana çekebilir ya da yeni ekipman satın alabilirsin.',
    emoji: '₿',
    position: 'bottom',
  },
  {
    target: 'nav-shop',
    title: 'Mining Marketi',
    body: 'Daha güçlü rig\'ler, enerji paketleri ve özel kontratlar burada. Hash gücünü artırmak için alışveriş yap!',
    emoji: '🛒',
    position: 'top',
  },
  {
    target: 'nav-contracts',
    title: 'Kontratlar',
    body: 'Saatlik veya günlük anlaşmalar yaparak garantili BTC kazan. Risk yok, sabit gelir!',
    emoji: '📋',
    position: 'top',
  },
  {
    target: 'nav-guild',
    title: 'Lonca',
    body: 'Diğer madencilerle takım kur, lonca savaşlarına katıl ve birlikte daha büyük ödüller kazan!',
    emoji: '⚔️',
    position: 'top',
  },
];

interface Rect { top: number; left: number; width: number; height: number; }

function getElementRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const PAD = 10; // Spotlight padding

export default function OnboardingTour({ forceShow = false }: { forceShow?: boolean }) {
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; transform: string }>({ top: 0, left: 0, transform: '' });
  const rafRef = useRef<number>();

  // Göster/gizle kararı
  useEffect(() => {
    const done = localStorage.getItem(LS_KEY);
    if (forceShow || !done) {
      // Sayfa yüklendikten 1.5sn sonra başlat
      const t = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(t);
    }
  }, [forceShow]);

  // Hedef elementi bul ve rect güncelle
  const updateRect = useCallback(() => {
    if (!active) return;
    const currentStep = STEPS[step];
    if (!currentStep) return;
    if (currentStep.position === 'center') {
      setRect(null);
      return;
    }
    const r = getElementRect(currentStep.target);
    setRect(r);
    if (r) {
      computeTooltipPos(r, currentStep.position ?? 'bottom');
    }
  }, [active, step]);

  useEffect(() => {
    updateRect();
    // Scroll veya resize'a karşı sürekli kontrol
    const loop = () => { updateRect(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [updateRect]);

  const computeTooltipPos = (r: Rect, pos: string) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipW = Math.min(300, vw - 32);
    const tooltipH = 160;

    let top = 0, left = 0, transform = '';

    if (pos === 'bottom') {
      top = r.top + r.height + PAD + 14;
      left = r.left + r.width / 2;
      transform = 'translateX(-50%)';
    } else if (pos === 'top') {
      top = r.top - tooltipH - PAD - 14;
      left = r.left + r.width / 2;
      transform = 'translateX(-50%)';
    } else if (pos === 'left') {
      top = r.top + r.height / 2;
      left = r.left - tooltipW / 2 - PAD;
      transform = 'translateY(-50%)';
    } else if (pos === 'right') {
      top = r.top + r.height / 2;
      left = r.left + r.width + PAD;
      transform = 'translateY(-50%)';
    }

    // Ekran sınırlarını aş
    if (left + tooltipW > vw - 16) left = vw - tooltipW - 16;
    if (left < 16) left = 16;
    if (top < 16) top = r.top + r.height + PAD + 14;
    if (top + tooltipH > vh - 16) top = r.top - tooltipH - PAD - 14;

    setTooltipPos({ top, left, transform });
  };

  const finish = () => {
    setActive(false);
    try { localStorage.setItem(LS_KEY, '1'); } catch {}
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const prev = () => { if (step > 0) setStep(s => s - 1); };

  if (!active) return null;

  const currentStep = STEPS[step];
  const isCenter = currentStep.position === 'center' || !rect;
  const isLast = step === STEPS.length - 1;

  // Spotlight boyutu
  const spotTop = rect ? rect.top - PAD : 0;
  const spotLeft = rect ? rect.left - PAD : 0;
  const spotW = rect ? rect.width + PAD * 2 : 0;
  const spotH = rect ? rect.height + PAD * 2 : 0;

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* ── Overlay + Spotlight cutout ── */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9990,
              pointerEvents: 'none',
            }}
          >
            {isCenter ? (
              // Tam overlay (center adımları)
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }} />
            ) : (
              // SVG spotlight maskesi
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <mask id="spotlight-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={spotLeft} y={spotTop}
                      width={spotW} height={spotH}
                      rx={14} fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%" height="100%"
                  fill="rgba(0,0,0,0.80)"
                  mask="url(#spotlight-mask)"
                />
                {/* Spotlight border glow */}
                <rect
                  x={spotLeft - 1} y={spotTop - 1}
                  width={spotW + 2} height={spotH + 2}
                  rx={15} fill="none"
                  stroke={a1} strokeWidth={2}
                  strokeOpacity={0.7}
                  style={{ filter: `drop-shadow(0 0 8px ${a1})` }}
                />
              </svg>
            )}
          </motion.div>

          {/* ── Tıklama engeli (spotlight dışı) ── */}
          {!isCenter && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9991, pointerEvents: 'all', cursor: 'default' }}
              onClick={next}
            />
          )}

          {/* ── Spotlight üzerindeki element'e tıklama geçsin ── */}
          {!isCenter && rect && (
            <div
              style={{
                position: 'fixed',
                top: spotTop, left: spotLeft,
                width: spotW, height: spotH,
                zIndex: 9992, pointerEvents: 'none',
              }}
            />
          )}

          {/* ── Tooltip ── */}
          <motion.div
            key={`tooltip-${step}`}
            initial={{ opacity: 0, scale: 0.88, y: isCenter ? 20 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{
              position: 'fixed',
              zIndex: 9999,
              pointerEvents: 'all',
              ...(isCenter
                ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: Math.min(320, window.innerWidth - 32) }
                : { top: tooltipPos.top, left: tooltipPos.left, transform: tooltipPos.transform, width: Math.min(300, window.innerWidth - 32) }
              ),
            }}
          >
            <div style={{
              background: 'rgba(8, 10, 16, 0.97)',
              border: `1px solid ${a1}40`,
              borderRadius: 22,
              overflow: 'hidden',
              boxShadow: `0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px ${a1}15, 0 0 40px ${a1}15`,
            }}>
              {/* Top accent line */}
              <div style={{ height: 2, background: `linear-gradient(90deg, ${a2}, ${a1}, ${a2})` }} />

              <div style={{ padding: '18px 20px 16px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: `${a1}18`, border: `1px solid ${a1}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    {currentStep.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                      {currentStep.title}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: a1, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>
                      Adım {step + 1} / {STEPS.length}
                    </div>
                  </div>
                  <button onClick={finish} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: 2, lineHeight: 1 }}>
                    <X size={14} />
                  </button>
                </div>

                {/* Body */}
                <p style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.6, margin: '0 0 16px' }}>
                  {currentStep.body}
                </p>

                {/* Progress dots */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 14 }}>
                  {STEPS.map((_, i) => (
                    <div key={i} style={{
                      width: i === step ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === step ? a1 : i < step ? `${a1}50` : 'rgba(255,255,255,0.1)',
                      transition: 'all 0.3s ease',
                      boxShadow: i === step ? `0 0 8px ${a1}80` : 'none',
                    }} />
                  ))}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {step > 0 && (
                    <button
                      onClick={prev}
                      style={{
                        flex: '0 0 auto', padding: '9px 14px',
                        borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.04)', color: '#71717a',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        letterSpacing: '0.05em',
                      }}
                    >
                      ← Geri
                    </button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={isLast ? finish : next}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: 12, border: 'none',
                      background: `linear-gradient(135deg, ${a1}, ${a2})`,
                      color: '#000', fontSize: 12, fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 6,
                      letterSpacing: '0.04em',
                      boxShadow: `0 6px 20px ${a1}40`,
                    }}
                  >
                    {isLast ? (
                      <><Zap size={13} fill="currentColor" /> Madenciliğe Başla!</>
                    ) : (
                      <>İleri <ChevronRight size={13} /></>
                    )}
                  </motion.button>
                </div>

                {/* Skip */}
                {!isLast && (
                  <button
                    onClick={finish}
                    style={{
                      display: 'block', width: '100%', marginTop: 10, background: 'none',
                      border: 'none', color: '#3f3f46', fontSize: 10, fontWeight: 600,
                      cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}
                  >
                    Turu Atla
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** localStorage'daki turu sıfırla (Settings'ten tekrar göster) */
export function resetOnboarding() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}
