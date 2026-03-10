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
    MessageSquare,
    Link,
    Share2,
    Bell,
    Send,
    ShieldAlert,
    Banknote,
    CheckCircle2,
    Clock,
    XCircle,
    Copy,
    ExternalLink,
    Home,
    Smartphone,
    Mail,
    UserCheck,
    Download,
    Upload,
    History,
    FileText,
    Coins,
    Layout,
    Route,
    Award,
    Key,
    LifeBuoy,
    Info,
    Bug,
    ChevronDown,
    ChevronUp,
    MousePointer2,
    CreditCard,
    LogIn
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';
import { supabase, TABLES } from '../lib/supabase';
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

type AdminTab = 'overview' |
    'players_active' | 'players_banned' | 'players_email_unverified' | 'players_mobile_unverified' | 'players_kyc_unverified' | 'players_kyc_pending' | 'players_balance' | 'players_all' | 'players_notification' |
    'currencies' | 'mining_plans' | 'mining_paths' |
    'deposits_initiated' | 'deposits_pending' | 'deposits_approved' | 'deposits_success' | 'deposits_rejected' | 'deposits_all' |
    'withdrawals_pending' | 'withdrawals_approved' | 'withdrawals_rejected' | 'withdrawals_all' |
    'system_settings' | 'orders' | 'transactions_all' | 'referral_bonus' |
    'reports_login' | 'reports_notifications' |
    'support_pending' | 'support_closed' | 'support_answered' | 'support_all' |
    'info_app' | 'info_server' | 'info_cache' | 'info_update' |
    'report_request' | 'subscribers' |
    'market' | 'guilds' | 'referrals' | 'bots' | 'webhooks' | 'security' | 'economy' | 'activities' | 'cheats' | 'settings' | 'logs';

// Menu Categories structure is now handled inside the component for dynamic badges

export default function AdminPortal({ onClose }: { onClose: () => void }) {
    const { 
        state, 
        dispatch,
        adminSetBtc,
        adminSetTp,
        adminSetLevel,
        adminUpdateSettings,
        adminTriggerEvent
    } = useGame();
    const { notify } = useNotify();

    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [allMarket, setAllMarket] = useState<any[]>([]);
    const [allGuilds, setAllGuilds] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [adminLogs, setAdminLogs] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalTab, setModalTab] = useState<'profile' | 'miners' | 'transactions'>('profile');
    const [selectedPlayerMiners, setSelectedPlayerMiners] = useState<any[]>([]);
    const [selectedPlayerTransactions, setSelectedPlayerTransactions] = useState<any[]>([]);
    const [activeSessions, setActiveSessions] = useState(0);
    const [liveNetworkData, setLiveNetworkData] = useState<any[]>([]);
    const [openCategories, setOpenCategories] = useState<string[]>(['dashboard', 'manage_users']);
    const [logSearchQuery, setLogSearchQuery] = useState('');
    const [marketSearchTerm, setMarketSearchTerm] = useState('');
    const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'on_hold'>('all');

    const toggleCategory = (id: string) => {
        setOpenCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const MENU_CATEGORIES = [
        {
            title: 'Kontrol Paneli',
            id: 'dashboard',
            color: 'bg-indigo-600',
            items: [
                { id: 'overview' as AdminTab, label: 'Kontrol Paneli', icon: <Home size={16} /> },
            ]
        },
        {
            title: 'Kullanıcıları Yönet',
            id: 'manage_users',
            color: 'bg-violet-600',
            items: [
                { id: 'players_active' as AdminTab, label: 'Aktif Kullanıcılar', icon: <UserCheck size={16} /> },
                { id: 'players_banned' as AdminTab, label: 'Yasaklı Kullanıcılar', icon: <ShieldAlert size={16} />, badge: players.filter(p => p.isBanned).length || undefined },
                { id: 'players_kyc_pending' as AdminTab, label: 'KYC Beklemede', icon: <Clock size={16} />, badge: players.filter(p => (p.riskScore || 0) > 50).length || undefined },
                { id: 'players_all' as AdminTab, label: 'Tüm Kullanıcılar', icon: <Users size={16} />, badge: players.length || undefined },
                { id: 'players_notification' as AdminTab, label: 'Bildirim Gönder', icon: <Send size={16} /> },
            ]
        },
        {
            title: 'Mevduat & Çekim',
            id: 'finance_ops',
            color: 'bg-indigo-700',
            items: [
                { id: 'deposits_all' as AdminTab, label: 'Para Yatırma', icon: <Download size={16} />, badge: allTransactions.filter(t => t.type === 'deposit' && t.status === 'pending').length || undefined },
                { id: 'withdrawals_all' as AdminTab, label: 'Para Çekme', icon: <Upload size={16} />, badge: withdrawals.filter(w => w.status === 'pending').length || undefined },
            ]
        },
        {
            title: 'Oyun Ekosistemi',
            id: 'ecosystem',
            color: 'bg-emerald-600',
            items: [
                { id: 'market' as AdminTab, label: 'Pazar Yeri', icon: <ShoppingCart size={16} />, badge: allMarket.length || undefined },
                { id: 'guilds' as AdminTab, label: 'Loncalar', icon: <Users size={16} />, badge: allGuilds.length || undefined },
                { id: 'bots' as AdminTab, label: 'Bot Yönetimi', icon: <Cpu size={16} /> },
                { id: 'economy' as AdminTab, label: 'Ekonomi Ayarları', icon: <Coins size={16} /> },
            ]
        },
        {
            title: 'Sistem & Güvenlik',
            id: 'system_security',
            color: 'bg-zinc-900',
            items: [
                { id: 'settings' as AdminTab, label: 'Sistem Ayarları', icon: <SettingsIcon size={16} /> },
                { id: 'logs' as AdminTab, label: 'İşlem Günlükleri', icon: <ShieldCheck size={16} /> },
                { id: 'webhooks' as AdminTab, label: 'Webhook Ayarları', icon: <Link size={16} /> },
            ]
        },
        {
            title: 'Bilgi & Rapor',
            id: 'system_info',
            color: 'bg-indigo-600',
            items: [
                { id: 'info_server' as AdminTab, label: 'Sunucu Durumu', icon: <Database size={16} /> },
                { id: 'info_app' as AdminTab, label: 'Uygulama Bilgisi', icon: <Smartphone size={16} /> },
                { id: 'report_request' as AdminTab, label: 'Hata Raporları', icon: <Bug size={16} /> },
            ]
        }
    ];

    // Fetch Selected Player Sub-collections
    useEffect(() => {
        if (!selectedPlayer) {
            setSelectedPlayerMiners([]);
            setSelectedPlayerTransactions([]);
            return;
        }

        const fetchPlayerData = async () => {
            // Initial fetch
            const { data: miners } = await supabase.from('miners').select('*').eq('user_id', selectedPlayer.id);
            if (miners) setSelectedPlayerMiners(miners);

            const { data: txs, error: txErr } = await supabase.from(TABLES.TRANSACTIONS).select('*').eq('user_id', selectedPlayer.id).order('created_at', { ascending: false }).limit(10);
            if (txErr) console.error('AdminPortal Individual Tx Error:', txErr);
            if (txs) setSelectedPlayerTransactions(txs);
        };

        fetchPlayerData();

        const channel = supabase
            .channel(`player-${selectedPlayer.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'miners', filter: `user_id=eq.${selectedPlayer.id}` }, (payload) => {
                if (payload.eventType === 'INSERT') setSelectedPlayerMiners(prev => [...prev, payload.new]);
                if (payload.eventType === 'UPDATE') setSelectedPlayerMiners(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
                if (payload.eventType === 'DELETE') setSelectedPlayerMiners(prev => prev.filter(m => m.id === payload.old.id));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.TRANSACTIONS, filter: `user_id=eq.${selectedPlayer.id}` }, (payload) => {
                setSelectedPlayerTransactions(prev => [payload.new, ...prev].slice(0, 10));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedPlayer]);

    const currentPlayer = selectedPlayer ? (players.find(p => p.id === selectedPlayer.id) || selectedPlayer) : null;

    // Fetch Global Data
    useEffect(() => {
        setLoading(true);

        const fetchAllData = async () => {
            try {
                const { data: profiles } = await supabase.from(TABLES.PROFILES).select('*');
                if (profiles) setPlayers(profiles);

                const { data: withdraws, error: wErr } = await supabase.from(TABLES.WITHDRAWALS).select('*, profiles(username)').order('created_at', { ascending: false });
                if (wErr) console.error('AdminPortal Withdrawals Error:', wErr);
                if (withdraws) setWithdrawals(withdraws.map(w => ({ ...w, username: w.profiles?.username || 'Bilinmiyor' })));

                const { data: guilds } = await supabase.from(TABLES.GUILDS).select('*');
                if (guilds) setAllGuilds(guilds);

                const { data: market } = await supabase.from(TABLES.MARKETPLACE).select('*');
                if (market) setAllMarket(market);

                const { data: logs, error: lErr } = await supabase.from(TABLES.LOGS).select('*').order('created_at', { ascending: false }).limit(50);
                if (lErr) console.error('AdminPortal Logs Error:', lErr);
                if (logs) setAdminLogs(logs);

                const { data: txs, error: gtErr } = await supabase.from(TABLES.TRANSACTIONS).select('*, profiles(username)').order('created_at', { ascending: false }).limit(100);
                if (gtErr) console.error('AdminPortal Global Tx Error:', gtErr);
                if (txs) setAllTransactions(txs.map(t => ({ ...t, username: t.profiles?.username || 'Bilinmiyor' })));
            } catch (err) {
                console.error("Fetch all data error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();

        const globalChannel = supabase
            .channel('admin-global')
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.PROFILES }, (payload) => {
                if (payload.eventType === 'INSERT') setPlayers(prev => [...prev, payload.new]);
                if (payload.eventType === 'UPDATE') setPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
                if (payload.eventType === 'DELETE') setPlayers(prev => prev.filter(p => p.id === payload.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.TRANSACTIONS }, async (payload) => {
                if (payload.eventType === 'INSERT') {
                    const { data: profile } = await supabase.from(TABLES.PROFILES).select('username').eq('id', payload.new.user_id).single();
                    setAllTransactions(prev => [{ ...payload.new, username: profile?.username || 'Bilinmiyor' }, ...prev].slice(0, 100));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.WITHDRAWALS }, async (payload) => {
                if (payload.eventType === 'INSERT') {
                    // Start by adding with 'Loading...' or 'Bilinmiyor'
                    const newWithdrawal = { ...payload.new, username: 'Yükleniyor...' };
                    setWithdrawals(prev => [newWithdrawal, ...prev]);

                    // Fetch username
                    const { data: profile } = await supabase.from(TABLES.PROFILES).select('username').eq('id', payload.new.user_id).single();
                    if (profile) {
                        setWithdrawals(prev => prev.map(w => w.id === payload.new.id ? { ...w, username: profile.username } : w));
                    }
                }
                if (payload.eventType === 'UPDATE') {
                    setWithdrawals(prev => prev.map(w => w.id === payload.new.id ? { ...w, ...payload.new } : w));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.GUILDS }, (payload) => {
                if (payload.eventType === 'INSERT') setAllGuilds(prev => [...prev, payload.new]);
                if (payload.eventType === 'UPDATE') setAllGuilds(prev => prev.map(g => g.id === payload.new.id ? payload.new : g));
                if (payload.eventType === 'DELETE') setAllGuilds(prev => prev.filter(g => g.id === payload.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.MARKETPLACE }, (payload) => {
                if (payload.eventType === 'INSERT') setAllMarket(prev => [...prev, payload.new]);
                if (payload.eventType === 'UPDATE') setAllMarket(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
                if (payload.eventType === 'DELETE') setAllMarket(prev => prev.filter(m => m.id === payload.old.id));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.LOGS }, (payload) => {
                setAdminLogs(prev => [payload.new, ...prev].slice(0, 50));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.SETTINGS }, (payload) => {
                if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                    dispatch({ type: 'SET_GLOBAL_SETTINGS', settings: payload.new });
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(globalChannel); };
    }, []);

    useEffect(() => {
        if (activeTab === 'withdrawals_pending') {
            setActiveTab('withdrawals');
            setWithdrawalFilter('pending');
        }
        if (activeTab === 'banned') {
            setActiveTab('players');
            setSearchTerm('is:banned'); // Assuming I implement a search filter like this or just handle it in players tab
        }
    }, [activeTab]);

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
            await supabase.from(TABLES.LOGS).insert({
                admin_id: state.user?.uid,
                admin_username: state.username,
                action,
                target_id: targetId || 'global',
                details: details || {}
            });
        } catch (e) { console.error("Logging failed", e); }
    };

    const handleDeleteGuild = async (gid: string) => {
        const cleanGid = gid.trim();
        if (!window.confirm('Bu loncayı silmek istediğinize emin misiniz?')) return;
        try {
            await supabase.from(TABLES.GUILDS).delete().eq('id', cleanGid);
            await logAdminAction('delete_guild', cleanGid);
            notify({ type: 'success', title: 'Silindi', message: 'Lonca başarıyla silindi.' });
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Silme işlemi başarısız.' }); }
    };

    const handleUpdatePlayer = async (uid: string, updates: any) => {
        const cleanUid = uid.trim();
        try {
            await supabase.from(TABLES.PROFILES).update(updates).eq('id', cleanUid);
            await logAdminAction('update_player', cleanUid, updates);
            notify({ type: 'success', title: 'Başarılı', message: 'Oyuncu verileri güncellendi.' });
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Güncelleme başarısız.' }); }
    };

    const handleDeletePlayer = async (uid: string) => {
        const cleanUid = uid.trim();
        if (!window.confirm('Bu oyuncuyu TAMAMEN silmek istediğinize emin misiniz?')) return;
        try {
            await supabase.from(TABLES.PROFILES).delete().eq('id', cleanUid);
            await logAdminAction('delete_player', cleanUid);
            notify({ type: 'success', title: 'Silindi', message: 'Oyuncu başarıyla silindi.' });
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Silme işlemi başarısız.' }); }
    };

    const handleUpdateSettings = async (updates: any) => {
        try {
            // Sanitize updates to prevent undefined values
            const cleanUpdates = Object.fromEntries(
                Object.entries(updates).map(([k, v]) => [k, v === undefined ? "" : v])
            );
            await supabase.from(TABLES.SETTINGS).upsert({ id: 'v1', ...cleanUpdates });
            await logAdminAction('update_settings', 'global', cleanUpdates);
            notify({ type: 'success', title: 'Ayarlar Kaydedildi', message: 'Global sistem ayarları güncellendi.' });
        } catch (e: any) {
            console.error("Settings update failed:", e);
            notify({ type: 'warning', title: 'Hata', message: `Ayarlar kaydedilemedi: ${e.message || 'Bilinmeyen hata'}` });
        }
    };

    // Analytics Helper Data
    const totalBtc = players.reduce((acc, p) => acc + (p.btcBalance || 0), 0);
    const totalTp = players.reduce((acc, p) => acc + (p.tycoonPoints || 0), 0);
    const vipCount = players.filter(p => p.vip?.isActive).length;

    return (
        <div className="flex h-screen w-full bg-[#f8f9fa] text-zinc-600 font-sans overflow-hidden">
            {/* 🏰 Premium Sidebar */}
            <aside className="w-72 h-full bg-[#161c2d] border-r border-white/5 flex flex-col z-20 shrink-0 overflow-y-auto custom-scrollbar">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-lg tracking-tighter uppercase leading-none">Tycoon</h1>
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Admin Panel</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <SidebarLink active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={18} />} label="Dashboard" />
                        </div>

                        {MENU_CATEGORIES.map((cat) => {
                            const isOpen = openCategories.includes(cat.id);
                            return (
                                <div key={cat.id} className="space-y-1">
                                    <button
                                        onClick={() => toggleCategory(cat.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group mb-1",
                                            cat.color ? `${cat.color} text-white shadow-lg shadow-black/20` : "hover:bg-white/5 text-zinc-500"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {cat.items[0]?.icon}
                                            <p className="text-[10px] font-black uppercase tracking-[0.15em]">
                                                {cat.title}
                                            </p>
                                        </div>
                                        {cat.items.length > 1 && (
                                            <div className="text-white/40 group-hover:text-white transition-colors">
                                                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </div>
                                        )}
                                    </button>

                                    {isOpen && (
                                        <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                            {cat.items.map(item => (
                                                <SidebarLink
                                                    key={item.id}
                                                    active={activeTab === item.id}
                                                    onClick={() => setActiveTab(item.id as AdminTab)}
                                                    icon={item.icon}
                                                    label={item.label}
                                                    badge={item.badge}
                                                    sub={cat.items.length > 1}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-auto p-6 border-t border-white/5 bg-black/10">
                    <button onClick={onClose} className="w-full h-12 rounded-xl border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3 active:scale-95">
                        <LogOut size={16} /> Paneli Kapat
                    </button>
                </div>
            </aside>

            {/* 🖥️ Ana Panel */}
            <main className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#f0f2f5] relative">
                <header className="sticky top-0 z-10 w-full px-8 py-4 bg-white shadow-sm flex items-center justify-between">
                    <div>
                        <h2 className="text-[#161c2d] font-black text-xl uppercase tracking-tight">
                            {(() => {
                                const allItems = MENU_CATEGORIES.flatMap(c => c.items);
                                const currentItem = allItems.find(i => i.id === activeTab);
                                return currentItem?.label || (activeTab === 'overview' ? 'Genel Bakış' : activeTab.replace(/_/g, ' '));
                            })()}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Sistem Aktif // Gecikme: 14ms</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-6 px-4 py-2 rounded-xl bg-zinc-100 border border-zinc-200">
                            <div className="text-right">
                                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Tahmini Değer</p>
                                <p className="text-xs font-black text-emerald-600 tabular-nums">${(totalBtc * 65000).toLocaleString()}</p>
                            </div>
                            <div className="w-px h-6 bg-zinc-200" />
                            <div className="text-right">
                                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Etkinlik Çarpanı</p>
                                <p className="text-xs font-black text-blue-600 tabular-nums">{state.globalSettings.eventMultiplier || 1.0}x</p>
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg text-sm">
                            {(state.username?.charAt(0) || '?').toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="p-8 space-y-8 max-w-[1600px] mx-auto pb-32">

                    {activeTab === 'overview' && (
                        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <BentoCard label="Toplam Kullanıcı" value={players.length.toLocaleString()} icon={<Users size={24} />} color="blue" />
                                <BentoCard label="Aktif Oturumlar" value={activeSessions.toString()} icon={<Activity size={24} />} color="emerald" />
                                <BentoCard label="E-posta Onaysız" value={players.filter(p => !p.email_verified).length.toString()} icon={<Bell size={24} />} color="orange" />
                                <BentoCard label="Doğrulama Bekleyen" value={players.filter(p => p.riskScore > 0).length.toString()} icon={<ShieldAlert size={24} />} color="purple" />
                            </div>

                            {/* 💰 Finansal Özet */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white rounded-[2rem] border border-zinc-200 p-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-8 border-b border-zinc-50 pb-4">
                                        <h3 className="font-black text-sm text-zinc-800 uppercase tracking-tight flex items-center gap-2">
                                            <Bitcoin className="text-orange-500" size={18} /> Yatırım Geçmişi
                                        </h3>
                                        <ArrowRight className="text-zinc-300" size={16} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <MiniStat label="Toplam Yatırım" value={`${allTransactions.filter(t => t.type === 'deposit').reduce((acc, t) => acc + t.amount, 0).toFixed(4)} BTC`} icon={<CheckCircle2 className="text-emerald-500" size={20} />} />
                                        <MiniStat label="Bekleyen İşlemler" value={`${allTransactions.filter(t => t.type === 'deposit' && t.status === 'pending').length}`} icon={<Clock className="text-orange-500" size={20} />} />
                                        <MiniStat label="Reddedilenler" value={`${allTransactions.filter(t => t.type === 'deposit' && t.status === 'rejected').length}`} icon={<XCircle className="text-red-500" size={20} />} />
                                        <MiniStat label="Madenci Alımları" value={`${allTransactions.filter(t => t.type === 'buy_item').length}`} icon={<Cpu className="text-blue-500" size={20} />} />
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] border border-zinc-200 p-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-8 border-b border-zinc-50 pb-4">
                                        <h3 className="font-black text-sm text-zinc-800 uppercase tracking-tight flex items-center gap-2">
                                            <Banknote className="text-emerald-500" size={18} /> Çekim Talepleri Özeti
                                        </h3>
                                        <ArrowRight className="text-zinc-300" size={16} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <MiniStat label="Toplam Çekim" value={`${allTransactions.filter(t => t.type === 'withdrawal' && t.status === 'approved').reduce((acc, t) => acc + Math.abs(t.amount), 0).toFixed(4)} BTC`} icon={<CheckCircle2 className="text-blue-500" size={20} />} />
                                        <MiniStat label="Bekleyen Talepler" value={`${withdrawals.filter(w => w.status === 'pending').length}`} icon={<Clock className="text-orange-500" size={20} />} />
                                        <MiniStat label="Reddedilen Talepler" value={`${withdrawals.filter(w => w.status === 'rejected').length}`} icon={<XCircle className="text-red-500" size={20} />} />
                                        <MiniStat label="Sistem Komisyonu" value="0.0000 BTC" icon={<Activity className="text-purple-500" size={20} />} />
                                    </div>
                                </div>
                            </div>

                            {/* 📈 Grafikler Ara Alanı */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-zinc-200 shadow-sm relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="font-black text-sm text-zinc-800 uppercase tracking-tight">Sistem İşlem Akışı (24s)</h3>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-zinc-100 text-zinc-400 rounded-full text-[8px] font-black uppercase tracking-widest">Canlı Veri</span>
                                        </div>
                                    </div>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={liveNetworkData}>
                                                <defs>
                                                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                                <XAxis dataKey="time" hide />
                                                <YAxis fontSize={9} stroke="#ddd" tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ background: '#fff', border: '1px solid #efefef', borderRadius: '12px', fontSize: '10px' }}
                                                />
                                                <Area type="monotone" dataKey="load" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFlow)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-200 shadow-sm">
                                    <h3 className="font-black text-sm text-zinc-800 uppercase tracking-tight mb-8">Giriş Dağılımı</h3>
                                    <div className="h-[250px] w-full flex items-center justify-center relative">
                                        <div className="w-32 h-32 rounded-full border-[16px] border-emerald-500 border-l-indigo-600 border-b-orange-500 relative">
                                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                <span className="text-xl font-black text-zinc-800">84%</span>
                                                <span className="text-[7px] text-zinc-400 font-bold uppercase">Başarılı</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <ChartLegend color="bg-indigo-600" label="Chrome" value="45%" />
                                        <ChartLegend color="bg-emerald-500" label="Safari" value="30%" />
                                        <ChartLegend color="bg-orange-500" label="Firefox" value="15%" />
                                        <ChartLegend color="bg-zinc-200" label="Diğer" value="10%" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeTab.startsWith('players_') || activeTab === 'players') && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-12 gap-8">
                                <div className="col-span-12 lg:col-span-8 space-y-8">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="Kullanıcı adı, UID, e-posta veya seviye ile ara..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full h-16 bg-white border border-zinc-200 rounded-2xl px-16 text-zinc-800 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all placeholder:text-zinc-400 shadow-sm"
                                        />
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    </div>

                                    <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-zinc-50/50 border-b border-zinc-100 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                    <th className="p-6">Kullanıcı Kimliği</th>
                                                    <th className="p-6">Cüzdan (BTC)</th>
                                                    <th className="p-6">Seviye / XP</th>
                                                    <th className="p-6 text-right">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-50">
                                                {players.filter(p => {
                                                    const matchesSearch = !searchTerm || (p.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.id || '').includes(searchTerm);
                                                    if (!matchesSearch) return false;

                                                    if (activeTab === 'players_active') return !p.isBanned;
                                                    if (activeTab === 'players_banned') return p.isBanned;
                                                    if (activeTab === 'players_email_unverified') return p.email_verified === false;
                                                    if (activeTab === 'players_kyc_pending') return p.riskScore > 50; 
                                                    return true;
                                                }).slice(0, 15).map(player => (
                                                    <tr key={player.id} className="hover:bg-zinc-50/50 transition-colors group">
                                                        <td className="p-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-black text-xs text-zinc-500 border border-zinc-200 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all">
                                                                    {(player.username?.charAt(0) || '?').toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-zinc-800 font-bold text-sm tracking-tight">{player.username}</p>
                                                                    <p className="text-[9px] text-zinc-400 font-bold mt-0.5 uppercase tracking-widest">{player.isAdmin ? 'Sistem Yöneticisi' : player.vip?.isActive ? 'VIP Üye' : 'Standart Kullanıcı'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-orange-600 font-black text-sm tabular-nums tracking-tighter">{player.btcBalance?.toFixed(8)}</span>
                                                                <span className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5 tracking-widest">Kullanılabilir Bakiye</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-indigo-600 font-black text-sm tabular-nums tracking-tighter">SEVİYE {player.level}</span>
                                                                <span className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5 tracking-widest">{player.xp?.toLocaleString()} Toplam XP</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button onClick={() => setSelectedPlayer(player)} className="p-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"><Edit3 size={16} /></button>
                                                                <button onClick={() => handleDeletePlayer(player.id)} className="p-2.5 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"><Trash2 size={16} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {players.length === 0 && <div className="p-16 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Veritabanında eşleşen kayıt bulunamadı</div>}
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-4 space-y-8">
                                    <div className="p-8 rounded-[2rem] bg-white border border-zinc-200 shadow-sm space-y-8">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                            <BarChart3 size={18} className="text-indigo-500" /> Veritabanı Metrikleri
                                        </h3>
                                        <div className="space-y-6">
                                            <InsightProgress label="Oyuncu Kapasitesi" value={players.length} max={1000} color="emerald" light />
                                            <InsightProgress label="VIP Dönüşüm Oranı" value={vipCount} max={players.length || 1} color="blue" light />
                                            <InsightProgress label="Yönetici Sayısı" value={players.filter(p => p.isAdmin).length} max={10} color="red" light />
                                        </div>
                                        <div className="pt-8 border-t border-zinc-100">
                                            <button className="w-full h-14 rounded-xl bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 active:scale-95">
                                                Veritabanını Dışa Aktar (JSON) <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedPlayer && currentPlayer && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/60 backdrop-blur-md p-6 overflow-y-auto no-scrollbar">
                                    <div className="w-full max-w-4xl bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                                        <div className="p-10 border-b border-zinc-100 bg-zinc-50/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                                        <Users size={28} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tight leading-none">Kullanıcı Düzenleme</h3>
                                                        <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-2">{currentPlayer.username} • UID: {currentPlayer.id.substring(0, 8)}...</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setSelectedPlayer(null)} className="p-3 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-600 transition-all active:scale-95"><X size={20} /></button>
                                            </div>

                                            <div className="flex items-center gap-4 mt-10">
                                                {['profile', 'miners', 'transactions'].map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setModalTab(t as any)}
                                                        className={cn(
                                                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                            modalTab === t
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                                                                : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300 hover:text-zinc-600"
                                                        )}
                                                    >
                                                        {t === 'profile' ? 'Profil Bilgisi' : t === 'miners' ? 'Ekipmanlar' : 'İşlem Geçmişi'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-10">
                                            {modalTab === 'profile' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                    <InputGroup label="BTC Cüzdan Bakiyesi" value={currentPlayer.btcBalance?.toString()} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { btcBalance: parseFloat(v) })} icon={<Bitcoin className="text-orange-500" size={18} />} placeholder="0.0" light />
                                                    <InputGroup label="Tycoon Puanı (TP)" value={currentPlayer.tycoonPoints?.toString()} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { tycoonPoints: parseInt(v) })} icon={<Database className="text-indigo-500" size={18} />} placeholder="0" light />
                                                    <InputGroup label="Mevcut Seviye" value={currentPlayer.level?.toString()} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { level: parseInt(v) })} icon={<TrendingUp className="text-blue-500" size={18} />} placeholder="1" light />
                                                    <InputGroup label="Deneyim (XP)" value={currentPlayer.xp?.toString()} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { xp: parseInt(v) })} icon={<Zap className="text-amber-500" size={18} />} placeholder="0" light />
                                                </div>
                                            )}

                                            {modalTab === 'miners' && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {selectedPlayerMiners.map(miner => (
                                                            <div key={miner.id} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between group">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-indigo-600 shadow-sm">
                                                                        <Cpu size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-zinc-800 font-bold text-xs uppercase tracking-tight">{miner.label || miner.type}</p>
                                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">GÜÇ: {miner.hashrate} GH/S</p>
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => supabase.from('miners').delete().eq('id', miner.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                                            </div>
                                                        ))}
                                                        {selectedPlayerMiners.length === 0 && <div className="col-span-2 py-10 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest italic">Bu kullanıcı için madenci ekipmanı bulunamadı</div>}
                                                    </div>
                                                </div>
                                            )}

                                            {modalTab === 'transactions' && (
                                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                                    {selectedPlayerTransactions.map(tx => (
                                                        <div key={tx.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shadow-sm", tx.amount > 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                                                                    {tx.amount > 0 ? <TrendingUp size={16} /> : <TrendingUp className="rotate-180" size={16} />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-zinc-800 font-bold text-[11px] uppercase tracking-tight">{tx.description || 'Sistem İşlemi'}</p>
                                                                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{new Date(tx.timestamp).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                            <p className={cn("font-black text-sm tabular-nums", tx.amount > 0 ? "text-emerald-600" : "text-red-600")}>
                                                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(8)} {tx.currency || 'BTC'}
                                                            </p>
                                                        </div>
                                                    ))}
                                                    {selectedPlayerTransactions.length === 0 && <div className="py-10 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest italic">İşlem geçmişi bulunamadı</div>}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-100">
                                                <button onClick={() => handleUpdatePlayer(currentPlayer.id, { isAdmin: !currentPlayer.isAdmin })} className={cn("h-14 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border-2", currentPlayer.isAdmin ? "bg-red-50 border-red-100 text-red-600" : "bg-zinc-50 border-zinc-100 text-zinc-500 hover:bg-zinc-100")}>
                                                    {currentPlayer.isAdmin ? 'Yöneticilik Yetkisini Kaldır' : 'Yönetici Yetkisi Ver'}
                                                </button>
                                                <button onClick={() => handleUpdatePlayer(currentPlayer.id, { "vip.isActive": !currentPlayer.vip?.isActive })} className={cn("h-14 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border-2", currentPlayer.vip?.isActive ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-zinc-50 border-zinc-100 text-zinc-500 hover:bg-zinc-100")}>
                                                    {currentPlayer.vip?.isActive ? 'Standart Üyeliğe Düşür' : 'VIP Elite Statüsüne Yükselt'}
                                                </button>
                                            </div>

                                            <div className="mt-6 flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-zinc-300 font-bold text-[9px] uppercase tracking-widest">
                                                    <ShieldAlert size={14} /> Kritik Veri Erişimi
                                                </div>
                                                <button onClick={() => handleDeletePlayer(currentPlayer.id)} className="px-8 py-3 bg-red-50 text-red-600 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                                                    Kullanıcıyı Kalıcı Olarak Sil
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'economy' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                        <Bitcoin className="text-orange-500" size={18} /> Manuel Müdahale
                                    </h3>
                                    <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-8">
                                        <InputGroup label="BTC Bakiyesi" value={state.btcBalance.toString()} onChange={(v) => adminSetBtc(parseFloat(v))} icon={<Bitcoin size={16} />} placeholder="0.00" light />
                                        <InputGroup label="TP Rezervi" value={state.tycoonPoints.toString()} onChange={(v) => adminSetTp(parseInt(v))} icon={<Database size={16} />} placeholder="0" light />
                                        <InputGroup label="Deneyim Takviyesi" value="0" onChange={(v) => dispatch({ type: 'ADMIN_ADD_XP', amount: parseInt(v) || 0 })} icon={<TrendingUp size={16} />} placeholder="XP Ekle" light />
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                        <ShoppingCart className="text-indigo-500" size={18} /> Kontrat Denetimi
                                    </h3>
                                    <div className="grid gap-4">
                                        {(state.availableJobs || []).map(job => (
                                            <div key={job.id} className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4 group hover:border-indigo-200 transition-all">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{job.client}</span>
                                                    <span className="text-[9px] font-bold text-zinc-400 uppercase">GH: {job.goalHash.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <h4 className="text-zinc-800 font-black text-sm uppercase tracking-tight">{job.label}</h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-2">
                                                            <Bitcoin size={12} className="text-orange-500" />
                                                            <input
                                                                type="number"
                                                                step="0.000000001"
                                                                defaultValue={job.reward}
                                                                onBlur={(e) => dispatch({ type: 'ADMIN_UPDATE_JOB', jobId: job.id, updates: { reward: parseFloat(e.target.value) } })}
                                                                className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-right text-xs font-black text-zinc-800 focus:outline-none focus:border-indigo-300 transition-all tabular-nums"
                                                            />
                                                        </div>
                                                        <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1 tracking-widest">BTC ÖDÜLÜ</p>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                        <Zap className="text-amber-500" size={18} /> Güç Modifikasyonları
                                    </h3>
                                    <div className="grid gap-4">
                                        <BigCheatButton label="Enerji Patlaması" color="yellow" onClick={() => dispatch({ type: 'ADMIN_TRIGGER_EVENT', eventType: 'energy_surge' })} icon={<Zap size={22} />} desc="Tüm hücresel sistemleri anında %100 kapasiteye doldurur." />
                                        <BigCheatButton label="Sonsuz Enerji" color="red" active={state.isInfiniteEnergy} onClick={() => dispatch({ type: 'ADMIN_TOGGLE_INFINITE_ENERGY' })} icon={<Unlock size={22} />} desc="Güvenlik protokollerini devre dışı bırakır. Kullanım rezerv tüketmez." />
                                        <BigCheatButton label="Hashrate Enjektörü" color="purple" onClick={() => dispatch({ type: 'ADMIN_ADD_HASHRATE', amount: 100000 })} icon={<Cpu size={22} />} desc="Çekirdeğe doğrudan +100 GH/s hesaplama gücü enjekte eder." />
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                        <TrendingUp className="text-indigo-500" size={18} /> İlerleme Hileleri
                                    </h3>
                                    <div className="grid gap-4">
                                        <BigCheatButton label="Seviye Atlama" color="emerald" onClick={() => adminSetLevel(state.level + 1)} icon={<ArrowRight size={22} />} desc="Kimlik yetkilendirme seviyesini +1 birim artırır." />
                                        <BigCheatButton label="Mega İlerleme" color="blue" onClick={() => adminSetLevel(state.level + 10)} icon={<ChevronRight size={22} />} desc="Sistem yetkilendirmesinde önemli bir atlama sağlar. +10 Seviye." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activities' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-10 relative overflow-hidden">
                                    <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                        <ShieldCheck size={18} className="text-indigo-500" /> System Protocols
                                    </h3>

                                    <div className="space-y-6">
                                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Maintenance Mode</p>
                                        <button
                                            onClick={() => handleUpdateSettings({ isMaintenance: !state.globalSettings.isMaintenance })}
                                            className={cn("w-full h-24 rounded-2xl border-2 flex items-center gap-6 px-8 transition-all group", state.globalSettings.isMaintenance ? "bg-red-50 border-red-200" : "bg-white border-zinc-100 hover:bg-zinc-50")}
                                        >
                                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm", state.globalSettings.isMaintenance ? "bg-red-500 text-white" : "bg-zinc-100 text-zinc-400")}>
                                                {state.globalSettings.isMaintenance ? <Lock size={20} /> : <Unlock size={20} />}
                                            </div>
                                            <div className="text-left">
                                                <p className={cn("text-base font-black uppercase tracking-tight", state.globalSettings.isMaintenance ? "text-red-600" : "text-zinc-800")}>{state.globalSettings.isMaintenance ? 'Bakım Modu Aktif' : 'Sistem Çalışıyor'}</p>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Tüm istemciler için küresel erişim kısıtlaması</p>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="space-y-6 pt-8 border-t border-zinc-100">
                                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Küresel Bonus Çarpanı</p>
                                        <div className="grid grid-cols-4 gap-3">
                                            {[1.0, 1.5, 2.0, 3.0].map(m => (
                                                <button key={m} onClick={() => handleUpdateSettings({ eventMultiplier: m })} className={cn("h-14 rounded-xl font-black text-xs transition-all border-2", state.globalSettings.eventMultiplier === m ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-white border-zinc-100 text-zinc-400 hover:text-zinc-600")}>{m}x</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-8 flex flex-col">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                            <Terminal size={18} className="text-indigo-500" /> Sistem Duyurusu
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[8px] font-black text-emerald-600 uppercase">Canlı Çıktı</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <textarea
                                            value={state.globalSettings.announcement || ''}
                                            onChange={(e) => handleUpdateSettings({ announcement: e.target.value })}
                                            className="w-full h-48 bg-zinc-50 border border-zinc-200 rounded-2xl p-6 text-sm font-mono text-zinc-800 focus:outline-none focus:border-indigo-300 transition-all no-scrollbar placeholder:text-zinc-300 leading-relaxed shadow-inner"
                                            placeholder="Sistem yayın mesajını girin..."
                                        />
                                        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                            <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-2 italic">Duyuru Önizleme</p>
                                            <p className="text-zinc-600 text-[10px] font-medium leading-relaxed">{state.globalSettings.announcement || 'Mesaj girişi bekleniyor...'}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-zinc-400 font-bold text-[9px] uppercase tracking-widest">
                                            <Activity size={12} /> Senkronizasyon Aktif
                                        </div>
                                        <button onClick={() => notify({ type: 'success', title: 'Yayınlandı', message: 'Sistem duyurusu güncellendi.' })} className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95">Terminali Güncelle</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Yönetici adı veya işlem ile ara..."
                                    value={logSearchQuery}
                                    onChange={(e) => setLogSearchQuery(e.target.value)}
                                    className="w-full h-16 bg-white border border-zinc-200 rounded-2xl px-16 text-zinc-800 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all placeholder:text-zinc-400 shadow-sm"
                                />
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                            </div>

                            <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                            <ShieldAlert size={20} />
                                        </div>
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest">Güvenlik Denetim İzleri</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        {adminLogs.filter(log =>
                                            !logSearchQuery ||
                                            (log.adminUsername || '').toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                                            (log.action || '').toLowerCase().includes(logSearchQuery.toLowerCase())
                                        ).length} Kayıt Bulundu
                                    </span>
                                </div>
                                <div className="divide-y divide-zinc-50">
                                    {adminLogs.filter(log =>
                                        !logSearchQuery ||
                                        (log.admin_username || '').toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                                        (log.action || '').toLowerCase().includes(logSearchQuery.toLowerCase())
                                    ).slice(0, 20).map(log => (
                                        <div key={log.id} className="p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border transition-all", log.action?.includes('delete') ? "bg-red-50 border-red-100 text-red-500 shadow-sm" : "bg-zinc-50 border-zinc-100 text-indigo-600")}>
                                                    {log.action?.includes('delete') ? <Trash2 size={20} /> : <Terminal size={20} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-800 tracking-tight">
                                                        <span className="text-indigo-600 font-black">{log.admin_username || 'Admin'}</span>
                                                        <span className="mx-2 text-zinc-400 font-medium">tarafından yürütüldü:</span>
                                                        <span className="text-zinc-900 uppercase text-[10px] font-black tracking-widest bg-zinc-100 px-2 py-0.5 rounded-md">{log.action?.replace('_', ' ')}</span>
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">HEDEF: {log.target_id?.substring(0, 8)}...</p>
                                                        <div className="w-1 h-1 rounded-full bg-zinc-200" />
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => console.log(log.details)} className="p-3 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm"><Eye size={16} /></button>
                                        </div>
                                    ))}
                                    {adminLogs.length === 0 && <div className="p-20 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest italic">Güvenlik günlüğü bulunamadı</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'guilds' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                            <Users size={20} />
                                        </div>
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest">Global İttifak Kayıtları</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{allGuilds.length} Aktif Lonca</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-zinc-100 bg-zinc-50/30 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                <th className="px-8 py-5">İttifak Kimliği</th>
                                                <th className="px-8 py-5">Lider</th>
                                                <th className="px-8 py-5">Üye Sayısı</th>
                                                <th className="px-8 py-5">Seviye</th>
                                                <th className="px-8 py-5 text-right">İşlemler</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-50">
                                            {allGuilds.map(guild => (
                                                <tr key={guild.id} className="hover:bg-zinc-50/50 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                                                                {guild.name?.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="text-zinc-800 font-extrabold text-sm uppercase tracking-tight block">{guild.name}</span>
                                                                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">ID: {guild.id.substring(0, 8)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-zinc-600 text-xs font-bold">{guild.leaderName || 'Bilinmiyor'}</td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase border border-zinc-200">{guild.members?.length || 0} Üye</span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase border border-indigo-100">SEVİYE {guild.level || 1}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button onClick={() => handleDeleteGuild(guild.id)} className="p-3 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {allGuilds.length === 0 && <div className="p-20 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest italic">Aktif ittifak bulunamadı</div>}
                            </div>
                        </div>
                    )}


                    {activeTab === 'market' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-12 gap-10">
                                <div className="col-span-12 lg:col-span-8 space-y-8">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="Ürün adı, satıcı veya tür ile arayın..."
                                            value={marketSearchTerm}
                                            onChange={(e) => setMarketSearchTerm(e.target.value)}
                                            className="w-full h-16 bg-white border border-zinc-200 rounded-2xl px-16 text-zinc-800 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 transition-all placeholder:text-zinc-400 shadow-sm"
                                        />
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                                    </div>

                                    <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-zinc-100 bg-zinc-50/30 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                    <th className="px-8 py-5">Ürün Tanımı</th>
                                                    <th className="px-8 py-5">Değer (BTC)</th>
                                                    <th className="px-8 py-5">Satıcı Bilgisi</th>
                                                    <th className="px-8 py-5 text-right">Kontrol</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-50">
                                                {allMarket.filter(item => !marketSearchTerm || (item.label || '').toLowerCase().includes(marketSearchTerm.toLowerCase()) || (item.sellerName || '').toLowerCase().includes(marketSearchTerm.toLowerCase()) || (item.type || '').toLowerCase().includes(marketSearchTerm.toLowerCase())).map(item => (
                                                    <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                                                                    <ShoppingCart size={18} />
                                                                </div>
                                                                <span className="text-zinc-800 font-extrabold text-sm uppercase tracking-tight">{item.label || item.type}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-zinc-900 font-black text-sm tabular-nums tracking-tighter">{item.price?.toFixed(8)}</span>
                                                                <span className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5 tracking-widest italic">LİSTELEME FİYATI</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-zinc-700 font-bold text-xs uppercase tracking-tight">{item.sellerName || 'Anonim'}</span>
                                                                <span className="text-[8px] text-zinc-400 font-black mt-0.5 uppercase tracking-widest italic">{item.type} • {item.rarity}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <button onClick={() => supabase.from(TABLES.MARKETPLACE).delete().eq('id', item.id)} className="p-3 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {allMarket.length === 0 && <div className="p-20 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest italic">Pazar yeri şu an boş</div>}
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-4 space-y-8">
                                    <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-10">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                            <Activity size={18} className="text-orange-500" /> Pazar Analitiği
                                        </h3>
                                        <div className="space-y-8">
                                            <InsightProgress label="Mevcut Listelemeler" value={allMarket.length} max={100} color="orange" light />
                                            <InsightProgress label="Ortalama Pazar Fiyatı" value={allMarket.length > 0 ? allMarket.reduce((acc, curr) => acc + (curr.price || 0), 0) / allMarket.length : 0} max={1} color="emerald" light />
                                        </div>
                                        <div className="pt-6 border-t border-zinc-100">
                                            <button className="w-full h-14 rounded-xl bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95">Tüm Listelemeleri Temizle</button>
                                        </div>
                                    </div>

                                    <div className="p-10 rounded-[2.5rem] bg-orange-50 border border-orange-100 shadow-sm space-y-10">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                            <Flame size={18} className="text-orange-600" /> Fırsat Ürünü Protokolü
                                        </h3>
                                        <div className="space-y-6">
                                            <InputGroup
                                                label="Küresel İndirim Faktörü"
                                                value={state.globalSettings.marketDiscount || 0}
                                                onChange={(v) => handleUpdateSettings({ marketDiscount: parseInt(v) })}
                                                icon={<TrendingUp size={16} />}
                                                placeholder="%"
                                                light
                                            />
                                            <button className="w-full h-16 rounded-xl bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                                                <Zap size={16} /> İndirimi Başlat
                                            </button>
                                            <p className="text-[9px] font-bold text-orange-600/60 uppercase tracking-widest text-center italic">Tüm aktif düğümlere indirim yayını yapar</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'referrals' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-12 gap-10">
                                <div className="col-span-12 lg:col-span-8 space-y-8">
                                    <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                        <Users className="text-indigo-500" size={18} /> Küresel Referans Matrisi
                                    </h3>
                                    <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-zinc-100 bg-zinc-50/30 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                    <th className="px-8 py-5">Kaynak Ajan (Referans)</th>
                                                    <th className="px-8 py-5 text-center">Dönüştürülen Düğümler</th>
                                                    <th className="px-8 py-5">Üretilen Kazanç</th>
                                                    <th className="px-8 py-5 text-right">Görüntüle</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-50">
                                                {players.map(player => {
                                                    const referralCount = players.filter(p => p.referredBy === player.id).length;
                                                    if (referralCount === 0) return null;
                                                    return (
                                                        <tr key={player.id} className="hover:bg-zinc-50/50 transition-colors group">
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                                                        <Users size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-zinc-800 font-extrabold text-sm uppercase tracking-tight block">{player.username || 'Anonim'}</span>
                                                                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">ID: {player.id.substring(0, 8)}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-center">
                                                                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-black text-[10px] tabular-nums border border-emerald-100 uppercase tracking-widest">
                                                                    {referralCount} DÜĞÜM
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-2">
                                                                    <Bitcoin className="text-orange-500" size={14} />
                                                                    <span className="text-zinc-900 font-black text-sm tabular-nums">{(referralCount * (state.globalSettings.referralBtcReward || 0.0001)).toFixed(8)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <button onClick={() => setSelectedPlayer(player)} className="p-3 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm opacity-0 group-hover:opacity-100">
                                                                    <Eye size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                }).filter(Boolean)}
                                            </tbody>
                                        </table>
                                        {players.filter(p => players.some(parent => parent.id === p.referredBy)).length === 0 && (
                                            <div className="p-20 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest italic">Dönüşüm aktivitesi tespit edilmedi</div>
                                        )}
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-4 space-y-8">
                                    <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-10">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                            <SettingsIcon size={18} className="text-indigo-500" /> Protokol Ayarları
                                        </h3>
                                        <div className="space-y-8">
                                            <InputGroup
                                                label="Dönüşüm BTC Kazancı"
                                                value={state.globalSettings.referralBtcReward || 0.0001}
                                                onChange={(v) => handleUpdateSettings({ referralBtcReward: parseFloat(v) })}
                                                icon={<Bitcoin size={16} />}
                                                placeholder="0.0001"
                                                light
                                            />
                                            <InputGroup
                                                label="TP Genişleme Bonusu"
                                                value={state.globalSettings.referralTpReward || 50}
                                                onChange={(v) => handleUpdateSettings({ referralTpReward: parseInt(v) })}
                                                icon={<Database size={16} />}
                                                placeholder="50"
                                                light
                                            />
                                            <div className="pt-6 border-t border-zinc-100">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest mb-1">Yetkilendirme Kilidi</p>
                                                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">Minimum Seviye Gereksinimi: 5</p>
                                                    </div>
                                                    <div className="w-10 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center px-1 cursor-pointer" onClick={() => handleUpdateSettings({ referralLevelGate: !state.globalSettings.referralLevelGate })}>
                                                        <div className={cn("w-4 h-4 rounded-full transition-all duration-300 shadow-md", state.globalSettings.referralLevelGate ? "bg-indigo-600 translate-x-4 shadow-indigo-500/20" : "bg-zinc-300 translate-x-0")} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-10 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 shadow-sm space-y-8">
                                        <div className="flex justify-between items-start">
                                            <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                                                <Link size={24} />
                                            </div>
                                            <span className="px-3 py-1 bg-white text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">ZEKA</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-widest mb-2 italic">Küresel Dönüşüm Oranı</p>
                                            <p className="text-4xl font-black text-zinc-900 tracking-tighter tabular-nums">
                                                %{((players.filter(p => p.referredBy).length / (players.length || 1)) * 100).toFixed(1)}
                                            </p>
                                        </div>
                                        <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden shadow-inner">
                                            <div className="h-full bg-indigo-600 transition-all duration-1000 shadow-lg" style={{ width: `${(players.filter(p => p.referredBy).length / (players.length || 1)) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bots' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-12 gap-10">
                                <div className="col-span-12 lg:col-span-7 space-y-8">
                                    <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3"><Cpu className="text-purple-600" size={18} /> Yapay Zeka Popülasyonu</h3>
                                    <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-zinc-800 font-extrabold text-lg uppercase tracking-tight">Sentetik Madenciler</p>
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1 italic">Ekosistem likiditesini sağlayan otonom ajanlar</p>
                                            </div>
                                            <div className="text-2xl font-black text-purple-600 tabular-nums">
                                                {state.globalSettings.botCount || 0} / 500
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="500"
                                            step="10"
                                            value={state.globalSettings.botCount || 0}
                                            onChange={(e) => handleUpdateSettings({ botCount: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic">Hesaplanan Güç</p>
                                                <p className="text-zinc-800 font-black text-sm uppercase">{(state.globalSettings.botCount * 12).toLocaleString()} GH/S</p>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic">Tahmini Aktivite</p>
                                                <p className="text-zinc-800 font-black text-sm uppercase">{Math.floor(state.globalSettings.botCount / 5)} İşlem / SA</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <button className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all group flex flex-col gap-4 text-left shadow-sm">
                                            <TrendingUp className="text-indigo-600 group-hover:scale-110 transition-transform" size={28} />
                                            <div>
                                                <p className="text-zinc-800 font-black text-xs uppercase tracking-widest italic">Hiper Likidite</p>
                                                <p className="text-[9px] text-zinc-400 font-bold mt-1 leading-relaxed">Botları düşük seviyeli ilanları anında temizlemeye zorlar.</p>
                                            </div>
                                        </button>
                                        <button className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all group flex flex-col gap-4 text-left shadow-sm">
                                            <Zap className="text-emerald-600 group-hover:scale-110 transition-transform" size={28} />
                                            <div>
                                                <p className="text-zinc-800 font-black text-xs uppercase tracking-widest italic">Zorluk Ayarı</p>
                                                <p className="text-[9px] text-zinc-400 font-bold mt-1 leading-relaxed">Ağ yüküne göre dinamik hash yeniden dengeleme.</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-5 space-y-8">
                                    <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-10">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                            <Activity size={18} className="text-purple-600" /> Ekonomik Kalibrasyon
                                        </h3>
                                        <div className="space-y-8">
                                            <InputGroup
                                                label="Küresel Zorluk Endeksi"
                                                value={state.globalSettings.miningDifficulty || 1.0}
                                                onChange={(v) => handleUpdateSettings({ miningDifficulty: parseFloat(v) })}
                                                icon={<Activity size={16} />}
                                                placeholder="1.0"
                                                light
                                            />
                                            <InputGroup
                                                label="Bot Satın Alma Eşiği"
                                                value={state.globalSettings.botBuyLimit || 0.001}
                                                onChange={(v) => handleUpdateSettings({ botBuyLimit: parseFloat(v) })}
                                                icon={<Bitcoin size={16} />}
                                                placeholder="0.001"
                                                light
                                            />

                                            <div className="pt-6 border-t border-zinc-100 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest mb-1">Akıllı Fiyatlandırma</p>
                                                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">Botlar gerçek zamanlı fiyat dalgalanmalarını takip eder</p>
                                                    </div>
                                                    <div className="w-10 h-6 rounded-full bg-purple-50 border border-purple-100 flex items-center px-1 cursor-pointer" onClick={() => handleUpdateSettings({ smartBotPricing: !state.globalSettings.smartBotPricing })}>
                                                        <div className={cn("w-4 h-4 rounded-full transition-all duration-300 shadow-md", state.globalSettings.smartBotPricing ? "bg-purple-600 translate-x-4 shadow-purple-500/20" : "bg-zinc-300 translate-x-0")} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest mb-1">Otonom İlan Verme</p>
                                                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">Botlar tarafından oluşturulan pazar trafiğini etkinleştir</p>
                                                    </div>
                                                    <div className="w-10 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center px-1 cursor-pointer" onClick={() => handleUpdateSettings({ autoBotListing: !state.globalSettings.autoBotListing })}>
                                                        <div className={cn("w-4 h-4 rounded-full transition-all duration-300 shadow-md", state.globalSettings.autoBotListing ? "bg-emerald-600 translate-x-4 shadow-emerald-500/20" : "bg-zinc-300 translate-x-0")} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 rounded-[2rem] bg-zinc-50 border border-zinc-200 space-y-6 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                            <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.2em]">Düğüm Durum Raporu</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                <span>OPERASYONEL DÜĞÜMLER</span>
                                                <span className="text-zinc-800 font-black">{state.globalSettings.botCount || 0} BİRİM</span>
                                            </div>
                                            <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]" style={{ width: `${((state.globalSettings.botCount || 0) / 500) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'webhooks' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-12 gap-10">
                                <div className="col-span-12 lg:col-span-12 space-y-8">
                                    <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3"><Bell className="text-blue-500" size={18} /> Webhook & Dış Bildirim Motoru</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2] border border-[#5865F2]/20">
                                                    <MessageSquare size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-zinc-800 font-black text-sm uppercase tracking-widest italic">Discord Entegrasyonu</p>
                                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Kritik Kanal Bildirimleri</p>
                                                </div>
                                            </div>
                                            <div className="space-y-8">
                                                <InputGroup
                                                    label="Discord Webhook URL"
                                                    value={state.globalSettings.discordWebhookUrl || ''}
                                                    onChange={(v) => handleUpdateSettings({ discordWebhookUrl: v })}
                                                    icon={<Link size={18} />}
                                                    placeholder="https://discord.com/api/webhooks/..."
                                                    light
                                                />
                                                <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest mb-1">Giriş Bildirimleri</p>
                                                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">Kullanıcı oturum açtığında uyar</p>
                                                    </div>
                                                    <div className="w-10 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center px-1 cursor-pointer" onClick={() => handleUpdateSettings({ discordLoginNotify: !state.globalSettings.discordLoginNotify })}>
                                                        <div className={cn("w-4 h-4 rounded-full transition-all duration-300 shadow-md", state.globalSettings.discordLoginNotify ? "bg-[#5865F2] translate-x-4 shadow-blue-500/20" : "bg-zinc-300 translate-x-0")} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-10 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 shadow-sm space-y-10 flex flex-col justify-center text-center">
                                            <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-indigo-600 mx-auto shadow-xl shadow-indigo-600/10 mb-6">
                                                <Zap size={32} />
                                            </div>
                                            <h4 className="text-zinc-900 font-black text-lg uppercase tracking-tight">Test Protokolü</h4>
                                            <p className="text-zinc-500 text-xs font-bold leading-relaxed max-w-xs mx-auto mb-8 uppercase tracking-widest">Bağlantı bütünlüğünü doğrulamak için Discord sunucusuna bir test sinyali gönderin.</p>
                                            <button onClick={() => console.log('Sending test webhook...')} className="h-16 px-10 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 mx-auto">Sinyal Gönder</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-12 gap-10">
                                <div className="col-span-12 lg:col-span-8 space-y-8">
                                    <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                        <ShieldAlert className="text-red-500" size={18} /> Akıllı Tehdit Tespit Sistemi
                                    </h3>
                                    <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-zinc-100 bg-zinc-50/30 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                    <th className="px-8 py-5">Şüpheli Aktör</th>
                                                    <th className="px-8 py-5">Tespit Edilen Vektör</th>
                                                    <th className="px-8 py-5">Dijital İmza / IP</th>
                                                    <th className="px-8 py-5 text-right">Müdahale</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-50">
                                                {players.filter(p => p.riskScore > 0).map(player => (
                                                    <tr key={player.id} className="hover:bg-red-50/30 transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                                                                    <Users size={18} />
                                                                </div>
                                                                <div>
                                                                    <span className="text-zinc-800 font-extrabold text-sm uppercase tracking-tight block">{player.username}</span>
                                                                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">ID: {player.id.substring(0, 8)}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[9px] font-black uppercase border border-red-100 tracking-widest">
                                                                {player.riskReason || 'Çoklu Hesap Vektörü'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-zinc-500 font-mono text-[10px] font-bold">
                                                            {player.lastIp || '127.0.0.1'}
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <button onClick={() => handleUpdatePlayer(player.id, { isBanned: true })} className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-black text-[9px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95">
                                                                ERİŞİMİ KES (BAN)
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {players.filter(p => p.riskScore > 0).length === 0 && (
                                                    <tr><td colSpan={4} className="p-20 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest italic">Şu anda kritik bir tehdit vektörü tespit edilmedi</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-4 space-y-8">
                                    <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-10">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                            <ShieldCheck size={18} className="text-emerald-500" /> Güvenlik Direktifleri
                                        </h3>
                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest mb-1">Anti-Cheat Çekirdeği</p>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">Anormal hash paternlerini durdur</p>
                                                </div>
                                                <div className="w-10 h-6 rounded-full bg-red-50 border border-red-100 flex items-center px-1 cursor-pointer" onClick={() => handleUpdateSettings({ antiCheatEnabled: !state.globalSettings.antiCheatEnabled })}>
                                                    <div className={cn("w-4 h-4 rounded-full transition-all duration-300 shadow-md", state.globalSettings.antiCheatEnabled ? "bg-red-600 translate-x-4 shadow-red-500/20" : "bg-zinc-300 translate-x-0")} />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest mb-1">IP Senkronizasyonu</p>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">IP başına maksimum 2 benzersiz ID</p>
                                                </div>
                                                <div className="w-10 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center px-1 cursor-pointer" onClick={() => handleUpdateSettings({ ipLimitEnabled: !state.globalSettings.ipLimitEnabled })}>
                                                    <div className={cn("w-4 h-4 rounded-full transition-all duration-300 shadow-md", state.globalSettings.ipLimitEnabled ? "bg-indigo-600 translate-x-4 shadow-indigo-500/20" : "bg-zinc-300 translate-x-0")} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-10 rounded-[2.5rem] bg-white border border-zinc-200 space-y-6 shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <ShieldAlert className="text-red-500" size={24} />
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Aktif Kısıtlama</p>
                                                <p className="text-[8px] text-zinc-500 font-bold uppercase">Sistem bütünlüğü %99.8</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-zinc-100">
                                            <button onClick={() => adminUpdateSettings({ blacklist: [] })} className="w-full h-12 rounded-xl bg-red-600/5 border border-red-600/10 text-red-600 font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">IP KARA LİSTESİNİ TEMİZLE</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeTab.startsWith('withdrawals_') || activeTab === 'withdrawals') && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex flex-col gap-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-zinc-800 font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><Banknote className="text-emerald-500" size={20} /> Bekleyen Çekim Talepleri</h3>
                                    <div className="flex gap-4">
                                        <div className="px-6 py-2 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 font-bold text-[10px] uppercase tracking-widest">
                                            Bekleyen: {withdrawals.filter(w => w.status === 'pending').length}
                                        </div>
                                        <div className="px-6 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                                            Toplam Onay: {withdrawals.filter(w => w.status === 'approved').length}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-2 bg-zinc-100 rounded-[2rem] w-fit border border-zinc-200">
                                    {(['all', 'pending', 'approved', 'on_hold', 'rejected'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setWithdrawalFilter(f)}
                                            className={cn(
                                                "px-8 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                                                withdrawalFilter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                                            )}
                                        >
                                            {f === 'all' ? 'Hepsi' :
                                                f === 'pending' ? 'Bekliyor' :
                                                    f === 'approved' ? 'Onaylı' :
                                                        f === 'on_hold' ? 'Beklemede' : 'İptal'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white border border-zinc-200 rounded-[3.5rem] overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-100 bg-zinc-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            <th className="p-8">Oyuncu</th>
                                            <th className="p-8">Tutar & Tarih</th>
                                            <th className="p-8">Cüzdan Adresi</th>
                                            <th className="p-8">Durum</th>
                                            <th className="p-8 text-right">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {withdrawals
                                            .filter(req => {
                                                if (activeTab === 'withdrawals_pending') return req.status === 'pending';
                                                if (activeTab === 'withdrawals_approved') return req.status === 'approved';
                                                if (activeTab === 'withdrawals_rejected') return req.status === 'rejected';
                                                
                                                return withdrawalFilter === 'all' ? true : req.status === withdrawalFilter;
                                            })
                                            .map((req: any) => (
                                                <tr key={req.id} className="hover:bg-zinc-50/50 transition-colors group">
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
                                                                <Users size={18} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-zinc-800 font-extrabold text-sm uppercase">{req.username}</span>
                                                                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest italic">{req.userId?.substring(0, 8)}...</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-emerald-600 font-mono font-black text-sm">{req.amount.toFixed(8)} BTC</span>
                                                            <span className="text-[9px] text-zinc-400 font-bold uppercase">{new Date(req.created_at).toLocaleString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-2 group/addr">
                                                            <code className="text-[10px] font-mono text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100 max-w-[140px] truncate">{req.address}</code>
                                                            <button
                                                                onClick={() => navigator.clipboard.writeText(req.address)}
                                                                className="p-2 rounded-lg bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-opacity opacity-0 group-hover/addr:opacity-100"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[8px] font-black uppercase border",
                                                            req.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                                req.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                                    req.status === 'on_hold' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                        "bg-red-50 text-red-600 border-red-100"
                                                        )}>
                                                            {req.status === 'pending' ? 'Bekliyor' :
                                                                req.status === 'approved' ? 'Onaylandı' :
                                                                    req.status === 'on_hold' ? 'Beklemede' : 'İptal Edildi'}
                                                        </span>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="flex items-center justify-end gap-2 text-white">
                                                            {req.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => supabase.from(TABLES.WITHDRAWALS).update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', (req.id as string).trim())}
                                                                        className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                                                                        title="Onayla"
                                                                    >
                                                                        <CheckCircle2 size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => supabase.from(TABLES.WITHDRAWALS).update({ status: 'on_hold', updated_at: new Date().toISOString() }).eq('id', (req.id as string).trim())}
                                                                        className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10 transition-all active:scale-95"
                                                                        title="Beklet"
                                                                    >
                                                                        <Clock size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => supabase.from(TABLES.WITHDRAWALS).update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', (req.id as string).trim())}
                                                                        className="p-3 rounded-xl bg-zinc-900 hover:bg-red-600 shadow-lg transition-all active:scale-95"
                                                                        title="İptal Et"
                                                                    >
                                                                        <XCircle size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {req.status !== 'pending' && (
                                                                <button
                                                                    onClick={() => supabase.from(TABLES.WITHDRAWALS).update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', (req.id as string).trim())}
                                                                    className="px-4 py-2 rounded-xl bg-zinc-100 text-[9px] font-black uppercase text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-all"
                                                                >
                                                                    Geri Al
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        {withdrawals.length === 0 && (
                                            <tr><td colSpan={5} className="p-20 text-center text-zinc-400 font-black uppercase text-xs tracking-widest italic">Herhangi bir çekim talebi bulunmuyor</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activities' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <h3 className="text-zinc-800 font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><ShieldAlert className="text-red-500" size={20} /> Sistem Kontrolü</h3>
                                    <div className="p-12 rounded-[4rem] bg-white border border-zinc-200 shadow-sm space-y-8 h-full">
                                        <div className="space-y-6">
                                            <BigCheatButton
                                                label="Bakım Modu"
                                                color="red"
                                                onClick={() => handleUpdateSettings({ isMaintenance: !state.globalSettings.isMaintenance })}
                                                icon={<SettingsIcon size={24} />}
                                                desc="Uygulamayı tüm kullanıcılar için kapatır. Sadece adminler erişebilir."
                                                active={state.globalSettings.isMaintenance}
                                            />
                                            <InputGroup
                                                label="Genel Duyuru"
                                                placeholder="Kayar yazı duyurusu ekleyin..."
                                                value={state.globalSettings.announcement}
                                                onChange={(v) => handleUpdateSettings({ announcement: v })}
                                                icon={<Bell size={20} />}
                                                light={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <h3 className="text-zinc-800 font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><Flame className="text-orange-500" size={20} /> Küresel Etkinlikler</h3>
                                        <div className="grid gap-6">
                                            <BigCheatButton 
                                                label="Madenci Bayramı" 
                                                color="emerald" 
                                                onClick={() => adminUpdateSettings({ eventMultiplier: 2.0 })} 
                                                icon={<Cpu size={24} />} 
                                                desc="Tüm kazım verimliliğini 24 saat boyunca %200 artırır." 
                                                active={state.globalSettings.eventMultiplier === 2.0}
                                            />
                                            <BigCheatButton 
                                                label="TP Yağmuru" 
                                                color="blue" 
                                                onClick={() => adminUpdateSettings({ eventMultiplier: 1.5 })} 
                                                icon={<Database size={24} />} 
                                                desc="Görevlerden gelen TP ödüllerini %50 artırır." 
                                                active={state.globalSettings.eventMultiplier === 1.5}
                                            />
                                            <BigCheatButton 
                                                label="VIP Haftası" 
                                                color="purple" 
                                                onClick={() => adminUpdateSettings({ isVipEvent: !state.globalSettings.isVipEvent })} 
                                                icon={<Zap size={24} />} 
                                                desc="VIP olmayan oyunculara sınırlı süreli özellikler tanımlar." 
                                                active={state.globalSettings.isVipEvent}
                                            />
                                        </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-12">
                                <div className="space-y-8">
                                    <h3 className="text-zinc-800 font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><Activity className="text-indigo-500" size={20} /> Haftalık Görev Kontrolü</h3>
                                    <div className="p-12 rounded-[4rem] bg-white border border-zinc-200 shadow-sm space-y-8 h-full">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mevcut Görev Hedefi</p>
                                            <InputGroup
                                                label="Toplam Hash Hedefi"
                                                value={state.globalSettings.weeklyQuestGoal || "500000"}
                                                onChange={(v) => handleUpdateSettings({ weeklyQuestGoal: v })}
                                                icon={<Cpu size={20} />}
                                                placeholder="GH/S"
                                                light={true}
                                            />
                                            <InputGroup
                                                label="Ödül Havuzu (BTC)"
                                                value={state.globalSettings.weeklyQuestReward || "0.005"}
                                                onChange={(v) => handleUpdateSettings({ weeklyQuestReward: v })}
                                                icon={<Bitcoin size={20} />}
                                                placeholder="BTC"
                                                light={true}
                                            />
                                        </div>
                                        <div className="pt-10 border-t border-zinc-100">
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Tüm oyuncuların haftalık görev ilerlemesini sıfırlamak istediğinize emin misiniz?')) {
                                                        await handleUpdateSettings({ lastQuestReset: Date.now(), questResetTrigger: Math.random() });
                                                        notify({ type: 'success', title: 'Sıfırlandı', message: 'Haftalık görevler tüm oyuncular için sıfırlandı.' });
                                                    }
                                                }}
                                                className="w-full h-16 rounded-[1.5rem] bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98]"
                                            >
                                                Görevleri Sıfırla ve Başlat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'transactions_all' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-zinc-800 font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><History className="text-blue-500" size={20} /> Küresel İşlem Geçmişi</h3>
                                <div className="px-6 py-2 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
                                    Son 100 İşlem
                                </div>
                            </div>
                            <div className="bg-white border border-zinc-200 rounded-[3.5rem] overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-100 bg-zinc-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            <th className="p-8">Oyuncu</th>
                                            <th className="p-8">İşlem Tipi</th>
                                            <th className="p-8">Tutar</th>
                                            <th className="p-8">Açıklama</th>
                                            <th className="p-8 text-right">Tarih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {allTransactions.map((tx: any) => (
                                            <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="p-8">
                                                    <span className="text-zinc-800 font-extrabold text-sm uppercase">{tx.username}</span>
                                                </td>
                                                <td className="p-8">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[8px] font-black uppercase border",
                                                        tx.type === 'deposit' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        tx.type === 'withdrawal' ? "bg-red-50 text-red-600 border-red-100" :
                                                        tx.type === 'buy_item' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                        "bg-blue-50 text-blue-600 border-blue-100"
                                                    )}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="p-8">
                                                    <span className={cn("font-mono font-black text-sm", tx.amount > 0 ? "text-emerald-600" : "text-red-600")}>
                                                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(8)} {tx.currency || 'BTC'}
                                                    </span>
                                                </td>
                                                <td className="p-8 text-zinc-500 text-xs font-bold uppercase tracking-tight">
                                                    {tx.description || '-'}
                                                </td>
                                                <td className="p-8 text-right text-zinc-400 font-bold text-[10px] uppercase">
                                                    {new Date(tx.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-zinc-800 font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><ShoppingCart className="text-purple-500" size={20} /> Aktif Pazaryeri İlanları</h3>
                                <div className="px-6 py-2 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 font-bold text-[10px] uppercase tracking-widest">
                                    Toplam: {allMarket.length} İlan
                                </div>
                            </div>
                            <div className="bg-white border border-zinc-200 rounded-[3.5rem] overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-100 bg-zinc-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            <th className="p-8">Satıcı</th>
                                            <th className="p-8">Öge Bilgisi</th>
                                            <th className="p-8">Hash Gücü</th>
                                            <th className="p-8">Fiyat</th>
                                            <th className="p-8 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {allMarket.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="p-8">
                                                    <span className="text-zinc-800 font-extrabold text-sm uppercase">{item.sellerName || 'Anonim'}</span>
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-400">
                                                            <Cpu size={14} />
                                                        </div>
                                                        <span className="text-zinc-800 font-black text-xs uppercase">{item.label}</span>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <span className="text-indigo-600 font-mono font-black text-xs">{item.hashRate} GH/S</span>
                                                </td>
                                                <td className="p-8">
                                                    <span className="text-emerald-600 font-mono font-black text-sm">{item.price.toFixed(8)} BTC</span>
                                                </td>
                                                <td className="p-8 text-right">
                                                    <button onClick={() => supabase.from(TABLES.MARKETPLACE).delete().eq('id', item.id)} className="px-4 py-2 rounded-xl bg-red-600/5 text-red-600 border border-red-600/10 text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">İlanı Kaldır</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab.startsWith('deposits_') && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-zinc-800 font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><Download className="text-indigo-500" size={20} /> Mevduat Takip (İşlem Bazlı)</h3>
                            </div>
                            <div className="bg-white border border-zinc-200 rounded-[3.5rem] overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-100 bg-zinc-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            <th className="p-8">Oyuncu</th>
                                            <th className="p-8">Tutar</th>
                                            <th className="p-8">Açıklama</th>
                                            <th className="p-8 text-right">Tarih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {allTransactions
                                            .filter(tx => tx.type === 'deposit')
                                            .map((tx: any) => (
                                                <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                                                    <td className="p-8">
                                                        <span className="text-zinc-800 font-extrabold text-sm uppercase">{tx.username}</span>
                                                    </td>
                                                    <td className="p-8">
                                                        <span className="text-emerald-600 font-mono font-black text-sm">+{tx.amount.toFixed(8)} BTC</span>
                                                    </td>
                                                    <td className="p-8 text-zinc-500 text-xs font-bold uppercase tracking-tight">
                                                        {tx.description || 'Para Yatırma'}
                                                    </td>
                                                    <td className="p-8 text-right text-zinc-400 font-bold text-[10px] uppercase">
                                                        {new Date(tx.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        {allTransactions.filter(tx => tx.type === 'deposit').length === 0 && (
                                            <tr><td colSpan={4} className="p-20 text-center text-zinc-400 font-black uppercase text-xs tracking-widest italic">Henüz bir mevduat işlemi bulunmuyor</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports_login' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="p-20 bg-white border border-zinc-200 rounded-[3.5rem] shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-400 mb-6">
                                    <LogIn size={40} />
                                </div>
                                <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight">Giriş Kayıtları</h3>
                                <p className="text-zinc-500 text-sm max-w-sm mt-2 mb-8 uppercase font-bold tracking-widest text-[10px]">Siber güvenlik denetimi için tüm oturum açma işlemleri kayıt altına alınmaktadır.</p>
                                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 w-full max-w-lg text-left">
                                    <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest mb-4">Son 5 Giriş Denemesi</p>
                                    <div className="space-y-3">
                                        {players.slice(0, 5).map(p => (
                                            <div key={p.id} className="flex items-center justify-between text-[10px] font-bold text-zinc-500 border-b border-zinc-100 pb-2">
                                                <span>{p.username}</span>
                                                <span className="font-mono text-zinc-400">{p.lastIp || '192.168.1.1'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'reports_notifications' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="p-20 bg-white border border-zinc-200 rounded-[3.5rem] shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-500 mb-6">
                                    <Bell size={40} />
                                </div>
                                <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight">Bildirim Geçmişi</h3>
                                <p className="text-zinc-500 text-sm max-w-sm mt-2 mb-8 uppercase font-bold tracking-widest text-[10px]">Global duyurular ve sistem uyarılarının gönderim raporları yakında burada listelenecek.</p>
                             </div>
                        </div>
                    )}

                    {activeTab === 'info_app' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                 <div className="p-10 bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm space-y-6">
                                     <h4 className="text-zinc-800 font-black text-xs uppercase tracking-widest">Uygulama Mimarisi</h4>
                                     <div className="space-y-4">
                                         <StabilityRow label="Frontend Engine" value="React 18 + Vite" color="bg-blue-500" />
                                         <StabilityRow label="Backend Service" value="Supabase (Postgres)" color="bg-emerald-500" />
                                         <StabilityRow label="Realtime Engine" value="WebSockets (Go)" color="bg-indigo-500" />
                                         <StabilityRow label="Styling" value="Tailwind CSS" color="bg-sky-500" />
                                     </div>
                                 </div>
                                 <div className="p-10 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-sm text-white space-y-6">
                                     <h4 className="text-zinc-400 font-black text-xs uppercase tracking-widest">Build Bilgisi</h4>
                                     <div className="space-y-4 font-mono text-[10px]">
                                         <div className="flex justify-between border-b border-zinc-800 pb-2">
                                             <span className="text-zinc-500">VERSION</span>
                                             <span className="text-emerald-400">2.4.0-RELEASE</span>
                                         </div>
                                         <div className="flex justify-between border-b border-zinc-800 pb-2">
                                             <span className="text-zinc-500">BUILD ID</span>
                                             <span>CTM-992-PX8</span>
                                         </div>
                                         <div className="flex justify-between border-b border-zinc-800 pb-2">
                                             <span className="text-zinc-500">ENVIRONMENT</span>
                                             <span className="text-amber-400">PRODUCTION</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'info_server' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="p-10 bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm">
                                 <h3 className="text-zinc-800 font-black text-sm uppercase italic tracking-widest flex items-center gap-3 mb-10"><Database className="text-indigo-500" size={20} /> Sunucu Metrikleri (Canlı)</h3>
                                 <div className="h-[400px]">
                                     <ResponsiveContainer width="100%" height="100%">
                                         <AreaChart data={liveNetworkData}>
                                             <defs>
                                                 <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                 </linearGradient>
                                             </defs>
                                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                                             <XAxis dataKey="time" hide />
                                             <YAxis hide domain={[0, 100]} />
                                             <Tooltip content={({ active, payload }) => {
                                                 if (active && payload && payload.length) {
                                                     return (
                                                         <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl">
                                                             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Sunucu Yükü</p>
                                                             <p className="text-lg font-black text-white">%{payload[0].value?.toString()}</p>
                                                         </div>
                                                     );
                                                 }
                                                 return null;
                                             }} />
                                             <Area type="monotone" dataKey="load" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorLoad)" />
                                         </AreaChart>
                                     </ResponsiveContainer>
                                 </div>
                                 <div className="grid grid-cols-3 gap-6 mt-10">
                                     <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                                         <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">CPU Kullanımı</p>
                                         <p className="text-sm font-black text-zinc-800">%{liveNetworkData[liveNetworkData.length - 1]?.load || 0}</p>
                                     </div>
                                     <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                                         <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">RAM (8GB)</p>
                                         <p className="text-sm font-black text-zinc-800">Dynamic allocation</p>
                                     </div>
                                     <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                                         <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Uptime</p>
                                         <p className="text-sm font-black text-zinc-800">Live service</p>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}
                    {activeTab === 'info_cache' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="p-20 bg-white border border-zinc-200 rounded-[3.5rem] shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-400 mb-6">
                                    <RefreshCw size={40} />
                                </div>
                                <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight">Önbellek Yönetimi</h3>
                                <p className="text-zinc-500 text-sm max-w-sm mt-2 mb-8 uppercase font-bold tracking-widest text-[10px]">İstemci ve sunucu tarafındaki geçici verileri temizleyerek senkronizasyon sorunlarını giderin.</p>
                                <button className="px-10 py-5 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95">TÜM ÖNBELLEĞİ TEMİZLE (PURGE ALL)</button>
                             </div>
                        </div>
                    )}

                    {activeTab === 'info_update' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="p-20 bg-white border border-zinc-200 rounded-[3.5rem] shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-6">
                                    <Zap size={40} />
                                </div>
                                <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight">Güncelleme Kontrolü</h3>
                                <p className="text-zinc-500 text-sm max-w-sm mt-2 mb-8 uppercase font-bold tracking-widest text-[10px]">Mevcut versiyon (`v2.4.0`) güncel. Yeni bir dağıtım (OTA) bulunmuyor.</p>
                                <div className="flex gap-4">
                                    <button className="px-8 py-4 bg-zinc-100 text-zinc-500 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-not-allowed">GÜNCELLEME YOK</button>
                                    <button className="px-8 py-4 border border-zinc-200 text-zinc-800 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-50">MANUEL KONTROL</button>
                                </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'report_request' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="p-20 bg-white border border-zinc-200 rounded-[3.5rem] shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 mb-6">
                                    <Bug size={40} />
                                </div>
                                <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight">Hata Raporları & Talepler</h3>
                                <p className="text-zinc-500 text-sm max-w-sm mt-2 mb-8 uppercase font-bold tracking-widest text-[10px]">Kullanıcılar tarafından gönderilen hata bildirimleri ve özellik talepleri.</p>
                                <div className="w-full max-w-2xl bg-zinc-50 border border-zinc-100 rounded-3xl p-8 text-left">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6">Açık Talepler (0)</p>
                                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                        <FileText size={48} className="mb-4 text-zinc-400" />
                                        <p className="font-black text-[10px] uppercase">Henüz bildirilmiş bir hata yok</p>
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

function SidebarLink({ active, onClick, icon, label, badge, sub }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number | string, sub?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full rounded-xl flex items-center gap-3 px-4 transition-all group relative shrink-0",
                sub ? "h-9 mb-0.5" : "h-11 mb-1",
                active
                    ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/5",
                sub && "pl-9"
            )}
        >
            <div className={cn(
                "transition-all duration-300 shrink-0",
                active ? "scale-110 text-indigo-400" : "group-hover:scale-110",
                sub ? "text-[10px]" : "text-[16px]"
            )}>
                {sub ? <div className="w-1.5 h-1.5 rounded-full border-2 border-current opacity-40" /> : icon}
            </div>
            <span className={cn(
                "font-bold uppercase tracking-widest text-left flex-1 truncate",
                sub ? "text-[9px]" : "text-[10px]"
            )}>
                {label}
            </span>

            {badge !== undefined && (
                <div className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-black text-indigo-400 tabular-nums">
                    {badge}
                </div>
            )}

            {active && <div className="absolute left-0 w-1 h-4 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
        </button>
    );
}

function BentoCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: 'blue' | 'emerald' | 'orange' | 'purple' }) {
    const shades = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        orange: 'text-orange-600 bg-orange-50 border-orange-100',
        purple: 'text-purple-600 bg-purple-50 border-purple-100',
    };
    return (
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-6 hover:shadow-md transition-all cursor-default group">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", shades[color])}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest leading-none mb-2">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-xl font-black text-zinc-800 tracking-tight">{value}</p>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                </div>
            </div>
        </div>
    );
}

function InsightProgress({ label, value, max, color, light }: { label: string, value: number, max: number, color: 'emerald' | 'blue' | 'red' | 'orange', light?: boolean }) {
    const colors = { emerald: 'bg-emerald-500', blue: 'bg-blue-500', red: 'bg-red-500', orange: 'bg-orange-500' };
    const pct = Math.min((value / (max || 1)) * 100, 100);
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <span>{label}</span>
                <span className={cn("tabular-nums font-extrabold", light ? "text-zinc-800" : "text-white")}>{value} / {max}</span>
            </div>
            <div className={cn("h-1.5 w-full rounded-full overflow-hidden", light ? "bg-zinc-100" : "bg-white/5")}>
                <div className={cn("h-full transition-all duration-1000 ease-out", colors[color])} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function StabilityRow({ label, value, color, active = true }: { label: string, value: string, color?: string, active?: boolean }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-zinc-600 mb-1 tracking-widest">{label}</p>
                <div className="flex items-end justify-between">
                    <p className={cn("text-2xl font-black tabular-nums tracking-tighter leading-none italic", color ? color.replace('bg-', 'text-') : "text-white")}>{value}</p>
                    <div className={cn("w-1.5 h-1.5 rounded-full", active ? (color || "bg-emerald-500") + " animate-pulse" : "bg-zinc-800")} />
                </div>
            </div>
        </div>
    );
}

function InputGroup({ label, placeholder, value, onChange, icon, light }: { label: string, placeholder: string, value: any, onChange: (v: string) => void, icon: React.ReactNode, light?: boolean }) {
    const [val, setVal] = useState(value);
    useEffect(() => setVal(value), [value]);

    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">{label} • Secure Protocol</label>
            <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-800 transition-colors duration-300">
                    {icon}
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className={cn(
                        "w-full h-14 rounded-xl pl-16 pr-32 text-sm font-bold transition-all duration-300 focus:outline-none",
                        light ? "bg-white border border-zinc-200 text-zinc-800 focus:ring-4 focus:ring-zinc-50 focus:border-zinc-300 shadow-sm" : "bg-white/5 border border-white/5 text-white focus:border-white/20"
                    )}
                />
                <button
                    onClick={() => onChange(val)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 rounded-lg bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all shadow-lg"
                >
                    COMMIT
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

function ChartLegend({ color, label, value }: { color: string, label: string, value: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", color)} />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-[10px] font-black text-zinc-800">{value}</span>
        </div>
    );
}

function MiniStat({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col gap-3 group hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
                <ChevronRight className="text-zinc-200 group-hover:text-indigo-500 transition-colors" size={14} />
            </div>
            <div>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-sm font-black text-zinc-800 tracking-tight">{value}</p>
            </div>
        </div>
    );
}
