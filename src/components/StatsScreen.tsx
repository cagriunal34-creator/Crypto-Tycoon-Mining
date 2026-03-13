/**
 * StatsScreen — Kazanç Grafiği & İstatistikler
 * Recharts tabanlı, tema rengiyle uyumlu
 */
import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
  TrendingUp, Zap, Trophy, Flame, Users, Shield,
  Cpu, BarChart2, Clock, Star, Crown, Bitcoin, Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import ShareCardModal from './ShareCardModal';

// ── Simüle edilmiş BTC kazanç geçmişi (localStorage'dan veya üretilmiş) ─────
function generateEarningsHistory(btcBalance: number, level: number) {
  const days = 14;
  const dailyBase = btcBalance / Math.max(level, 1) / 1000;
  const now = Date.now();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * 86400000);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const variance = 0.7 + Math.random() * 0.6;
    const val = +(dailyBase * variance * (1 + i * 0.03)).toFixed(8);
    return { label, btc: val, usd: +(val * 95000).toFixed(2) };
  });
}

function generateHourlyActivity(level: number) {
  return Array.from({ length: 24 }, (_, h) => {
    const peak = h >= 8 && h <= 23 ? 1.5 : 0.6;
    return { hour: `${h}:00`, activity: Math.floor(Math.random() * 100 * peak * (level / 10 + 0.5)) };
  });
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, color }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(6,8,14,0.95)', border: `1px solid ${color}30` }}>
      <p className="font-bold text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-black" style={{ color }}>
          {typeof p.value === 'number' && p.value < 0.01 ? p.value.toFixed(8) : p.value.toLocaleString()}
          {p.dataKey === 'btc' ? ' BTC' : p.dataKey === 'usd' ? ' $' : ''}
        </p>
      ))}
    </div>

  );
}

// ── Stat kart ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }: {
  icon: any; label: string; value: string | number; sub?: string; color: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="p-4 rounded-2xl flex items-center gap-3"
      style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>{label}</p>
        <p className="text-base font-black text-white truncate">{value}</p>
        {sub && <p className="text-[9px] font-bold mt-0.5" style={{ color }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

type Range = '7g' | '14g';
type ChartTab = 'btc' | 'activity' | 'breakdown';

export default function StatsScreen() {
  const { state } = useGame();
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const [range, setRange] = useState<Range>('14g');
  const [chartTab, setChartTab] = useState<ChartTab>('btc');
  const [shareOpen, setShareOpen] = useState(false);

  // ── Veri üretimi ─────────────────────────────────────────────────────────
  const earnings = useMemo(() => generateEarningsHistory(state.btcBalance, state.level), [state.btcBalance, state.level]);
  const hourly   = useMemo(() => generateHourlyActivity(state.level), [state.level]);
  const sliced   = range === '7g' ? earnings.slice(-7) : earnings;

  const totalBtc   = sliced.reduce((s, d) => s + d.btc, 0);
  const totalUsd   = sliced.reduce((s, d) => s + d.usd, 0);
  const bestDay    = [...sliced].sort((a, b) => b.btc - a.btc)[0];
  const avgPerDay  = totalBtc / sliced.length;

  // Dağılım pasta verisi
  const breakdown = [
    { name: 'Manuel Mining',  value: 45, color: a1 },
    { name: 'Kontratlar',     value: 30, color: '#fbbf24' },
    { name: 'Çiftlik',        value: 15, color: '#60a5fa' },
    { name: 'Diğer',          value: 10, color: '#a78bfa' },
  ];

  // Seviye ilerlemesi
  const xpPct = Math.min(100, Math.floor((state.xp / state.xpToNextLevel) * 100));

  // Hash rate hesabı (yaklaşık)
  const hashRate = Math.floor(50 * Math.pow(1.18, state.level - 1) * (state.prestigeMultiplier ?? 1));

  return (
    <div className="space-y-5 pt-2 pb-20">

      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">İstatistikler</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>Madencilik verilerin</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black"
            style={{ background: `${a1}15`, border: `1px solid ${a1}30`, color: a1 }}>
            <Share2 size={12} /> Kartı Paylaş
          </motion.button>
          <div className="flex p-1 gap-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['7g', '14g'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black transition-all"
                style={{ background: range === r ? `${a1}20` : 'transparent', color: range === r ? a1 : 'var(--ct-muted)' }}>
                {r === '7g' ? '7G' : '14G'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Bitcoin} label="Toplam BTC" value={totalBtc.toFixed(6)} sub={`≈ $${totalUsd.toFixed(0)}`} color={a1} delay={0} />
        <StatCard icon={TrendingUp} label="Günlük Ort." value={avgPerDay.toFixed(7)} sub="BTC/gün" color="#fbbf24" delay={0.05} />
        <StatCard icon={Flame} label="En İyi Gün" value={bestDay?.btc.toFixed(7) ?? '-'} sub={bestDay?.label} color="#f87171" delay={0.1} />
        <StatCard icon={Cpu} label="Hash Rate" value={`${hashRate} GH/s`} sub={`Prestige ×${state.prestigeMultiplier?.toFixed(2) ?? '1.00'}`} color="#60a5fa" delay={0.15} />
      </div>

      {/* Oyuncu profil özeti */}
      <div className="p-4 rounded-[1.5rem]" style={{ background: `${a1}08`, border: `1px solid ${a1}18` }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${a1}18`, border: `1px solid ${a1}30` }}>
            {state.vip?.isActive ? '👑' : state.prestigeLevel > 0 ? '⭐' : '⛏️'}
          </div>
          <div className="flex-1">
            <p className="font-black text-white">{state.username || 'Madenci'}</p>
            <p className="text-[10px] font-bold" style={{ color: 'var(--ct-muted)' }}>Seviye {state.level} · Prestige {state.prestigeLevel}</p>
            <div className="flex items-center gap-2 mt-1">
              {state.vip?.isActive && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black" style={{ background: '#fbbf2420', color: '#fbbf24', border: '1px solid #fbbf2430' }}>VIP</span>}
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black" style={{ background: `${a1}15`, color: a1, border: `1px solid ${a1}25` }}>
                {state.streak?.count ?? 0} Gün Seri 🔥
              </span>
            </div>
          </div>
        </div>
        {/* XP bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-bold" style={{ color: 'var(--ct-muted)' }}>
            <span>XP İlerlemesi</span>
            <span style={{ color: a1 }}>{state.xp?.toLocaleString() ?? 0} / {state.xpToNextLevel?.toLocaleString() ?? 500}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${a1}, ${a2})` }} />
          </div>
        </div>
      </div>

      {/* Graf seçim tab'ları */}
      <div className="flex p-1 gap-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([
          { id: 'btc',       label: '📈 BTC Kazanç' },
          { id: 'activity',  label: '⚡ Aktivite' },
          { id: 'breakdown', label: '🥧 Dağılım' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setChartTab(t.id)}
            className="flex-1 py-2 rounded-lg text-[9px] font-black transition-all"
            style={{ background: chartTab === t.id ? `${a1}18` : 'transparent', color: chartTab === t.id ? a1 : 'var(--ct-muted)', border: chartTab === t.id ? `1px solid ${a1}25` : '1px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BTC Kazanç Grafiği ── */}
      {chartTab === 'btc' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-[1.5rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-black text-white">BTC Kazanç Geçmişi</p>
              <p className="text-[9px]" style={{ color: 'var(--ct-muted)' }}>Son {sliced.length} güne ait tahmini veri</p>
            </div>
            <BarChart2 size={16} style={{ color: a1 }} />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={sliced} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={a1} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={a1} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip color={a1} />} />
              <Area type="monotone" dataKey="btc" stroke={a1} strokeWidth={2} fill="url(#btcGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Saatlik Aktivite ── */}
      {chartTab === 'activity' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-[1.5rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-black text-white">Saatlik Aktivite Örüntüsü</p>
              <p className="text-[9px]" style={{ color: 'var(--ct-muted)' }}>Hangi saatlerde daha aktifsin</p>
            </div>
            <Clock size={16} style={{ color: '#fbbf24' }} />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={hourly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis dataKey="hour" tick={{ fontSize: 7, fill: '#52525b' }} axisLine={false} tickLine={false}
                tickFormatter={v => v.split(':')[0]} interval={2} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip color="#fbbf24" />} />
              <Bar dataKey="activity" radius={[3, 3, 0, 0]}>
                {hourly.map((_, i) => (
                  <Cell key={i} fill={i >= 8 && i <= 22 ? `${a1}cc` : `${a1}40`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Kaynak Dağılımı ── */}
      {chartTab === 'breakdown' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-[1.5rem]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-black text-white mb-4">Kazanç Kaynakları</p>
          <div className="flex items-center gap-4">
            <PieChart width={120} height={120}>
              <Pie data={breakdown} cx={55} cy={55} innerRadius={35} outerRadius={55}
                dataKey="value" strokeWidth={0}>
                {breakdown.map((b, i) => <Cell key={i} fill={b.color} />)}
              </Pie>
            </PieChart>
            <div className="flex-1 space-y-2">
              {breakdown.map(b => (
                <div key={b.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: b.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white">{b.name}</span>
                      <span className="text-[10px] font-black" style={{ color: b.color }}>{b.value}%</span>
                    </div>
                    <div className="h-1 rounded-full mt-0.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${b.value}%`, background: b.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Ek istatistikler grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users}  label="Davet"       value={state.referralCount ?? 0} sub={`${Math.min((state.referralCount ?? 0) * 5, 50)}% hız bonusu`} color="#a78bfa" delay={0} />
        <StatCard icon={Trophy} label="Tycoon Puanı" value={(state.tycoonPoints ?? 0).toLocaleString()} sub="TP" color="#fbbf24" delay={0.05} />
        <StatCard icon={Shield} label="Kontratlar"   value={state.ownedContracts?.length ?? 0} sub="aktif kontrat" color="#60a5fa" delay={0.1} />
        <StatCard icon={Star}   label="Prestige"     value={state.prestigeLevel ?? 0} sub={`×${state.prestigeMultiplier?.toFixed(2) ?? '1.00'} çarpan`} color="#f87171" delay={0.15} />
      </div>
      
      {/* Share Card Modal */}
      <ShareCardModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />

    </div>
  );
}
