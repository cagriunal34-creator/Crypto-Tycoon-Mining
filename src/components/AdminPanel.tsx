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
import { supabase, TABLES } from '../lib/supabase';
import { Download, Upload, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
    const { state, dispatch, adminSetBtc, adminSetTp, adminSetLevel, adminTriggerEvent } = useGame();
    const { theme } = useTheme();
    const { notify } = useNotify();
    const [activeTab, setActiveTab] = useState<'overview' | 'economy' | 'users' | 'events' | 'withdrawals'>('overview');
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

    const triggerEvent = async (type: any) => {
        try {
            await adminTriggerEvent(type);
            notify({ type: 'success', title: 'Admin Etkinliği', message: `${type} başarıyla başlatıldı.` });
        } catch (e) {
            notify({ type: 'error', title: 'Hata', message: 'Etkinlik başlatılamadı.' });
        }
    };

    const handleSetBtc = async (val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        try {
            await adminSetBtc(num);
            notify({ type: 'success', title: 'Başarılı', message: 'BTC Bakiyesi güncellendi.' });
        } catch (e) {
            notify({ type: 'error', title: 'Hata', message: 'Bakiye güncellenemedi.' });
        }
    };

    const handleSetTp = async (val: string) => {
        const num = parseInt(val);
        if (isNaN(num)) return;
        try {
            await adminSetTp(num);
            notify({ type: 'success', title: 'Başarılı', message: 'TP Bakiyesi güncellendi.' });
        } catch (e) {
            notify({ type: 'error', title: 'Hata', message: 'Bakiye güncellenemedi.' });
        }
    };

    const handleSetLevel = async (val: string) => {
        const num = parseInt(val);
        if (isNaN(num)) return;
        try {
            await adminSetLevel(num);
            notify({ type: 'success', title: 'Başarılı', message: 'Seviye güncellendi.' });
        } catch (e) {
            notify({ type: 'error', title: 'Hata', message: 'Seviye güncellenemedi.' });
        }
    };

    React.useEffect(() => {
        if (activeTab === 'withdrawals') {
            fetchWithdrawals();
            const channel = supabase
                .channel('mobile-admin-withdrawals')
                .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.WITHDRAWALS }, () => {
                    fetchWithdrawals();
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [activeTab]);

    const fetchWithdrawals = async () => {
        setLoadingWithdrawals(true);
        try {
            const { data } = await supabase.from(TABLES.WITHDRAWALS).select('*, profiles(username)').order('created_at', { ascending: false });
            if (data) setWithdrawals(data);
        } finally {
            setLoadingWithdrawals(false);
        }
    };

    const handleWithdrawal = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await supabase.from(TABLES.WITHDRAWALS).update({ status }).eq('id', id);
            notify({ type: 'success', title: 'Başarılı', message: `Talep ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.` });
        } catch (e) {
            notify({ type: 'error', title: 'Hata', message: 'İşlem başarısız.' });
        }
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

            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 relative z-10 shrink-0 overflow-x-auto no-scrollbar">
                {(['overview', 'economy', 'users', 'events', 'withdrawals'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                            : 'text-zinc-500 hover:text-white'
                            }`}
                    >
                        {tab === 'withdrawals' ? 'Çekimler' : tab}
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
                                onChange={handleSetLevel}
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

                {activeTab === 'withdrawals' && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 px-2 flex items-center justify-between">
                            Çekim Talepleri
                            {loadingWithdrawals && <RefreshCw size={12} className="animate-spin text-emerald-500" />}
                        </h2>
                        <div className="grid gap-3">
                            {withdrawals.filter(w => w.status === 'pending').map(w => (
                                <div key={w.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                                <Bitcoin size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase">{w.profiles?.username || 'Bilinmiyor'}</p>
                                                <p className="text-[8px] font-bold text-zinc-500 uppercase">{new Date(w.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-emerald-500 tabular-nums">{(w.amount || 0).toFixed(8)} BTC</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleWithdrawal(w.id, 'approved')}
                                            className="flex-1 py-2 rounded-xl bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                                        >
                                            ONAYLA
                                        </button>
                                        <button 
                                            onClick={() => handleWithdrawal(w.id, 'rejected')}
                                            className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                                        >
                                            REDDET
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                                <div className="py-12 text-center">
                                    <CheckCircle2 size={32} className="mx-auto text-zinc-800 mb-3" />
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bekleyen talep yok</p>
                                </div>
                            )}
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
