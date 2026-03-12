import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, AlertCircle, Play } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';

export default function LowEnergyAdBanner({ onWatchAd }: { onWatchAd: () => void }) {
  const { state } = useGame();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [lastDismissed, setLastDismissed] = useState(0);

  const a1 = theme.vars['--ct-a1'];
  const energyPercentage = Math.round((state.energyCells / state.maxEnergyCells) * 100);

  useEffect(() => {
    // Show if energy < 20% and not dismissed in last 30 mins
    if (energyPercentage < 20 && Date.now() - lastDismissed > 1800000) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [energyPercentage, lastDismissed]);

  const handleAction = () => {
    onWatchAd();
    setIsVisible(false);
    setLastDismissed(Date.now());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[60] max-w-md mx-auto"
        >
          <div 
            className="rounded-2xl p-4 flex items-center justify-between shadow-2xl overflow-hidden relative"
            style={{ 
              background: '#080808f0', 
              backdropFilter: 'blur(12px)',
              border: '1px solid #f59e0b40',
              boxShadow: '0 -8px 32px rgba(245, 158, 11, 0.15)'
            }}
          >
            {/* Glow effect */}
            <div className="absolute -left-8 -top-8 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse">
                <AlertCircle size={20} className="text-amber-500" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Enerji Kritik!</h4>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                  Reklam izle — Enerji anında %100 dolsun
                </p>
              </div>
            </div>

            <button
              onClick={handleAction}
              className="px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <Play size={10} fill="currentColor" />
              DOLDUR
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
