/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { Zap } from 'lucide-react';

export default function FeverOverlay() {
    const { state } = useGame();
    const isFever = state.isFeverMode;

    return (
        <AnimatePresence>
            {isFever && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
                >
                    {/* Pulsing Red/Gold Vignette */}
                    <motion.div
                        animate={{
                            boxShadow: [
                                'inset 0 0 100px rgba(239, 68, 68, 0.4)',
                                'inset 0 0 200px rgba(245, 158, 11, 0.6)',
                                'inset 0 0 100px rgba(239, 68, 68, 0.4)'
                            ]
                        }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0"
                    />

                    {/* Speed Lines / Particles */}
                    <div className="absolute inset-0 opacity-30">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ top: `${Math.random() * 100}%`, left: '-10%' }}
                                animate={{ left: '110%' }}
                                transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, ease: "linear", delay: Math.random() }}
                                className="absolute h-px w-32 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
                            />
                        ))}
                    </div>

                    {/* Fever Banner */}
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="absolute top-24 left-0 right-0 flex flex-col items-center gap-2"
                    >
                        <div className="bg-red-600 text-white px-6 py-2 rounded-full font-black text-2xl shadow-[0_0_30px_rgba(220,38,38,0.8)] border-2 border-yellow-400 flex items-center gap-3">
                            <Zap size={24} fill="currentColor" className="animate-bounce" />
                            <span className="tracking-tighter italic">FEVER MODE: 10X!</span>
                            <Zap size={24} fill="currentColor" className="animate-bounce" />
                        </div>

                        {/* Countdown bar */}
                        <div className="w-48 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
                            <motion.div
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: 8, ease: "linear" }}
                                className="h-full bg-yellow-400 shadow-[0_0_10px_#facc15]"
                            />
                        </div>
                    </motion.div>

                    {/* Screen Flash on trigger */}
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-white z-[110]"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
