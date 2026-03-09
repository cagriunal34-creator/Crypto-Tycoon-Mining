import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Microscope, Zap, Thermometer, Cpu, Flame, Lock, Check, Info, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { cn } from '../lib/utils';
import { useNotify } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

interface TechNode {
    id: string;
    label: string;
    description: string;
    cost: number;
    icon: React.ElementType;
    position: { x: number; y: number };
    dependencies: string[];
    effect: string;
}

const TECH_NODES: TechNode[] = [
    { id: 'mining-1', label: 'Optimize Algoritma', description: 'Madencilik algoritmalarını optimize ederek temel hızı artır.', cost: 5000, icon: Cpu, position: { x: 200, y: 50 }, dependencies: [], effect: '+%10 Temel Hashrate' },
    { id: 'cooling-1', label: 'Sıvı Soğutma', description: 'Daha verimli soğutma ile rig sıcaklığını düşür.', cost: 8000, icon: Thermometer, position: { x: 100, y: 150 }, dependencies: ['mining-1'], effect: '-%15 Isınma Oranı' },
    { id: 'power-1', label: 'Düşük Gerilim', description: 'Voltaj dengeleme ile enerji verimliliğini artır.', cost: 8000, icon: Zap, position: { x: 300, y: 150 }, dependencies: ['mining-1'], effect: '-%20 Enerji Tüketimi' },
    { id: 'fever-1', label: 'Yüksek Akım', description: 'Fever Mode sırasında elektron akışını maksimize et.', cost: 15000, icon: Flame, position: { x: 200, y: 250 }, dependencies: ['cooling-1', 'power-1'], effect: '+3sn Fever Mode Süresi' },
    { id: 'mining-2', label: 'Kuantum Çipler', description: 'Geleneksel ASIC yerine kuantum işlemcilere geçiş.', cost: 50000, icon: Cpu, position: { x: 200, y: 350 }, dependencies: ['fever-1'], effect: '+%50 Toplam Hashrate' },
];

export default function ResearchTree() {
    const { state, dispatch } = useGame();
    const { notify } = useNotify();
    const { theme } = useTheme();
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const a1 = theme.vars['--ct-a1'];

    const isUnlocked = (id: string) => state.researchedNodes.includes(id);
    const canUnlock = (node: TechNode) => {
        if (isUnlocked(node.id)) return false;
        return node.dependencies.every(depId => isUnlocked(depId));
    };

    const handleUnlock = (node: TechNode) => {
        if (state.tycoonPoints < node.cost) {
            notify({ type: 'warning', title: 'Yetersiz TP', message: `${node.cost - state.tycoonPoints} TP daha gerekiyor.` });
            return;
        }
        dispatch({ type: 'UNLOCK_RESEARCH', nodeId: node.id, cost: node.cost });
        notify({ type: 'success', title: 'Teknoloji Açıldı', message: `${node.label} başarıyla uygulandı.` });
        setSelectedNodeId(null);
    };

    const selectedNode = TECH_NODES.find(n => n.id === selectedNodeId);

    return (
        <div className="flex flex-col h-full space-y-4 pt-2 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 px-1">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Microscope className="text-purple-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Teknoloji Ağacı</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Kalıcı İmparatorluk Geliştirmeleri</p>
                </div>
            </div>

            <div className="relative flex-1 bg-black/40 rounded-[2.5rem] border border-white/5 overflow-hidden min-h-[500px]">
                {/* SVG Connections Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {TECH_NODES.map(node => node.dependencies.map(depId => {
                        const dep = TECH_NODES.find(n => n.id === depId);
                        if (!dep) return null;
                        const unlocked = isUnlocked(node.id) && isUnlocked(dep.id);
                        return (
                            <line
                                key={`${dep.id}-${node.id}`}
                                x1={dep.position.x} y1={dep.position.y}
                                x2={node.position.x} y2={node.position.y}
                                stroke={unlocked ? a1 : "rgba(255,255,255,0.05)"}
                                strokeWidth="2"
                                strokeDasharray={unlocked ? "" : "4,4"}
                            />
                        );
                    }))}
                </svg>

                {/* Nodes Grid */}
                <div className="relative w-full h-full overflow-auto p-12">
                    {TECH_NODES.map((node) => {
                        const unlocked = isUnlocked(node.id);
                        const available = canUnlock(node);
                        const NodeIcon = node.icon;

                        return (
                            <motion.button
                                key={node.id}
                                initial={false}
                                animate={{
                                    boxShadow: node.id === selectedNodeId ? `0 0 20px ${a1}40` : "0 0 0px transparent",
                                    borderColor: unlocked ? a1 : available ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)"
                                }}
                                className={cn(
                                    "absolute w-14 h-14 rounded-2xl border flex items-center justify-center transition-all bg-zinc-900 shadow-xl z-10",
                                    !unlocked && !available && "grayscale opacity-40"
                                )}
                                style={{ left: node.position.x - 28, top: node.position.y - 28 }}
                                onClick={() => setSelectedNodeId(node.id)}
                            >
                                {unlocked ? (
                                    <Check size={20} className="text-emerald-500" />
                                ) : !available ? (
                                    <Lock size={16} className="text-zinc-600" />
                                ) : (
                                    <NodeIcon size={20} className="text-white" />
                                )}

                                {available && !unlocked && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping" />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Node Detail Info Overlay */}
                <AnimatePresence>
                    {selectedNodeId && selectedNode && (
                        <motion.div
                            initial={{ y: 200, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 200, opacity: 0 }}
                            className="absolute bottom-4 left-4 right-4 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 z-30 shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                        <selectedNode.icon size={20} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{selectedNode.label}</h4>
                                        <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">{selectedNode.effect}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedNodeId(null)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500">
                                    <X size={16} />
                                </button>
                            </div>

                            <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-medium">{selectedNode.description}</p>

                            <div className="flex gap-4">
                                <div className="flex-1 flex flex-col justify-center">
                                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Gereken Yatırım</span>
                                    <span className="text-lg font-black text-white">{selectedNode.cost.toLocaleString()} <span className="text-xs text-zinc-500">TP</span></span>
                                </div>
                                {isUnlocked(selectedNode.id) ? (
                                    <div className="px-8 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 overflow-hidden">
                                        <Check size={16} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">TAMAMLANDI</span>
                                    </div>
                                ) : (
                                    <button
                                        disabled={!canUnlock(selectedNode)}
                                        onClick={() => handleUnlock(selectedNode)}
                                        className={cn(
                                            "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            canUnlock(selectedNode)
                                                ? "bg-white text-black hover:bg-zinc-200 active:scale-95"
                                                : "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed"
                                        )}
                                    >
                                        {!canUnlock(selectedNode) ? 'KİLİTLİ' : 'ARAŞTIR'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Info size={14} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Yatırım havuzu: {state.tycoonPoints.toLocaleString()} TP</span>
                </div>
                <span className="text-[10px] text-purple-400 font-black uppercase italic">Mastery: {(state.researchedNodes.length / TECH_NODES.length * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
}
