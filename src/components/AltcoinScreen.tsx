/**
 * AltcoinScreen — Altcoin Sezon Eventleri
 *
 * - BTC dışı coin mining event sistemi
 * - Aktif sezon: ETH / SOL / BNB / DOGE eventleri
 * - Sezon süresi + ödül havuzu
 * - Event boost: belirli saatlerde 2× mining
 * - Coin bakiye + dönüştürme (BTC'ye)
 * - Gelecek eventler takvimi
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, TrendingDown, Clock, Zap, Gift, ArrowRight,
  RefreshCw, Calendar, Star, Flame, ChevronRight
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';
import { useSoundEffects } from '../hooks/useSoundEffects';

// ── Coin tanımları ────────────────────────────────────────────────────────────
interface AltCoin {
  id: string;
  symbol: string;
  name: string;
  emoji: string;
  color: string;
  btcRate: number;      // 1 coin = X BTC
  mineRatePerClick: number;
  mineRatePerSec: number;
  description: string;
}

const COINS: AltCoin[] = [
  { id:'eth',  symbol:'ETH',  name:'Ethereum',    emoji:'⟠',  color:'#627eea', btcRate:0.045,   mineRatePerClick:0.00002, mineRatePerSec:0.000005, description:'Akıllı kontrat platformu' },
  { id:'sol',  symbol:'SOL',  name:'Solana',       emoji:'◎',  color:'#9945ff', btcRate:0.0018,  mineRatePerClick:0.0005,  mineRatePerSec:0.00012,  description:'Yüksek hızlı blockchain'   },
  { id:'bnb',  symbol:'BNB',  name:'BNB',          emoji:'⬡',  color:'#f3ba2f', btcRate:0.008,   mineRatePerClick:0.0001,  mineRatePerSec:0.000025, description:'Binance ekosistemi'        },
  { id:'doge', symbol:'DOGE', name:'Dogecoin',     emoji:'Ð',  color:'#c2a633', btcRate:0.000003,mineRatePerClick:0.5,     mineRatePerSec:0.12,     description:'Halkın kripto parası'      },
  { id:'ada',  symbol:'ADA',  name:'Cardano',      emoji:'₳',  color:'#0033ad', btcRate:0.00001, mineRatePerClick:0.1,     mineRatePerSec:0.025,    description:'Akademik blockchain'       },
  { id:'avax', symbol:'AVAX', name:'Avalanche',    emoji:'▲',  color:'#e84142', btcRate:0.0005,  mineRatePerClick:0.002,   mineRatePerSec:0.0005,   description:'Ultra hızlı konsensüs'     },
];

// ── Event tanımları ───────────────────────────────────────────────────────────
interface CoinEvent {
  id: string;
  coinId: string;
  name: string;
  description: string;
  multiplier: number;
  endsAt: number;
  rewardPool: number; // toplam TP ödül havuzu
  participants: number;
  isBoosted: boolean; // aktif boost saati mi
  type: 'mining' | 'trading' | 'staking';
}

function makeEvent(coinId: string, hoursFromNow: number, durationHours: number, mult: number, type: CoinEvent['type']): CoinEvent {
  const now = Date.now();
  const coin = COINS.find(c => c.id === coinId)!;
  const names: Record<string, string[]> = {
    mining:  ['Mining Fırtınası', 'Hash Festivali', 'Blok Yarışı'],
    trading: ['Volatilite Fırsatı', 'Trade Sezonu', 'Piyasa Dalgası'],
    staking: ['Stake Ödülü', 'Uzun Vade Bonusu', 'Likidite Ödülü'],
  };
  const n = names[type][Math.floor(Math.random() * 3)];
  return {
    id: `evt_${coinId}_${hoursFromNow}`,
    coinId,
    name: `${coin.symbol} ${n}`,
    description: `${coin.name} için ${mult}× kazanım bonusu!`,
    multiplier: mult,
    endsAt: now + hoursFromNow * 3600000 + durationHours * 3600000,
    rewardPool: Math.floor(Math.random() * 50000) + 10000,
    participants: Math.floor(Math.random() * 5000) + 500,
    isBoosted: hoursFromNow === 0,
    type,
  };
}

const ACTIVE_EVENTS: CoinEvent[] = [
  makeEvent('eth',  0, 6,  2.0, 'mining'),
  makeEvent('sol',  2, 12, 1.5, 'trading'),
  makeEvent('bnb',  8, 24, 1.8, 'mining'),
  makeEvent('doge', 1, 4,  3.0, 'mining'),
];

const UPCOMING_EVENTS: CoinEvent[] = [
  makeEvent('ada',  24, 12, 2.5, 'staking'),
  makeEvent('avax', 48, 8,  2.0, 'mining'),
  makeEvent('eth',  72, 24, 3.0, 'trading'),
];

import { AltcoinBalances } from '../types';

function useCountdown(endsAt: number) {
  const [rem, setRem] = useState(Math.max(0, endsAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setRem(Math.max(0, endsAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const h = Math.floor(rem / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  const s = Math.floor((rem % 60000) / 1000);
  return `${h}s ${m}d ${s}s`;
}

function EventCard({ event, onMine }: { event: CoinEvent; onMine: (e: CoinEvent) => void }) {
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const coin = COINS.find(c => c.id === event.coinId)!;
  const countdown = useCountdown(event.endsAt);
  const typeColors: Record<string, string> = { mining:'#f59e0b', trading:'#10b981', staking:'#a78bfa' };
  const tc = typeColors[event.type] || a1;

  return (
    <motion.div layout
      className="p-4 rounded-2xl"
      style={{
        background: event.isBoosted ? `${coin.color}10` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${event.isBoosted ? coin.color + '35' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: event.isBoosted ? `0 0 20px ${coin.color}15` : 'none',
      }}>
      {event.isBoosted && (
        <div className="flex items-center gap-1 mb-2">
          <motion.div animate={{ opacity:[1,0.5,1] }} transition={{ duration:1, repeat:Infinity }}>
            <Flame size={11} className="text-orange-400" />
          </motion.div>
          <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">CANLI BOOST</span>
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background:`${coin.color}15`, border:`1px solid ${coin.color}25` }}>
          {coin.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white truncate">{event.name}</p>
          <p className="text-[9px]" style={{ color:'var(--ct-muted)' }}>{event.description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-black" style={{ color: coin.color }}>{event.multiplier}×</div>
          <div className="text-[8px]" style={{ color:'var(--ct-muted)' }}>boost</div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-3">
          <div>
            <p className="text-[8px]" style={{ color:'var(--ct-muted)' }}>Havuz</p>
            <p className="text-[10px] font-black" style={{ color:'#a78bfa' }}>{event.rewardPool.toLocaleString()} TP</p>
          </div>
          <div>
            <p className="text-[8px]" style={{ color:'var(--ct-muted)' }}>Katılımcı</p>
            <p className="text-[10px] font-black text-white">{event.participants.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[8px]" style={{ color:'var(--ct-muted)' }}>Tür</p>
            <p className="text-[9px] font-black capitalize" style={{ color: tc }}>{event.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[9px]" style={{ color:'var(--ct-muted)' }}>
          <Clock size={10} /> {countdown}
        </div>
      </div>
      <motion.button whileTap={{ scale:0.96 }} onClick={() => onMine(event)}
        className="w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
        style={{
          background: event.isBoosted
            ? `linear-gradient(135deg, ${coin.color}cc, ${coin.color}88)`
            : `${coin.color}18`,
          color: event.isBoosted ? '#000' : coin.color,
          border: `1px solid ${coin.color}30`,
          boxShadow: event.isBoosted ? `0 6px 20px ${coin.color}30` : 'none',
        }}>
        <Zap size={14} /> {coin.symbol} Mine Et ({event.multiplier}×)
      </motion.button>
    </motion.div>
  );
}

type ATab = 'events' | 'wallet' | 'calendar';

export default function AltcoinScreen() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const { notify } = useNotify();
  const { play } = useSoundEffects();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const [tab, setTab] = useState<ATab>('events');
  const [converting, setConverting] = useState<string | null>(null);
  const balances = state.altcoinBalances;

  const handleMine = (event: CoinEvent) => {
    const coin = COINS.find(c => c.id === event.coinId)!;
    const earned = coin.mineRatePerClick * event.multiplier;
    const newBal = { ...balances, [coin.id]: (balances[coin.id] || 0) + earned };
    dispatch({ type: 'ALTCOIN_SET_BALANCES', balances: newBal });
    play('mine');

    // TP da ver
    const tpBonus = Math.floor(earned * 1000 * event.multiplier);
    dispatch({ type: 'ADD_TP', amount: tpBonus });
    notify({
      type: 'success',
      title: `${coin.emoji} +${earned.toFixed(4)} ${coin.symbol}!`,
      message: `+${tpBonus} TP bonus · ${event.multiplier}× boost aktif`,
    });
  };

  const handleConvert = (coinId: string) => {
    const coin = COINS.find(c => c.id === coinId)!;
    const bal = balances[coinId] || 0;
    if (bal <= 0) {
      notify({ type:'warning', title:'Bakiye yok', message:'Önce altcoin mine et' });
      return;
    }
    const btcEarned = bal * coin.btcRate;
    dispatch({ type:'ADD_BTC', amount: btcEarned });
    const newBal = { ...balances, [coinId]: 0 };
    dispatch({ type: 'ALTCOIN_SET_BALANCES', balances: newBal });
    play('btcEarned');
    notify({
      type:'success',
      title:`${coin.emoji} ${coin.symbol} → ₿ BTC`,
      message:`${bal.toFixed(4)} ${coin.symbol} → ${btcEarned.toFixed(8)} BTC dönüştürüldü!`,
    });
    setConverting(null);
  };

  const totalBtcValue = COINS.reduce((acc, c) => acc + (balances[c.id] || 0) * c.btcRate, 0);

  return (
    <div className="space-y-4 pt-2 pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[1.75rem] p-5"
        style={{ background:`linear-gradient(135deg, ${a1}14, ${a2}08)`, border:`1px solid ${a1}25` }}>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <TrendingUp size={120} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background:`${a1}18`, border:`1px solid ${a1}30` }}>
            <TrendingUp size={22} style={{ color:a1 }} />
          </div>
          <div>
            <div className="text-base font-black text-white">Altcoin Sezonları</div>
            <div className="text-[10px] font-bold" style={{ color:'var(--ct-muted)' }}>
              BTC dışı coin event'leri
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'Aktif Event',  value: ACTIVE_EVENTS.length,              color:a1        },
            { label:'Bakiye (BTC)', value: totalBtcValue.toFixed(6),          color:'#f59e0b' },
            { label:'Coin Türü',    value: COINS.length,                      color:'#a78bfa' },
          ].map(s => (
            <div key={s.label} className="text-center py-2 rounded-xl"
              style={{ background:`${s.color}0c`, border:`1px solid ${s.color}20` }}>
              <div className="text-xs font-black truncate" style={{ color:s.color }}>{s.value}</div>
              <div className="text-[7px] font-bold uppercase tracking-widest" style={{ color:'var(--ct-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 gap-1 rounded-2xl"
        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
        {([
          { id:'events',   label:'🔥 Eventler'  },
          { id:'wallet',   label:'💰 Cüzdan'    },
          { id:'calendar', label:'📅 Takvim'    },
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
        {/* ══ AKTİF EVENTLER ══ */}
        {tab === 'events' && (
          <motion.div key="events"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="space-y-3">
            {ACTIVE_EVENTS.map((evt, i) => (
              <motion.div key={evt.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}>
                <EventCard event={evt} onMine={handleMine} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ══ CÜZDAN ══ */}
        {tab === 'wallet' && (
          <motion.div key="wallet"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="space-y-3">
            {COINS.map((coin, i) => {
              const bal = balances[coin.id] || 0;
              const btcVal = bal * coin.btcRate;
              return (
                <motion.div key={coin.id}
                  initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    background: bal > 0 ? `${coin.color}08` : 'rgba(255,255,255,0.02)',
                    border:`1px solid ${bal > 0 ? coin.color+'20' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background:`${coin.color}15` }}>
                    {coin.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-white">{coin.name}</p>
                    <p className="text-[9px]" style={{ color:'var(--ct-muted)' }}>
                      1 {coin.symbol} ≈ {coin.btcRate.toFixed(6)} BTC
                    </p>
                  </div>
                  <div className="text-right mr-2">
                    <p className="text-xs font-black" style={{ color: bal > 0 ? coin.color : 'var(--ct-muted)' }}>
                      {bal.toFixed(4)}
                    </p>
                    <p className="text-[8px]" style={{ color:'var(--ct-muted)' }}>
                      ≈{btcVal.toFixed(7)} BTC
                    </p>
                  </div>
                  {bal > 0 && (
                    <motion.button whileTap={{ scale:0.9 }}
                      onClick={() => setConverting(converting === coin.id ? null : coin.id)}
                      className="px-2.5 py-1.5 rounded-xl text-[9px] font-black shrink-0"
                      style={{ background:`${coin.color}18`, color:coin.color, border:`1px solid ${coin.color}30` }}>
                      BTC'ye
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
            {/* Conversion confirm */}
            <AnimatePresence>
              {converting && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  className="p-4 rounded-2xl"
                  style={{ background:`${a1}08`, border:`1px solid ${a1}25` }}>
                  {(() => {
                    const coin = COINS.find(c => c.id === converting)!;
                    const bal = balances[converting] || 0;
                    return (
                      <>
                        <p className="text-xs font-black text-white mb-2">
                          {coin.emoji} {bal.toFixed(4)} {coin.symbol} → {(bal * coin.btcRate).toFixed(8)} BTC
                        </p>
                        <div className="flex gap-2">
                          <motion.button whileTap={{ scale:0.95 }} onClick={() => handleConvert(converting)}
                            className="flex-1 py-2.5 rounded-xl font-black text-[11px]"
                            style={{ background:`linear-gradient(135deg, ${coin.color}, ${coin.color}88)`, color:'#000' }}>
                            Dönüştür ✓
                          </motion.button>
                          <button onClick={() => setConverting(null)}
                            className="flex-1 py-2.5 rounded-xl font-black text-[11px]"
                            style={{ background:'rgba(255,255,255,0.05)', color:'var(--ct-muted)' }}>
                            İptal
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ══ TAKVİM ══ */}
        {tab === 'calendar' && (
          <motion.div key="calendar"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color:'var(--ct-muted)' }}>
              🔜 Yaklaşan Eventler
            </p>
            {UPCOMING_EVENTS.map((evt, i) => {
              const coin = COINS.find(c => c.id === evt.coinId)!;
              const typeColors: Record<string, string> = { mining:'#f59e0b', trading:'#10b981', staking:'#a78bfa' };
              return (
                <motion.div key={evt.id}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl"
                  style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background:`${coin.color}15` }}>
                    {coin.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-white truncate">{evt.name}</p>
                    <p className="text-[8px]" style={{ color:'var(--ct-muted)' }}>
                      {evt.multiplier}× boost · {evt.type}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-black" style={{ color: typeColors[evt.type] }}>
                      {Math.floor((evt.endsAt - Date.now() - 3600000 * 24) / 3600000)}s sonra
                    </p>
                    <p className="text-[8px]" style={{ color:'var(--ct-muted)' }}>
                      {evt.rewardPool.toLocaleString()} TP havuz
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
