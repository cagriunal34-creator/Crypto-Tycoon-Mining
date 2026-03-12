/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Gift, CheckCircle2, Zap, Coins, Trophy } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const REWARDS = [
    { day: 1, type: 'tp', value: 250, label: '250 TP' },
    { day: 2, type: 'tp', value: 500, label: '500 TP' },
    { day: 3, type: 'btc', value: 0.000005, label: '0.000005 BTC' },
    { day: 4, type: 'tp', value: 1000, label: '1000 TP' },
    { day: 5, type: 'energy', value: 10, label: '10 Enerji' },
    { day: 6, type: 'tp', value: 2000, label: '2000 TP' },
    { day: 7, type: 'btc', value: 0.00005, label: '0.00005 BTC' },
];

export default function LoginStreak() {
    const { state, claimStreakReward } = useGame();
    const { notify } = useNotify();
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [hasBeenShown, setHasBeenShown] = useState(false);

    const a1 = theme.vars['--ct-a1'];

    useEffect(() => {
        if (state.isLoading || hasBeenShown) return;

        const today = new Date().toISOString().split('T')[0];
        const lastClaimDate = state.streak.lastClaim ? new Date(state.streak.lastClaim).toISOString().split('T')[0] : null;

        if (lastClaimDate !== today) {
            setIsOpen(true);
            setHasBeenShown(true);
        }
    }, [state.streak.lastClaim, state.isLoading, hasBeenShown]);

    const handleClaim = () => {
        claimStreakReward();
        setIsOpen(false);
        notify({
            type: 'success',
            title: 'Günlük Ödül Alındı!',
            message: `${REWARDS[state.streak.count % 7].label} hesabına eklendi.`
        });
    };

    const currentDay = (state.streak.count % 7) + 1;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="w-full max-w-sm glass-panel rounded-[2.5rem] p-8 border-white/10 relative overflow-hidden"
                    >
                        {/* Background elements */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

                        <div className="text-center space-y-2 mb-8 relative">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                                <Calendar size={32} className="text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Günlük Giriş</h2>
                            <p className="text-sm text-zinc-400">Her gün gir, daha büyük ödüller kazan!</p>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-8">
                            {REWARDS.map((reward) => {
                                const isClaimed = reward.day < currentDay;
                                const isCurrent = reward.day === currentDay;

                                return (
                                    <div
                                        key={reward.day}
                                        className={`relative p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${isCurrent
                                                ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                                : isClaimed
                                                    ? 'bg-zinc-800/50 border-white/5 opacity-50'
                                                    : 'bg-white/5 border-white/5'
                                            }`}
                                    >
                                        {isClaimed && <CheckCircle2 size={12} className="absolute top-1 right-1 text-emerald-500" />}
                                        <span className="text-[10px] font-bold text-zinc-500">GÜN {reward.day}</span>
                                        {reward.type === 'tp' && <Trophy size={16} className={isCurrent ? 'text-emerald-500' : 'text-zinc-600'} />}
                                        {reward.type === 'btc' && <Coins size={16} className={isCurrent ? 'text-yellow-500' : 'text-zinc-600'} />}
                                        {reward.type === 'energy' && <Zap size={16} className={isCurrent ? 'text-blue-500' : 'text-zinc-600'} />}
                                        <span className="text-[9px] font-black mt-1 text-center leading-tight">{reward.label.split(' ')[0]}</span>
                                    </div>
                                );
                            })}
                            <div className="col-span-1 p-3 rounded-2xl border border-dashed border-white/10 flex items-center justify-center bg-white/5">
                                <Gift size={16} className="text-zinc-700" />
                            </div>
                        </div>

                        <button
                            onClick={handleClaim}
                            className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-black text-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                            BUGÜNKÜ ÖDÜLÜ AL!
                        </button>
                        <p className="text-[10px] text-zinc-600 text-center mt-4 uppercase tracking-widest font-bold">
                            SERİ: {state.streak.count} GÜN
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
