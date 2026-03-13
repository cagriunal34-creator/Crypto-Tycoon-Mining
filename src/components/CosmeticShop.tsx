/**
 * CosmeticShop — Avatar Frame, Efekt & Rozet Dükkanı
 *
 * - 4 kategori: Avatar Frame / Mining Efekti / Rozet / Arka Plan
 * - TP ve BTC ile satın alma
 * - Sahip olunan itemları kuşanma / çıkarma
 * - Nadirlik sistemi: common / rare / epic / legendary
 * - Ön izleme animasyonu
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Check, Lock, Sparkles, Star, Crown, Zap, Palette } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { CosmeticItem, CosmeticCategory } from '../types';

// ── Ürün kataloğu ─────────────────────────────────────────────────────────────
const CATALOG: CosmeticItem[] = [
  // Avatar Çerçeveler
  { id:'f_bronze',   name:'Bronz Çerçeve',    description:'Madenci yolculuğunun başlangıcı',   category:'frame',      rarity:'common',    emoji:'🟤', previewColor:'#b45309', price:500   },
  { id:'f_silver',   name:'Gümüş Çerçeve',    description:'Deneyimli bir madencinin işareti',  category:'frame',      rarity:'rare',      emoji:'⚪', previewColor:'#94a3b8', price:1500  },
  { id:'f_gold',     name:'Altın Çerçeve',     description:'Elit madencilerin tercihi',         category:'frame',      rarity:'epic',      emoji:'🟡', previewColor:'#f59e0b', price:4000  },
  { id:'f_diamond',  name:'Elmas Çerçeve',     description:'Efsanevi statü sembolü',            category:'frame',      rarity:'legendary', emoji:'💎', previewColor:'#67e8f9', price:12000, isLimited:true },
  { id:'f_fire',     name:'Ateş Çerçevesi',   description:'Madencinin tutkusu alevleniyor',    category:'frame',      rarity:'epic',      emoji:'🔥', previewColor:'#f97316', price:5000, isNew:true },
  { id:'f_cyber',    name:'Siber Çerçeve',     description:'Geleceğin teknolojisi',             category:'frame',      rarity:'legendary', emoji:'🔷', previewColor:'#06b6d4', price:15000 },

  // Mining Efektleri
  { id:'e_spark',    name:'Kıvılcım Efekti',  description:'Her tıkta kıvılcımlar çakar',      category:'effect',     rarity:'common',    emoji:'✨', previewColor:'#fbbf24', price:800   },
  { id:'e_lightning',name:'Şimşek Efekti',    description:'Elektrik hızında madencilik',       category:'effect',     rarity:'rare',      emoji:'⚡', previewColor:'#a78bfa', price:2000  },
  { id:'e_bitcoin',  name:'Bitcoin Yağmuru',  description:'BTC logolarının dansı',             category:'effect',     rarity:'epic',      emoji:'₿',  previewColor:'#f59e0b', price:6000  },
  { id:'e_galaxy',   name:'Galaksi Efekti',   description:'Evrenin gücüyle madencilik',        category:'effect',     rarity:'legendary', emoji:'🌌', previewColor:'#8b5cf6', price:18000, isLimited:true },
  { id:'e_matrix',   name:'Matrix Kodu',      description:'Yeşil kod yağmuru',                 category:'effect',     rarity:'epic',      emoji:'🟩', previewColor:'#22c55e', price:5500, isNew:true },

  // Rozetler
  { id:'b_miner',    name:'Usta Madenci',     description:'1000 saatlik madenciliğin ödülü',  category:'badge',      rarity:'common',    emoji:'⛏️', previewColor:'#78716c', price:300   },
  { id:'b_whale',    name:'Balina Rozeti',    description:'Büyük oyuncu',                      category:'badge',      rarity:'rare',      emoji:'🐋', previewColor:'#3b82f6', price:2500  },
  { id:'b_legend',   name:'Efsane Unvan',     description:'En yüksek mertebeye ulaştın',       category:'badge',      rarity:'legendary', emoji:'🏆', previewColor:'#f59e0b', price:10000 },
  { id:'b_vip',      name:'VIP Rozeti',       description:'Özel kulüp üyesi',                  category:'badge',      rarity:'epic',      emoji:'👑', previewColor:'#fbbf24', price:7500  },
  { id:'b_og',       name:'OG Madenci',       description:'İlk gün katılanların simgesi',      category:'badge',      rarity:'legendary', emoji:'🎖️', previewColor:'#10b981', price:0, isLimited:true },

  // Arka Planlar
  { id:'bg_dark',    name:'Obsidyan Karanlık',description:'Tam siyah derinlik',                category:'background', rarity:'common',    emoji:'⬛', previewColor:'#1c1917', price:400   },
  { id:'bg_cyber',   name:'Siber Şehir',      description:'Neon ışıklı dijital metropol',      category:'background', rarity:'rare',      emoji:'🌆', previewColor:'#0f172a', price:1800  },
  { id:'bg_space',   name:'Uzay İstasyonu',   description:'Yıldızların arasında madencilik',   category:'background', rarity:'epic',      emoji:'🚀', previewColor:'#0c0a1a', price:4500  },
  { id:'bg_matrix',  name:'Matrix Dünyası',   description:'Yeşil kod sonsuzluğu',              category:'background', rarity:'legendary', emoji:'💚', previewColor:'#052e16', price:9000  },
];

const RARITY_CONFIG: Record<string, { label: string; color: string; glow: string }> = {
  common:    { label: 'Normal',   color: '#78716c', glow: '#78716c30' },
  rare:      { label: 'Nadir',    color: '#3b82f6', glow: '#3b82f630' },
  epic:      { label: 'Epik',     color: '#a78bfa', glow: '#a78bfa30' },
  legendary: { label: 'Efsane',   color: '#f59e0b', glow: '#f59e0b30' },
};

const CATEGORY_CONFIG: Record<CosmeticCategory, { label: string; icon: string }> = {
  frame:      { label: 'Avatar Çerçeve', icon: '🖼️' },
  effect:     { label: 'Mining Efekti',  icon: '✨'  },
  badge:      { label: 'Rozetler',       icon: '🏅'  },
  background: { label: 'Arka Plan',      icon: '🎨'  },
};

function RarityBadge({ rarity }: { rarity: string }) {
  const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  return (
    <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
      style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

function ItemCard({ item, owned, equipped, onBuy, onEquip, onUnequip }: {
  item: CosmeticItem;
  owned: boolean;
  equipped: boolean;
  onBuy: () => void;
  onEquip: () => void;
  onUnequip: () => void;
}) {
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const rarity = RARITY_CONFIG[item.rarity];
  const [preview, setPreview] = useState(false);

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setPreview(true)}
      onHoverEnd={() => setPreview(false)}
      className="relative rounded-2xl overflow-hidden p-3"
      style={{
        background: equipped
          ? `${item.previewColor}12`
          : owned
            ? `${rarity.color}08`
            : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${equipped
          ? item.previewColor + '60'
          : owned
            ? rarity.color + '30'
            : 'rgba(255,255,255,0.06)'}`,
        boxShadow: equipped ? `0 0 20px ${item.previewColor}25` : 'none',
      }}
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 flex gap-1 z-10">
        {item.isNew && (
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-green-500 text-black">YENİ</span>
        )}
        {item.isLimited && (
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white">SINIRLI</span>
        )}
      </div>

      {/* Equipped badge */}
      {equipped && (
        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-full text-[7px] font-black"
          style={{ background: item.previewColor, color: '#000' }}>
          AKTIF
        </div>
      )}

      {/* Preview/Emoji */}
      <motion.div
        className="w-full h-20 rounded-xl flex items-center justify-center mb-3 relative overflow-hidden"
        style={{ background: `${item.previewColor}12`, border: `1px solid ${item.previewColor}20` }}
        animate={preview ? { boxShadow: `0 0 20px ${item.previewColor}40` } : {}}
      >
        <motion.span
          className="text-4xl"
          animate={preview ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {item.emoji}
        </motion.span>
        {/* Rarity shimmer */}
        {item.rarity === 'legendary' && (
          <motion.div
            className="absolute inset-0"
            style={{ background: `linear-gradient(45deg, transparent 30%, ${item.previewColor}20 50%, transparent 70%)` }}
            animate={{ x: [-100, 200] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          />
        )}
      </motion.div>

      {/* Info */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[10px] font-black text-white leading-tight">{item.name}</p>
          <RarityBadge rarity={item.rarity} />
        </div>
        <p className="text-[8px] leading-tight" style={{ color: 'var(--ct-muted)' }}>
          {item.description}
        </p>
      </div>

      {/* Action */}
      {!owned ? (
        <motion.button whileTap={{ scale: 0.94 }} onClick={onBuy}
          className="w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest"
          style={{
            background: `${rarity.color}18`,
            color: rarity.color,
            border: `1px solid ${rarity.color}30`,
          }}>
          {item.price === 0 ? 'Ücretsiz Al' : `${item.price.toLocaleString()} TP`}
        </motion.button>
      ) : equipped ? (
        <button onClick={onUnequip}
          className="w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest"
          style={{ background: `${item.previewColor}12`, color: item.previewColor, border: `1px solid ${item.previewColor}30` }}>
          ✓ Çıkar
        </button>
      ) : (
        <motion.button whileTap={{ scale: 0.94 }} onClick={onEquip}
          className="w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest"
          style={{ background: `${a1}18`, color: a1, border: `1px solid ${a1}30` }}>
          Kuşan
        </motion.button>
      )}
    </motion.div>
  );
}

type ShopTab = CosmeticCategory | 'equipped';

export default function CosmeticShop() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const { notify } = useNotify();
  const { play } = useSoundEffects();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const [tab, setTab] = useState<ShopTab>('frame');

  const cosmetics = state.cosmetics || { owned: [], equipped: {} };
  const ownedIds  = cosmetics.owned || [];
  const equipped  = cosmetics.equipped || {};

  const handleBuy = (item: CosmeticItem) => {
    if (ownedIds.includes(item.id)) return;
    if (item.price > 0 && state.tycoonPoints < item.price) {
      notify({ type: 'warning', title: 'Yetersiz TP', message: `${item.price.toLocaleString()} TP gerekiyor (Bakiye: ${state.tycoonPoints.toLocaleString()})` });
      return;
    }
    dispatch({ type: 'COSMETIC_BUY', id: item.id, cost: item.price });
    play('purchase');
    notify({ type: 'success', title: `${item.emoji} ${item.name} Alındı!`, message: 'Koleksiyonuna eklendi.' });
  };

  const handleEquip = (item: CosmeticItem) => {
    dispatch({ type: 'COSMETIC_EQUIP', id: item.id, category: item.category });
    play('click');
    notify({ type: 'info', title: `${item.emoji} ${item.name}`, message: 'Kuşanıldı!' });
  };

  const handleUnequip = (item: CosmeticItem) => {
    dispatch({ type: 'COSMETIC_UNEQUIP', category: item.category });
    play('click');
  };

  const displayItems = tab === 'equipped'
    ? CATALOG.filter(it => Object.values(equipped).includes(it.id))
    : CATALOG.filter(it => it.category === tab);

  const equippedCount = Object.values(equipped).filter(Boolean).length;

  return (
    <div className="space-y-4 pt-2 pb-24">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-[1.75rem] p-5"
        style={{ background: `linear-gradient(135deg, ${a1}14, ${a2}08)`, border: `1px solid ${a1}25` }}>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <ShoppingBag size={120} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${a1}18`, border: `1px solid ${a1}30` }}>
            <Palette size={22} style={{ color: a1 }} />
          </div>
          <div>
            <div className="text-base font-black text-white">Kozmetik Dükkan</div>
            <div className="text-[10px] font-bold" style={{ color: 'var(--ct-muted)' }}>
              Tarzını yansıt — {CATALOG.length} ürün
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm font-black" style={{ color: a1 }}>
              {state.tycoonPoints.toLocaleString()}
            </div>
            <div className="text-[8px] font-bold" style={{ color: 'var(--ct-muted)' }}>TP</div>
          </div>
        </div>

        {/* Owned stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Sahip',    value: ownedIds.length, color: a1     },
            { label: 'Kuşanılan', value: equippedCount,  color: '#f59e0b' },
            { label: 'Toplam',   value: CATALOG.length,  color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} className="text-center py-2 rounded-xl"
              style={{ background: `${s.color}0c`, border: `1px solid ${s.color}20` }}>
              <div className="text-sm font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {([
          { id: 'frame',      ...CATEGORY_CONFIG.frame      },
          { id: 'effect',     ...CATEGORY_CONFIG.effect      },
          { id: 'badge',      ...CATEGORY_CONFIG.badge       },
          { id: 'background', ...CATEGORY_CONFIG.background  },
          { id: 'equipped',   label: 'Kuşanılan', icon: '✅' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id as ShopTab)}
            className="shrink-0 px-3 py-2 rounded-2xl text-[10px] font-black flex items-center gap-1.5 transition-all"
            style={{
              background: tab === t.id ? `${a1}18` : 'rgba(255,255,255,0.04)',
              color:      tab === t.id ? a1 : 'var(--ct-muted)',
              border:     `1px solid ${tab === t.id ? a1 + '30' : 'rgba(255,255,255,0.06)'}`,
            }}>
            <span>{t.icon}</span> {t.label}
            {t.id === 'equipped' && equippedCount > 0 && (
              <span className="w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-black"
                style={{ background: a1, color: '#000' }}>{equippedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="grid grid-cols-2 gap-3">
          {displayItems.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-sm font-black text-white">Hiçbir şey kuşanılmadı</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--ct-muted)' }}>
                Dükkanı keşfet
              </p>
            </div>
          ) : displayItems.map((item, idx) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}>
              <ItemCard
                item={item}
                owned={ownedIds.includes(item.id)}
                equipped={equipped[item.category] === item.id}
                onBuy={() => handleBuy(item)}
                onEquip={() => handleEquip(item)}
                onUnequip={() => handleUnequip(item)}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
