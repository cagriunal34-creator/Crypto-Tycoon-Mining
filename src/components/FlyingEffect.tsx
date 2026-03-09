/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Effect {
    id: number;
    x: number;
    y: number;
    value: string;
}

export default function FlyingEffect() {
    const [effects, setEffects] = useState<Effect[]>([]);

    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            // We'll listen for a custom event or check if we should trigger here
            // For now, let's use a custom event dispatched from the BTC3D component
        };

        const handleTrigger = (e: any) => {
            const { x, y, value } = e.detail;
            const id = Date.now() + Math.random();
            setEffects(prev => [...prev, { id, x, y, value }]);

            // Auto cleanup
            setTimeout(() => {
                setEffects(prev => prev.filter(eff => eff.id !== id));
            }, 1000);
        };

        window.addEventListener('mining-click', handleTrigger);
        return () => window.removeEventListener('mining-click', handleTrigger);
    }, []);

    return (
        <div className="fixed inset-0 z-[600] pointer-events-none select-none">
            <AnimatePresence>
                {effects.map(eff => (
                    <motion.div
                        key={eff.id}
                        initial={{ opacity: 1, y: eff.y - 20, x: eff.x - 20, scale: 0.5 }}
                        animate={{ opacity: 0, y: eff.y - 120, x: eff.x + (Math.random() - 0.5) * 40, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        className="absolute pointer-events-none"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-emerald-400 font-black text-lg drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                                {eff.value}
                            </span>
                            <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
