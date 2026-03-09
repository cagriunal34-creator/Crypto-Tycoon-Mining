import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Zap, Star, Globe, TrendingUp } from 'lucide-react';

interface Activity {
    id: string;
    user: string;
    action: string;
    time: string;
    color: string;
}

const USERS = ["SiberKral", "CryptoMaster", "BTC_Ninja", "MoonWalker", "PixelMiner", "Satoshi_Fan"];
const ACTIONS = [
    "yeni bir kontrat satın aldı",
    "seviye atladı!",
    "çarktan 5000 TP kazandı",
    "Prestige moduna geçti",
    "VIP üyeliğini yeniledi",
    "madencilik farmını genişletti"
];

export default function SocialFeed() {
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        // Initial data
        const initial = Array.from({ length: 5 }, (_, i) => ({
            id: `act-${i}`,
            user: USERS[Math.floor(Math.random() * USERS.length)],
            action: ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
            time: "Şimdi",
            color: ["#10b981", "#3b82f6", "#f59e0b", "#a855f7"][Math.floor(Math.random() * 4)]
        }));
        setActivities(initial);

        const interval = setInterval(() => {
            const newAct = {
                id: `act-${Date.now()}`,
                user: USERS[Math.floor(Math.random() * USERS.length)],
                action: ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
                time: "Şimdi",
                color: ["#10b981", "#3b82f6", "#f59e0b", "#a855f7"][Math.floor(Math.random() * 4)]
            };
            setActivities(prev => [newAct, ...prev.slice(0, 4)]);
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Globe size={12} className="text-zinc-600" />
                    CANLI AKTİVİTE AKIŞI
                </h3>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-500/60 uppercase">ONLINE</span>
                </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence initial={false}>
                    {activities.map((act) => (
                        <motion.div
                            key={act.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="flex items-start gap-3"
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: `${act.color}15`, border: `1px solid ${act.color}30` }}
                            >
                                <User size={14} style={{ color: act.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-[11px] font-black text-zinc-200 truncate">{act.user}</span>
                                    <span className="text-[8px] font-bold text-zinc-600 uppercase tabular-nums">{act.time}</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-tight">
                                    {act.action}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
