import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Zap, Clock, CheckCircle2, AlertCircle, Briefcase, Trophy, ChevronRight } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { cn } from '../lib/utils';
import { useNotify } from '../context/NotificationContext';

export default function ContractsScreen() {
    const { state, dispatch } = useGame();
    const { notify } = useNotify();

    const AVAILABLE_JOBS = state.availableJobs || [];

    const handleAccept = (job: typeof AVAILABLE_JOBS[0]) => {
        // Check if player meets hashrate requirement to even start? 
        // Or just let them start and fail/progress slowly?
        // Let's allow starting if they have at least 50% of it.
        if (state.totalHashRate < job.goalHash * 0.5) {
            notify({ type: 'warning', title: 'Yetersiz Donanım', message: 'Bu kontratı kabul edebilmek için hashrate kapasiteni artırmalısın.' });
            return;
        }

        const now = Date.now();
        dispatch({
            type: 'ACCEPT_CONTRACT',
            contract: {
                id: `${job.id}-${now}`,
                label: job.label,
                goalHash: job.goalHash,
                reward: job.reward,
                startedAt: now,
                endsAt: now + (job.duration * 1000)
            }
        });

        notify({ type: 'success', title: 'Kontrat Onaylandı', message: `${job.client} ile çalışmaya başladın.` });
    };

    const activeContracts = state.activeContracts || [];

    return (
        <div className="flex flex-col h-full space-y-6 pt-2 pb-12">
            {/* Header Section */}
            <div className="flex items-center gap-4 px-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <Briefcase className="text-indigo-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Aktif İşler</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Kurumsal Kontrat Merkezi</p>
                </div>
            </div>

            {/* Active Jobs Progress Area */}
            {activeContracts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <Clock size={12} /> Yürütülen Operasyonlar
                    </h3>
                    <div className="grid gap-4">
                        {activeContracts.map((contract) => {
                            const now = Date.now();
                            const progress = Math.min(100, ((now - contract.startedAt) / (contract.endsAt - contract.startedAt)) * 100);
                            const isFinished = now >= contract.endsAt;
                            const meetsRequirements = state.totalHashRate >= contract.goalHash;

                            return (
                                <div
                                    key={contract.id}
                                    className={cn(
                                        "relative overflow-hidden rounded-3xl p-5 border transition-all duration-300",
                                        isFinished ? "bg-emerald-500/5 border-emerald-500/30" : "bg-white/5 border-white/5 shadow-xl"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{contract.label}</h4>
                                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Hedef: {contract.goalHash} GH/s</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-emerald-500">+{contract.reward.toFixed(11)} BTC</div>
                                            <div className="text-[9px] text-zinc-500 font-bold uppercase">Reward</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                                            <span className={meetsRequirements ? "text-emerald-500" : "text-orange-400"}>
                                                {meetsRequirements ? 'Hashrate Stabil' : 'Hashrate Düşük!'}
                                            </span>
                                            <span className="text-zinc-500">{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[2px]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className={cn("h-full rounded-full transition-colors", isFinished ? "bg-emerald-500" : "bg-indigo-500")}
                                            />
                                        </div>
                                    </div>

                                    {isFinished && (
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => dispatch({ type: 'COMPLETE_CONTRACT', contractId: contract.id })}
                                            className="w-full mt-4 py-3 rounded-2xl bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                        >
                                            Ödülü Al & Tamamla
                                        </motion.button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Available Jobs List */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-2">Kullanılabilir Fırsatlar</h3>
                <div className="grid gap-3">
                    {AVAILABLE_JOBS.map((job) => {
                        const isAlreadyActive = activeContracts.some(ac => ac.id.startsWith(job.id));

                        return (
                            <div
                                key={job.id}
                                className={cn(
                                    "group relative overflow-hidden rounded-3xl p-5 border transition-all duration-300 bg-zinc-900/40 border-white/5",
                                    isAlreadyActive ? "opacity-50 pointer-events-none" : "hover:border-zinc-700 hover:bg-zinc-800/40"
                                )}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/5 uppercase tracking-widest">
                                                {job.client}
                                            </span>
                                            {state.totalHashRate >= job.goalHash && (
                                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">Uyumlu</span>
                                            )}
                                        </div>
                                        <h4 className="text-base font-black text-white">{job.label}</h4>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-emerald-500">{job.reward.toFixed(11)} BTC</div>
                                        <p className="text-[9px] text-zinc-500 font-bold uppercase">{Math.floor(job.duration / 60)} dakika</p>
                                    </div>
                                </div>

                                <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">{job.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-zinc-500 font-bold uppercase">Gereksinim</span>
                                            <span className="text-xs font-black text-white">{job.goalHash} GH/s</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAccept(job)}
                                        className="px-6 py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                                    >
                                        Kontratı Başlat
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Empty State / Footer */}
            <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-4">
                <Trophy className="text-indigo-400 shrink-0" size={24} />
                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                    Kurumsal kontratları tamamlayarak saygınlığını artır. Prestij seviyen yükseldikçe daha yüksek ödüllü işler merkezimize eklenecektir.
                </p>
            </div>
        </div>
    );
}
