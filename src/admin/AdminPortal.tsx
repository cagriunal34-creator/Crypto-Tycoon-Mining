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
    X,
    Lock,
    Unlock,
    Flame,
    ShoppingCart,
    Briefcase,
    Gift
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';

export default function AdminPortal({ onClose }: { onClose: () => void }) {
    const { state, dispatch } = useGame();
    const { theme } = useTheme();
    const { notify } = useNotify();
    const [activeTab, setActiveTab] = useState<'overview' | 'economy' | 'users' | 'cheats' | 'market'>('overview');

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
        <div className="h-full bg-black text-white p-6 pb-24 space-y-8 relative overflow-hidden flex flex-col">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] -z-10" />

            <div className="flex items-center justify-between relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-500/20 animate-pulse">
                        <ShieldCheck size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter">Admin Portal</h1>
                        <p className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                            Root Access Granted
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => window.location.reload()} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Reload State">
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <nav className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 relative z-10 shrink-0">
                {(['overview', 'economy', 'market', 'cheats', 'users'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                            : 'text-zinc-500 hover:text-zinc-200'
                            }`}
                    >
                        {tab === 'market' ? 'Pazar & İşler' : tab === 'cheats' ? 'Hileler' : tab}
                    </button>
                ))}
            </nav>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 relative z-10 pr-1 custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard label="BTC Bakiyesi" value={state.btcBalance.toFixed(8)} icon={<Bitcoin size={16} />} color="orange" />
                            <StatCard label="TP Bakiyesi" value={state.tycoonPoints.toLocaleString()} icon={<Database size={16} />} color="blue" />
                            <StatCard label="Seviye" value={state.level.toString()} icon={<TrendingUp size={16} />} color="emerald" />
                            <StatCard label="Enerji" value={`${Math.floor(state.energyCells)}/${state.maxEnergyCells}`} icon={<Zap size={16} />} color="yellow" />
                            <StatCard label="Hashrate" value={`${(state.totalHashRate / 1000).toFixed(2)} GH/s`} icon={<Cpu size={16} />} color="purple" />
                            <StatCard label="Prestige" value={`Lv.${state.prestigeLevel}`} icon={<Flame size={16} />} color="red" />
                        </div>
                    </div>
                )}

                {activeTab === 'economy' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                        <InputGroup
                            label="Deneyim (XP) Ekle"
                            placeholder="500"
                            value="0"
                            onChange={(val) => dispatch({ type: 'ADMIN_ADD_XP', amount: parseInt(val) || 0 })}
                            icon={<TrendingUp size={18} />}
                        />
                    </div>
                )}

                {activeTab === 'cheats' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 px-2">Gelişmiş Hileler</h2>
                        <div className="grid gap-3">
                            <CheatButton
                                label="Seviye Atla (+1)"
                                desc="Mevcut seviyeni 1 artırır"
                                icon={<TrendingUp size={18} />}
                                onClick={() => dispatch({ type: 'ADMIN_SET_LEVEL', level: state.level + 1 })}
                                color="emerald"
                            />
                            <CheatButton
                                label="Mega Seviye (+10)"
                                desc="Hızlı ilerleme için +10 seviye"
                                icon={<TrendingUp size={18} />}
                                onClick={() => dispatch({ type: 'ADMIN_SET_LEVEL', level: state.level + 10 })}
                                color="blue"
                            />
                            <CheatButton
                                label="Enerji Yenile"
                                desc="Tüm enerji hücrelerini doldur"
                                icon={<Zap size={18} />}
                                onClick={() => triggerEvent('energy_surge')}
                                color="yellow"
                            />
                            <CheatButton
                                label="Sonsuz Enerji (Hack)"
                                desc="Enerji tüketimini devre dışı bırakır"
                                icon={state.isInfiniteEnergy ? <Unlock size={18} /> : <Lock size={18} />}
                                onClick={() => dispatch({ type: 'ADMIN_TOGGLE_INFINITE_ENERGY' })}
                                color={state.isInfiniteEnergy ? 'red' : 'zinc'}
                                active={state.isInfiniteEnergy}
                            />
                            <CheatButton
                                label="Hashrate Injector"
                                desc="+100 GH/s Kalıcı Bonus"
                                icon={<Cpu size={18} />}
                                onClick={() => dispatch({ type: 'ADMIN_ADD_HASHRATE', amount: 100000 })}
                                color="purple"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                <span>Kullanıcı Adı</span>
                                <span className="text-zinc-300">{state.username}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                <span>Kullanıcı ID</span>
                                <span className="text-zinc-300">{state.userId}</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <button
                                onClick={() => {
                                    if (window.confirm('TÜM VERİLER SIFIRLANACAK! Emin misiniz?')) dispatch({ type: 'ADMIN_RESET_GAME' });
                                }}
                                className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                            >
                                <RefreshCw size={16} />
                                Tüm Oyunu Sıfırla
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'market' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Marketplace Section */}
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500 px-2 flex items-center gap-2">
                                <ShoppingCart size={14} /> Pazar Yeri Fiyatları
                            </h2>
                            <div className="grid gap-3">
                                {state.marketListings.map((listing) => (
                                    <div key={listing.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                                                <Zap size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase text-zinc-300">{listing.contractName}</h4>
                                                <p className="text-[9px] text-zinc-500 font-bold">{listing.hashRate} Gh/s · {listing.tier}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                defaultValue={listing.price}
                                                onBlur={(e) => dispatch({ type: 'ADMIN_UPDATE_MARKET_LISTING', listingId: listing.id, updates: { price: parseInt(e.target.value) } })}
                                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-black text-orange-500 focus:outline-none focus:border-orange-500/50"
                                            />
                                            <span className="text-[8px] font-black text-zinc-500 uppercase">TP</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contracts Section */}
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-blue-500 px-2 flex items-center gap-2">
                                <Briefcase size={14} /> Kurumsal Kontrat Ödülleri
                            </h2>
                            <div className="grid gap-3">
                                {(state.availableJobs || []).map((job) => (
                                    <div key={job.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                                                    <Briefcase size={14} />
                                                </div>
                                                <h4 className="text-[10px] font-black uppercase text-zinc-300">{job.label}</h4>
                                            </div>
                                            <span className="text-[8px] font-black px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-white/5">{job.client}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase text-zinc-500 ml-1">Ödül (BTC)</label>
                                                <input
                                                    type="number"
                                                    step="0.00000000001"
                                                    defaultValue={job.reward}
                                                    onBlur={(e) => dispatch({ type: 'ADMIN_UPDATE_JOB', jobId: job.id, updates: { reward: parseFloat(e.target.value) } })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-black text-emerald-500 focus:outline-none focus:border-emerald-500/50"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[8px] font-black uppercase text-zinc-500 ml-1">Hedef (GH/s)</label>
                                                <input
                                                    type="number"
                                                    defaultValue={job.goalHash}
                                                    onBlur={(e) => dispatch({ type: 'ADMIN_UPDATE_JOB', jobId: job.id, updates: { goalHash: parseInt(e.target.value) } })}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-black text-blue-400 focus:outline-none focus:border-blue-400/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ad Reward Settings Section */}
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500 px-2 flex items-center gap-2">
                                <Gift size={14} /> Reklam Ödülleri & Cooldown
                            </h2>
                            <div className="p-5 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black uppercase text-zinc-500 ml-1">BTC Ödülü</label>
                                        <div className="relative">
                                            <Bitcoin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" />
                                            <input
                                                type="number"
                                                step="0.00000001"
                                                defaultValue={state.adRewardBtc}
                                                onBlur={(e) => dispatch({ type: 'ADMIN_UPDATE_AD_SETTINGS', updates: { adRewardBtc: parseFloat(e.target.value) } })}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black uppercase text-zinc-500 ml-1">TP Ödülü</label>
                                        <div className="relative">
                                            <Database size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                                            <input
                                                type="number"
                                                defaultValue={state.adRewardTp}
                                                onBlur={(e) => dispatch({ type: 'ADMIN_UPDATE_AD_SETTINGS', updates: { adRewardTp: parseInt(e.target.value) } })}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs font-black text-white focus:outline-none focus:border-emerald-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[8px] font-black uppercase text-zinc-500">Bekleme Süresi (Dakika)</label>
                                        <span className="text-[9px] font-bold text-emerald-500">{Math.round(state.adCooldown / 60000)} Dakika</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="60"
                                        defaultValue={state.adCooldown / 60000}
                                        onChange={(e) => dispatch({ type: 'ADMIN_UPDATE_AD_SETTINGS', updates: { adCooldown: parseInt(e.target.value) * 60000 } })}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <div className="flex justify-between text-[7px] font-bold text-zinc-600 uppercase tracking-widest px-1">
                                        <span>1 DK</span>
                                        <span>30 DK</span>
                                        <span>60 DK</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5 pt-4 border-t border-white/5">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[8px] font-black uppercase text-zinc-500">Otomatik Reklam Aralığı (Dakika)</label>
                                        <span className="text-[9px] font-bold text-blue-500">{Math.round(state.interstitialAdInterval / 60000)} Dakika</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        defaultValue={state.interstitialAdInterval / 60000}
                                        onChange={(e) => dispatch({ type: 'ADMIN_UPDATE_INTERSTITIAL_SETTINGS', updates: { interstitialAdInterval: parseInt(e.target.value) * 60000 } })}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <div className="flex justify-between text-[7px] font-bold text-zinc-600 uppercase tracking-widest px-1">
                                        <span>1 DK</span>
                                        <span>5 DK</span>
                                        <span>10 DK</span>
                                    </div>
                                </div>
                            </div>
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
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        red: 'text-red-500 bg-red-500/10 border-red-500/20',
    };

    return (
        <div className={`p-4 rounded-3xl border ${colors[color]} space-y-2 hover:scale-[1.02] transition-transform cursor-default bg-black/40 backdrop-blur-md`}>
            <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-lg bg-current/10">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-[9px] uppercase font-black opacity-60 tracking-wider">{label}</p>
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
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                    {icon}
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-24 text-sm font-bold focus:outline-none focus:border-emerald-500/50 transition-all focus:bg-white/[0.08]"
                />
                <button
                    onClick={() => onChange(val)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg"
                >
                    Uygula
                </button>
            </div>
        </div>
    );
}

function CheatButton({ label, desc, icon, onClick, color, active }: { label: string, desc: string, icon: React.ReactNode, onClick: () => void, color: string, active?: boolean }) {
    const colors: any = {
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        yellow: 'bg-yellow-500',
        purple: 'bg-purple-500',
        red: 'bg-red-500',
        zinc: 'bg-zinc-600',
    };

    return (
        <button
            onClick={onClick}
            className={`group w-full p-4 rounded-2xl transition-all flex items-center justify-between active:scale-[0.98] border ${active ? 'bg-red-500/20 border-red-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${active ? 'bg-red-500 animate-pulse' : colors[color]} flex items-center justify-center text-black shadow-lg shadow-black/20`}>
                    {icon}
                </div>
                <div className="text-left">
                    <h4 className={`text-xs font-black uppercase tracking-wider ${active ? 'text-red-400' : 'text-zinc-200'}`}>{label}</h4>
                    <p className="text-[10px] text-zinc-500 font-bold">{desc}</p>
                </div>
            </div>
            <ArrowRight size={16} className={`transition-colors ${active ? 'text-red-500' : 'text-zinc-600 group-hover:text-white'}`} />
        </button>
    );
}
