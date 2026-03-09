import React, { useState, useEffect } from 'react';
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
    Gift,
    LayoutDashboard,
    Activity,
    Settings as SettingsIcon,
    Search,
    ChevronRight,
    LogOut,
    Calendar,
    Eye,
    Globe,
    AlertTriangle,
    Trash2,
    Edit3,
    BarChart3,
    MessageSquare
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
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

type AdminTab = 'overview' | 'players' | 'guilds' | 'market' | 'economy' | 'activities' | 'cheats' | 'settings' | 'logs';

export default function AdminPortal({ onClose }: { onClose: () => void }) {
    const { state, dispatch } = useGame();
    const { notify } = useNotify();
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');

    // Global Admin Data State
    const [players, setPlayers] = useState<any[]>([]);
    const [allGuilds, setAllGuilds] = useState<any[]>([]);
    const [allMarket, setAllMarket] = useState<any[]>([]);
    const [adminLogs, setAdminLogs] = useState<any[]>([]);
    const [globalSettings, setGlobalSettings] = useState<any>({
        isMaintenance: false,
        announcement: "",
        eventMultiplier: 1.0,
        ads: { adRewardBtc: 0, adRewardTp: 0, adCooldown: 0 },
        interstitials: { interstitialAdInterval: 0 }
    });
    const [liveNetworkData, setLiveNetworkData] = useState<{ time: string, load: number }[]>([]);
    const [activeSessions, setActiveSessions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [marketSearchTerm, setMarketSearchTerm] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
    const [modalTab, setModalTab] = useState<'profile' | 'miners' | 'transactions'>('profile');
    const [selectedPlayerMiners, setSelectedPlayerMiners] = useState<any[]>([]);
    const [selectedPlayerTransactions, setSelectedPlayerTransactions] = useState<any[]>([]);

    // Fetch Selected Player Sub-collections
    useEffect(() => {
        if (!selectedPlayer) {
            setSelectedPlayerMiners([]);
            setSelectedPlayerTransactions([]);
            return;
        }
        const unsubMiners = onSnapshot(collection(db, COLLECTIONS.USERS, selectedPlayer.id, 'miners'), (snap) => {
            setSelectedPlayerMiners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubTx = onSnapshot(
            query(collection(db, COLLECTIONS.USERS, selectedPlayer.id, COLLECTIONS.TRANSACTIONS), orderBy('timestamp', 'desc'), limit(10)),
            (snap) => {
                setSelectedPlayerTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        );
        return () => { unsubMiners(); unsubTx(); };
    }, [selectedPlayer]);

    const currentPlayer = selectedPlayer ? (players.find(p => p.id === selectedPlayer.id) || selectedPlayer) : null;

    // Fetch Global Data
    useEffect(() => {
        setLoading(true);
        const unsubUsers = onSnapshot(collection(db, COLLECTIONS.USERS), (snap) => {
            setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubGuilds = onSnapshot(collection(db, COLLECTIONS.GUILDS), (snap) => {
            setAllGuilds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubMarket = onSnapshot(collection(db, COLLECTIONS.MARKETPLACE), (snap) => {
            setAllMarket(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubSettings = onSnapshot(doc(db, COLLECTIONS.SETTINGS, 'v1'), (snap) => {
            if (snap.exists()) setGlobalSettings(snap.data());
        });
        const unsubLogs = onSnapshot(
            query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(50)),
            (snap) => {
                setAdminLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        );
        setLoading(false);
        return () => {
            unsubUsers(); unsubGuilds(); unsubMarket(); unsubSettings(); unsubLogs();
        };
    }, []);

    // Simulated Live Traffic
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveNetworkData(prev => {
                const newData = [...prev, {
                    time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    load: Math.floor(Math.random() * 40) + 30
                }].slice(-20);
                return newData;
            });
            setActiveSessions(Math.floor(Math.random() * 5) + players.filter(p => Math.random() > 0.7).length);
        }, 3000);
        return () => clearInterval(interval);
    }, [players]);

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
        } catch (e) { console.error("Logging failed", e); }
    };

    const handleUpdatePlayer = async (uid: string, updates: any) => {
        try {
            await updateDoc(doc(db, COLLECTIONS.USERS, uid), updates);
            await logAdminAction('update_player', uid, updates);
            notify({ type: 'success', title: 'Başarılı', message: 'Oyuncu verileri güncellendi.' });
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Güncelleme başarısız.' }); }
    };

    const handleDeletePlayer = async (uid: string) => {
        if (!window.confirm('Bu oyuncuyu TAMAMEN silmek istediğinize emin misiniz?')) return;
        try {
            await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
            await logAdminAction('delete_player', uid);
            notify({ type: 'success', title: 'Silindi', message: 'Oyuncu başarıyla silindi.' });
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Silme işlemi başarısız.' }); }
    };

    const handleUpdateSettings = async (updates: any) => {
        try {
            await setDoc(doc(db, COLLECTIONS.SETTINGS, 'v1'), updates, { merge: true });
            await logAdminAction('update_settings', 'global', updates);
            notify({ type: 'success', title: 'Ayarlar Kaydedildi', message: 'Global sistem ayarları güncellendi.' });
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Ayarlar kaydedilemedi.' }); }
    };

    // Analytics Helper Data
    const totalBtc = players.reduce((acc, p) => acc + (p.btcBalance || 0), 0);
    const totalTp = players.reduce((acc, p) => acc + (p.tycoonPoints || 0), 0);
    const vipCount = players.filter(p => p.vip?.isActive).length;

    return (
        <div className="flex h-screen w-full bg-[#030303] text-zinc-400 font-sans overflow-hidden">
            {/* 🏰 Premium Sidebar */}
            <aside className="w-80 h-full bg-black/40 border-r border-white/5 flex flex-col z-20 backdrop-blur-3xl shrink-0">
                <div className="p-10 pb-12">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                            <ShieldCheck className="text-black" size={28} />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-xl tracking-tighter uppercase leading-none italic">Tycoon</h1>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">Control v3</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase text-zinc-700 mb-4 ml-4 tracking-[0.3em]">Çekirdek İstihbarat</p>
                        <SidebarLink active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={20} />} label="Genel Bakış" />
                        <SidebarLink active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={<Users size={20} />} label="Oyuncu Kitlesi" />
                        <SidebarLink active={activeTab === 'guilds'} onClick={() => setActiveTab('guilds')} icon={<Globe size={20} />} label="Küresel Loncalar" />
                        <SidebarLink active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<ShoppingCart size={20} />} label="Pazar Kaydı" />
                    </div>

                    <div className="mt-14 space-y-1.5">
                        <p className="text-[10px] font-black uppercase text-zinc-700 mb-4 ml-4 tracking-[0.3em]">Canlı Sistemler</p>
                        <SidebarLink active={activeTab === 'economy'} onClick={() => setActiveTab('economy')} icon={<Bitcoin size={20} />} label="Ekonomi" />
                        <SidebarLink active={activeTab === 'activities'} onClick={() => setActiveTab('activities')} icon={<Flame size={20} />} label="Etkinlik Yönetimi" />
                        <SidebarLink active={activeTab === 'cheats'} onClick={() => setActiveTab('cheats')} icon={<Zap size={20} />} label="Hile Motoru" />
                        <SidebarLink active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20} />} label="Uygulama Ayarları" />
                        <SidebarLink active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Activity size={20} />} label="Sistem Kayıtları" />
                    </div>
                </div>

                <div className="mt-auto p-10 pt-0">
                    <button onClick={onClose} className="w-full h-14 rounded-2xl border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3 active:scale-95">
                        <LogOut size={18} /> Panelden Çık
                    </button>
                </div>
            </aside>

            {/* 🖥️ Main Dashboard */}
            <main className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#050505] relative">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] pointer-events-none" />

                <header className="sticky top-0 z-10 w-full px-16 py-10 bg-[#050505]/90 backdrop-blur-xl flex items-center justify-between border-b border-white/5">
                    <div>
                        <h2 className="text-white font-black text-3xl uppercase tracking-tighter italic leading-none">
                            {activeTab.replace('_', ' ')}
                        </h2>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Güvenli Oturum Aktif // Gecikme: 24ms</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden xl:flex items-center gap-8 px-8 py-3 rounded-full bg-white/5 border border-white/5">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Toplam Değerleme</p>
                                <p className="text-sm font-black text-emerald-500 tabular-nums">${(totalBtc * 65000).toLocaleString()}</p>
                            </div>
                            <div className="w-px h-8 bg-white/5" />
                            <div className="text-right">
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Küresel Çarpan</p>
                                <p className="text-sm font-black text-blue-500 tabular-nums">{globalSettings.eventMultiplier || 1.0}x</p>
                            </div>
                        </div>
                        <div className="h-12 w-12 rounded-2xl border border-white/10 bg-zinc-900 flex items-center justify-center font-black text-white shadow-xl">
                            {(state.username?.charAt(0) || '?').toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="p-16 space-y-16 max-w-[1600px] mx-auto pb-32">

                    {activeTab === 'overview' && (
                        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-4 gap-8">
                                <BentoCard label="Toplam Kullanıcı" value={players.length.toLocaleString()} icon={<Users size={28} />} color="blue" />
                                <BentoCard label="Toplam BTC Arzı" value={totalBtc.toFixed(3)} icon={<Bitcoin size={28} />} color="orange" />
                                <BentoCard label="Aktif Lonca Sayısı" value={allGuilds.length.toString()} icon={<Globe size={28} />} color="emerald" />
                                <BentoCard label="Denetim Kontrolü" value="OK-772" icon={<Activity size={28} />} color="purple" />
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                                <div className="col-span-2 p-12 rounded-[3.5rem] bg-black/60 border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex items-center justify-between mb-12">
                                        <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-3 italic">
                                            <BarChart3 size={20} className="text-emerald-500" /> Servet Konsantrasyonu Analizi
                                        </h3>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase">Canlı Veri</span>
                                        </div>
                                    </div>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[...players].sort((a, b) => (b.btcBalance || 0) - (a.btcBalance || 0)).slice(0, 15).map(p => ({ name: p.username, btc: p.btcBalance }))}>
                                                <defs>
                                                    <linearGradient id="colorBtc" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                <XAxis dataKey="name" stroke="#555" fontSize={9} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#555" fontSize={9} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ background: '#090909', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px', padding: '12px' }}
                                                    cursor={{ stroke: '#10b98120', strokeWidth: 2 }}
                                                />
                                                <Area type="monotone" dataKey="btc" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorBtc)" animationDuration={2000} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="p-10 rounded-[3.5rem] bg-emerald-500 text-black shadow-2xl shadow-emerald-500/10 flex flex-col justify-between">
                                        <div>
                                            <div className="w-14 h-14 rounded-2xl bg-black/10 flex items-center justify-center">
                                                <ShieldCheck size={32} />
                                            </div>
                                            <h3 className="font-black text-xl uppercase mt-8 leading-none italic">VIP Prestij</h3>
                                            <p className="text-[10px] font-black uppercase opacity-60 mt-3 tracking-widest leading-relaxed">Öncelikli sistem erişimi ve yükseltilmiş ödüllere sahip seçkin oyuncular.</p>
                                        </div>
                                        <div className="mt-12">
                                            <p className="text-6xl font-black tabular-nums tracking-tighter">{vipCount}</p>
                                            <p className="text-[9px] font-black uppercase opacity-60 mt-2">Aktif Abonelikler</p>
                                        </div>
                                    </div>
                                    <div className="p-10 rounded-[3.5rem] bg-white/5 border border-white/5 space-y-8">
                                        <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 italic">Ağ Kararlılığı</h3>
                                        <div className="space-y-6">
                                            <StabilityRow label="Sorgu Gecikmesi" value="12ms" active />
                                            <StabilityRow label="Gerçek Zamanlı Senk." value="99.9%" active />
                                            <StabilityRow label="DB Akışı" value="1.2k req/s" active />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 🌐 Live Infrastructure Section */}
                            <div className="p-12 rounded-[4rem] bg-black/60 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                            <RefreshCw size={32} className="animate-spin-slow" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black text-xl uppercase tracking-tighter italic leading-none">Canlı Altyapı İzleme</h3>
                                            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mt-3 italic">Global Ağ Yükü ve Aktif Oturumlar</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-12 text-right">
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Aktif Oturumlar</p>
                                            <p className="text-3xl font-black text-white tabular-nums italic mt-1">{activeSessions}</p>
                                        </div>
                                        <div className="w-px h-12 bg-white/5" />
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Ağ Yükü</p>
                                            <p className="text-3xl font-black text-blue-500 tabular-nums italic mt-1">%{liveNetworkData[liveNetworkData.length - 1]?.load || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={liveNetworkData}>
                                            <defs>
                                                <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                            <XAxis dataKey="time" hide />
                                            <YAxis hide domain={[0, 100]} />
                                            <Tooltip
                                                contentStyle={{ background: '#090909', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px', padding: '12px' }}
                                                labelStyle={{ color: '#666' }}
                                            />
                                            <Area type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLoad)" isAnimationActive={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'players' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-12 gap-8">
                                <div className="col-span-12 lg:col-span-8 space-y-8">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="Kullanıcı adı, UID, e-posta veya seviyeye göre veritabanında ara..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full h-20 bg-white/5 border border-white/5 rounded-[2rem] px-20 text-white text-base font-bold focus:outline-none focus:border-emerald-500/20 transition-all placeholder:text-zinc-700"
                                        />
                                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={24} />
                                    </div>

                                    <div className="bg-black/40 border border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                                                    <th className="p-8">Kimlik</th>
                                                    <th className="p-8">Cüzdan (BTC)</th>
                                                    <th className="p-8">Rütbe / Seviye</th>
                                                    <th className="p-8 text-right">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {players.filter(p => !searchTerm || (p.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.id || '').includes(searchTerm)).slice(0, 15).map(player => (
                                                    <tr key={player.id} className="border-b border-white/5 hover:bg-white/[0.015] transition-colors group">
                                                        <td className="p-8">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center font-black text-sm text-zinc-500 border border-white/5 group-hover:border-emerald-500/20 group-hover:text-emerald-500 transition-all">
                                                                    {(player.username?.charAt(0) || '?').toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-zinc-200 font-extrabold text-sm uppercase tracking-tight">{player.username}</p>
                                                                    <p className="text-[9px] text-zinc-600 font-black mt-1 uppercase tracking-widest">{player.isAdmin ? 'Yönetici Erişimi' : player.vip?.isActive ? 'VIP Premium' : 'Standart Kullanıcı'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-8">
                                                            <div className="flex flex-col">
                                                                <span className="text-orange-500 font-black text-sm tabular-nums tracking-tighter">{player.btcBalance?.toFixed(8)}</span>
                                                                <span className="text-[9px] font-black text-zinc-700 uppercase mt-1">Dijital BTC</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-8">
                                                            <div className="flex flex-col">
                                                                <span className="text-blue-500 font-black text-sm tabular-nums tracking-tighter">SEVİYE {player.level}</span>
                                                                <span className="text-[9px] font-black text-zinc-700 uppercase mt-1">{player.xp?.toLocaleString()} Toplam XP</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-8 text-right">
                                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                                <button onClick={() => setSelectedPlayer(player)} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all duration-300 shadow-xl"><Edit3 size={18} /></button>
                                                                <button onClick={() => handleDeletePlayer(player.id)} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 shadow-xl"><Trash2 size={18} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {players.length === 0 && <div className="p-20 text-center text-zinc-600 font-black uppercase text-xs tracking-widest">Veritabanında eşleşen kayıt bulunamadı</div>}
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-4 space-y-8">
                                    <div className="p-10 rounded-[3.5rem] bg-white/5 border border-white/5 space-y-10">
                                        <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3">
                                            <Activity size={18} className="text-blue-500" /> Veritabanı Analizi
                                        </h3>
                                        <div className="space-y-8">
                                            <InsightProgress label="Toplam Oyuncu" value={players.length} max={1000} color="emerald" />
                                            <InsightProgress label="VIP Dönüşümü" value={vipCount} max={players.length || 1} color="blue" />
                                            <InsightProgress label="Yönetici Rolleri" value={players.filter(p => p.isAdmin).length} max={10} color="red" />
                                        </div>
                                        <div className="pt-10 border-t border-white/5">
                                            <button className="w-full h-16 rounded-[1.5rem] bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-transform">Veritabanını Aktar (JSON-A)</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedPlayer && currentPlayer && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-12 overflow-y-auto no-scrollbar">
                                    <div className="w-full max-w-4xl bg-[#080808] border border-white/10 rounded-[4rem] p-16 space-y-12 relative shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] pointer-events-none" />

                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 flex items-center justify-center text-black shadow-2xl shadow-emerald-500/20">
                                                    <Terminal size={36} />
                                                </div>
                                                <div>
                                                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Kimliği Düzenle</h3>
                                                    <p className="text-zinc-500 font-black text-xs uppercase tracking-[0.3em] mt-3">{currentPlayer.username} // SID: {currentPlayer.id}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setSelectedPlayer(null)} className="p-5 rounded-3xl bg-white/5 text-zinc-500 hover:text-white transition-all border border-white/5 active:scale-90"><X size={28} /></button>
                                        </div>

                                        <div className="flex items-center gap-6 border-b border-white/5 pb-2 relative z-10">
                                            {['profile', 'miners', 'transactions'].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => setModalTab(t as any)}
                                                    className={cn(
                                                        "pb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                                                        modalTab === t ? "text-emerald-500" : "text-zinc-600 hover:text-zinc-400"
                                                    )}
                                                >
                                                    {t === 'profile' ? 'Kimlik Bilgileri' : t === 'miners' ? 'Ekipmanlar' : 'İşlem Geçmişi'}
                                                    {modalTab === t && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981]" />}
                                                </button>
                                            ))}
                                        </div>

                                        {modalTab === 'profile' && (
                                            <div className="grid grid-cols-2 gap-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <InputGroup label="BTC Cüzdan Bakiyesi" value={currentPlayer.btcBalance} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { btcBalance: parseFloat(v) })} icon={<Bitcoin size={20} />} placeholder="0.0" />
                                                <InputGroup label="Tycoon Puanı (TP)" value={currentPlayer.tycoonPoints} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { tycoonPoints: parseInt(v) })} icon={<Database size={20} />} placeholder="0" />
                                                <InputGroup label="Mevcut Seviye" value={currentPlayer.level} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { level: parseInt(v) })} icon={<TrendingUp size={20} />} placeholder="1" />
                                                <InputGroup label="Deneyim (XP)" value={currentPlayer.xp} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { xp: parseInt(v) })} icon={<SettingsIcon size={20} />} placeholder="0" />
                                            </div>
                                        )}

                                        {modalTab === 'miners' && (
                                            <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <div className="grid grid-cols-2 gap-6">
                                                    {selectedPlayerMiners.map(miner => (
                                                        <div key={miner.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-emerald-500">
                                                                    <Cpu size={24} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-white font-black text-xs uppercase italic">{miner.label || miner.type}</p>
                                                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">GÜÇ: {miner.hashrate} GH/S</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => deleteDoc(doc(db, COLLECTIONS.USERS, currentPlayer.id, 'miners', miner.id))} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                        </div>
                                                    ))}
                                                    {selectedPlayerMiners.length === 0 && <div className="col-span-2 py-12 text-center text-zinc-700 font-black uppercase text-[10px] tracking-widest italic">Madencilik cihazı bulunamadı</div>}
                                                </div>
                                            </div>
                                        )}

                                        {modalTab === 'transactions' && (
                                            <div className="space-y-4 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                {selectedPlayerTransactions.map(tx => (
                                                    <div key={tx.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group">
                                                        <div className="flex items-center gap-5">
                                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                                                {tx.amount > 0 ? <TrendingUp size={20} /> : <TrendingUp className="rotate-180" size={20} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-zinc-200 font-black text-[11px] uppercase tracking-tight">{tx.description || 'Sistem İşlemi'}</p>
                                                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">{new Date(tx.timestamp).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        <p className={cn("font-black text-sm tabular-nums", tx.amount > 0 ? "text-emerald-500" : "text-red-500")}>
                                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(8)} {tx.currency || 'BTC'}
                                                        </p>
                                                    </div>
                                                ))}
                                                {selectedPlayerTransactions.length === 0 && <div className="py-12 text-center text-zinc-700 font-black uppercase text-[10px] tracking-widest italic">İşlem geçmişi bulunamadı</div>}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-6 pt-6 relative z-10">
                                            <button onClick={() => handleUpdatePlayer(currentPlayer.id, { isAdmin: !currentPlayer.isAdmin })} className={cn("h-24 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all border-2", currentPlayer.isAdmin ? "bg-red-500/10 border-red-500/40 text-red-500" : "bg-white/5 border-white/10 text-zinc-600 hover:text-white hover:bg-white/10")}>
                                                {currentPlayer.isAdmin ? 'Erişimi Sonlandır' : 'Kimliği Yetkilendir'}
                                            </button>
                                            <button onClick={() => handleUpdatePlayer(currentPlayer.id, { "vip.isActive": !currentPlayer.vip?.isActive })} className={cn("h-24 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all border-2", currentPlayer.vip?.isActive ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500" : "bg-white/5 border-white/10 text-zinc-600 hover:text-white hover:bg-white/10")}>
                                                {currentPlayer.vip?.isActive ? 'VIP Devre Dışı' : 'Prestij Aktif Et'}
                                            </button>
                                        </div>

                                        <div className="pt-10 border-t border-white/5 flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-4 text-red-500/40 font-black text-[10px] uppercase tracking-widest">
                                                <AlertTriangle size={16} /> Veri değişikliği kalıcıdır
                                            </div>
                                            <button onClick={() => handleDeletePlayer(currentPlayer.id)} className="px-10 py-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-xl">
                                                Kalıcı Silme
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'economy' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><Bitcoin className="text-orange-500" size={20} /> Manuel Enjeksiyon</h3>
                                    <div className="p-12 rounded-[3.5rem] bg-black/60 border border-white/5 space-y-8">
                                        <InputGroup label="BTC Nabzınız" value={state.btcBalance.toString()} onChange={(v) => dispatch({ type: 'ADMIN_SET_BTC', amount: parseFloat(v) })} icon={<Bitcoin size={18} />} placeholder="0.00" />
                                        <InputGroup label="TP Rezerviniz" value={state.tycoonPoints.toString()} onChange={(v) => dispatch({ type: 'ADMIN_SET_TP', amount: parseInt(v) })} icon={<Database size={18} />} placeholder="0" />
                                        <InputGroup label="Deneyim Takviyesi" value="0" onChange={(v) => dispatch({ type: 'ADMIN_ADD_XP', amount: parseInt(v) || 0 })} icon={<TrendingUp size={18} />} placeholder="XP Ekle" />
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><ShoppingCart className="text-purple-500" size={20} /> Kontrat Kontrolü</h3>
                                    <div className="grid gap-6">
                                        {(state.availableJobs || []).map(job => (
                                            <div key={job.id} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 space-y-6 group">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">{job.client}</span>
                                                    <span className="text-[9px] font-black text-zinc-600 uppercase">GH: {job.goalHash}</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <h4 className="text-white font-black text-sm uppercase italic">{job.label}</h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <input
                                                            type="number"
                                                            step="0.000000001"
                                                            defaultValue={job.reward}
                                                            onBlur={(e) => dispatch({ type: 'ADMIN_UPDATE_JOB', jobId: job.id, updates: { reward: parseFloat(e.target.value) } })}
                                                            className="w-32 bg-transparent border-b border-white/10 text-right text-sm font-black text-emerald-500 focus:outline-none focus:border-emerald-500 transition-colors tabular-nums"
                                                        />
                                                        <p className="text-[9px] font-black text-zinc-700 uppercase mt-1">Ödül BTC</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cheats' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><Zap className="text-yellow-500" size={20} /> Güç Modifikasyonları</h3>
                                    <div className="grid gap-6">
                                        <BigCheatButton label="Enerji Patlaması" color="yellow" onClick={() => dispatch({ type: 'ADMIN_TRIGGER_EVENT', eventType: 'energy_surge' })} icon={<Zap size={24} />} desc="Tüm hücresel sistemleri anında %100 kapasiteye canlandırın." />
                                        <BigCheatButton label="Sonsuz Enerji" color="red" active={state.isInfiniteEnergy} onClick={() => dispatch({ type: 'ADMIN_TOGGLE_INFINITE_ENERGY' })} icon={<Unlock size={24} />} desc="Koruma protokollerini baypas edin. Kullanım rezervleri tüketmez." />
                                        <BigCheatButton label="Hashrate Enjektörü" color="purple" onClick={() => dispatch({ type: 'ADMIN_ADD_HASHRATE', amount: 100000 })} icon={<Cpu size={24} />} desc="Çekirdeğe doğrudan +100 GH/s hesaplama gücü enjekte edin." />
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><TrendingUp className="text-blue-500" size={20} /> İlerleme Hileleri</h3>
                                    <div className="grid gap-6">
                                        <BigCheatButton label="Seviye Atla" color="emerald" onClick={() => dispatch({ type: 'ADMIN_SET_LEVEL', level: state.level + 1 })} icon={<ArrowRight size={24} />} desc="Kimlik yetki seviyesini +1 birim ilerletin." />
                                        <BigCheatButton label="Mega İlerleme" color="blue" onClick={() => dispatch({ type: 'ADMIN_SET_LEVEL', level: state.level + 10 })} icon={<ChevronRight size={24} />} desc="Sistem yetkilendirmesinde önemli artış. +10 Seviye." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-2 gap-12">
                                <div className="p-12 rounded-[4rem] bg-black/60 border border-white/5 space-y-12 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl -z-10" />
                                    <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 italic">Sistem Bütünlüğü</h3>

                                    <div className="space-y-6">
                                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Bakım Protokolü</p>
                                        <button
                                            onClick={() => handleUpdateSettings({ isMaintenance: !globalSettings.isMaintenance })}
                                            className={cn("w-full h-32 rounded-[2.5rem] border-2 flex items-center gap-8 px-10 transition-all group", globalSettings.isMaintenance ? "bg-red-500/10 border-red-500/40" : "bg-white/5 border-white/5 hover:bg-white/10")}
                                        >
                                            <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center transition-all", globalSettings.isMaintenance ? "bg-red-500 text-white shadow-2xl shadow-red-500/20" : "bg-zinc-800 text-zinc-500")}>
                                                {globalSettings.isMaintenance ? <Lock size={28} /> : <Unlock size={28} />}
                                            </div>
                                            <div className="text-left">
                                                <p className={cn("text-lg font-black uppercase tracking-tighter italic", globalSettings.isMaintenance ? "text-red-500" : "text-white")}>{globalSettings.isMaintenance ? 'Kısıtlama Modu Aktif' : 'Genel Erişime Açık'}</p>
                                                <p className="text-[10px] font-bold text-zinc-600 uppercase mt-1 tracking-widest">Tüm istemciler için küresel sistem durumu</p>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-white/5">
                                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">Küresel Etkinlik Çarpanı</p>
                                        <div className="grid grid-cols-4 gap-4">
                                            {[1.0, 1.5, 2.0, 3.0].map(m => (
                                                <button key={m} onClick={() => handleUpdateSettings({ eventMultiplier: m })} className={cn("h-20 rounded-[1.5rem] font-black text-sm transition-all border-2", globalSettings.eventMultiplier === m ? "bg-blue-500 border-blue-400 text-white shadow-xl shadow-blue-500/20" : "bg-white/5 border-white/5 text-zinc-600 hover:text-white")}>{m}x</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-12 rounded-[4rem] bg-black/60 border border-white/5 space-y-12 h-full flex flex-col">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 italic"><Terminal size={18} className="text-blue-500" /> Yayın Terminali v2</h3>
                                        <div className="flex gap-4">
                                            <span className="px-3 py-1 bg-white/5 text-zinc-500 text-[8px] font-black uppercase tracking-tighter border border-white/5 rounded-lg">Markdown Destekli</span>
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-tighter border border-emerald-500/20 rounded-lg">Şifreli Bağlantı</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 flex-1">
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center px-4">
                                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">Kontrol Ünitesi</p>
                                                <div className="flex gap-2">
                                                    {['B', 'I', '#', '>'].map(btn => (
                                                        <button key={btn} className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-zinc-400 hover:text-white transition-colors">{btn}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea
                                                defaultValue={globalSettings.announcement}
                                                onBlur={(e) => handleUpdateSettings({ announcement: e.target.value })}
                                                className="w-full h-[400px] bg-zinc-900/50 border-2 border-white/5 rounded-[2rem] p-8 text-sm font-mono text-blue-400 focus:outline-none focus:border-blue-500/20 transition-all no-scrollbar placeholder:text-zinc-800 leading-relaxed shadow-inner"
                                                placeholder="Sistem mesajını girin..."
                                            />
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center px-4">
                                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">Canlı İstemci Önizleme</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[8px] font-black text-emerald-500 uppercase">YAYINDA</span>
                                                </div>
                                            </div>
                                            <div className="w-full h-[400px] bg-blue-500/[0.02] border-2 border-dashed border-white/5 rounded-[2rem] p-8 overflow-y-auto no-scrollbar relative group">
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-500/[0.02] pointer-events-none" />
                                                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:mb-4 prose-p:mb-4">
                                                    <p className="text-zinc-400 font-bold whitespace-pre-wrap leading-relaxed">{globalSettings.announcement || 'Mesaj bekleniyor...'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-3 text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4">
                                                <Activity size={12} /> Otomatik Senkronizasyon
                                            </div>
                                            <div className="w-px h-4 bg-white/5" />
                                            <div className="flex items-center gap-3 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                                <Calendar size={12} /> Zamanlanmış Gönderim Aktif
                                            </div>
                                        </div>
                                        <button className="px-12 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all shadow-2xl">Terminali Güncelle</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="bg-black/40 border border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-xl">
                                <div className="p-12 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Activity className="text-emerald-500" size={24} />
                                        <h3 className="text-white font-black text-sm uppercase tracking-widest italic">Güvenlik Denetim Kayıtları // Derin Arama</h3>
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Son 50 Etkinlik Gösteriliyor</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {adminLogs.map(log => (
                                        <div key={log.id} className="p-10 flex items-center justify-between hover:bg-white/[0.015] transition-all group">
                                            <div className="flex items-center gap-10">
                                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border", log.action?.includes('delete') ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/5 text-emerald-500")}>
                                                    {log.action?.includes('delete') ? <Trash2 size={24} /> : <Terminal size={24} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-zinc-300 uppercase italic tracking-tight">
                                                        <span className="text-emerald-500">{log.adminUsername || 'Admin'}</span>
                                                        <span className="mx-3 font-bold text-zinc-700 italic lowercase tracking-normal">eylemi tetikledi</span>
                                                        <span className="text-blue-500">{log.action?.replace('_', ' ')}</span>
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-3">
                                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Hedef Kaynak: {log.targetId}</p>
                                                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => console.log(log.details)} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-zinc-600 hover:text-white transition-all shadow-xl opacity-0 group-hover:opacity-100"><Eye size={20} /></button>
                                        </div>
                                    ))}
                                    {adminLogs.length === 0 && <div className="p-32 text-center text-zinc-800 font-extrabold uppercase italic tracking-[0.4em]">Denetim Kaydı Boş</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'guilds' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="bg-black/40 border border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                                            <th className="p-8">Lonca Adı</th>
                                            <th className="p-8">Lider</th>
                                            <th className="p-8">Üyeler</th>
                                            <th className="p-8">Seviye</th>
                                            <th className="p-8 text-right">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allGuilds.map(guild => (
                                            <tr key={guild.id} className="border-b border-white/5 hover:bg-white/[0.015] transition-colors group">
                                                <td className="p-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-black">
                                                            {(guild.name || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-zinc-200 font-extrabold text-sm uppercase">{guild.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-8 text-zinc-500 text-xs font-bold">{guild.leaderName || 'Bilinmiyor'}</td>
                                                <td className="p-8 text-zinc-500 text-xs font-bold">{guild.members?.length || 0} Üye</td>
                                                <td className="p-8 text-zinc-500 text-xs font-bold">LVL {guild.level || 1}</td>
                                                <td className="p-8 text-right">
                                                    <button onClick={() => handleDeletePlayer(guild.id)} className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'market' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-12 gap-8">
                                <div className="col-span-12 lg:col-span-8 space-y-8">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="İlan adı, satıcı veya türe göre pazar yerinde ara..."
                                            value={marketSearchTerm}
                                            onChange={(e) => setMarketSearchTerm(e.target.value)}
                                            className="w-full h-20 bg-white/5 border border-white/5 rounded-[2rem] px-20 text-white text-base font-bold focus:outline-none focus:border-emerald-500/20 transition-all placeholder:text-zinc-700"
                                        />
                                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={24} />
                                    </div>

                                    <div className="bg-black/40 border border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                                                    <th className="p-8">İtem / İlan</th>
                                                    <th className="p-8">Fiyat (BTC)</th>
                                                    <th className="p-8">Satıcı</th>
                                                    <th className="p-8 text-right">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allMarket.filter(item => !marketSearchTerm || (item.label || '').toLowerCase().includes(marketSearchTerm.toLowerCase()) || (item.sellerName || '').toLowerCase().includes(marketSearchTerm.toLowerCase()) || (item.type || '').toLowerCase().includes(marketSearchTerm.toLowerCase())).map(item => (
                                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.015] transition-colors group">
                                                        <td className="p-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                                                                    <ShoppingCart size={18} />
                                                                </div>
                                                                <span className="text-zinc-200 font-extrabold text-sm uppercase">{item.label || item.type}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-8">
                                                            <div className="flex flex-col">
                                                                <span className="text-orange-500 font-black text-sm tabular-nums tracking-tighter">{item.price?.toFixed(8)}</span>
                                                                <span className="text-[9px] font-black text-zinc-700 uppercase mt-1">İstenen Fiyat</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-8">
                                                            <div className="flex flex-col">
                                                                <span className="text-zinc-200 font-extrabold text-sm uppercase tracking-tight">{item.sellerName || 'Anonim'}</span>
                                                                <span className="text-[9px] text-zinc-600 font-black mt-1 uppercase tracking-widest italic">{item.type} // {item.rarity}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-8 text-right">
                                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                                <button onClick={() => deleteDoc(doc(db, COLLECTIONS.MARKETPLACE, item.id))} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 shadow-xl"><Trash2 size={18} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {allMarket.length === 0 && <div className="p-20 text-center text-zinc-600 font-black uppercase text-xs tracking-widest">Veritabanında eşleşen kayıt bulunamadı</div>}
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-4 space-y-8">
                                    <div className="p-10 rounded-[3.5rem] bg-white/5 border border-white/5 space-y-10">
                                        <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3">
                                            <Activity size={18} className="text-orange-500" /> Pazar Analizi
                                        </h3>
                                        <div className="space-y-8">
                                            <InsightProgress label="Toplam Listeleme" value={allMarket.length} max={100} color="orange" />
                                            <InsightProgress label="Ortalama Fiyat" value={allMarket.length > 0 ? allMarket.reduce((acc, curr) => acc + (curr.price || 0), 0) / allMarket.length : 0} max={1} color="emerald" />
                                        </div>
                                        <div className="pt-10 border-t border-white/5">
                                            <button className="w-full h-16 rounded-[1.5rem] bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-transform">Envanteri Boşalt</button>
                                        </div>
                                    </div>

                                    <div className="p-10 rounded-[3.5rem] bg-orange-500/5 border border-orange-500/10 space-y-10">
                                        <h3 className="text-white font-black text-xs uppercase tracking-widest italic flex items-center gap-3">
                                            <Flame size={18} className="text-orange-500" /> Flaş Satış Kontrolü
                                        </h3>
                                        <div className="space-y-6">
                                            <InputGroup
                                                label="Global İndirim Oranı"
                                                value={globalSettings.marketDiscount || 0}
                                                onChange={(v) => handleUpdateSettings({ marketDiscount: parseInt(v) })}
                                                icon={<TrendingUp size={20} />}
                                                placeholder="%"
                                            />
                                            <button className="w-full h-20 rounded-[1.5rem] bg-orange-500 text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-3">
                                                <Zap size={18} /> Flaş Satışı Başlat
                                            </button>
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center italic">Başlatıldığında tüm oyunculara bildirim gider</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activities' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><Flame className="text-red-500" size={20} /> Küresel Etkinlikler</h3>
                                    <div className="grid gap-6">
                                        <BigCheatButton label="Madenci Bayramı" color="emerald" onClick={() => handleUpdateSettings({ eventMultiplier: 2.0 })} icon={<Cpu size={24} />} desc="Tüm kazım verimliliğini 24 saat boyunca %200 artırır." />
                                        <BigCheatButton label="TP Yağmuru" color="blue" onClick={() => handleUpdateSettings({ eventMultiplier: 1.5 })} icon={<Database size={24} />} desc="Görevlerden gelen TP ödüllerini %50 artırır." />
                                        <BigCheatButton label="VIP Haftası" color="purple" onClick={() => notify({ type: 'success', title: 'Planlandı', message: 'VIP haftası etkinliği kuyruğa alındı' })} icon={<Zap size={24} />} desc="VIP olmayan oyunculara sınırlı süreli özellikler tanımlar." />
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><Activity className="text-blue-500" size={20} /> Haftalık Görev Kontrolü</h3>
                                    <div className="p-12 rounded-[4rem] bg-black/60 border border-white/5 space-y-8 h-full">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Mevcut Görev Hedefi</p>
                                            <InputGroup label="Toplam Hash Hedefi" value="500000" onChange={(v) => console.log('Update goal', v)} icon={<Cpu size={20} />} placeholder="GH/S" />
                                            <InputGroup label="Ödül Havuzu (BTC)" value="0.005" onChange={(v) => console.log('Update reward', v)} icon={<Bitcoin size={20} />} placeholder="BTC" />
                                        </div>
                                        <div className="pt-10 border-t border-white/5">
                                            <button className="w-full h-16 rounded-[1.5rem] bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:brightness-110 transition-all">Görevleri Sıfırla ve Başlat</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full h-16 rounded-[1.25rem] flex items-center gap-5 px-8 transition-all group relative duration-500",
                active ? "bg-white text-black shadow-2xl shadow-emerald-500/10" : "text-zinc-600 hover:text-white hover:bg-white/5"
            )}
        >
            <div className={cn("transition-transform duration-500", active ? "scale-110" : "group-hover:scale-110")}>{icon}</div>
            <span className="text-xs font-extrabold uppercase tracking-widest">{label}</span>
            {active && <div className="absolute left-0 w-1.5 h-6 bg-emerald-500 rounded-r-full" />}
        </button>
    );
}

function BentoCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: 'blue' | 'emerald' | 'orange' | 'purple' }) {
    const shades = {
        blue: 'from-blue-500/15 text-blue-500 border-blue-500/10',
        emerald: 'from-emerald-500/15 text-emerald-500 border-emerald-500/10',
        orange: 'from-orange-500/15 text-orange-500 border-orange-500/10',
        purple: 'from-purple-500/15 text-purple-500 border-purple-500/10',
    };
    return (
        <div className={cn("p-10 rounded-[3rem] bg-gradient-to-br border backdrop-blur-3xl hover:-translate-y-2 transition-all duration-500 cursor-default group relative overflow-hidden h-64 flex flex-col justify-between", shades[color])}>
            <div className="relative z-10 w-full">
                <div className="flex justify-between items-start w-full">
                    <div className="p-4 bg-white/5 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                        {icon}
                    </div>
                </div>
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em]">{label}</p>
                <p className="text-4xl font-black mt-3 tracking-tighter text-white tabular-nums italic">{value}</p>
            </div>
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-current opacity-[0.03] blur-[60px] rounded-full group-hover:opacity-10 transition-opacity duration-1000" />
        </div>
    );
}

function InsightProgress({ label, value, max, color }: { label: string, value: number, max: number, color: 'emerald' | 'blue' | 'red' | 'orange' }) {
    const colors = { emerald: 'bg-emerald-500', blue: 'bg-blue-500', red: 'bg-red-500', orange: 'bg-orange-500' };
    const pct = Math.min((value / (max || 1)) * 100, 100);
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <span>{label}</span>
                <span className="text-white tabular-nums font-extrabold">{value} / {max}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={cn("h-full transition-all duration-1000 ease-out", colors[color])} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function StabilityRow({ label, value, active }: { label: string, value: string, active: boolean }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-zinc-600 mb-1 tracking-widest">{label}</p>
                <div className="flex items-end justify-between">
                    <p className="text-2xl font-black text-white tabular-nums tracking-tighter leading-none italic">{value}</p>
                    <div className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" : "bg-zinc-800")} />
                </div>
            </div>
        </div>
    );
}

function InputGroup({ label, placeholder, value, onChange, icon }: { label: string, placeholder: string, value: any, onChange: (v: string) => void, icon: React.ReactNode }) {
    const [val, setVal] = useState(value);
    useEffect(() => setVal(value), [value]);

    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-4">{label} // güvenli giriş</label>
            <div className="relative group">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors duration-300">
                    {icon}
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="w-full h-16 bg-white/[0.03] border border-white/5 rounded-[1.5rem] pl-20 pr-36 text-sm font-extrabold text-white focus:outline-none focus:border-emerald-500/20 transition-all duration-300"
                />
                <button
                    onClick={() => onChange(val)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 px-6 rounded-xl bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-emerald-500/10"
                >
                    Güncelle
                </button>
            </div>
        </div>
    );
}

function BigCheatButton({ label, desc, icon, onClick, color, active }: { label: string, desc: string, icon: React.ReactNode, onClick: () => void, color: string, active?: boolean }) {
    const colors: any = { emerald: 'bg-emerald-500', blue: 'bg-blue-500', yellow: 'bg-yellow-500', purple: 'bg-purple-500', red: 'bg-red-500' };
    return (
        <button
            onClick={onClick}
            className={cn("w-full p-8 rounded-[2.5rem] border-2 flex items-center gap-10 transition-all group duration-300 transform", active ? "bg-red-500/5 border-red-500/40" : "bg-white/5 border-white/5 hover:bg-white/10 hover:translate-x-3")}
        >
            <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-300", active ? "bg-red-500 text-white shadow-2xl shadow-red-500/20" : colors[color] + " text-black")}>
                {icon}
            </div>
            <div className="text-left flex-1">
                <p className={cn("text-xs font-black uppercase tracking-widest italic mb-1", active ? "text-red-500" : "text-white")}>{label}</p>
                <p className="text-[10px] font-bold text-zinc-600 leading-relaxed max-w-sm">{desc}</p>
            </div>
            <ChevronRight size={24} className="text-zinc-800 group-hover:text-emerald-500 transition-colors" />
        </button>
    );
}
