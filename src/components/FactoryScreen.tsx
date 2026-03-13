/**
 * FactoryScreen — Fabrika Zinciri Mekaniği
 *
 * Yeni kaynak sistemi:
 * - 4 hammadde: Silikon, Bakır, Litik, Nadir Toprak
 * - Üretim zincirleri: Hammadde → Bileşen → İşlenmiş Madde → Ürün
 * - Fabrika slotları (başlangıç 2, max 6)
 * - Üretim süresi + TP / BTC ödülü
 * - Slot kilit açma (TP ile)
 * - Otomatik üretim (VIP)
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Factory, Zap, Clock, CheckCircle2, Lock, Play, RefreshCw,
  ChevronRight, Package, Cpu, FlaskConical, Gem, Plus
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { FactoryData, FactorySlot, SlotState } from '../types';

// ── Kaynak tanımları ──────────────────────────────────────────────────────────
interface Resource {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

const RESOURCES: Resource[] = [
  { id:'silicon',  name:'Silikon',      emoji:'🪨', color:'#94a3b8', description:'Temel çip hammaddesi'       },
  { id:'copper',   name:'Bakır',         emoji:'🟠', color:'#b45309', description:'İletken kablo üretimi'     },
  { id:'lithium',  name:'Lityum',        emoji:'💙', color:'#3b82f6', description:'Batarya çekirdek maddesi'  },
  { id:'rare',     name:'Nadir Toprak',  emoji:'💎', color:'#a78bfa', description:'Üst seviye bileşenler'     },
];

// ── Reçete tanımları ─────────────────────────────────────────────────────────
interface Recipe {
  id: string;
  name: string;
  emoji: string;
  color: string;
  tier: 1 | 2 | 3;
  description: string;
  inputs: { resourceId: string; amount: number }[];
  outputTp: number;
  outputBtc: number;
  durationMs: number; // üretim süresi ms
  unlockCost: number; // TP
}

const RECIPES: Recipe[] = [
  // Tier 1 — Bileşenler
  {
    id:'r_chip',     name:'Temel Çip',      emoji:'🔲', color:'#94a3b8', tier:1,
    description: "Silikon'dan üretilen temel işlemci",
    inputs:[{ resourceId:'silicon', amount:3 }],
    outputTp:50, outputBtc:0, durationMs:30000, unlockCost:0,
  },
  {
    id:'r_wire',     name:'Bakır Kablo',     emoji:'🔌', color:'#b45309', tier:1,
    description:'Bakırdan yapılan iletken kablo',
    inputs:[{ resourceId:'copper', amount:3 }],
    outputTp:60, outputBtc:0, durationMs:25000, unlockCost:0,
  },
  {
    id:'r_cell',     name:'Pil Hücresi',     emoji:'🔋', color:'#3b82f6', tier:1,
    description:'Lityum bazlı enerji hücresi',
    inputs:[{ resourceId:'lithium', amount:2 }],
    outputTp:80, outputBtc:0, durationMs:40000, unlockCost:500,
  },
  // Tier 2 — İşlenmiş
  {
    id:'r_gpu',      name:'Grafik Kartı',    emoji:'🖥️', color:'#f59e0b', tier:2,
    description:'Çip + Kablo birleşimi',
    inputs:[{ resourceId:'silicon', amount:5 }, { resourceId:'copper', amount:4 }],
    outputTp:250, outputBtc:0.000001, durationMs:120000, unlockCost:2000,
  },
  {
    id:'r_asic',     name:'ASIC Modül',      emoji:'⚡', color:'#10b981', tier:2,
    description:'Özel madenci çipi',
    inputs:[{ resourceId:'silicon', amount:8 }, { resourceId:'rare', amount:2 }],
    outputTp:400, outputBtc:0.000003, durationMs:180000, unlockCost:3500,
  },
  {
    id:'r_battery',  name:'Mega Batarya',    emoji:'🔆', color:'#06b6d4', tier:2,
    description:'Yüksek kapasiteli enerji depolama',
    inputs:[{ resourceId:'lithium', amount:6 }, { resourceId:'copper', amount:3 }],
    outputTp:350, outputBtc:0.000002, durationMs:150000, unlockCost:2500,
  },
  // Tier 3 — Son Ürün
  {
    id:'r_miner',    name:'Mining Rig',      emoji:'🖥️', color:'#a78bfa', tier:3,
    description:'Tam donanımlı madencilik cihazı',
    inputs:[{ resourceId:'silicon', amount:10 }, { resourceId:'copper', amount:8 }, { resourceId:'rare', amount:5 }],
    outputTp:1500, outputBtc:0.00001, durationMs:600000, unlockCost:8000,
  },
  {
    id:'r_quantum',  name:'Kuantum İşlemci', emoji:'💫', color:'#f97316', tier:3,
    description:'Geleceğin işlemci teknolojisi',
    inputs:[{ resourceId:'rare', amount:8 }, { resourceId:'lithium', amount:6 }, { resourceId:'silicon', amount:8 }],
    outputTp:3000, outputBtc:0.00003, durationMs:1200000, unlockCost:15000,
  },
];

function formatDuration(ms: number): string {
  if (ms <= 0) return 'Tamamlandı!';
  const s = Math.floor(ms / 1000);
  if (s < 60)  return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}d ${s%60}s`;
  return `${Math.floor(s/3600)}sa ${Math.floor((s%3600)/60)}d`;
}

function SlotCard({ slot, onStart, onCollect, onUnlock, factory }: {
  slot: FactorySlot;
  onStart: (slotId: number, recipeId: string) => void;
  onCollect: (slotId: number) => void;
  onUnlock: (slotId: number) => void;
  factory: any;
}) {
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const [selectOpen, setSelectOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (slot.state !== 'producing') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [slot.state]);

  const recipe  = slot.recipeId ? RECIPES.find(r => r.id === slot.recipeId) : null;
  const progress = recipe && slot.state === 'producing'
    ? Math.min(100, ((now - slot.startedAt) / (slot.finishesAt - slot.startedAt)) * 100)
    : 0;
  const remaining = slot.state === 'producing' ? Math.max(0, slot.finishesAt - now) : 0;
  const availRecipes = RECIPES.filter(r => factory.unlockedRecipes.includes(r.id));

  if (slot.locked) {
    return (
      <motion.div layout className="p-4 rounded-2xl flex flex-col items-center gap-2 text-center"
        style={{ background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.08)' }}>
        <Lock size={20} style={{ color:'var(--ct-muted)' }} />
        <p className="text-[10px] font-black text-zinc-500 uppercase">Slot {slot.id + 1}</p>
        <p className="text-[9px]" style={{ color:'var(--ct-muted)' }}>Kilitli</p>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => onUnlock(slot.id)}
          className="px-3 py-1.5 rounded-xl text-[9px] font-black mt-1"
          style={{ background:`${a1}18`, color:a1, border:`1px solid ${a1}30` }}>
          {slot.unlockCost.toLocaleString()} TP ile Aç
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div layout className="p-4 rounded-2xl"
      style={{
        background: slot.state === 'ready'
          ? `${a1}08`
          : recipe
            ? `${recipe.color}06`
            : 'rgba(255,255,255,0.03)',
        border: `1px solid ${slot.state === 'ready' ? a1 + '30' : recipe ? recipe.color + '18' : 'rgba(255,255,255,0.07)'}`,
      }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black"
            style={{ background:`${a1}20`, color:a1 }}>
            {slot.id + 1}
          </div>
          <span className="text-[10px] font-black text-white">
            {slot.state === 'idle' ? 'Boş Slot'
              : slot.state === 'producing' ? recipe?.name
              : `✅ ${recipe?.name}`}
          </span>
        </div>
        {slot.state === 'idle' && (
          <button onClick={() => setSelectOpen(v => !v)}
            className="text-[9px] font-black px-2 py-1 rounded-lg"
            style={{ background:`${a1}15`, color:a1 }}>
            + Başlat
          </button>
        )}
        {slot.state === 'ready' && (
          <motion.button whileTap={{ scale:0.9 }} onClick={() => onCollect(slot.id)}
            className="text-[9px] font-black px-3 py-1.5 rounded-xl"
            style={{ background:a1, color:'#000' }}
            animate={{ boxShadow:[`0 0 0px ${a1}00`,`0 0 16px ${a1}60`,`0 0 0px ${a1}00`] }}
            transition={{ duration:1.5, repeat:Infinity }}>
            Topla!
          </motion.button>
        )}
      </div>

      {/* Progress bar */}
      {slot.state === 'producing' && (
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[9px]" style={{ color:'var(--ct-muted)' }}>{recipe?.emoji} Üretiliyor...</span>
            <span className="text-[9px] font-black" style={{ color: recipe?.color }}>
              {formatDuration(remaining)}
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden"
            style={{ background:'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: recipe?.color, width:`${progress}%` }}
              animate={{ width:`${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Recipe selector */}
      <AnimatePresence>
        {selectOpen && (
          <motion.div
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            className="overflow-hidden mt-3 space-y-1.5">
            {availRecipes.map(r => {
              const canMake = r.inputs.every(inp => (factory.resources[inp.resourceId] || 0) >= inp.amount);
              return (
                <button key={r.id} onClick={() => { if (canMake) { onStart(slot.id, r.id); setSelectOpen(false); } }}
                  disabled={!canMake}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-all disabled:opacity-40"
                  style={{ background:`${r.color}08`, border:`1px solid ${r.color}18` }}>
                  <span className="text-xl">{r.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black truncate" style={{ color: r.color }}>{r.name}</p>
                    <p className="text-[8px]" style={{ color:'var(--ct-muted)' }}>
                      {r.inputs.map(i => `${i.amount}×${RESOURCES.find(res=>res.id===i.resourceId)?.emoji}`).join(' ')} · {formatDuration(r.durationMs)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-black" style={{ color:'#a78bfa' }}>+{r.outputTp}TP</p>
                    {r.outputBtc > 0 && <p className="text-[8px]" style={{ color:'#f59e0b' }}>+{r.outputBtc.toFixed(6)}</p>}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type FTab = 'factory' | 'resources' | 'recipes';

export default function FactoryScreen() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const { notify } = useNotify();
  const { play } = useSoundEffects();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const factory = state.factoryData;
  const [tab, setTab] = useState<FTab>('factory');

  // Tick — üretim tamamlandı mı?
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const needsUpdate = factory.slots.some(s => s.state === 'producing' && now >= s.finishesAt);
      if (needsUpdate) {
        const newSlots = factory.slots.map(s => {
          if (s.state === 'producing' && now >= s.finishesAt) {
            return { ...s, state: 'ready' as any };
          }
          return s;
        });
        dispatch({ type: 'FACTORY_UPDATE_DATA', data: { slots: newSlots } });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [factory.slots, dispatch]);

  const handleStart = (slotId: number, recipeId: string) => {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return;

    // Kaynak kontrolü
    const canMake = recipe.inputs.every(inp => (factory.resources[inp.resourceId] || 0) >= inp.amount);
    if (!canMake) {
      notify({ type: 'warning', title: 'Yetersiz Hammadde', message: 'Yeterli kaynak yok.' });
      return;
    }

    const now = Date.now();
    const newResources = { ...factory.resources };
    recipe.inputs.forEach(inp => { newResources[inp.resourceId] = (newResources[inp.resourceId] || 0) - inp.amount; });

    const newSlots = factory.slots.map(s =>
      s.id === slotId
        ? { ...s, state: 'producing' as SlotState, recipeId, startedAt: now, finishesAt: now + recipe.durationMs }
        : s
    );
    dispatch({ type: 'FACTORY_UPDATE_DATA', data: { slots: newSlots, resources: newResources } });
    play('click');
    notify({ type: 'info', title: `${recipe.emoji} Üretim Başladı`, message: `${recipe.name} · ${formatDuration(recipe.durationMs)} içinde hazır` });
  };

  const handleCollect = (slotId: number) => {
    const slot = factory.slots.find(s => s.id === slotId);
    if (!slot?.recipeId) return;
    const recipe = RECIPES.find(r => r.id === slot.recipeId);
    if (!recipe) return;

    dispatch({ type: 'ADD_TP', amount: recipe.outputTp });
    if (recipe.outputBtc > 0) dispatch({ type: 'ADD_BTC', amount: recipe.outputBtc });

    const newSlots = factory.slots.map(s =>
      s.id === slotId
        ? { ...s, state: 'idle' as SlotState, recipeId: null, startedAt: 0, finishesAt: 0 }
        : s
    );
    dispatch({ type: 'FACTORY_UPDATE_DATA', data: { slots: newSlots } });
    play('reward');
    notify({
      type: 'success',
      title: `${recipe.emoji} ${recipe.name} Tamamlandı!`,
      message: `+${recipe.outputTp} TP${recipe.outputBtc > 0 ? ` · +${recipe.outputBtc.toFixed(6)} BTC` : ''} kazandın!`,
    });
  };

  const handleUnlock = (slotId: number) => {
    const slot = factory.slots.find(s => s.id === slotId);
    if (!slot) return;
    if (state.tycoonPoints < slot.unlockCost) {
      notify({ type: 'warning', title: 'Yetersiz TP', message: `${slot.unlockCost.toLocaleString()} TP gerekiyor` });
      return;
    }
    dispatch({ type: 'ADD_TP', amount: -slot.unlockCost });
    const newSlots = factory.slots.map(s => s.id === slotId ? { ...s, locked: false } : s);
    dispatch({ type: 'FACTORY_UPDATE_DATA', data: { slots: newSlots } });
    play('purchase');
    notify({ type: 'success', title: '🏭 Slot Açıldı!', message: `Fabrika Slot ${slotId + 1} aktif!` });
  };

  const handleUnlockRecipe = (recipe: Recipe) => {
    if (factory.unlockedRecipes.includes(recipe.id)) return;
    if (state.tycoonPoints < recipe.unlockCost) {
      notify({ type: 'warning', title: 'Yetersiz TP', message: `${recipe.unlockCost.toLocaleString()} TP gerekiyor` });
      return;
    }
    dispatch({ type: 'ADD_TP', amount: -recipe.unlockCost });
    dispatch({ type: 'FACTORY_UPDATE_DATA', data: { unlockedRecipes: [...factory.unlockedRecipes, recipe.id] } });
    play('purchase');
    notify({ type: 'success', title: `${recipe.emoji} Reçete Açıldı!`, message: `${recipe.name} artık üretilebilir!` });
  };

  // Hammadde yenileme (her 5dk simüle et)
  const handleRefreshResources = () => {
    const newRes = {
      silicon: (factory.resources.silicon || 0) + 5,
      copper:  (factory.resources.copper  || 0) + 4,
      lithium: (factory.resources.lithium || 0) + 3,
      rare:    (factory.resources.rare    || 0) + 1,
    };
    dispatch({ type: 'FACTORY_UPDATE_DATA', data: { resources: newRes } });
    play('btcEarned');
    notify({ type: 'success', title: '⛏️ Hammadde Toplandı!', message: 'Kaynaklar yenilendi.' });
  };

  const activeCount = factory.slots.filter(s => s.state === 'producing').length;
  const readyCount  = factory.slots.filter(s => s.state === 'ready').length;

  return (
    <div className="space-y-4 pt-2 pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[1.75rem] p-5"
        style={{ background:`linear-gradient(135deg, ${a1}14, ${a2}08)`, border:`1px solid ${a1}25` }}>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <Factory size={120} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background:`${a1}18`, border:`1px solid ${a1}30` }}>
            <Factory size={22} style={{ color:a1 }} />
          </div>
          <div>
            <div className="text-base font-black text-white">Fabrika Zinciri</div>
            <div className="text-[10px] font-bold" style={{ color:'var(--ct-muted)' }}>
              Üret, topla, geliştir
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label:'Aktif',    value:activeCount,                          color:a1        },
            { label:'Hazır',    value:readyCount,                           color:'#10b981' },
            { label:'Slot',     value:factory.slots.filter(s=>!s.locked).length, color:'#f59e0b' },
            { label:'Reçete',   value:factory.unlockedRecipes.length,      color:'#a78bfa' },
          ].map(s => (
            <div key={s.label} className="text-center py-2 rounded-xl"
              style={{ background:`${s.color}0c`, border:`1px solid ${s.color}20` }}>
              <div className="text-sm font-black" style={{ color:s.color }}>{s.value}</div>
              <div className="text-[7px] font-bold uppercase tracking-widest" style={{ color:'var(--ct-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 gap-1 rounded-2xl"
        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
        {([
          { id:'factory',   label:'🏭 Fabrika'    },
          { id:'resources', label:'⛏️ Hammadde'   },
          { id:'recipes',   label:'📋 Reçeteler'  },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            style={{
              background: tab === t.id ? `${a1}18` : 'transparent',
              color:      tab === t.id ? a1 : 'var(--ct-muted)',
              border:     tab === t.id ? `1px solid ${a1}30` : '1px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ══ FABRİKA SLOTLARI ══ */}
        {tab === 'factory' && (
          <motion.div key="factory"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="space-y-3">
            {factory.slots.map((slot, i) => (
              <motion.div key={slot.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}>
                <SlotCard slot={slot} factory={factory}
                  onStart={handleStart} onCollect={handleCollect} onUnlock={handleUnlock} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ══ HAMMADDE ══ */}
        {tab === 'resources' && (
          <motion.div key="resources"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {RESOURCES.map((res, i) => (
                <motion.div key={res.id}
                  initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.07 }}
                  className="p-4 rounded-2xl"
                  style={{ background:`${res.color}08`, border:`1px solid ${res.color}20` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{res.emoji}</span>
                    <div>
                      <p className="text-[10px] font-black" style={{ color:res.color }}>{res.name}</p>
                      <p className="text-[8px]" style={{ color:'var(--ct-muted)' }}>{res.description}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-black" style={{ color:res.color }}>
                    {factory.resources[res.id] || 0}
                    <span className="text-[10px] font-bold ml-1" style={{ color:'var(--ct-muted)' }}>adet</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.button whileTap={{ scale:0.97 }} onClick={handleRefreshResources}
              className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
              style={{ background:`${a1}18`, color:a1, border:`1px solid ${a1}30` }}>
              <RefreshCw size={16} /> Hammadde Topla
            </motion.button>
          </motion.div>
        )}

        {/* ══ REÇETELER ══ */}
        {tab === 'recipes' && (
          <motion.div key="recipes"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="space-y-3">
            {([1,2,3] as const).map(tier => (
              <div key={tier}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2"
                  style={{ color:'var(--ct-muted)' }}>
                  {tier === 1 ? '⚙️ Tier 1 — Bileşenler' : tier === 2 ? '🔧 Tier 2 — İşlenmiş' : '🏭 Tier 3 — Son Ürün'}
                </p>
                {RECIPES.filter(r => r.tier === tier).map((r, i) => {
                  const unlocked = factory.unlockedRecipes.includes(r.id);
                  return (
                    <motion.div key={r.id}
                      initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl mb-2"
                      style={{
                        background: unlocked ? `${r.color}08` : 'rgba(255,255,255,0.02)',
                        border:`1px solid ${unlocked ? r.color+'20' : 'rgba(255,255,255,0.06)'}`,
                        opacity: unlocked ? 1 : 0.7,
                      }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background:`${r.color}15` }}>{r.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black" style={{ color: unlocked ? r.color : 'var(--ct-muted)' }}>{r.name}</p>
                        <p className="text-[8px]" style={{ color:'var(--ct-muted)' }}>
                          {r.inputs.map(inp => `${inp.amount}×${RESOURCES.find(res=>res.id===inp.resourceId)?.name}`).join(', ')}
                        </p>
                        <p className="text-[8px] font-bold" style={{ color:'#a78bfa' }}>
                          +{r.outputTp}TP{r.outputBtc>0?` · +${r.outputBtc.toFixed(6)} BTC`:''}  · {formatDuration(r.durationMs)}
                        </p>
                      </div>
                      {!unlocked && r.unlockCost > 0 ? (
                        <motion.button whileTap={{ scale:0.9 }} onClick={() => handleUnlockRecipe(r)}
                          className="px-2.5 py-1.5 rounded-xl text-[9px] font-black shrink-0"
                          style={{ background:`${a1}18`, color:a1, border:`1px solid ${a1}30` }}>
                          {r.unlockCost.toLocaleString()} TP
                        </motion.button>
                      ) : (
                        <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background:`${r.color}20` }}>
                          <CheckCircle2 size={12} style={{ color:r.color }} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
