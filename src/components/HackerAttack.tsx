import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldAlert, Cpu, Terminal, Zap } from 'lucide-react';
import { useNotify } from '../context/NotificationContext';

interface HackerAttackProps {
    onSuccess: () => void;
    onFailure: () => void;
}

export default function HackerAttack({ onSuccess, onFailure }: HackerAttackProps) {
    const [code, setCode] = useState("");
    const [target, setTarget] = useState("");
    const [timeLeft, setTimeLeft] = useState(10);
    const { notify } = useNotify();

    useEffect(() => {
        const chars = "ABCDEF0123456789";
        let newTarget = "";
        for (let i = 0; i < 6; i++) newTarget += chars[Math.floor(Math.random() * chars.length)];
        setTarget(newTarget);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onFailure();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.toUpperCase() === target) {
            onSuccess();
        } else {
            notify({ type: 'warning', title: 'Hatalı Kod', message: 'Hızla tekrar dene!' });
            setCode("");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-red-950/90 backdrop-blur-xl flex items-center justify-center p-6"
        >
            <div className="w-full max-w-sm glass-card border-red-500/30 p-8 text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_15px_red]" />

                <div className="flex justify-center">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center text-red-500"
                    >
                        <ShieldAlert size={48} />
                    </motion.div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-red-500 tracking-tighter uppercase italic">SİSTEM SALDIRI ALTINDA!</h2>
                    <p className="text-sm text-zinc-400">Güvenlik duvarını yeniden kurmak için aşağıdaki kodu doğrula:</p>
                </div>

                <div className="py-4 px-6 bg-black/40 rounded-2xl border border-red-500/20 font-mono text-3xl font-black tracking-[0.5em] text-red-400">
                    {target}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        autoFocus
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="KODU BURAYA YAZ"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 text-center text-xl font-black focus:border-red-500 outline-none transition-all uppercase"
                    />

                    <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                        <div className="flex items-center gap-1">
                            <Terminal size={12} />
                            <span>TERMINAL#259</span>
                        </div>
                        <div className={timeLeft < 4 ? "text-red-500 animate-pulse" : ""}>
                            KALAN SÜRE: {timeLeft}s
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-red-500 text-white font-black text-lg shadow-[0_4px_20px_rgba(239,68,68,0.4)] active:scale-95 transition-all"
                    >
                        SİSTEMİ KORU!
                    </button>
                </form>
            </div>
        </motion.div>
    );
}
