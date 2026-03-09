import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Coin {
    id: number;
    x: number;
    delay: number;
    duration: number;
    size: number;
}

export default function CoinShower({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
    const [coins, setCoins] = useState<Coin[]>([]);

    useEffect(() => {
        if (active) {
            const newCoins = Array.from({ length: 40 }).map((_, i) => ({
                id: Date.now() + i,
                x: Math.random() * 100, // percentage
                delay: Math.random() * 2,
                duration: 2 + Math.random() * 2,
                size: 15 + Math.random() * 15,
            }));
            setCoins(newCoins);

            const timer = setTimeout(() => {
                setCoins([]);
                if (onComplete) onComplete();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [active]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <AnimatePresence>
                {coins.map((coin) => (
                    <motion.div
                        key={coin.id}
                        initial={{ y: -50, x: `${coin.x}%`, rotate: 0, opacity: 0 }}
                        animate={{
                            y: window.innerHeight + 50,
                            rotate: 720,
                            opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                            duration: coin.duration,
                            delay: coin.delay,
                            ease: "linear"
                        }}
                        className="absolute text-yellow-500 brightness-125"
                        style={{ width: coin.size, height: coin.size }}
                    >
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border border-yellow-200/50 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                            <span className="text-[10px] font-black text-amber-900">₿</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
