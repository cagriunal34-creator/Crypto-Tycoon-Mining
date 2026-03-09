import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Zap, Thermometer, ShieldCheck, ArrowUpCircle, Info } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { FarmSettings, OwnedContract } from '../types';

export const InfrastructureScreen: React.FC = () => {
    const { state, dispatch } = useGame();
    const { farmSettings, tycoonPoints, ownedContracts } = state;

    const handleRepairContract = (c: OwnedContract) => {
        const cost = Math.floor((100 - c.condition) * 5); // 5 TP per 1% health
        if (tycoonPoints >= cost && c.condition < 100) {
            dispatch({ type: 'REPAIR_CONTRACT', contractId: c.id, cost });
        }
    };

    const handleUpgrade = (target: 'cooling' | 'power') => {
        const cost = target === 'cooling'
            ? farmSettings.coolingLevel * 2500
            : farmSettings.powerSupplyLevel * 3000;

        if (tycoonPoints >= cost) {
            dispatch({ type: 'UPGRADE_INFRASTRUCTURE', target, cost });
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="text-yellow-400" /> Altyapı ve Bakım
                    </h2>
                    <p className="text-zinc-400 text-sm">Sistem sağlığını yönetin ve altyapınızı güçlendirin.</p>
                </div>
                <div className="px-4 py-2 glass-panel rounded-xl text-right">
                    <div className="text-xs text-zinc-500 uppercase">Bakım Fonu</div>
                    <div className="text-xl font-bold text-yellow-500">{tycoonPoints.toLocaleString()} TP</div>
                </div>
            </div>

            {/* Infrastructure Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cooling System */}
                <div className="glass-card p-5 relative overflow-hidden group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Thermometer className="text-blue-400 w-6 h-6" />
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-zinc-500">Seviye {farmSettings.coolingLevel}</div>
                            <div className="font-bold text-blue-400">Soğutma Sistemi</div>
                        </div>
                    </div>
                    <p className="text-sm text-zinc-400 mb-6">
                        Rastgele ısınmaları azaltır ve cihazların ömrünü uzatır.
                    </p>
                    <button
                        onClick={() => handleUpgrade('cooling')}
                        disabled={tycoonPoints < farmSettings.coolingLevel * 2500}
                        className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <ArrowUpCircle className="w-4 h-4" />
                        {(farmSettings.coolingLevel * 2500).toLocaleString()} TP ile Yükselt
                    </button>
                </div>

                {/* Power Supply */}
                <div className="glass-card p-5 relative overflow-hidden group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-yellow-500/20 rounded-xl">
                            <Zap className="text-yellow-400 w-6 h-6" />
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-zinc-500">Seviye {farmSettings.powerSupplyLevel}</div>
                            <div className="font-bold text-yellow-400">Güç Kaynağı</div>
                        </div>
                    </div>
                    <p className="text-sm text-zinc-400 mb-6">
                        Elektrik maliyetlerini %10 düşürür ve grid kararlılığını artırır.
                    </p>
                    <button
                        onClick={() => handleUpgrade('power')}
                        disabled={tycoonPoints < farmSettings.powerSupplyLevel * 3000}
                        className="w-full py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <ArrowUpCircle className="w-4 h-4" />
                        {(farmSettings.powerSupplyLevel * 3000).toLocaleString()} TP ile Yükselt
                    </button>
                </div>
            </div>

            {/* Equipment Maintenance List */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-emerald-400" /> Ekipman Durumu
                </h3>

                <div className="space-y-4">
                    {ownedContracts.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                            <Info className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            Aktif sözleşme bulunmuyor.
                        </div>
                    ) : (
                        ownedContracts.map(c => {
                            const repairCost = Math.floor((100 - c.condition) * 5);
                            return (
                                <div key={c.id} className="p-4 bg-zinc-900/50 rounded-xl border border-white/5 flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold">{c.name}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.tier === 'Gold' ? 'border-yellow-500/50 text-yellow-500' :
                                                c.tier === 'Silver' ? 'border-zinc-400/50 text-zinc-400' :
                                                    'border-orange-500/50 text-orange-400'
                                                }`}>
                                                {c.tier}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${c.condition}%` }}
                                                className={`h-full ${c.condition > 70 ? 'bg-emerald-500' :
                                                    c.condition > 30 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] text-zinc-500">Sağlık: %{c.condition.toFixed(1)}</span>
                                            <span className="text-[10px] text-zinc-500">Verimlilik: %{c.condition > 90 ? '100' : c.condition.toFixed(0)}</span>
                                        </div>
                                    </div>

                                    <div className="ml-6">
                                        <button
                                            onClick={() => handleRepairContract(c)}
                                            disabled={tycoonPoints < repairCost || c.condition >= 99.5}
                                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-bold transition-all disabled:opacity-30 flex items-center gap-2"
                                        >
                                            <Wrench className="w-3.5 h-3.5" />
                                            {repairCost > 0 ? `${repairCost} TP` : 'Tam'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Technical Log */}
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex gap-3">
                <ShieldCheck className="text-orange-400 shrink-0" />
                <p className="text-xs text-orange-300/80 leading-relaxed">
                    <strong>Teknik Not:</strong> Donanım sağlığı %90'ın altına düştüğünde madencilik verimliliği azalmaya başlar.
                    Kritik seviyelerde (%20 altı) donanım tamamen durabilir veya kalıcı hasar alabilir.
                </p>
            </div>
        </div>
    );
};
