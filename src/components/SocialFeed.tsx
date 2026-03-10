import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Zap, Star, Globe, TrendingUp, History } from 'lucide-react';
import { supabase, TABLES } from '../lib/supabase';

interface Activity {
    id: string;
    user: string;
    action: string;
    time: string;
    color: string;
}

const USERS: string[] = [];
const ACTIONS: string[] = [];

export default function SocialFeed() {
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const fetchInitial = async () => {
            const { data } = await supabase
                .from(TABLES.TRANSACTIONS)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) {
                const mapped = data.map((t: any) => ({
                    id: t.id,
                    user: 'Bir Madenci',
                    action: t.description || 'İşlem gerçekleştirdi',
                    time: 'AZ ÖNCE',
                    color: t.amount > 0 ? '#10b981' : '#6366f1'
                }));
                setActivities(mapped);
            }
        };

        fetchInitial();

        const channel = supabase
            .channel('social-feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.TRANSACTIONS }, async (payload) => {
                const { data: profile } = await supabase.from(TABLES.PROFILES).select('username').eq('id', payload.new.user_id).single();
                const newAct: Activity = {
                    id: payload.new.id,
                    user: profile?.username || 'Gizli Madenci',
                    action: payload.new.description || 'İşlem gerçekleştirdi',
                    time: 'YENİ',
                    color: payload.new.amount > 0 ? '#10b981' : '#6366f1'
                };
                setActivities(prev => [newAct, ...prev].slice(0, 5));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
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
