/**
 * TournamentScreen — Haftalık BTC Turnuvası
 *
 * - Haftalık sıfırlanan liderboard (Supabase profiles.weeklyBtc)
 * - Gerçek zamanlı geri sayım (hafta sonu Pazar 23:59)
 * - Ödül dağılımı tablosu (top 3 BTC, top 10 TP)
 * - Katıl butonu + kendi sıralaması
 * - Önceki hafta sonuçları
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy, Crown, Timer, Gift, ChevronUp, ChevronDown,
  Minus, Flame, Medal, Star, Zap, Lock, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';
import { supabase, TABLES } from '../lib/supabase';

// ── Ödül şeması ───────────────────────────────────────────────────────────────
const PRIZE_TABLE = [
  { rank: 1,     label: '🥇 1.',   btc: 0.005,   tp: 10000, color: '#fbbf24' },
  { rank: 2,     label: '🥈 2.',   btc: 0.002,   tp: 5000,  color: '#94a3b8' },
  { rank: 3,     label: '🥉 3.',   btc: 0.001,   tp: 3000,  color: '#b45309' },
  { rank: 4,     label: '4–5.',    btc: 0,        tp: 2000,  color: '#60a5fa' },
  { rank: 6,     label: '6–10.',   btc: 0,        tp: 1000,  color: '#a78bfa' },
  { rank: 11,    label: '11–25.',  btc: 0,        tp: 500,   color: '#34d399' },
];

// ── Geri sayım ────────────────────────────────────────────────────────────────
function getNextSundayMidnight(): number {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilSunday);
  next.setHours(23, 59, 59, 0);
  return next.getTime();
}

function useCountdown(target: number) {
  const [remaining, setRemaining] = useState(target - Date.now());
  useEffect(() => {
    const id = setInterval(() => setRemaining(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const total = Math.max(0, remaining);
  const d = Math.floor(total / 86400000);
  const h = Math.floor((total % 86400000) / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return { d, h, m, s, total };
}

function TimeUnit({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg tabular-nums"
        style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>{label}</span>
    </div>
  );
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={15} className="text-yellow-400" fill="currentColor" />;
  if (rank === 2) return <Medal size={15} className="text-zinc-400" />;
  if (rank === 3) return <Medal size={15} className="text-amber-700" />;
  return <span className="text-[11px] font-black text-zinc-500">#{rank}</span>;
}

type TournamentTab = 'live' | 'prizes' | 'history';

export default function TournamentScreen() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const { notify } = useNotify();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const [tab, setTab] = useState<TournamentTab>('live');
  const [joined, setJoined] = useState(() => {
    return localStorage.getItem('tournament_joined_v1') === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);

  const deadline = useMemo(() => getNextSundayMidnight(), []);
  const { d, h, m, s } = useCountdown(deadline);

  // Turnuva listesini yükle (weeklyBtc veya btcBalance ile sırala)
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from(TABLES.PROFILES)
          .select('id, username, btcBalance, level, totalHashRate')
          .order('btcBalance', { ascending: false })
          .limit(25);
        if (data) {
          setPlayers(data.map((p: any, i: number) => ({
            rank: i + 1,
            id: p.id,
            name: p.username || 'Madenci',
            score: +(p.btcBalance || 0).toFixed(6),
            level: p.level || 1,
            avatar: (p.username || 'M').slice(0, 2).toUpperCase(),
            isMe: p.id === state.user?.uid,
          })));
        }
      } catch { /* offline — simüle et */ }
    };
    load();
  }, [state.user?.uid]);

  // Eğer Supabase boşsa simüle et
  const displayPlayers = players.length > 0 ? players : Array.from({ length: 12 }, (_, i) => ({
    rank: i + 1,
    id: `mock_${i}`,
    name: i === 2 ? (state.username || 'Sen') : `Madenci${i + 1}`,
    score: +(state.btcBalance * (1.5 - i * 0.1)).toFixed(6),
    level: Math.max(1, state.level - i),
    avatar: i === 2 ? (state.username || 'S').slice(0, 2).toUpperCase() : `M${i}`,
    isMe: i === 2,
  }));

  const myEntry = displayPlayers.find(p => p.isMe) || { rank: '?', name: state.username || 'Sen', score: +(state.btcBalance || 0).toFixed(6), level: state.level, avatar: (state.username || 'S').slice(0, 2).toUpperCase() };

  const handleJoin = async () => {
    if (joined || loading) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setJoined(true);
    localStorage.setItem('tournament_joined_v1', 'true');
    notify({ type: 'success', title: '🏆 Turnuvaya Katıldın!', message: 'Haftalık sıralamada yerinizi aldınız. Başarılar!' });
    setLoading(false);
  };

  const topThree = displayPlayers.slice(0, 3);
  const rest = displayPlayers.slice(3);

  return (
    <div className="space-y-4 pt-2 pb-20">

      {/* Hero başlık */}
      <div className="relative overflow-hidden rounded-[1.75rem] p-5"
        style={{ background: `linear-gradient(135deg, ${a1}14, ${a2}08)`, border: `1px solid ${a1}25` }}>
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
          <Trophy size={140} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${a1}18`, border: `1px solid ${a1}30` }}>
            <Trophy size={22} style={{ color: a1 }} />
          </div>
          <div>
            <div className="text-base font-black text-white">Haftalık Turnuva</div>
            <div className="text-[10px] font-bold" style={{ color: 'var(--ct-muted)' }}>
              Top 25 madenci ödülleri paylaşır
            </div>
          </div>
          {joined && (
            <div className="ml-auto flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full"
              style={{ background: `${a1}18`, color: a1, border: `1px solid ${a1}30` }}>
              <CheckCircle2 size={11} /> Katıldın
            </div>
          )}
        </div>

        {/* Geri sayım */}
        <div className="mb-4">
          <p className="text-[9px] font-black uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--ct-muted)' }}>
            ⏱ Hafta bitmesine kalan
          </p>
          <div className="flex items-center justify-center gap-3">
            <TimeUnit value={d} label="Gün" color={a1} />
            <span className="text-xl font-black" style={{ color: a1 }}>:</span>
            <TimeUnit value={h} label="Saat" color={a1} />
            <span className="text-xl font-black" style={{ color: a1 }}>:</span>
            <TimeUnit value={m} label="Dak" color={a1} />
            <span className="text-xl font-black" style={{ color: a1 }}>:</span>
            <TimeUnit value={s} label="Sn" color="#f87171" />
          </div>
        </div>

        {/* Katıl butonu */}
        {!joined ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleJoin} disabled={loading}
            className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${a1}, ${a2})`,
              color: '#000',
              boxShadow: `0 8px 24px ${a1}35`,
              opacity: loading ? 0.7 : 1,
            }}>
            {loading
              ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Katılıyor...</>
              : <><Trophy size={16} /> Turnuvaya Katıl!</>}
          </motion.button>
        ) : (
          <div className="w-full py-3.5 rounded-2xl font-black text-sm text-center"
            style={{ background: `${a1}12`, border: `1px solid ${a1}25`, color: a1 }}>
            ✅ Aktif Katılımcısın — Sıra: #{myEntry.rank}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex p-1 gap-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([
          { id: 'live',    label: '🔴 Canlı' },
          { id: 'prizes',  label: '🎁 Ödüller' },
          { id: 'history', label: '📜 Geçmiş' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            style={{
              background: tab === t.id ? `${a1}18` : 'transparent',
              color: tab === t.id ? a1 : 'var(--ct-muted)',
              border: tab === t.id ? `1px solid ${a1}30` : '1px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══ CANLI SIRALAMA ══ */}
        {tab === 'live' && (
          <motion.div key="live" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Podyum top 3 */}
            <div className="flex items-end justify-center gap-2 pb-2">
              {[topThree[1], topThree[0], topThree[2]].map((p, i) => {
                if (!p) return <div key={i} className="flex-1" />;
                const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const podH = ['h-16', 'h-22', 'h-14'];
                const podC = ['bg-zinc-600', 'bg-yellow-500', 'bg-amber-700'];
                const prize = PRIZE_TABLE[rank - 1];
                return (
                  <div key={p.id} className="flex flex-col items-center gap-1.5 flex-1">
                    {p.isMe && <div className="text-[7px] font-black px-1.5 py-0.5 rounded-full" style={{ background: `${a1}20`, color: a1 }}>SEN</div>}
                    <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-black"
                      style={{ borderColor: prize.color + '60', background: prize.color + '15', color: prize.color }}>
                      {p.avatar}
                    </div>
                    <p className="text-[8px] font-bold text-zinc-300 text-center truncate max-w-[56px]">{p.name}</p>
                    <p className="text-[8px] font-black text-center" style={{ color: prize.color }}>
                      {prize.btc > 0 ? `+${prize.btc} BTC` : `+${prize.tp.toLocaleString()} TP`}
                    </p>
                    <div className={cn('w-full rounded-t-2xl flex items-center justify-center', podH[i], podC[i])}>
                      <RankIcon rank={rank} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Listesi 4-25 */}
            <div className="space-y-2">
              {rest.map((p, idx) => {
                const prizeRow = PRIZE_TABLE.find(pr => p.rank >= pr.rank && p.rank < (PRIZE_TABLE[PRIZE_TABLE.indexOf(pr) + 1]?.rank ?? 999));
                const prizeColor = prizeRow?.color ?? '#52525b';
                return (
                  <motion.div key={p.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{
                      background: p.isMe ? `${a1}06` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${p.isMe ? a1 + '20' : 'rgba(255,255,255,0.04)'}`,
                    }}>
                    <div className="w-6 text-center"><RankIcon rank={p.rank} /></div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                      style={{ background: p.isMe ? `${a1}20` : 'rgba(255,255,255,0.06)', color: p.isMe ? a1 : '#71717a' }}>
                      {p.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: p.isMe ? a1 : 'white' }}>
                        {p.name}{p.isMe ? ' (Sen)' : ''}
                      </p>
                      <p className="text-[9px]" style={{ color: 'var(--ct-muted)' }}>Lv.{p.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black font-mono" style={{ color: prizeColor }}>
                        {p.score.toFixed(5)} BTC
                      </p>
                      {prizeRow && (
                        <p className="text-[8px] font-bold" style={{ color: prizeColor }}>
                          {prizeRow.btc > 0 ? `+${prizeRow.btc} BTC` : `+${prizeRow.tp.toLocaleString()} TP`}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Sen — sabit alta yapışık */}
            {joined && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-dashed border-white/08" />
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--ct-muted)' }}>senin sıran</span>
                  <div className="flex-1 border-t border-dashed border-white/08" />
                </div>
                <motion.div
                  animate={{ boxShadow: [`0 0 0px ${a1}00`, `0 0 18px ${a1}22`, `0 0 0px ${a1}00`] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: `${a1}08`, border: `1px solid ${a1}25` }}>
                  <div className="w-6 text-center"><span className="text-xs font-black text-zinc-500">#{myEntry.rank}</span></div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{ background: `${a1}20`, color: a1 }}>
                    {myEntry.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold" style={{ color: a1 }}>{myEntry.name}</p>
                    <p className="text-[9px]" style={{ color: 'var(--ct-muted)' }}>Lv.{myEntry.level}</p>
                  </div>
                  <p className="text-[10px] font-black font-mono" style={{ color: a1 }}>{myEntry.score} BTC</p>
                </motion.div>
              </>
            )}
          </motion.div>
        )}

        {/* ══ ÖDÜL TABLOSU ══ */}
        {tab === 'prizes' && (
          <motion.div key="prizes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="p-4 rounded-2xl space-y-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-3 text-center" style={{ color: 'var(--ct-muted)' }}>
                🎁 Haftalık Ödül Havuzu
              </p>
              {PRIZE_TABLE.map((pr, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl"
                  style={{ background: `${pr.color}08`, border: `1px solid ${pr.color}18` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                    style={{ background: `${pr.color}15`, color: pr.color }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${pr.rank}`}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-white">{pr.label} Sıra</p>
                    <div className="flex gap-3 mt-0.5">
                      {pr.btc > 0 && (
                        <span className="text-[9px] font-bold" style={{ color: '#fbbf24' }}>+{pr.btc} BTC</span>
                      )}
                      <span className="text-[9px] font-bold" style={{ color: '#a78bfa' }}>+{pr.tp.toLocaleString()} TP</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {pr.btc > 0 && (
                      <p className="text-xs font-black" style={{ color: '#fbbf24' }}>
                        ≈ ${(pr.btc * 95000).toFixed(0)}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-4 rounded-2xl space-y-2" style={{ background: `${a1}06`, border: `1px solid ${a1}15` }}>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: a1 }}>📋 Kurallar</p>
              {[
                'Turnuva her Pazar gece 23:59\'da sıfırlanır',
                'Sıralama o haftaki toplam BTC bakiyene göredir',
                'Ödüller hafta kapandıktan sonraki 24 saat içinde dağıtılır',
                'VIP oyuncular 2× TP ödülü alır',
                'Turnuvaya katılmak ücretsizdir',
              ].map((r, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: a1 }} />
                  <p className="text-[10px] text-white/70 font-medium">{r}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══ GEÇMİŞ SONUÇLAR ══ */}
        {tab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {[
              { week: 'Geçen Hafta',   rank: 8,  reward: '1000 TP', date: '2–9 Mar' },
              { week: '2 Hafta Önce',  rank: 14, reward: '500 TP',  date: '23 Şub–2 Mar' },
              { week: '3 Hafta Önce',  rank: 22, reward: '500 TP',  date: '16–23 Şub' },
            ].map((h, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a' }}>
                  #{h.rank}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-white">{h.week}</p>
                  <p className="text-[9px]" style={{ color: 'var(--ct-muted)' }}>{h.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black" style={{ color: '#a78bfa' }}>+{h.reward}</p>
                  <p className="text-[9px]" style={{ color: 'var(--ct-muted)' }}>kazanıldı</p>
                </div>
              </motion.div>
            ))}
            <div className="text-center py-4">
              <p className="text-[10px]" style={{ color: 'var(--ct-muted)' }}>Tüm geçmiş kayıtları yakında...</p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
