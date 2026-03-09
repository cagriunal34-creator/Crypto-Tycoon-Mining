import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Zap, Thermometer, ShieldAlert, Cpu as RigIcon, ChevronRight, X, Cog } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

export default function MiningFarm() {
  const { state, dispatch } = useGame();
  const { theme } = useTheme();
  const [selectedRigId, setSelectedRigId] = useState<number | null>(null);

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const rigs = state.farmSettings.rigStatuses.slice(0, 48);
  const activeCount = state.farmSettings.activeRigs;

  const handleRigClick = (id: number) => {
    setSelectedRigId(id);
  };

  const selectedRig = rigs.find(r => r.id === selectedRigId);

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 overflow-hidden">
      {/* Header Info */}
      <div className="p-6 border-b border-white/5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Cpu className="text-emerald-500" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Maden Çiftliği</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Kapasite: {activeCount}/48 Ünite</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[9px] text-zinc-500 font-bold uppercase">Şebeke Yükü</p>
              <div className="flex items-center gap-1.5 justify-end">
                <Zap size={10} className="text-yellow-500" />
                <span className="text-xs font-black text-white">{((activeCount / 48) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="grid grid-cols-6 gap-2">
          {rigs.map((rig, idx) => {
            const isActive = idx < activeCount;
            const isBroken = rig.isBroken;
            const isHot = rig.heat > 80;

            return (
              <motion.button
                key={rig.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRigClick(rig.id)}
                className={cn(
                  "relative aspect-square rounded-xl border flex flex-col items-center justify-center transition-all overflow-hidden bg-zinc-900/50",
                  idx === selectedRigId ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "border-white/5",
                  !isActive && "opacity-20 grayscale",
                  isActive && isBroken && "border-red-500/50 bg-red-500/5",
                  isActive && !isBroken && isHot && "border-orange-500/50 bg-orange-500/5"
                )}
              >
                {/* Status LED */}
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]",
                        isBroken ? "text-red-500 bg-red-500" : isHot ? "text-orange-500 bg-orange-500 animate-pulse" : "text-emerald-500 bg-emerald-500"
                      )}
                    />
                  </div>
                )}

                <RigIcon
                  size={20}
                  className={cn(
                    "mb-1",
                    !isActive ? "text-zinc-700" : isBroken ? "text-red-500" : isHot ? "text-orange-500" : "text-zinc-400"
                  )}
                />

                <span className="text-[8px] font-black tracking-tighter text-zinc-600 block">
                  #{String(rig.id + 1).padStart(2, '0')}
                </span>

                {/* Scanline Effect if active */}
                {isActive && !isBroken && (
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%]" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Detailed Centered Modal for Rig (Portaled) */}
      {createPortal(
        <AnimatePresence>
          {selectedRigId !== null && selectedRig && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            >
              <div className="w-full max-w-md mx-auto flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.9, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 30 }}
                  className="w-full max-w-[360px] bg-zinc-900 rounded-[2.5rem] border border-white/10 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden"
                >
                  <div className="p-5 border-b border-white/5 flex items-center justify-between bg-emerald-500/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <RigIcon className="text-emerald-500" size={16} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Ünite Detayları</span>
                    </div>
                    <button onClick={() => setSelectedRigId(null)} className="p-2 mr-[-4px] rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <div className="text-center">
                      <div className="inline-flex w-16 h-16 rounded-2xl bg-zinc-800 border border-white/5 items-center justify-center mb-3">
                        <RigIcon size={32} className={selectedRig.isBroken ? "text-red-500" : "text-emerald-500"} />
                      </div>
                      <h3 className="text-lg font-black text-white">{selectedRig.serialNumber}</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Sıra No: {selectedRig.id + 1}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1 text-zinc-400">Durum</p>
                        <p className={cn("text-xs font-black uppercase", selectedRig.isBroken ? "text-red-500" : "text-emerald-500")}>
                          {selectedRig.isBroken ? 'Arızalı' : 'Aktif'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1 text-zinc-400">Verim</p>
                        <p className="text-xs font-black text-white">%{selectedRig.efficiency}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                          <span className="text-zinc-500 flex items-center gap-1"><Thermometer size={12} /> Sıcaklık</span>
                          <span className={cn(selectedRig.heat > 80 ? "text-red-500" : selectedRig.heat > 60 ? "text-orange-400" : "text-emerald-500")}>
                            {selectedRig.heat.toFixed(1)}°C
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedRig.heat}%` }}
                            className={cn("h-full", selectedRig.heat > 80 ? "bg-red-500" : selectedRig.heat > 60 ? "bg-orange-400" : "bg-emerald-500")}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                          <span className="text-zinc-500 flex items-center gap-1"><ShieldAlert size={12} /> Kondisyon</span>
                          <span className="text-white">{selectedRig.condition.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedRig.condition}%` }}
                            style={{ background: a1 }}
                            className="h-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          dispatch({
                            type: 'UPDATE_FARM',
                            settings: {
                              rigStatuses: state.farmSettings.rigStatuses.map(r =>
                                r.id === selectedRig.id ? { ...r, isBroken: false, condition: 100 } : r
                              )
                            }
                          });
                          setSelectedRigId(null);
                        }}
                        className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-emerald-400 transition-all active:scale-[0.98]"
                      >
                        <Cog size={16} />
                        Ünite Bakımı
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
