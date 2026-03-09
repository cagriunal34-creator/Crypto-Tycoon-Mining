import React, { useState } from 'react';
import {
    ShieldCheck,
    Terminal,
    Users,
    Zap,
    Bitcoin,
    Cpu,
    RefreshCw,
    Play,
    TrendingUp,
    Database,
    ArrowRight,
    X
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
    const { state, dispatch } = useGame();
    const { theme } = useTheme();
    const { notify } = useNotify();
    const [activeTab, setActiveTab] = useState<'overview' | 'economy' | 'users' | 'events'>('overview');

    const handleSetBtc = (val: string) => {
        const num = parseFloat(val);
        if (!isNaN(num)) dispatch({ type: 'ADMIN_SET_BTC', amount: num });
    };

    const handleSetTp = (val: string) => {
        const num = parseInt(val);
        if (!isNaN(num)) dispatch({ type: 'ADMIN_SET_TP', amount: num });
    };

    const triggerEvent = (type: any) => {
        dispatch({ type: 'ADMIN_TRIGGER_EVENT', eventType: type });
        notify({ type: 'success', title: 'Admin Etkinliği', message: `${type} başarıyla başlatıldı.` });
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24 space-y-8 max-w-md mx-auto relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-500/20">
                        <ShieldCheck size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter">Admin Panel</h1>
                        <p className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">Root Access Granted</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 relative z-10 shrink-0">
                {(['overview', 'economy', 'users', 'events'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                            : 'text-zinc-500 hover:text-white'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 relative z-10">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard label="BTC Bakiyesi" value={state.btcBalance.toFixed(8)} icon={<Bitcoin size={16} />}
                                color="orange" />
                            <StatCard label="TP Bakiyesi" value={state.tycoonPoints.toLocaleString()} icon={<Database size={16} />} color="blue" />
                            <StatCard label="Seviye" value={state.level.toString()} icon={<TrendingUp size={16} />} color="emerald" />
                            <StatCard label="Enerji" value={`${Math.floor(state.energyCells)}/${state.maxEnergyCells}`} icon={<Zap size={16} />} color="yellow" />
                        </div>
                    </div>
                )}

                {activeTab === 'economy' && (
                    <div className="space-y-6">
                        <InputGroup
                            label="BTC Bakiyesini Ayarla"
                            placeholder="0.00000000"
                            value={state.btcBalance.toString()}
                            onChange={handleSetBtc}
                            icon={<Bitcoin size={18} />}
                        />
                        <InputGroup
                            label="TP Bakiyesini Ayarla"
                            placeholder="1000"
                            value={state.tycoonPoints.toString()}
                            onChange={handleSetTp}
                            icon={<Database size={18} />}
                        />
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 px-2">Manuel Etkinlik Tetikle</h2>
                        <div className="grid gap-3">
                            <EventButton
                                label="Flash Pool"
                                desc="1.5x BTC Kazancı (15 dk)"
                                onTrigger={() => triggerEvent('flash_pool')}
                                color="emerald"
                            />
                            <EventButton
                                label="Hash Storm"
                                desc="+500 GH/s Hız (15 dk)"
                                onTrigger={() => triggerEvent('hash_storm')}
                                color="blue"
                            />
                            <EventButton
                                label="Energy Surge"
                                desc="Full Enerji Yenileme"
                                onTrigger={() => triggerEvent('energy_surge')}
                                color="yellow"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <InputGroup
                                label="Seviye Belirle"
                                placeholder="3"
                                value={state.level.toString()}
                                onChange={(val) => dispatch({ type: 'ADMIN_SET_LEVEL', level: parseInt(val) || 1 })}
                                icon={<TrendingUp size={18} />}
                            />
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <button
                                onClick={() => {
                                    if (window.confirm('TÜM VERİLER SIFIRLANACAK! Emin misiniz?')) dispatch({ type: 'ADMIN_RESET_GAME' });
                                }}
                                className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                            >
                                <RefreshCw size={16} />
                                Tüm Oyunu Sıfırla
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
    const colors: any = {
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    };

    return (
        <div className={`p-4 rounded-3xl border ${colors[color]} space-y-2`}>
            <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-lg bg-current/10">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-[9px] uppercase font-black opacity-60">{label}</p>
                <p className="text-sm font-black truncate">{value}</p>
            </div>
        </div>
    );
}

function InputGroup({ label, placeholder, value, onChange, icon }: { label: string, placeholder: string, value: string, onChange: (v: string) => void, icon: React.ReactNode }) {
    const [val, setVal] = useState(value);

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{label}</label>
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    {icon}
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-20 text-sm font-bold focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                    onClick={() => onChange(val)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                >
                    Uygula
                </button>
            </div>
        </div>
    );
}

function EventButton({ label, desc, onTrigger, color }: { label: string, desc: string, onTrigger: () => void, color: string }) {
    const colors: any = {
        emerald: 'bg-emerald-600',
        blue: 'bg-blue-600',
        yellow: 'bg-yellow-600',
    };

    return (
        <button
            onClick={onTrigger}
            className="group w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between active:scale-[0.98]"
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center text-white shadow-lg`}>
                    <Play size={18} fill="currentColor" />
                </div>
                <div className="text-left">
                    <h4 className="text-xs font-black uppercase tracking-wider">{label}</h4>
                    <p className="text-[10px] text-zinc-500 font-bold">{desc}</p>
                </div>
            </div>
            <ArrowRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
        </button>
    );
}
