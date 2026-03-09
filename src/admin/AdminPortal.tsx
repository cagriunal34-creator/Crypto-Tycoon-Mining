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
import {
    collection,
    query,
    getDocs,
    updateDoc,
    doc,
    deleteDoc,
    onSnapshot,
    where,
    orderBy,
    limit,
    getDoc,
    setDoc
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function AdminPortal({ onClose }: { onClose: () => void }) {
    const { state, dispatch } = useGame();
    const { theme } = useTheme();
    const { notify } = useNotify();
    const [activeTab, setActiveTab] = useState<'overview' | 'economy' | 'users' | 'cheats' | 'market' | 'players' | 'settings' | 'guilds'>('overview');

    // Global Admin Data State
    const [players, setPlayers] = useState<any[]>([]);
    const [allGuilds, setAllGuilds] = useState<any[]>([]);
    const [allMarket, setAllMarket] = useState<any[]>([]);
    const [globalSettings, setGlobalSettings] = useState<any>({
        isMaintenance: false,
        announcement: "",
        eventMultiplier: 1.0,
        ads: { adRewardBtc: 0, adRewardTp: 0, adCooldown: 0 },
        interstitials: { interstitialAdInterval: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

    // Fetch Global Data
    React.useEffect(() => {
        setLoading(true);
        // We use onSnapshot for real-time admin overview if needed, or just getDocs for performance
        const unsubUsers = onSnapshot(collection(db, COLLECTIONS.USERS), (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPlayers(docs);
        });

        const unsubGuilds = onSnapshot(collection(db, COLLECTIONS.GUILDS), (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAllGuilds(docs);
        });

        const unsubMarket = onSnapshot(collection(db, COLLECTIONS.MARKETPLACE), (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAllMarket(docs);
        });

        const unsubSettings = onSnapshot(doc(db, COLLECTIONS.SETTINGS, 'v1'), (snap) => {
            if (snap.exists()) {
                setGlobalSettings(snap.data());
            }
        });

        setLoading(false);
        return () => {
            unsubUsers();
            unsubGuilds();
            unsubMarket();
            unsubSettings();
        };
    }, []);

    const logAdminAction = async (action: string, targetId?: string, details?: any) => {
        try {
            await setDoc(doc(collection(db, 'logs'), `admin_${Date.now()}`), {
                adminId: state.user?.uid,
                adminUsername: state.username,
                action,
                targetId: targetId || 'global',
                details: details || {},
                timestamp: Date.now()
            });
        } catch (e) {
            console.error("Logging failed", e);
        }
    };

    const handleUpdatePlayer = async (uid: string, updates: any) => {
        try {
            await updateDoc(doc(db, COLLECTIONS.USERS, uid), updates);
            await logAdminAction('update_player', uid, updates);
            notify({ type: 'success', title: 'Başarılı', message: 'Oyuncu verileri güncellendi.' });
        } catch (e) {
            notify({ type: 'warning', title: 'Hata', message: 'Güncelleme başarısız.' });
        }
    };

    const handleDeletePlayer = async (uid: string) => {
        if (!window.confirm('Bu oyuncuyu TAMAMEN silmek istediğinize emin misiniz?')) return;
        try {
            await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
            await logAdminAction('delete_player', uid);
            notify({ type: 'success', title: 'Silindi', message: 'Oyuncu başarıyla silindi.' });
        } catch (e) {
            notify({ type: 'warning', title: 'Hata', message: 'Silme işlemi başarısız.' });
        }
    };

    const handleUpdateSettings = async (updates: any) => {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, 'v1'), updates, { merge: true });
            await logAdminAction('update_settings', 'global', updates);
            notify({ type: 'success', title: 'Ayarlar Kaydedildi', message: 'Global sistem ayarları güncellendi.' });
        } catch (e) {
            notify({ type: 'warning', title: 'Hata', message: 'Ayarlar kaydedilemedi.' });
        }
    };

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

            <nav className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 relative z-10 shrink-0 overflow-x-auto custom-scrollbar no-scrollbar">
                {(['overview', 'economy', 'players', 'guilds', 'market', 'cheats', 'settings'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                            activeTab === tab
                                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                                : 'text-zinc-500 hover:text-zinc-200'
                        )}
                    >
                        {tab === 'market' ? 'Pazar & İşler' : tab === 'cheats' ? 'Hileler' : tab === 'players' ? 'Oyuncular' : tab === 'settings' ? 'Sistem' : tab === 'guilds' ? 'Loncalar' : tab}
                    </button>
                ))}
            </nav>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 relative z-10 pr-1 custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard label="Toplam Oyuncu" value={players.length.toString()} icon={<Users size={16} />} color="blue" />
                            <StatCard label="Aktif Loncalar" value={allGuilds.length.toString()} icon={<Users size={16} />} color="emerald" />
                            <StatCard label="Pazar İlanları" value={allMarket.length.toString()} icon={<ShoppingCart size={16} />} color="orange" />
                            <StatCard label="Toplam BTC" value={players.reduce((acc, p) => acc + (p.btcBalance || 0), 0).toFixed(4)} icon={<Bitcoin size={16} />} color="orange" />
                            <StatCard label="Toplam TP" value={players.reduce((acc, p) => acc + (p.tycoonPoints || 0), 0).toLocaleString()} icon={<Database size={16} />} color="blue" />
                            <StatCard label="VIP Oyuncular" value={players.filter(p => p.vip?.isActive).length.toString()} icon={<ShieldCheck size={16} />} color="emerald" />
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

                {activeTab === 'players' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Oyuncu ara (İsim, ID veya E-posta)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-emerald-500/50"
                            />
                            <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        </div>

                        <div className="grid gap-3">
                            {players
                                .filter(p =>
                                    p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .slice(0, 20)
                                .map(player => (
                                    <div key={player.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-xs">
                                                {player.username?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase text-zinc-200">{player.username || 'İsimsiz'}</h4>
                                                <p className="text-[10px] text-zinc-500 font-black uppercase">LV.{player.level || 1} · {player.btcBalance?.toFixed(6)} BTC</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedPlayer(player)}
                                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all"
                                            >
                                                <Terminal size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlayer(player.id)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        {selectedPlayer && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
                                <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] -z-10" />

                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black uppercase">Oyuncu Düzenle</h3>
                                        <button onClick={() => setSelectedPlayer(null)} className="p-2 rounded-xl bg-white/10 text-zinc-400">
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-zinc-500">BTC Bakiyesi</label>
                                            <input
                                                type="number"
                                                defaultValue={selectedPlayer.btcBalance}
                                                onBlur={(e) => handleUpdatePlayer(selectedPlayer.id, { btcBalance: parseFloat(e.target.value) })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-orange-500"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-zinc-500">TP Bakiyesi</label>
                                            <input
                                                type="number"
                                                defaultValue={selectedPlayer.tycoonPoints}
                                                onBlur={(e) => handleUpdatePlayer(selectedPlayer.id, { tycoonPoints: parseInt(e.target.value) })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-blue-400"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-zinc-500">Seviye</label>
                                            <input
                                                type="number"
                                                defaultValue={selectedPlayer.level}
                                                onBlur={(e) => handleUpdatePlayer(selectedPlayer.id, { level: parseInt(e.target.value) })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-zinc-500">Deneyim (XP)</label>
                                            <input
                                                type="number"
                                                defaultValue={selectedPlayer.xp}
                                                onBlur={(e) => handleUpdatePlayer(selectedPlayer.id, { xp: parseInt(e.target.value) })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex flex-col gap-2">
                                        <button
                                            onClick={() => handleUpdatePlayer(selectedPlayer.id, { isAdmin: !selectedPlayer.isAdmin })}
                                            className={cn(
                                                "w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                                                selectedPlayer.isAdmin ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-400 border border-white/5"
                                            )}
                                        >
                                            {selectedPlayer.isAdmin ? 'Admin Yetkisini Kaldır' : 'Admin Yetkisi Ver'}
                                        </button>
                                        <button
                                            onClick={() => handleUpdatePlayer(selectedPlayer.id, { "vip.isActive": !selectedPlayer.vip?.isActive })}
                                            className={cn(
                                                "w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                                                selectedPlayer.vip?.isActive ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400 border border-white/5"
                                            )}
                                        >
                                            {selectedPlayer.vip?.isActive ? 'VIP İptal Et' : 'VIP Üyelik Ver'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500 px-2 flex items-center gap-2">
                                <ShieldCheck size={14} /> Sistem Durumu & Bakım
                            </h2>
                            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                                <CheatButton
                                    label="Bakım Modu"
                                    desc={globalSettings.isMaintenance ? "SUNUCU BAKIMDA - Girişler Kapalı" : "Sunucu Aktif - Girişler Açık"}
                                    icon={globalSettings.isMaintenance ? <Lock size={18} /> : <Unlock size={18} />}
                                    onClick={() => handleUpdateSettings({ isMaintenance: !globalSettings.isMaintenance })}
                                    color={globalSettings.isMaintenance ? "red" : "emerald"}
                                    active={globalSettings.isMaintenance}
                                />

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h3 className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2">
                                        <TrendingUp size={12} className="text-blue-500" /> Global Etkinlik Çarpanı
                                    </h3>
                                    <div className="flex gap-2">
                                        {[1.0, 1.5, 2.0, 3.0].map(mult => (
                                            <button
                                                key={mult}
                                                onClick={() => handleUpdateSettings({ eventMultiplier: mult })}
                                                className={cn(
                                                    "flex-1 py-3 rounded-xl border font-black text-xs transition-all",
                                                    globalSettings.eventMultiplier === mult
                                                        ? "bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20"
                                                        : "bg-white/5 border-white/10 text-zinc-500 hover:text-white"
                                                )}
                                            >
                                                {mult}x
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-zinc-600 font-bold px-1 italic">
                                        * Bu çarpan tüm oyuncuların BTC ve XP kazançlarını anında etkiler.
                                    </p>
                                </div>

                                <div className="space-y-2.5 pt-4 border-t border-white/5">
                                    <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2">
                                        <Terminal size={12} className="text-emerald-500" /> Global Duyuru Mesajı
                                    </label>
                                    <textarea
                                        key={globalSettings.announcement}
                                        defaultValue={globalSettings.announcement}
                                        onBlur={(e) => handleUpdateSettings({ announcement: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all min-h-[100px]"
                                        placeholder="Tüm oyuncuların ekranında kayacak mesaj..."
                                    />
                                    <p className="text-[8px] text-zinc-600 font-bold px-1 uppercase tracking-widest text-center mt-1">
                                        Otomatik Kaydedilir (Odaktan Çıkınca)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 opacity-50 hover:opacity-100 transition-opacity">
                            <button
                                onClick={async () => {
                                    if (window.confirm('KRİTİK UYARI: TÜM OYUN VERİLERİ (Global) SIFIRLANACAK! Bu işlem geri alınamaz. Emin misiniz?')) {
                                        // Hard reset implementation...
                                        notify({ type: 'warning', title: 'Beklemede', message: 'Bu işlem şimdilik devre dışı bırakıldı.' });
                                    }
                                }}
                                className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                            >
                                <RefreshCw size={16} />
                                Master Data Reset (Factory)
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'market' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Marketplace Section */}
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500 px-2 flex items-center gap-2">
                                <ShoppingCart size={14} /> Global Pazar Denetimi
                            </h2>
                            <div className="grid gap-3">
                                {allMarket.length === 0 ? (
                                    <div className="p-8 text-center bg-white/5 rounded-3xl border border-white/10 text-zinc-600 text-[10px] font-black uppercase">Aktif ilan yok</div>
                                ) : allMarket.map((listing) => (
                                    <div key={listing.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                                                <Zap size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase text-zinc-300">{listing.contractName}</h4>
                                                <p className="text-[9px] text-zinc-500 font-bold">{listing.hashRate} Gh/s · {listing.tier} · {listing.sellerName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                defaultValue={listing.price}
                                                onBlur={(e) => handleUpdatePlayer(`marketplace/${listing.id}`, { price: parseInt(e.target.value) })}
                                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-black text-orange-500"
                                            />
                                            <button
                                                onClick={async () => {
                                                    await deleteDoc(doc(db, COLLECTIONS.MARKETPLACE, listing.id));
                                                    notify({ type: 'info', title: 'Silindi', message: 'Pazar ilanı kaldırıldı.' });
                                                }}
                                                className="p-2 bg-red-500/10 text-red-500 rounded-lg"
                                            >
                                                <X size={14} />
                                            </button>
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

                {activeTab === 'guilds' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className="text-xs font-black uppercase tracking-widest text-blue-500 px-2 flex items-center gap-2">
                            <Users size={14} /> Lonca Yönetimi
                        </h2>
                        <div className="grid gap-3">
                            {allGuilds.map(guild => (
                                <div key={guild.id} className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl">
                                                {guild.badge || '🛡️'}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase text-white">{guild.name}</h4>
                                                <p className="text-[10px] text-zinc-500 font-black uppercase">{guild.members} Üye · LV.{guild.level}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Bu loncayı dağıtmak istediğinize emin misiniz?')) {
                                                        await deleteDoc(doc(db, COLLECTIONS.GUILDS, guild.id));
                                                        notify({ type: 'info', title: 'Dağıtıldı', message: 'Lonca başarıyla silindi.' });
                                                    }
                                                }}
                                                className="p-3 rounded-xl bg-red-500/10 text-red-500"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black uppercase text-zinc-500 ml-1">Lonca Açıklaması</label>
                                        <textarea
                                            defaultValue={guild.description}
                                            onBlur={async (e) => await updateDoc(doc(db, COLLECTIONS.GUILDS, guild.id), { description: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] font-bold text-zinc-300"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ))}
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
