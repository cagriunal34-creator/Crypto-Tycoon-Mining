/**
 * ShareCardModal — Paylaşılabilir Kazanç Kartı
 *
 * SVG tabanlı kart oluşturma + PNG indirme (sıfır bağımlılık)
 * Canvas foreignObject yaklaşımı ile tarayıcı içinde render
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Download, Share2, Copy, Check,
  Flame, Trophy, Cpu, Users, Bitcoin, Zap
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';

// ── Kart boyutları ────────────────────────────────────────────────────────────
const CARD_W = 420;
const CARD_H = 580;

// ── SVG kart bileşeni (hem ekranda gösterilir hem de PNG'ye dönüştürülür) ─────
interface CardData {
  username: string;
  level: number;
  prestigeLevel: number;
  btcBalance: number;
  tycoonPoints: number;
  streakCount: number;
  referralCount: number;
  rankTitle: string;
  hashRate: number;
  isVip: boolean;
  a1: string;
  a2: string;
  themeName: string;
  avatar: string;
}

function buildSVGString(d: CardData): string {
  const btcStr = d.btcBalance.toFixed(6);
  const tpStr  = d.tycoonPoints.toLocaleString('tr-TR');
  const usdEst = (d.btcBalance * 95000).toFixed(0);
  const hashStr = `${Math.floor(d.hashRate)} GH/s`;
  const date = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  // Inline SVG as a string — no external fonts, no foreign objects → maximum compat
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
  <defs>
    <!-- BG gradient -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#060810"/>
      <stop offset="100%" stop-color="#0d1017"/>
    </linearGradient>
    <!-- Accent gradient -->
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${d.a1}"/>
      <stop offset="100%" stop-color="${d.a2}"/>
    </linearGradient>
    <!-- Accent vertical -->
    <linearGradient id="accV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${d.a1}40"/>
      <stop offset="100%" stop-color="${d.a1}00"/>
    </linearGradient>
    <!-- Glow filter -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <!-- Clip for rounded card -->
    <clipPath id="cardClip">
      <rect width="${CARD_W}" height="${CARD_H}" rx="28"/>
    </clipPath>
  </defs>

  <g clip-path="url(#cardClip)">
    <!-- Background -->
    <rect width="${CARD_W}" height="${CARD_H}" fill="url(#bg)"/>

    <!-- Top glow blob -->
    <ellipse cx="${CARD_W/2}" cy="-20" rx="200" ry="120" fill="${d.a1}" opacity="0.08" filter="url(#glow)"/>

    <!-- Grid dots pattern -->
    ${Array.from({length: 12}, (_, row) => Array.from({length: 10}, (_, col) =>
      `<circle cx="${col * 46 + 20}" cy="${row * 48 + 20}" r="1" fill="white" opacity="0.04"/>`
    ).join('')).join('')}

    <!-- Top accent line -->
    <rect x="0" y="0" width="${CARD_W}" height="4" fill="url(#acc)"/>

    <!-- Brand watermark top-right -->
    <text x="${CARD_W - 20}" y="28" font-family="system-ui,sans-serif" font-size="10" font-weight="700" fill="${d.a1}" opacity="0.7" text-anchor="end" letter-spacing="3">CRYPTOTYCOON</text>

    <!-- Avatar circle -->
    <circle cx="${CARD_W/2}" cy="88" r="40" fill="${d.a1}" opacity="0.12"/>
    <circle cx="${CARD_W/2}" cy="88" r="40" fill="none" stroke="${d.a1}" stroke-width="2" opacity="0.4"/>
    <text x="${CARD_W/2}" y="97" font-family="system-ui,sans-serif" font-size="32" text-anchor="middle">${d.avatar}</text>

    <!-- VIP badge -->
    ${d.isVip ? `<rect x="${CARD_W/2 + 22}" y="58" width="34" height="16" rx="8" fill="#fbbf24" opacity="0.9"/>
    <text x="${CARD_W/2 + 39}" y="70" font-family="system-ui,sans-serif" font-size="9" font-weight="900" fill="black" text-anchor="middle">VIP</text>` : ''}

    <!-- Username -->
    <text x="${CARD_W/2}" y="150" font-family="system-ui,sans-serif" font-size="22" font-weight="900" fill="white" text-anchor="middle">${d.username || 'Madenci'}</text>

    <!-- Rank title -->
    <text x="${CARD_W/2}" y="172" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="${d.a1}" text-anchor="middle" letter-spacing="2" opacity="0.9">${(d.rankTitle || 'YENİ MADENCİ').toUpperCase()}</text>

    <!-- Level + Prestige pill -->
    <rect x="${CARD_W/2 - 80}" y="184" width="160" height="28" rx="14" fill="${d.a1}" opacity="0.12"/>
    <rect x="${CARD_W/2 - 80}" y="184" width="160" height="28" rx="14" fill="none" stroke="${d.a1}" stroke-width="1" opacity="0.3"/>
    <text x="${CARD_W/2}" y="202" font-family="system-ui,sans-serif" font-size="11" font-weight="800" fill="${d.a1}" text-anchor="middle">Seviye ${d.level}${d.prestigeLevel > 0 ? `  •  Prestige ${d.prestigeLevel}` : ''}</text>

    <!-- Divider -->
    <line x1="36" y1="228" x2="${CARD_W - 36}" y2="228" stroke="white" stroke-opacity="0.06" stroke-width="1"/>

    <!-- BTC Balance — hero stat -->
    <text x="${CARD_W/2}" y="266" font-family="system-ui,monospace" font-size="36" font-weight="900" fill="url(#acc)" text-anchor="middle">${btcStr}</text>
    <text x="${CARD_W/2}" y="284" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="white" text-anchor="middle" opacity="0.5">BTC BAKİYE</text>
    <text x="${CARD_W/2}" y="302" font-family="system-ui,sans-serif" font-size="13" font-weight="800" fill="${d.a1}" text-anchor="middle" opacity="0.8">≈ $${Number(usdEst).toLocaleString('tr-TR')}</text>

    <!-- Divider -->
    <line x1="36" y1="320" x2="${CARD_W - 36}" y2="320" stroke="white" stroke-opacity="0.06" stroke-width="1"/>

    <!-- 4 stat boxes -->
    <!-- Row layout: 2x2 grid, each 170x76, padding 20 -->
    <!-- Box 1: Hash Rate -->
    <rect x="20" y="332" width="178" height="72" rx="16" fill="${d.a1}" opacity="0.06"/>
    <rect x="20" y="332" width="178" height="72" rx="16" fill="none" stroke="${d.a1}" stroke-opacity="0.15" stroke-width="1"/>
    <text x="38" y="360" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="white" opacity="0.45" letter-spacing="1.5">HASH RATE</text>
    <text x="38" y="382" font-family="system-ui,monospace" font-size="18" font-weight="900" fill="${d.a1}">${hashStr}</text>

    <!-- Box 2: Streak -->
    <rect x="222" y="332" width="178" height="72" rx="16" fill="#f87171" opacity="0.06"/>
    <rect x="222" y="332" width="178" height="72" rx="16" fill="none" stroke="#f87171" stroke-opacity="0.15" stroke-width="1"/>
    <text x="240" y="360" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="white" opacity="0.45" letter-spacing="1.5">GÜNLÜK SERİ</text>
    <text x="240" y="382" font-family="system-ui,monospace" font-size="18" font-weight="900" fill="#f87171">🔥 ${d.streakCount} GÜN</text>

    <!-- Box 3: TP -->
    <rect x="20" y="416" width="178" height="72" rx="16" fill="#fbbf24" opacity="0.06"/>
    <rect x="20" y="416" width="178" height="72" rx="16" fill="none" stroke="#fbbf24" stroke-opacity="0.15" stroke-width="1"/>
    <text x="38" y="444" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="white" opacity="0.45" letter-spacing="1.5">TYCOON PUANI</text>
    <text x="38" y="466" font-family="system-ui,monospace" font-size="18" font-weight="900" fill="#fbbf24">${tpStr} TP</text>

    <!-- Box 4: Referral -->
    <rect x="222" y="416" width="178" height="72" rx="16" fill="#a78bfa" opacity="0.06"/>
    <rect x="222" y="416" width="178" height="72" rx="16" fill="none" stroke="#a78bfa" stroke-opacity="0.15" stroke-width="1"/>
    <text x="240" y="444" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="white" opacity="0.45" letter-spacing="1.5">DAVET EDİLEN</text>
    <text x="240" y="466" font-family="system-ui,monospace" font-size="18" font-weight="900" fill="#a78bfa">👥 ${d.referralCount} KİŞİ</text>

    <!-- Bottom bar -->
    <rect x="0" y="${CARD_H - 52}" width="${CARD_W}" height="52" fill="url(#accV)" opacity="0.5"/>
    <text x="20" y="${CARD_H - 24}" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="white" opacity="0.35">${date}</text>
    <text x="${CARD_W - 20}" y="${CARD_H - 24}" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="${d.a1}" text-anchor="end" opacity="0.7">cryptotycoon.app</text>

    <!-- Bottom accent line -->
    <rect x="0" y="${CARD_H - 4}" width="${CARD_W}" height="4" fill="url(#acc)" opacity="0.6"/>
  </g>
</svg>`;
}

// ── PNG indirme fonksiyonu ─────────────────────────────────────────────────────
async function svgToPng(svgStr: string, w: number, h: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = w * 2; // 2× for retina
      canvas.height = h * 2;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Modal bileşeni ────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CARD_THEMES = [
  { id: 'default', label: 'Tema Rengi' },
  { id: 'gold',    label: 'Altın' },
  { id: 'cyber',   label: 'Siber' },
  { id: 'fire',    label: 'Ateş' },
];

const THEME_COLORS: Record<string, [string, string]> = {
  default: ['', ''],        // will be filled from theme
  gold:    ['#f59e0b', '#d97706'],
  cyber:   ['#06b6d4', '#0891b2'],
  fire:    ['#f97316', '#dc2626'],
};

export default function ShareCardModal({ isOpen, onClose }: Props) {
  const { state } = useGame();
  const { theme } = useTheme();
  const { notify } = useNotify();

  const [cardTheme, setCardTheme] = useState<string>('default');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [svgStr, setSvgStr] = useState('');

  // Compute card data
  const hashRate = Math.floor(50 * Math.pow(1.18, state.level - 1) * (state.prestigeMultiplier ?? 1));
  const leaders  = state.leaderboard || [];
  const me       = leaders.find((l: any) => l.isCurrentUser);
  const avatar   = (me as any)?.avatar ?? '⛏️';

  const a1Raw = theme.vars['--ct-a1'];
  const a2Raw = theme.vars['--ct-a2'];

  const [a1, a2] = cardTheme === 'default'
    ? [a1Raw, a2Raw]
    : THEME_COLORS[cardTheme];

  const cardData: CardData = {
    username:      state.username  || 'Madenci',
    level:         state.level     || 1,
    prestigeLevel: state.prestigeLevel || 0,
    btcBalance:    state.btcBalance || 0,
    tycoonPoints:  state.tycoonPoints || 0,
    streakCount:   state.streak?.count ?? 0,
    referralCount: state.referralCount || 0,
    rankTitle:     state.rankTitle || 'Yeni Madenci',
    hashRate,
    isVip:         state.vip?.isActive ?? false,
    a1, a2,
    themeName:     cardTheme,
    avatar,
  };

  // Re-generate SVG whenever inputs change
  useEffect(() => {
    setSvgStr(buildSVGString(cardData));
  }, [cardTheme, a1Raw, a2Raw, state.btcBalance, state.level]);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const png  = await svgToPng(svgStr, CARD_W, CARD_H);
      const link = document.createElement('a');
      link.href  = png;
      link.download = `cryptotycoon-${state.username || 'card'}.png`;
      link.click();
      notify({ type: 'success', title: '📸 Kart İndirildi!', message: 'Sosyal medyada paylaşmaya hazır.' });
    } catch (e) {
      notify({ type: 'warning', title: 'Hata', message: 'PNG oluşturulamadı. SVG olarak deneyin.' });
    }
    setDownloading(false);
  }, [svgStr, downloading, state.username]);

  const handleShare = useCallback(async () => {
    try {
      const png  = await svgToPng(svgStr, CARD_W, CARD_H);
      const blob = await (await fetch(png)).blob();
      const file = new File([blob], 'cryptotycoon-card.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'CryptoTycoon Karnesi', text: `${state.btcBalance.toFixed(6)} BTC madencisiyim! Katıl 🚀` });
        return;
      }
    } catch {}
    // Fallback: copy referral link
    try { await navigator.clipboard.writeText(`https://cryptotycoon.app/?ref=${state.referralCode}`); }
    catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notify({ type: 'success', title: 'Link Kopyalandı!', message: 'Referans linkin panoya eklendi.' });
  }, [svgStr, state]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="w-full max-w-md"
            style={{
              background: 'rgba(6,8,14,0.99)',
              border: `1px solid ${a1}25`,
              borderRadius: '28px 28px 0 0',
              maxHeight: '92vh',
              overflow: 'auto',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
            </div>

            <div className="px-5 pb-8 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-white">Kazanç Kartı</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>Sosyal medyada paylaş</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Kart preview — inline SVG */}
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className="rounded-[20px] overflow-hidden shadow-2xl mx-auto"
                style={{ width: '100%', maxWidth: 360, aspectRatio: `${CARD_W}/${CARD_H}`, boxShadow: `0 24px 60px ${a1}20` }}
                dangerouslySetInnerHTML={{ __html: svgStr.replace(`width="${CARD_W}"`, 'width="100%"').replace(`height="${CARD_H}"`, 'height="100%"') }}
              />

              {/* Renk tema seçimi */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--ct-muted)' }}>Kart Rengi</p>
                <div className="flex gap-2">
                  {CARD_THEMES.map(ct => {
                    const [c1] = ct.id === 'default' ? [a1Raw] : THEME_COLORS[ct.id];
                    return (
                      <motion.button key={ct.id} whileTap={{ scale: 0.93 }} onClick={() => setCardTheme(ct.id)}
                        className="flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all"
                        style={{
                          background: cardTheme === ct.id ? `${c1}20` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${cardTheme === ct.id ? c1 + '50' : 'rgba(255,255,255,0.07)'}`,
                          color: cardTheme === ct.id ? c1 : 'var(--ct-muted)',
                        }}>
                        <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: c1 }} />
                        {ct.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Aksiyon butonları */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleDownload} disabled={downloading}
                  className="py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${a1}, ${a2})`,
                    color: '#000',
                    boxShadow: `0 8px 24px ${a1}35`,
                    opacity: downloading ? 0.7 : 1,
                  }}>
                  {downloading
                    ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    : <Download size={16} />}
                  {downloading ? 'Hazırlanıyor...' : 'PNG İndir'}
                </motion.button>

                <motion.button whileTap={{ scale: 0.96 }} onClick={handleShare}
                  className="py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm"
                  style={{ background: `${a1}12`, border: `1px solid ${a1}30`, color: a1 }}>
                  {copied ? <Check size={16} /> : <Share2 size={16} />}
                  {copied ? 'Kopyalandı!' : 'Paylaş'}
                </motion.button>
              </div>

              <p className="text-center text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>
                Kart, güncel verilerinle oluşturulur
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
