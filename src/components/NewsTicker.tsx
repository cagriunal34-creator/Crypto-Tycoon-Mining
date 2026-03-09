import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, MessageSquare, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

const NEWS_TEMPLATES = [
    "Bitcoin fiyatı son 24 saatte %{val} yükselerek yeni bir rekor kırdı!",
    "Yeni bir madencilik havuzu keşfedildi: {name} havuzu üyelerine bonus veriyor.",
    "Elon Musk'tan gizemli tweet: Kripto piyasaları hareketlendi.",
    "Siber güvenlik uyarısı: Madencilerin %{val}'si hacker saldırılarına karşı savunmasız!",
    "Madencilik zorluğu %{val} oranında arttı. Daha fazla güç gerekiyor.",
    "Blok ödülü yarılanması (Halving) yaklaşıyor: Geri sayım başladı.",
];

const NAMES = ["Gold", "Cyber", "Mega", "Titan", "Neon"];

export default function NewsTicker({ announcement }: { announcement?: string }) {
    const [currentNews, setCurrentNews] = useState("");

    const generateNews = () => {
        if (announcement) return announcement;
        const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
        const val = (Math.random() * 15 + 1).toFixed(1);
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];
        return template.replace("{val}", val).replace("{name}", name);
    };

    useEffect(() => {
        setCurrentNews(generateNews());
        if (!announcement) {
            const interval = setInterval(() => {
                setCurrentNews(generateNews());
            }, 15000);
            return () => clearInterval(interval);
        }
    }, [announcement]);

    return (
        <div className="w-full bg-black/40 border-y border-white/5 py-1.5 overflow-hidden whitespace-nowrap relative">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10" />

            <motion.div
                key={currentNews}
                initial={{ x: "100%" }}
                animate={{ x: "-100%" }}
                transition={{ duration: 15, ease: "linear", repeat: Infinity }}
                className="inline-flex items-center gap-6"
            >
                <div className="flex items-center gap-2">
                    {announcement ? (
                        <ShieldCheck size={12} className="text-blue-500" />
                    ) : (
                        <TrendingUp size={12} className="text-emerald-500" />
                    )}
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        announcement ? "text-blue-400" : "text-zinc-300"
                    )}>
                        {announcement ? `[SİSTEM]: ${currentNews}` : currentNews}
                    </span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <div className="flex items-center gap-2">
                    <AlertCircle size={12} className="text-yellow-500" />
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Piyasalar açık - Madenciliğe devam!</span>
                </div>
            </motion.div>
        </div>
    );
}
