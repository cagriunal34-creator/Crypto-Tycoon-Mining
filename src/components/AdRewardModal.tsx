import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Gift, Timer, Zap, Bitcoin, Database, CheckCircle2 } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';

export default function AdRewardModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { state, dispatch, formatBtc } = useGame();
    const { notify } = useNotify();
    const [adState, setAdState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [timeLeft, setTimeLeft] = useState(15);

    const cooldownRemaining = Math.max(0, state.adCooldown - (Date.now() - state.lastAdWatchTime));
    const isReady = cooldownRemaining === 0;

    useEffect(() => {
        let interval: any;
        if (adState === 'playing' && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setAdState('finished');
        }
        return () => clearInterval(interval);
    }, [adState, timeLeft]);

    const startAd = () => {
        if (!isReady) return;

        // Google Adsense Rewarded Ad Integration
        try {
            const adsbygoogle = (window as any).adsbygoogle || [];
            if (adsbygoogle.push) {
                setAdState('playing');
                setTimeLeft(15); // Fallback timer or loading indicator

                adsbygoogle.push({
                    google_ad_client: "ca-pub-6329108306834809",
                    enable_page_level_ads: true,
                    google_ad_modality: "rewarded",
                    google_ad_unit_id: state.rewardedAdUnitId.split('/')[1] || state.rewardedAdUnitId,
                    onReward: (reward: any) => {
                        console.info('Ad reward granted:', reward);
                        setAdState('finished');
                    },
                    onFailure: (reason: any) => {
                        console.error('Ad failed to load:', reason);
                        // Fallback to simulation if ad fails to load (optional, but good for UX)
                        // setAdState('idle'); 
                    }
                });
            } else {
                // Fallback to simulation if adsbygoogle is not ready
                setAdState('playing');
                setTimeLeft(15);
            }
        } catch (e) {
            console.error('Ad error:', e);
            setAdState('playing'); // Fallback to simulation
            setTimeLeft(15);
        }
    };

    const claimReward = () => {
        dispatch({ type: 'WATCH_AD' });
        notify({
            type: 'success',
            title: 'Ödül Alındı!',
            message: `Enerji hücrelerin yenilendi ve ödüller hesabına eklendi.`
        });
        setAdState('idle');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={adState !== 'playing' ? onClose : undefined}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-emerald-500 shadow-xl shadow-emerald-500/20">
                                <Gift size={20} className="text-black" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tighter">Ödüllü Reklam</h3>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">İzle ve Kazan</p>
                            </div>
                        </div>
                        {adState !== 'playing' && (
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-500 transition-colors">
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="p-8 space-y-8">
                        {adState === 'idle' && (
                            <div className="text-center space-y-6">
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                                    <div className="relative w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto border border-white/10">
                                        <Play size={40} className="text-emerald-500 ml-1" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xl font-black text-white">Hazır mısın?</h4>
                                    <p className="text-sm text-zinc-400 max-w-[280px] mx-auto font-medium">
                                        Kısa bir reklam izleyerek büyük ödüller kazanabilirsin!
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                                        <div className="flex items-center gap-2 text-orange-500 mb-1">
                                            <Bitcoin size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Para Ödülü</span>
                                        </div>
                                        <p className="text-sm font-black text-white">{formatBtc(state.adRewardBtc)} BTC</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                                        <div className="flex items-center gap-2 text-blue-500 mb-1">
                                            <Database size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">TP Ödülü</span>
                                        </div>
                                        <p className="text-sm font-black text-white">+{state.adRewardTp} TP</p>
                                    </div>
                                </div>

                                <button
                                    onClick={startAd}
                                    disabled={!isReady}
                                    className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${isReady
                                            ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20'
                                            : 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed'
                                        }`}
                                >
                                    {isReady ? (
                                        <>
                                            <Play size={18} fill="currentColor" />
                                            Reklamı Başlat
                                        </>
                                    ) : (
                                        <>
                                            <Timer size={18} />
                                            {Math.ceil(cooldownRemaining / 60000)} Dakika Bekle...
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {adState === 'playing' && (
                            <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                                <div className="relative aspect-video rounded-2xl bg-black border border-white/10 overflow-hidden flex items-center justify-center group">
                                    {/* Simulated Video UI */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />

                                    {/* Placeholder Ad Content */}
                                    <div className="text-center space-y-4 z-20">
                                        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 animate-bounce">
                                            <Zap size={32} className="text-black" />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black uppercase tracking-widest text-white">Ad-Tycoon v2.0</h5>
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Yakında Play Store'da!</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 z-30">
                                        <motion.div
                                            initial={{ width: '0%' }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 15, ease: "linear" }}
                                            className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                        />
                                    </div>

                                    {/* Timer Badge */}
                                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-white flex items-center gap-2 z-30">
                                        <Timer size={12} className="text-emerald-500" />
                                        {timeLeft}s
                                    </div>
                                </div>

                                <div className="text-center space-y-2">
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Lütfen Bekleyin...</p>
                                    <p className="text-[10px] text-zinc-600 font-medium italic">Reklam bitmek üzere, sayfayı kapatmayın.</p>
                                </div>
                            </div>
                        )}

                        {adState === 'finished' && (
                            <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/40 blur-[80px] rounded-full" />
                                    <div className="relative w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', damping: 10 }}
                                        >
                                            <CheckCircle2 size={56} className="text-black" />
                                        </motion.div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-2xl font-black text-white">Tebrikler!</h4>
                                    <p className="text-sm text-zinc-400 font-medium">Reklam bitti ve ödüllerin hazır.</p>
                                </div>

                                <button
                                    onClick={claimReward}
                                    className="w-full py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Gift size={18} fill="currentColor" />
                                    Ödülleri Al
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
