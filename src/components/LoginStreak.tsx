/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Gift, CheckCircle2, Zap, Coins, Trophy, Sparkles, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const REWARDS = [
    { day: 1, type: 'tp',     value: 250,      label: '250 TP' },
    { day: 2, type: 'tp',     value: 500,      label: '500 TP' },
    { day: 3, type: 'btc',    value: 0.000005, label: '0.000005 BTC' },
    { day: 4, type: 'tp',     value: 1000,     label: '1000 TP' },
    { day: 5, type: 'energy', value: 10,       label: '10 Enerji' },
    { day: 6, type: 'tp',     value: 2000,     label: '2000 TP' },
    { day: 7, type: 'btc',    value: 0.00005,  label: '0.00005 BTC' },
];

// Bugünün tarih string'ini döndürür: "2025-12-31"
function todayStr(): string {
    return new Date().toISOString().split('T')[0];
}

// Verilen timestamp veya string'den tarih string'i döndürür
function toDateStr(val: number | string | null | undefined): string | null {
    if (!val) return null;
    try {
        return new Date(val).toISOString().split('T')[0];
    } catch {
        return null;
    }
}

export default function LoginStreak() {
    const { state, claimStreakReward } = useGame();
    const { notify } = useNotify();
    const { theme } = useTheme();
    const a1 = theme.vars['--ct-a1'];

    const [isOpen, setIsOpen]       = useState(false);
    const [claiming, setClaiming]   = useState(false);
    const [claimed, setClaimed]     = useState(false);

    // Aynı oturum içinde birden fazla gösterimi engelle
    const shownRef = useRef(false);

    useEffect(() => {
        // Yükleme bitmeden veya kullanıcı yoksa çalışma
        if (state.isLoading || !state.user) return;

        // Bu oturum içinde zaten gösterildiyse tekrar gösterme
        if (shownRef.current) return;

        const lastClaimDate = toDateStr(state.streak?.lastClaim);
        const today         = todayStr();

        // Bugün ödül alınmamışsa popup'ı göster
        if (lastClaimDate !== today) {
            // Kısa gecikme: DB'den veri yüklenmesini bekle
            const timer = setTimeout(() => {
                // Timeout içinde tekrar kontrol et (race condition önlemi)
                const recheckDate = toDateStr(state.streak?.lastClaim);
                if (recheckDate !== today && !shownRef.current) {
                    shownRef.current = true;
                    setIsOpen(true);
                }
            }, 800);
            return () => clearTimeout(timer);
        } else {
            // Bugün zaten alındı — gösterilmiş say
            shownRef.current = true;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.isLoading, state.user?.uid, state.streak?.lastClaim]);

    const handleClaim = async () => {
        if (claiming || claimed) return;
        setClaiming(true);

        try {
            await claimStreakReward();

            // Ödül başarıyla alındı
            setClaimed(true);
            const rewardIndex = state.streak?.count ? state.streak.count % 7 : 0;
            notify({
                type: 'success',
                title: '🎁 Günlük Ödül Alındı!',
                message: `${REWARDS[rewardIndex].label} hesabına eklendi.`
            });

            // 1.2sn sonra kapat
            setTimeout(() => setIsOpen(false), 1200);
        } catch (err) {
            console.error('Streak claim error:', err);
            notify({
                type: 'warning',
                title: 'Hata',
                message: 'Ödül alınırken bir sorun oluştu. Lütfen tekrar deneyin.'
            });
            setClaiming(false);
        }
    };

    const streakCount  = state.streak?.count ?? 0;
    const currentDay   = (streakCount % 7) + 1;

    // Bugün ödül zaten alınmışsa (lastClaim === today) popup açılmaz
    const alreadyClaimed = toDateStr(state.streak?.lastClaim) === todayStr();

    return (
        <AnimatePresence>
            {isOpen && !alreadyClaimed && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-sm glass-panel rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden"
                        style={{ background: 'var(--ct-surface, #111)' }}
                    >
                        {/* Arka plan efekti */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

                        {/* Kapatma Butonu */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors z-10"
                        >
                            <X size={20} className="text-zinc-400" />
                        </button>

                        {/* Başlık */}
                        <div className="text-center space-y-2 mb-8 relative">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                                {claimed
                                    ? <Sparkles size={32} className="text-emerald-400" />
                                    : <Calendar size={32} className="text-emerald-500" />
                                }
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-white">
                                {claimed ? 'Ödül Alındı!' : 'Günlük Giriş'}
                            </h2>
                            <p className="text-sm text-zinc-400">
                                {claimed
                                    ? `${REWARDS[(streakCount % 7)].label} bakiyene eklendi ✅`
                                    : 'Her gün gir, daha büyük ödüller kazan!'}
                            </p>
                        </div>

                        {/* Ödül Grid */}
                        <div className="grid grid-cols-4 gap-3 mb-8">
                            {REWARDS.map((reward) => {
                                const isClaimed  = reward.day < currentDay;
                                const isCurrent  = reward.day === currentDay;

                                return (
                                    <div
                                        key={reward.day}
                                        className={`relative p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                                            isCurrent
                                                ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                                : isClaimed
                                                    ? 'bg-zinc-800/50 border-white/5 opacity-50'
                                                    : 'bg-white/5 border-white/5'
                                        }`}
                                    >
                                        {isClaimed && (
                                            <CheckCircle2 size={12} className="absolute top-1 right-1 text-emerald-500" />
                                        )}
                                        <span className="text-[10px] font-bold text-zinc-500">GÜN {reward.day}</span>
                                        {reward.type === 'tp'     && <Trophy size={16} className={isCurrent ? 'text-emerald-500' : 'text-zinc-600'} />}
                                        {reward.type === 'btc'    && <Coins  size={16} className={isCurrent ? 'text-yellow-500' : 'text-zinc-600'} />}
                                        {reward.type === 'energy' && <Zap    size={16} className={isCurrent ? 'text-blue-500'  : 'text-zinc-600'} />}
                                        <span className="text-[9px] font-black mt-1 text-center leading-tight">
                                            {reward.label.split(' ')[0]}
                                        </span>
                                    </div>
                                );
                            })}
                            {/* 8. slot - sürpriz */}
                            <div className="col-span-1 p-3 rounded-2xl border border-dashed border-white/10 flex items-center justify-center bg-white/5">
                                <Gift size={16} className="text-zinc-700" />
                            </div>
                        </div>

                        {/* CTA Butonu */}
                        {!claimed ? (
                            <button
                                onClick={handleClaim}
                                disabled={claiming}
                                className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-black text-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {claiming ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                                        Alınıyor...
                                    </>
                                ) : (
                                    'BUGÜNKÜ ÖDÜLÜ AL!'
                                )}
                            </button>
                        ) : (
                            <div className="w-full py-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-lg text-center flex items-center justify-center gap-2">
                                <CheckCircle2 size={20} /> Alındı!
                            </div>
                        )}

                        <p className="text-[10px] text-zinc-600 text-center mt-4 uppercase tracking-widest font-bold">
                            SERİ: {streakCount} GÜN
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
