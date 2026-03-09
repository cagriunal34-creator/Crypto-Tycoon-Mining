/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { useGame } from '../context/GameContext';

export default function BTC3D() {
    const { state } = useGame();

    return (
        <div
            className="relative w-40 h-40 [perspective:1000px] flex items-center justify-center transition-transform"
        >
            <motion.div
                animate={{
                    rotateY: [0, 360],
                    y: [-10, 0, -10],
                    scale: state.comboCount >= 20 ? [1, 1.05, 1] : 1
                }}
                transition={{
                    rotateY: { duration: 10, repeat: Infinity, ease: "linear" },
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
                }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative w-24 h-24"
            >
                {/* Visual Pop Layer */}
                <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
                    {/* Front face */}
                    <div
                        className={`absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border-4 border-yellow-200/50 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] ${state.comboCount >= 20 ? 'shadow-red-500/50' : ''}`}
                        style={{ transform: 'translateZ(10px)' }}
                    >
                        <span className={`text-5xl font-black text-amber-900 drop-shadow-lg ${state.comboCount >= 20 ? 'animate-bounce' : ''}`}>₿</span>
                    </div>

                    {/* Back face */}
                    <div
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-600 via-amber-700 to-yellow-800 border-4 border-yellow-400/30 flex items-center justify-center"
                        style={{ transform: 'rotateY(180deg) translateZ(10px)' }}
                    >
                        <span className="text-5xl font-black text-amber-950 drop-shadow-lg">₿</span>
                    </div>

                    {/* Edge / Depth (simulated with fewer layers for smaller size) */}
                    {[...Array(16)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute inset-0 rounded-full bg-amber-700/80"
                            style={{ transform: `translateZ(${i - 8}px)` }}
                        />
                    ))}
                </motion.div>

                {/* Outer Glow Ring */}
                <div
                    className={`absolute inset-[-15px] rounded-full border border-yellow-500/10 animate-pulse ${state.comboCount >= 20 ? 'border-red-500/20' : ''}`}
                    style={{ transform: 'translateZ(-20px)' }}
                />
            </motion.div>

            {/* Dynamic Base Shadow */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-2 w-20 h-3 bg-black/60 blur-xl rounded-full"
            />
        </div>
    );
}
