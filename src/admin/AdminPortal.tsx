import React, { useState, useEffect, useMemo } from 'react';
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
    LogIn,
    User,
    Monitor,
    Wifi,
    Server,
    Package,
    DollarSign,
    TrendingDown,
    ShoppingBag
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
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';

type AdminTab = 'overview' |
    'players_active' | 'players_banned' | 'players_email_unverified' | 'players_mobile_unverified' | 'players_kyc_unverified' | 'players_kyc_pending' | 'players_balance' | 'players_all' | 'players_notification' | 'banned' | 'players' |
    'currencies' | 'mining_plans' | 'mining_paths' | 'mining_items' | 'flash_offers' | 'free_options' | 'contracts' |
    'deposits_initiated' | 'deposits_pending' | 'deposits_approved' | 'deposits_success' | 'deposits_rejected' | 'deposits_all' | 'withdrawals' |
    'withdrawals_pending' | 'withdrawals_approved' | 'withdrawals_rejected' | 'withdrawals_all' |
    'system_settings' | 'orders' | 'transactions_all' | 'referral_bonus' |
    'reports_login' | 'reports_notifications' |
    'support_pending' | 'support_closed' | 'support_answered' | 'support_all' |
    'info_app' | 'info_server' | 'info_cache' | 'info_update' |
    'report_request' | 'subscribers' |
    'market' | 'guilds' | 'referrals' | 'bots' | 'webhooks' | 'security' | 'economy' | 'activities' | 'cheats' | 'settings' | 'logs' |
    'leaderboard' | 'vip_management' | 'promo_codes' | 'game_events' | 'db_explorer';

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

    // --- NEW: Advanced Filtering & Bulk Ops ---
    const [playerFilterStatus, setPlayerFilterStatus] = useState<'all' | 'active' | 'banned' | 'vip' | 'admin'>('all');
    const [playerFilterLevel, setPlayerFilterLevel] = useState<'all' | 'low' | 'mid' | 'high'>('all');
    const [playerSortBy, setPlayerSortBy] = useState<'username' | 'btcBalance' | 'level' | 'createdAt'>('username');
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [depositSearchTerm, setDepositSearchTerm] = useState('');
    const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [selectedWithdrawalIds, setSelectedWithdrawalIds] = useState<Set<string>>(new Set());

    // --- NEW: Live Activity Feed ---
    const [liveActivityFeed, setLiveActivityFeed] = useState<{id: string, type: string, msg: string, time: Date, color: string}[]>([]);

    // --- NEW: Notification Sending ---
    const [notifTitle, setNotifTitle] = useState('');
    const [notifBody, setNotifBody] = useState('');
    const [notifTarget, setNotifTarget] = useState<'all' | 'vip' | 'single'>('all');
    const [notifTargetUid, setNotifTargetUid] = useState('');
    const [notifType, setNotifType] = useState<'info' | 'success' | 'warning'>('info');
    const [notifSending, setNotifSending] = useState(false);

    // --- NEW: Support/Ticket System ---
    const [tickets, setTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [ticketReply, setTicketReply] = useState('');
    const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'closed' | 'answered'>('open');

    // --- NEW: Subscribers ---
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [subSearchTerm, setSubSearchTerm] = useState('');

    // --- NEW: Auto-Rule Engine ---
    const [rules, setRules] = useState<{id:string, name:string, condition:string, threshold:number, action:string, enabled:boolean}[]>([
        { id: '1', name: 'Yüksek Çekim Hızı', condition: 'withdrawal_amount_gt', threshold: 0.1, action: 'auto_hold', enabled: true },
        { id: '2', name: 'Çoklu Hesap Tespiti', condition: 'same_ip_count_gt', threshold: 2, action: 'flag_review', enabled: true },
        { id: '3', name: 'Ani Bakiye Artışı', condition: 'balance_spike_gt', threshold: 1.0, action: 'notify_admin', enabled: false },
    ]);
    const [newRuleName, setNewRuleName] = useState('');
    const [newRuleCondition, setNewRuleCondition] = useState('withdrawal_amount_gt');
    const [newRuleThreshold, setNewRuleThreshold] = useState('');
    const [newRuleAction, setNewRuleAction] = useState('auto_hold');

    // --- NEW: IP Blacklist Management ---
    const [ipBlacklist, setIpBlacklist] = useState<string[]>([]);
    const [newIp, setNewIp] = useState('');
    const [twoFaRequired, setTwoFaRequired] = useState(false);

    // --- NEW: Export helpers ---
    const [exportLoading, setExportLoading] = useState(false);

    // --- Admin profile dropdown ---
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

    // --- NEW: Mining Items & Plans ---
    const [miningItems, setMiningItems] = useState<any[]>([]);
    const [editingMiningItem, setEditingMiningItem] = useState<any>(null);
    const [miningItemForm, setMiningItemForm] = useState<any>({});

    // --- NEW: Mining Plans ---
    const [miningPlans, setMiningPlans] = useState<any[]>([]);
    const [miningPlanSearch, setMiningPlanSearch] = useState('');
    const [showMiningPlanModal, setShowMiningPlanModal] = useState(false);
    const [editingMiningPlan, setEditingMiningPlan] = useState<any>(null);
    const [miningPlanAnalyticsId, setMiningPlanAnalyticsId] = useState<string | null>(null);
    const [miningPlanForm, setMiningPlanForm] = useState<any>({
        title: '', currency: 'Bitcoin', price: 0, return_amount: 0, return_type: 'Fixed',
        hashrate_value: 1, hashrate_unit: 'MH/s', period_value: 1, period_unit: 'Day',
        maintenance_cost: 0, features: [], description: '', status: 'enabled'
    });
    const [miningPlanFeatureInput, setMiningPlanFeatureInput] = useState('');
    const [miningPlanAnalyticsData, setMiningPlanAnalyticsData] = useState<any>(null);
    const [miningPlanAnalyticsRange, setMiningPlanAnalyticsRange] = useState<'7d' | '30d'>('7d');

    // --- NEW: Flash Offers ---
    const [flashOffers, setFlashOffers] = useState<any[]>([]);
    const [showFlashOfferModal, setShowFlashOfferModal] = useState(false);
    const [editingFlashOffer, setEditingFlashOffer] = useState<any>(null);
    const defaultFlashForm = { title: '', badge_text: 'SINIRLI STOK', subtitle: '', hashrate_value: 100, hashrate_unit: 'GH/s', bonus_hashrate: 0, original_price: 0, offer_price: 0, expires_minutes: 60, linked_plan_id: '', active: true };
    const [flashOfferForm, setFlashOfferForm] = useState<any>({ ...defaultFlashForm });

    // --- NEW: Free Options ---
    const [freeOptions, setFreeOptions] = useState<any>({
        daily_bonus_enabled: true,
        daily_bonus_ad_url: '',
        daily_bonus_ad_duration: 20,
        daily_bonus_mining_hours: 3,
        daily_bonus_tp_reward: 50,
        free_miner_enabled: true,
        free_miner_daily_max_usd: 0.50,
        free_miner_hashrate: 5,
        free_miner_hashrate_unit: 'GH/s',
        // --- Ödüllü Reklam (AdRewardModal) ---
        ad_reward_enabled: true,
        ad_reward_btc: 0.000001,
        ad_reward_tp: 50,
        ad_reward_daily_limit: 10,
        ad_reward_duration: 30,
    });
    const [freeOptionsSaving, setFreeOptionsSaving] = useState(false);

    // --- NEW: Contracts ---
    const [contracts, setContracts] = useState<any[]>([]);
    const [showContractModal, setShowContractModal] = useState(false);
    const [editingContract, setEditingContract] = useState<any>(null);
    const defaultContractForm = { title: '', description: '', reward_amount: 0, reward_currency: 'BTC', prestige_required: 1, duration_days: 7, max_participants: 100, active: true };
    const [contractForm, setContractForm] = useState<any>({ ...defaultContractForm });

    // --- NEW: Game Events ---
    const [gameEvents, setGameEvents] = useState<any[]>([]);
    const [newEvent, setNewEvent] = useState({ name: '', type: 'multiplier', multiplier: 2, duration_hours: 24, active: false });

    // --- NEW: Promo Codes ---
    const [promoCodes, setPromoCodes] = useState<any[]>([]);
    const [newPromo, setNewPromo] = useState({ code: '', reward_btc: 0, reward_tp: 0, max_uses: 100, expires_at: '' });

    // --- NEW: VIP Management ---
    const [vipPlayers, setVipPlayers] = useState<any[]>([]);

    // --- NEW: Leaderboard ---
    const [leaderboardType, setLeaderboardType] = useState<'btc' | 'tp' | 'level' | 'miners'>('btc');

    // --- NEW: DB Explorer ---
    const [dbTable, setDbTable] = useState('');
    const [dbRows, setDbRows] = useState<any[]>([]);
    const [dbLoading, setDbLoading] = useState(false);
    const [dbQuery, setDbQuery] = useState('');
    const DB_TABLES = ['profiles', 'transactions', 'withdrawals', 'guilds', 'marketplace', 'logs', 'settings', 'support_tickets', 'subscribers', 'miners', 'promo_codes', 'game_events'];

    // --- Orders state ---
    const [orders, setOrders] = useState<any[]>([]);

    // --- Security Directives (used in security score widget) ---
    const securityDirectives = [
        { key: 'twoFaRequired' },
        { key: 'antiCheatEnabled' },
        { key: 'ipLimitEnabled' },
        { key: 'rateLimitEnabled' },
        { key: 'kycRequired' },
    ] as const;

    // --- NEW: KPI Chart Data ---
    const [kpiRange, setKpiRange] = useState<'7d' | '30d' | '90d'>('7d');

    // KPI grafiği: gerçek transactions + profiles verisinden hesaplanır
    const kpiData = useMemo(() => {
        const days = kpiRange === '7d' ? 7 : kpiRange === '30d' ? 30 : 90;
        return Array.from({ length: days }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            const dayStr = date.toISOString().slice(0, 10);

            const newUsers = players.filter(p => p.created_at?.slice(0, 10) === dayStr).length;
            const revenue = allTransactions
                .filter(t => t.type === 'deposit' && t.status === 'approved' && t.created_at?.slice(0, 10) === dayStr)
                .reduce((acc, t) => acc + (t.amount || 0), 0);
            const withdrawalCount = allTransactions
                .filter(t => t.type === 'withdrawal' && t.created_at?.slice(0, 10) === dayStr).length;

            return { day: i + 1, label: dayStr.slice(5), newUsers, revenue, withdrawals: withdrawalCount };
        });
    }, [kpiRange, players, allTransactions]);

    const toggleCategory = (id: string) => {
        setOpenCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const MENU_CATEGORIES = [
        {
            title: 'Kontrol Paneli',
            id: 'dashboard',
            color: 'bg-indigo-600',
            items: [
                { id: 'overview' as AdminTab, label: 'Genel Bakış', icon: <LayoutDashboard size={16} /> },
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
                { id: 'mining_items' as AdminTab, label: 'Madenci Ekipmanları', icon: <Zap size={16} /> },
                { id: 'mining_plans' as AdminTab, label: 'Madencilik Planları', icon: <Route size={16} /> },
                { id: 'flash_offers' as AdminTab, label: 'Flaş Teklifler', icon: <Flame size={16} /> },
                { id: 'free_options' as AdminTab, label: 'Ücretsiz Seçenekler', icon: <Gift size={16} /> },
                { id: 'contracts' as AdminTab, label: 'Kontrat Merkezi', icon: <Layout size={16} /> },
                { id: 'game_events' as AdminTab, label: 'Oyun Etkinlikleri', icon: <Flame size={16} /> },
                { id: 'promo_codes' as AdminTab, label: 'Promo Kodlar', icon: <Gift size={16} /> },
                { id: 'leaderboard' as AdminTab, label: 'Sıralama Tablosu', icon: <Award size={16} /> },
            ]
        },
        {
            title: 'Finans & İşlemler',
            id: 'finance_detail',
            color: 'bg-blue-700',
            items: [
                { id: 'transactions_all' as AdminTab, label: 'Tüm İşlemler', icon: <Activity size={16} />, badge: allTransactions.length || undefined },
                { id: 'orders' as AdminTab, label: 'Siparişler', icon: <Briefcase size={16} /> },
                { id: 'referrals' as AdminTab, label: 'Referans Sistemi', icon: <Share2 size={16} /> },
                { id: 'vip_management' as AdminTab, label: 'VIP Yönetimi', icon: <ShieldCheck size={16} />, badge: players.filter(p => p.vip?.isActive).length || undefined },
            ]
        },
        {
            title: 'Destek & Kullanıcılar',
            id: 'support_section',
            color: 'bg-teal-600',
            items: [
                { id: 'support_all' as AdminTab, label: 'Destek Talepleri', icon: <LifeBuoy size={16} />, badge: tickets.filter(t => t.status === 'open').length || undefined },
                { id: 'subscribers' as AdminTab, label: 'Aboneler', icon: <Mail size={16} />, badge: subscribers.length || undefined },
                { id: 'reports_login' as AdminTab, label: 'Giriş Raporları', icon: <History size={16} /> },
            ]
        },
        {
            title: 'Sistem & Güvenlik',
            id: 'system_security',
            color: 'bg-zinc-900',
            items: [
                { id: 'settings' as AdminTab, label: 'Sistem Ayarları', icon: <SettingsIcon size={16} /> },
                { id: 'security' as AdminTab, label: 'Güvenlik', icon: <ShieldAlert size={16} /> },
                { id: 'logs' as AdminTab, label: 'İşlem Günlükleri', icon: <FileText size={16} /> },
                { id: 'webhooks' as AdminTab, label: 'Webhook & Kurallar', icon: <Link size={16} /> },
                { id: 'db_explorer' as AdminTab, label: 'Veritabanı Gezgini', icon: <Database size={16} /> },
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

                const { data: withdraws, error: wErr } = await supabase.from(TABLES.WITHDRAWALS).select('*').order('created_at', { ascending: false });
                if (wErr) console.error('AdminPortal Withdrawals Error:', wErr);
                if (withdraws) setWithdrawals(withdraws.map(w => ({ ...w, username: 'Kullanıcı' })));

                const { data: guilds } = await supabase.from(TABLES.GUILDS).select('*');
                if (guilds) setAllGuilds(guilds);

                const { data: market } = await supabase.from(TABLES.MARKETPLACE).select('*');
                if (market) setAllMarket(market);

                const { data: logs, error: lErr } = await supabase.from(TABLES.LOGS).select('*').order('created_at', { ascending: false }).limit(50);
                if (lErr) console.error('AdminPortal Logs Error:', lErr);
                if (logs) setAdminLogs(logs);

                const { data: txs, error: gtErr } = await supabase.from(TABLES.TRANSACTIONS).select('*').order('created_at', { ascending: false }).limit(100);
                if (gtErr) console.error('AdminPortal Global Tx Error:', gtErr);
                if (txs) setAllTransactions(txs.map(t => ({ ...t, username: 'Kullanıcı' })));

                const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
                if (ordersData) setOrders(ordersData);
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.eventType === 'INSERT') setOrders(prev => [payload.new, ...prev].slice(0, 200));
                if (payload.eventType === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
                if (payload.eventType === 'DELETE') setOrders(prev => prev.filter(o => o.id !== payload.old.id));
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

    // Real-time: Supabase Presence → aktif oturum sayısı + sistem yük grafiği
    useEffect(() => {
        const presenceChannel = supabase.channel('online-users', {
            config: { presence: { key: 'admin' } }
        });
        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const presState = presenceChannel.presenceState();
                const count = Object.keys(presState).length;
                setActiveSessions(count);
                setLiveNetworkData(prev => [...prev, {
                    time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    load: count
                }].slice(-20));
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ online_at: new Date().toISOString() });
                }
            });
        return () => { supabase.removeChannel(presenceChannel); };
    }, []);

    // Real-time: Live Activity Feed → gerçek DB olaylarından
    useEffect(() => {
        const typeMap: Record<string, { msg: string; color: string }> = {
            deposit:    { msg: 'Para yatırma talebi',  color: 'text-emerald-400' },
            withdrawal: { msg: 'Çekim talebi',         color: 'text-amber-400'  },
            buy_item:   { msg: 'Madenci satın aldı',   color: 'text-purple-400' },
            ban:        { msg: 'Hesap askıya alındı',  color: 'text-red-400'    },
            login:      { msg: 'Giriş yaptı',          color: 'text-blue-400'   },
        };
        const seed = [...allTransactions].slice(0, 20).map(tx => {
            const info = typeMap[tx.type] ?? { msg: tx.type, color: 'text-zinc-400' };
            return { id: tx.id, type: tx.type, msg: `${tx.username || 'Kullanıcı'}: ${info.msg}`, time: new Date(tx.created_at), color: info.color };
        });
        if (seed.length) setLiveActivityFeed(seed);

        const feedChannel = supabase.channel('admin-feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.TRANSACTIONS }, async (payload) => {
                const { data: profile } = await supabase.from(TABLES.PROFILES).select('username').eq('id', payload.new.user_id).single();
                const info = typeMap[payload.new.type] ?? { msg: payload.new.type, color: 'text-zinc-400' };
                setLiveActivityFeed(prev => [{ id: payload.new.id, type: payload.new.type, msg: `${profile?.username || 'Kullanıcı'}: ${info.msg}`, time: new Date(), color: info.color }, ...prev].slice(0, 30));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLES.WITHDRAWALS }, async (payload) => {
                const { data: profile } = await supabase.from(TABLES.PROFILES).select('username').eq('id', payload.new.user_id).single();
                setLiveActivityFeed(prev => [{ id: payload.new.id, type: 'withdrawal', msg: `${profile?.username || 'Kullanıcı'}: Çekim talebi`, time: new Date(), color: 'text-amber-400' }, ...prev].slice(0, 30));
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLES.PROFILES }, async (payload) => {
                if (payload.new.isBanned && !payload.old?.isBanned) {
                    setLiveActivityFeed(prev => [{ id: `ban-${payload.new.id}`, type: 'ban', msg: `${payload.new.username || 'Kullanıcı'}: Hesap askıya alındı`, time: new Date(), color: 'text-red-400' }, ...prev].slice(0, 30));
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(feedChannel); };
    }, [allTransactions]);

    // --- Fetch all extra tables ---
    useEffect(() => {
        const fetchExtra = async () => {
            try {
                const [ticketRes, subRes, settingsRes, miningRes, eventsRes, promoRes, plansRes, flashRes, contractsRes] = await Promise.allSettled([
                    supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(100),
                    supabase.from('subscribers').select('*').order('created_at', { ascending: false }),
                    supabase.from(TABLES.SETTINGS).select('*').eq('id','v1').single(),
                    supabase.from('mining_items').select('*').order('price', { ascending: true }),
                    supabase.from('game_events').select('*').order('created_at', { ascending: false }),
                    supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
                    supabase.from('mining_plans').select('*').order('created_at', { ascending: false }),
                    supabase.from('flash_offers').select('*').order('created_at', { ascending: false }),
                    supabase.from('contracts').select('*').order('created_at', { ascending: false }),
                ]);
                if (ticketRes.status === 'fulfilled' && ticketRes.value.data) setTickets(ticketRes.value.data);
                if (subRes.status === 'fulfilled' && subRes.value.data) setSubscribers(subRes.value.data);
                if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
                    const s = settingsRes.value.data;
                    if (s?.ipBlacklist) setIpBlacklist(s.ipBlacklist);
                    if (s?.twoFaRequired !== undefined) setTwoFaRequired(s.twoFaRequired);
                }
                if (miningRes.status === 'fulfilled' && miningRes.value.data) setMiningItems(miningRes.value.data);
                if (eventsRes.status === 'fulfilled' && eventsRes.value.data) setGameEvents(eventsRes.value.data);
                if (promoRes.status === 'fulfilled' && promoRes.value.data) setPromoCodes(promoRes.value.data);
                if (plansRes.status === 'fulfilled' && plansRes.value.data) setMiningPlans(plansRes.value.data);
                if (flashRes.status === 'fulfilled' && flashRes.value.data) setFlashOffers(flashRes.value.data);
                if (contractsRes.status === 'fulfilled' && contractsRes.value.data) setContracts(contractsRes.value.data);
                // Load free options from settings
                try {
                    const { data: freeOpts } = await supabase.from('settings').select('*').eq('id', 'free_options').single();
                    if (freeOpts?.value) setFreeOptions((prev: any) => ({ ...prev, ...freeOpts.value }));
                } catch {}
                // Real-time for new tables
                
            } catch (e) { /* tables may not exist yet */ }
        };
        fetchExtra();
        const ch = supabase.channel('admin-extra')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, (p) => {
                if (p.eventType === 'INSERT') setTickets(prev => [p.new, ...prev]);
                if (p.eventType === 'UPDATE') setTickets(prev => prev.map(t => t.id === p.new.id ? p.new : t));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mining_items' }, (p) => {
                if (p.eventType === 'INSERT') setMiningItems(prev => [...prev, p.new]);
                if (p.eventType === 'UPDATE') setMiningItems(prev => prev.map(m => m.id === p.new.id ? p.new : m));
                if (p.eventType === 'DELETE') setMiningItems(prev => prev.filter(m => m.id !== p.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_events' }, (p) => {
                if (p.eventType === 'INSERT') setGameEvents(prev => [p.new, ...prev]);
                if (p.eventType === 'UPDATE') setGameEvents(prev => prev.map(e => e.id === p.new.id ? p.new : e));
                if (p.eventType === 'DELETE') setGameEvents(prev => prev.filter(e => e.id !== p.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_codes' }, (p) => {
                if (p.eventType === 'INSERT') setPromoCodes(prev => [p.new, ...prev]);
                if (p.eventType === 'UPDATE') setPromoCodes(prev => prev.map(c => c.id === p.new.id ? p.new : c));
                if (p.eventType === 'DELETE') setPromoCodes(prev => prev.filter(c => c.id !== p.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mining_plans' }, (p) => {
                if (p.eventType === 'INSERT') setMiningPlans(prev => [p.new, ...prev]);
                if (p.eventType === 'UPDATE') setMiningPlans(prev => prev.map(m => m.id === p.new.id ? p.new : m));
                if (p.eventType === 'DELETE') setMiningPlans(prev => prev.filter(m => m.id !== p.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_offers' }, (p) => {
                if (p.eventType === 'INSERT') setFlashOffers(prev => [p.new, ...prev]);
                if (p.eventType === 'UPDATE') setFlashOffers(prev => prev.map(f => f.id === p.new.id ? p.new : f));
                if (p.eventType === 'DELETE') setFlashOffers(prev => prev.filter(f => f.id !== p.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, (p) => {
                if (p.eventType === 'INSERT') setContracts(prev => [p.new, ...prev]);
                if (p.eventType === 'UPDATE') setContracts(prev => prev.map(c => c.id === p.new.id ? p.new : c));
                if (p.eventType === 'DELETE') setContracts(prev => prev.filter(c => c.id !== p.old.id));
            })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, []);

    // --- Orders CRUD ---
    const handleDeleteOrder = async (id: string) => {
        if (!window.confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
        await supabase.from('orders').delete().eq('id', id);
        setOrders(prev => prev.filter(o => o.id !== id));
        notify({ type: 'warning', title: 'İlan Kaldırıldı', message: 'Market ilanı silindi.' });
    };

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

    // --- NEW: Bulk Operations ---
    // --- NEW: Export CSV/JSON ---
    const handleExportJSON = (data: any[], filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${filename}_${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
    };
    const handleExportCSV = (data: any[], filename: string) => {
        if (!data.length) return;
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${filename}_${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    // --- NEW: Ticket handlers ---
    const handleReplyTicket = async (ticketId: string) => {
        if (!ticketReply.trim()) return;
        try {
            await supabase.from('support_tickets').update({ status: 'answered', admin_reply: ticketReply, replied_at: new Date().toISOString() }).eq('id', ticketId.trim());
            await logAdminAction('reply_ticket', ticketId, { reply: ticketReply });
            notify({ type: 'success', title: 'Yanıt Gönderildi', message: 'Destek talebi yanıtlandı.' });
            setTicketReply(''); setSelectedTicket(null);
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Yanıt gönderilemedi.' }); }
    };
    const handleCloseTicket = async (ticketId: string) => {
        try {
            await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', ticketId.trim());
            await logAdminAction('close_ticket', ticketId);
            notify({ type: 'success', title: 'Kapatıldı', message: 'Ticket kapatıldı.' });
            setSelectedTicket(null);
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Kapatma başarısız.' }); }
    };

    // --- NEW: IP Blacklist ---
    const handleAddIp = async () => {
        if (!newIp.trim()) return;
        const updated = [...ipBlacklist, newIp.trim()];
        setIpBlacklist(updated);
        setNewIp('');
        await handleUpdateSettings({ ipBlacklist: updated });
    };
    const handleRemoveIp = async (ip: string) => {
        const updated = ipBlacklist.filter(i => i !== ip);
        setIpBlacklist(updated);
        await handleUpdateSettings({ ipBlacklist: updated });
    };

    // --- NEW: Rule Engine ---
    const handleAddRule = () => {
        if (!newRuleName || !newRuleThreshold) return;
        setRules(prev => [...prev, {
            id: Date.now().toString(), name: newRuleName, condition: newRuleCondition,
            threshold: parseFloat(newRuleThreshold), action: newRuleAction, enabled: true
        }]);
        setNewRuleName(''); setNewRuleThreshold('');
        notify({ type: 'success', title: 'Kural Eklendi', message: `"${newRuleName}" kuralı oluşturuldu.` });
    };
    const handleToggleRule = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    const handleDeleteRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id));

    // --- Mining Items CRUD ---
    const handleSaveMiningItem = async () => {
        if (!miningItemForm.name) return;
        try {
            if (editingMiningItem) {
                const { error } = await supabase.from('mining_items').update(miningItemForm).eq('id', editingMiningItem.id);
                if (!error) { setMiningItems(prev => prev.map(m => m.id === editingMiningItem.id ? { ...m, ...miningItemForm } : m)); }
            } else {
                const { data, error } = await supabase.from('mining_items').insert(miningItemForm).select().single();
                if (!error && data) setMiningItems(prev => [...prev, data]);
            }
            setEditingMiningItem(null); setMiningItemForm({});
            notify({ type: 'success', title: 'Kaydedildi', message: 'Madenci ekipmanı güncellendi.' });
            await logAdminAction('update_mining_item', editingMiningItem?.id, miningItemForm);
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Kayıt başarısız.' }); }
    };
    const handleDeleteMiningItem = async (id: string) => {
        if (!window.confirm('Bu ekipmanı silmek istediğinize emin misiniz?')) return;
        await supabase.from('mining_items').delete().eq('id', id);
        setMiningItems(prev => prev.filter(m => m.id !== id));
        notify({ type: 'warning', title: 'Silindi', message: 'Ekipman silindi.' });
    };

    // --- Mining Plans CRUD ---
    const handleSaveMiningPlan = async () => {
        try {
            const payload = {
                ...miningPlanForm,
                features: Array.isArray(miningPlanForm.features) ? miningPlanForm.features : [],
                updated_at: new Date().toISOString(),
            };
            if (editingMiningPlan?.id) {
                const { error } = await supabase.from('mining_plans').update(payload).eq('id', editingMiningPlan.id);
                if (!error) {
                    setMiningPlans(prev => prev.map(p => p.id === editingMiningPlan.id ? { ...p, ...payload } : p));
                    notify({ type: 'success', title: 'Güncellendi', message: 'Madencilik planı güncellendi.' });
                }
            } else {
                const { data, error } = await supabase.from('mining_plans').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
                if (!error && data) {
                    setMiningPlans(prev => [data, ...prev]);
                    notify({ type: 'success', title: 'Oluşturuldu', message: 'Yeni madencilik planı eklendi.' });
                }
            }
            setShowMiningPlanModal(false);
            setEditingMiningPlan(null);
            setMiningPlanForm({ title: '', currency: 'Bitcoin', price: 0, return_amount: 0, return_type: 'Fixed', hashrate_value: 1, hashrate_unit: 'MH/s', period_value: 1, period_unit: 'Day', maintenance_cost: 0, features: [], description: '', status: 'enabled' });
        } catch (e) {
            notify({ type: 'warning', title: 'Hata', message: 'Plan kaydedilemedi.' });
        }
    };

    const handleToggleMiningPlan = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
        await supabase.from('mining_plans').update({ status: newStatus }).eq('id', id);
        setMiningPlans(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
        notify({ type: newStatus === 'enabled' ? 'success' : 'warning', title: newStatus === 'enabled' ? 'Aktif Edildi' : 'Devre Dışı', message: '' });
    };

    const handleDeleteMiningPlan = async (id: string) => {
        if (!window.confirm('Bu planı silmek istediğinize emin misiniz?')) return;
        await supabase.from('mining_plans').delete().eq('id', id);
        setMiningPlans(prev => prev.filter(p => p.id !== id));
        notify({ type: 'warning', title: 'Silindi', message: 'Madencilik planı silindi.' });
    };

    const loadMiningPlanAnalytics = async (planId: string) => {
        setMiningPlanAnalyticsId(planId);
        // Fetch orders/miners for this plan
        try {
            const days = miningPlanAnalyticsRange === '7d' ? 7 : 30;
            const since = new Date(); since.setDate(since.getDate() - days);
            const { data: orders } = await supabase.from('orders').select('*').eq('plan_id', planId).gte('created_at', since.toISOString());
            const { data: miners } = await supabase.from('miners').select('*').eq('plan_id', planId);
            setMiningPlanAnalyticsData({ orders: orders || [], miners: miners || [] });
        } catch (e) {
            setMiningPlanAnalyticsData({ orders: [], miners: [] });
        }
    };

    // --- Flash Offers CRUD ---
    const handleSaveFlashOffer = async () => {
        try {
            const payload = { ...flashOfferForm, updated_at: new Date().toISOString() };
            if (editingFlashOffer?.id) {
                const { error } = await supabase.from('flash_offers').update(payload).eq('id', editingFlashOffer.id);
                if (!error) {
                    setFlashOffers(prev => prev.map(f => f.id === editingFlashOffer.id ? { ...f, ...payload } : f));
                    notify({ type: 'success', title: 'Güncellendi', message: 'Flaş teklif güncellendi.' });
                }
            } else {
                const { data, error } = await supabase.from('flash_offers').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
                if (!error && data) {
                    setFlashOffers(prev => [data, ...prev]);
                    notify({ type: 'success', title: 'Oluşturuldu', message: 'Flaş teklif eklendi.' });
                }
            }
            setShowFlashOfferModal(false);
            setEditingFlashOffer(null);
            setFlashOfferForm({ ...defaultFlashForm });
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Kayıt başarısız.' }); }
    };
    const handleToggleFlashOffer = async (id: string, active: boolean) => {
        await supabase.from('flash_offers').update({ active: !active }).eq('id', id);
        setFlashOffers(prev => prev.map(f => f.id === id ? { ...f, active: !active } : f));
    };
    const handleDeleteFlashOffer = async (id: string) => {
        if (!window.confirm('Bu teklifi silmek istiyor musunuz?')) return;
        await supabase.from('flash_offers').delete().eq('id', id);
        setFlashOffers(prev => prev.filter(f => f.id !== id));
        notify({ type: 'warning', title: 'Silindi', message: 'Flaş teklif silindi.' });
    };

    // --- Free Options Save ---
    const handleSaveFreeOptions = async () => {
        setFreeOptionsSaving(true);
        try {
            await supabase.from('settings').upsert({ id: 'free_options', value: freeOptions, updated_at: new Date().toISOString() });
            notify({ type: 'success', title: 'Kaydedildi', message: 'Ücretsiz seçenek ayarları güncellendi.' });
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Kayıt başarısız.' }); }
        setFreeOptionsSaving(false);
    };

    // --- Contracts CRUD ---
    const handleSaveContract = async () => {
        try {
            const payload = { ...contractForm, updated_at: new Date().toISOString() };
            if (editingContract?.id) {
                const { error } = await supabase.from('contracts').update(payload).eq('id', editingContract.id);
                if (!error) {
                    setContracts(prev => prev.map(c => c.id === editingContract.id ? { ...c, ...payload } : c));
                    notify({ type: 'success', title: 'Güncellendi', message: 'Kontrat güncellendi.' });
                }
            } else {
                const { data, error } = await supabase.from('contracts').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
                if (!error && data) {
                    setContracts(prev => [data, ...prev]);
                    notify({ type: 'success', title: 'Oluşturuldu', message: 'Kontrat eklendi.' });
                }
            }
            setShowContractModal(false);
            setEditingContract(null);
            setContractForm({ ...defaultContractForm });
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Kontrat kaydedilemedi.' }); }
    };
    const handleToggleContract = async (id: string, active: boolean) => {
        await supabase.from('contracts').update({ active: !active }).eq('id', id);
        setContracts(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c));
    };
    const handleDeleteContract = async (id: string) => {
        if (!window.confirm('Bu kontratı silmek istiyor musunuz?')) return;
        await supabase.from('contracts').delete().eq('id', id);
        setContracts(prev => prev.filter(c => c.id !== id));
        notify({ type: 'warning', title: 'Silindi', message: 'Kontrat silindi.' });
    };
    const handleCreateEvent = async () => {
        if (!newEvent.name) return;
        try {
            const { data, error } = await supabase.from('game_events').insert({ ...newEvent, created_at: new Date().toISOString() }).select().single();
            if (!error && data) { setGameEvents(prev => [data, ...prev]); setNewEvent({ name: '', type: 'multiplier', multiplier: 2, duration_hours: 24, active: false }); }
            notify({ type: 'success', title: 'Etkinlik Oluşturuldu', message: `"${newEvent.name}" etkinliği başlatıldı.` });
            await logAdminAction('create_game_event', undefined, newEvent);
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Etkinlik oluşturulamadı.' }); }
    };
    const handleToggleEvent = async (id: string, active: boolean) => {
        await supabase.from('game_events').update({ active }).eq('id', id);
        setGameEvents(prev => prev.map(e => e.id === id ? { ...e, active } : e));
        notify({ type: active ? 'success' : 'warning', title: active ? 'Etkinlik Başladı' : 'Etkinlik Durduruldu', message: '' });
    };

    // --- Promo Codes CRUD ---
    const handleCreatePromo = async () => {
        if (!newPromo.code) return;
        try {
            const { data, error } = await supabase.from('promo_codes').insert({ ...newPromo, used_count: 0, created_at: new Date().toISOString() }).select().single();
            if (!error && data) { setPromoCodes(prev => [data, ...prev]); setNewPromo({ code: '', reward_btc: 0, reward_tp: 0, max_uses: 100, expires_at: '' }); }
            notify({ type: 'success', title: 'Kod Oluşturuldu', message: `"${newPromo.code}" kodu hazır.` });
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Kod oluşturulamadı.' }); }
    };
    const handleDeletePromo = async (id: string) => {
        await supabase.from('promo_codes').delete().eq('id', id);
        setPromoCodes(prev => prev.filter(p => p.id !== id));
        notify({ type: 'warning', title: 'Silindi', message: 'Promo kod silindi.' });
    };

    // --- VIP Management ---
    const handleGrantVip = async (playerId: string, days: number) => {
        const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
        await supabase.from(TABLES.PROFILES).update({ vip: { isActive: true, expiresAt, grantedAt: new Date().toISOString() } }).eq('id', playerId);
        setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, vip: { isActive: true, expiresAt } } : p));
        notify({ type: 'success', title: 'VIP Verildi', message: `${days} günlük VIP aktif edildi.` });
        await logAdminAction('grant_vip', playerId, { days, expiresAt });
    };
    const handleRevokeVip = async (playerId: string) => {
        await supabase.from(TABLES.PROFILES).update({ vip: { isActive: false } }).eq('id', playerId);
        setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, vip: { isActive: false } } : p));
        notify({ type: 'warning', title: 'VIP Kaldırıldı', message: 'VIP üyelik iptal edildi.' });
    };

    // --- DB Explorer ---
    const handleDbQuery = async () => {
        if (!dbTable) return;
        setDbLoading(true);
        try {
            let q = supabase.from(dbTable).select('*').order('created_at', { ascending: false }).limit(100);
            if (dbQuery.trim()) {
                // Parse simple key:value filter
                const parts = dbQuery.split('=');
                if (parts.length === 2) q = q.eq(parts[0].trim(), parts[1].trim());
            }
            const { data, error } = await q;
            if (error) throw error;
            setDbRows(data || []);
        } catch (e: any) { notify({ type: 'warning', title: 'Sorgu Hatası', message: e.message }); setDbRows([]); }
        finally { setDbLoading(false); }
    };
    const handleDbDelete = async (table: string, id: string) => {
        if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
        await supabase.from(table).delete().eq('id', id);
        setDbRows(prev => prev.filter(r => r.id !== id));
        notify({ type: 'warning', title: 'Silindi', message: 'Kayıt veritabanından silindi.' });
        await logAdminAction('db_delete', id, { table });
    };

    const handleBulkBan = async () => {
        if (!window.confirm(`${selectedPlayerIds.size} kullanıcıyı banlamak istediğinize emin misiniz?`)) return;
        setBulkActionLoading(true);
        try {
            for (const uid of selectedPlayerIds) {
                await supabase.from(TABLES.PROFILES).update({ isBanned: true }).eq('id', uid.trim());
            }
            await logAdminAction('bulk_ban', 'multiple', { count: selectedPlayerIds.size });
            notify({ type: 'success', title: 'Toplu Ban', message: `${selectedPlayerIds.size} kullanıcı banlandı.` });
            setSelectedPlayerIds(new Set());
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Toplu ban başarısız.' }); }
        setBulkActionLoading(false);
    };

    const handleBulkUnban = async () => {
        setBulkActionLoading(true);
        try {
            for (const uid of selectedPlayerIds) {
                await supabase.from(TABLES.PROFILES).update({ isBanned: false }).eq('id', uid.trim());
            }
            await logAdminAction('bulk_unban', 'multiple', { count: selectedPlayerIds.size });
            notify({ type: 'success', title: 'Toplu Ban Kaldırma', message: `${selectedPlayerIds.size} kullanıcının banı kaldırıldı.` });
            setSelectedPlayerIds(new Set());
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Toplu ban kaldırma başarısız.' }); }
        setBulkActionLoading(false);
    };

    const handleBulkAddBtc = async (amount: number) => {
        setBulkActionLoading(true);
        try {
            for (const uid of selectedPlayerIds) {
                const player = players.find(p => p.id === uid);
                if (player) await supabase.from(TABLES.PROFILES).update({ btcBalance: (player.btcBalance || 0) + amount }).eq('id', uid.trim());
            }
            await logAdminAction('bulk_add_btc', 'multiple', { count: selectedPlayerIds.size, amount });
            notify({ type: 'success', title: 'Toplu BTC', message: `${selectedPlayerIds.size} kullanıcıya +${amount} BTC eklendi.` });
            setSelectedPlayerIds(new Set());
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Toplu BTC işlemi başarısız.' }); }
        setBulkActionLoading(false);
    };

    const handleBulkAddTp = async (amount: number) => {
        setBulkActionLoading(true);
        try {
            for (const uid of selectedPlayerIds) {
                const player = players.find(p => p.id === uid);
                if (player) await supabase.from(TABLES.PROFILES).update({ tycoonPoints: (player.tycoonPoints || 0) + amount }).eq('id', uid.trim());
            }
            await logAdminAction('bulk_add_tp', 'multiple', { count: selectedPlayerIds.size, amount });
            notify({ type: 'success', title: 'Toplu TP', message: `${selectedPlayerIds.size} kullanıcıya +${amount} TP eklendi.` });
            setSelectedPlayerIds(new Set());
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Toplu TP işlemi başarısız.' }); }
        setBulkActionLoading(false);
    };

    const handleSendNotification = async () => {
        if (!notifTitle || !notifBody) { notify({ type: 'warning', title: 'Eksik Alan', message: 'Başlık ve mesaj zorunludur.' }); return; }
        setNotifSending(true);
        try {
            let targets: any[] = [];
            if (notifTarget === 'all') targets = players;
            else if (notifTarget === 'vip') targets = players.filter(p => p.vip?.isActive);
            else if (notifTarget === 'single') targets = players.filter(p => p.id === notifTargetUid || p.username === notifTargetUid);

            for (const p of targets) {
                await supabase.from(TABLES.LOGS).insert({
                    admin_id: state.user?.uid, admin_username: state.username,
                    action: 'send_notification', target_id: p.id,
                    details: { title: notifTitle, body: notifBody, type: notifType }
                });
            }
            await logAdminAction('broadcast_notification', notifTarget, { title: notifTitle, count: targets.length });
            notify({ type: 'success', title: 'Bildirim Gönderildi', message: `${targets.length} kullanıcıya bildirim iletildi.` });
            setNotifTitle(''); setNotifBody(''); setNotifTargetUid('');
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Bildirim gönderilemedi.' }); }
        setNotifSending(false);
    };

    const handleBulkWithdrawalApprove = async () => {
        setBulkActionLoading(true);
        try {
            for (const id of selectedWithdrawalIds) {
                await supabase.from(TABLES.WITHDRAWALS).update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', id.trim());
            }
            notify({ type: 'success', title: 'Toplu Onay', message: `${selectedWithdrawalIds.size} çekim onaylandı.` });
            setSelectedWithdrawalIds(new Set());
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Toplu onay başarısız.' }); }
        setBulkActionLoading(false);
    };

    const handleWithdrawalStatusChange = async (id: string, newStatus: 'approved' | 'rejected' | 'on_hold' | 'pending') => {
        const cleanId = id.trim();
        try {
            // 1. Fetch withdrawal details to get amount and userId
            const { data: wd } = await supabase.from(TABLES.WITHDRAWALS).select('*').eq('id', cleanId).single();
            if (!wd) throw new Error('Çekim talebi bulunamadı.');

            // 2. If rejecting from a state that was previously 'pending', 'approved', or 'on_hold'
            // and we had deducted it (which we do now on request), we must REFUND it if status is 'rejected'
            if (newStatus === 'rejected') {
                const { data: profile } = await supabase.from(TABLES.PROFILES).select('btcBalance').eq('id', wd.user_id).single();
                if (profile) {
                    const newBalance = (profile.btcBalance || 0) + wd.amount;
                    await supabase.from(TABLES.PROFILES).update({ btcBalance: newBalance }).eq('id', wd.user_id);
                    // Add refund transaction
                    await supabase.from(TABLES.TRANSACTIONS).insert({
                        user_id: wd.user_id,
                        amount: wd.amount,
                        type: 'transfer_in',
                        description: `İade: Çekim Reddedildi (#${cleanId.substring(0,6)})`,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // 3. Update status
            await supabase.from(TABLES.WITHDRAWALS).update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', cleanId);
            
            notify({ type: 'success', title: 'Güncellendi', message: `Talep durumu '${newStatus}' olarak güncellendi.` });
        } catch (e: any) {
            console.error('Withdrawal update error:', e);
            notify({ type: 'warning', title: 'Hata', message: `Güncelleme başarısız: ${e.message}` });
        }
    };

    const handleBulkWithdrawalReject = async () => {
        setBulkActionLoading(true);
        try {
            for (const id of selectedWithdrawalIds) {
                await handleWithdrawalStatusChange(id, 'rejected');
            }
            notify({ type: 'warning', title: 'Toplu Red', message: `${selectedWithdrawalIds.size} çekim reddedildi ve iade edildi.` });
            setSelectedWithdrawalIds(new Set());
        } catch (e) { notify({ type: 'warning', title: 'Hata', message: 'Toplu red başarısız.' }); }
        setBulkActionLoading(false);
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
                        {MENU_CATEGORIES.map((cat) => {
                            const isOpen = openCategories.includes(cat.id);
                            const isSingleItem = cat.items.length === 1;
                            const isCatActive = cat.items.some(i => i.id === activeTab);
                            return (
                                <div key={cat.id} className="space-y-1">
                                    <button
                                        onClick={() => isSingleItem ? setActiveTab(cat.items[0].id as AdminTab) : toggleCategory(cat.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group mb-1",
                                            cat.color ? `${cat.color} text-white shadow-lg shadow-black/20` : "hover:bg-white/5 text-zinc-500",
                                            isSingleItem && isCatActive ? "ring-2 ring-white/30" : ""
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={cn("transition-all", isSingleItem && isCatActive ? "scale-110 text-white" : "")}>
                                                {cat.items[0]?.icon}
                                            </span>
                                            <p className="text-[10px] font-black uppercase tracking-[0.15em]">
                                                {cat.title}
                                            </p>
                                        </div>
                                        {!isSingleItem && (
                                            <div className="text-white/40 group-hover:text-white transition-colors">
                                                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </div>
                                        )}
                                    </button>

                                    {!isSingleItem && isOpen && (
                                        <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                                            {cat.items.map(item => (
                                                <div key={String(item.id)}>
                                                <SidebarLink
                                                    active={activeTab === item.id}
                                                    onClick={() => setActiveTab(item.id as AdminTab)}
                                                    icon={item.icon}
                                                    label={item.label}
                                                    badge={(item as any).badge}
                                                    sub
                                                />
                                                </div>
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
                <header className="sticky top-0 z-20 w-full px-6 py-3 bg-[#1a2035] flex items-center justify-between gap-4">
                    {/* Sol: arama */}
                    <div className="relative w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={13}/>
                        <input placeholder="Search here..." className="w-full h-9 pl-9 pr-4 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:bg-white/10 transition-all"/>
                    </div>

                    {/* Sağ: aksiyonlar */}
                    <div className="flex items-center gap-1 ml-auto">
                        {/* Ayarlar butonu */}
                        <button
                            onClick={() => setActiveTab('settings')}
                            title="Sistem Ayarları"
                            className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                activeTab === 'settings' ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"
                            )}>
                            <SettingsIcon size={16}/>
                        </button>

                        {/* Bildirimler */}
                        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
                            <Bell size={16}/>
                            {tickets.filter(t=>t.status==='open').length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"/>
                            )}
                        </button>

                        {/* Bakım modu göstergesi */}
                        {state.globalSettings.isMaintenance && (
                            <button onClick={() => handleUpdateSettings({ isMaintenance: false })}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">
                                <Lock size={11}/> Bakım Modu
                            </button>
                        )}

                        <div className="w-px h-5 bg-white/10 mx-1"/>

                        {/* Admin profil butonu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowAdminMenu(v => !v)}
                                className={cn(
                                    "flex items-center gap-2 h-9 px-3 rounded-lg transition-all",
                                    showAdminMenu ? "bg-white/20" : "hover:bg-white/10"
                                )}>
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white text-xs shadow-lg">
                                    {(state.username?.charAt(0) || 'A').toUpperCase()}
                                </div>
                                <div className="hidden lg:block text-left">
                                    <p className="text-white text-[10px] font-black leading-none">{state.username || 'Admin'}</p>
                                    <p className="text-white/40 text-[8px] font-bold leading-none mt-0.5">Süper Admin</p>
                                </div>
                                <ChevronDown size={12} className={cn("text-white/40 transition-transform", showAdminMenu && "rotate-180")}/>
                            </button>

                            {showAdminMenu && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setShowAdminMenu(false)}/>
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 border-b border-zinc-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white text-sm">
                                                    {(state.username?.charAt(0) || 'A').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-zinc-800 text-sm">{state.username || 'Admin'}</p>
                                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Süper Admin</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => { setShowAdminMenu(false); setActiveTab('players_all'); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors text-left">
                                                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><User size={13}/></div>
                                                <span className="text-xs font-bold text-zinc-700">Profil</span>
                                            </button>
                                            <button
                                                onClick={() => { setShowAdminMenu(false); setShowPasswordModal(true); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors text-left">
                                                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><Key size={13}/></div>
                                                <span className="text-xs font-bold text-zinc-700">Şifre Değiştir</span>
                                            </button>
                                            <div className="my-1 border-t border-zinc-100"/>
                                            <button
                                                onClick={() => { setShowAdminMenu(false); onClose(); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left">
                                                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><LogOut size={13}/></div>
                                                <span className="text-xs font-bold text-red-500">Çıkış Yap</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Şifre Değiştir Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-zinc-800 text-sm uppercase tracking-widest flex items-center gap-2"><Key size={14} className="text-amber-500"/> Şifre Değiştir</h3>
                                <button onClick={() => setShowPasswordModal(false)} className="text-zinc-400 hover:text-zinc-700 transition-colors"><X size={16}/></button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Yeni Şifre</p>
                                    <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}
                                        placeholder="••••••••" className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800 focus:outline-none focus:border-amber-300"/>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Şifre Tekrar</p>
                                    <input type="password" value={newPasswordConfirm} onChange={e=>setNewPasswordConfirm(e.target.value)}
                                        placeholder="••••••••" className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800 focus:outline-none focus:border-amber-300"/>
                                </div>
                            </div>
                            {newPassword && newPasswordConfirm && newPassword !== newPasswordConfirm && (
                                <p className="text-[9px] text-red-500 font-bold">Şifreler eşleşmiyor!</p>
                            )}
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => setShowPasswordModal(false)} className="flex-1 h-11 rounded-xl bg-zinc-100 text-zinc-600 font-black text-[9px] uppercase hover:bg-zinc-200 transition-all">İptal</button>
                                <button
                                    disabled={!newPassword || newPassword !== newPasswordConfirm}
                                    onClick={async () => {
                                        try {
                                            if (state.user?.uid) {
                                                await supabase.from(TABLES.PROFILES).update({ password_hash: newPassword }).eq('id', state.user.uid);
                                            }
                                            notify({ type: 'success', title: 'Şifre Güncellendi', message: 'Yeni şifreniz kaydedildi.' });
                                            setShowPasswordModal(false); setNewPassword(''); setNewPasswordConfirm('');
                                        } catch { notify({ type: 'warning', title: 'Hata', message: 'Şifre güncellenemedi.' }); }
                                    }}
                                    className="flex-1 h-11 rounded-xl bg-amber-500 text-white font-black text-[9px] uppercase hover:bg-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-8 space-y-8 max-w-[1600px] mx-auto pb-32">

                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Bakım Modu Banner */}
                            {state.globalSettings.isMaintenance && (
                                <div className="flex items-center gap-4 p-4 bg-red-600 rounded-2xl shadow-lg shadow-red-600/20">
                                    <Lock className="text-white shrink-0" size={18}/>
                                    <p className="text-white font-black text-sm flex-1">⚠️ Bakım Modu Aktif — Kullanıcılar şu an uygulamaya erişemiyor</p>
                                    <button onClick={() => handleUpdateSettings({ isMaintenance: false })}
                                        className="h-9 px-5 rounded-xl bg-white text-red-600 font-black text-[9px] uppercase shrink-0 hover:bg-red-50 transition-all active:scale-95 flex items-center gap-1.5">
                                        <Unlock size={12}/> Bakımı Kapat
                                    </button>
                                </div>
                            )}

                            {/* ── Row 1: Stat kartları ─ resimdeki 8'li grid ── */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm divide-x divide-zinc-100">
                                {[
                                    { label: 'Toplam Kullanıcı', value: players.length.toLocaleString(), icon: '👥', color: 'bg-blue-500', badge: null, tab: 'players_all' },
                                    { label: 'Aktif Kullanıcı', value: players.filter(p=>!p.isBanned).length.toLocaleString(), icon: '✅', color: 'bg-green-500', badge: null, tab: 'players_active' },
                                    { label: 'E-posta Onaysız', value: players.filter(p=>!p.email_verified).length.toLocaleString(), icon: '✉️', color: 'bg-red-500', badge: null, tab: 'players_all' },
                                    { label: 'Mobil Onaysız', value: players.filter(p=>!p.phone_verified).length.toLocaleString(), icon: '📱', color: 'bg-orange-500', badge: null, tab: 'players_all' },
                                ].map((s, i) => (
                                    <button key={i} onClick={() => setActiveTab(s.tab as AdminTab)}
                                        className="flex items-center gap-4 p-5 hover:bg-zinc-50 transition-colors text-left group">
                                        <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-lg shadow-sm shrink-0`}>{s.icon}</div>
                                        <div>
                                            <p className="text-2xl font-black text-zinc-800 tabular-nums leading-none">{s.value}</p>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{s.label}</p>
                                        </div>
                                        <ArrowRight size={13} className="ml-auto text-zinc-200 group-hover:text-indigo-400 transition-colors"/>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm divide-x divide-zinc-100">
                                {[
                                    { label: 'Total Currencies', value: '7', icon: '💱', color: 'bg-blue-500', tab: 'economy' },
                                    { label: 'Mining Plans', value: miningItems.length.toString(), icon: '⛏️', color: 'bg-teal-500', tab: 'mining_items' },
                                    { label: 'Total Orders', value: allTransactions.filter(t=>t.type==='buy_item').length.toLocaleString(), icon: '📦', color: 'bg-teal-600', tab: 'orders' },
                                    { label: 'Total Liabilities', value: `$${(totalBtc*65000).toLocaleString()}`, icon: '💰', color: 'bg-indigo-600', tab: 'transactions_all' },
                                ].map((s, i) => (
                                    <button key={i} onClick={() => setActiveTab(s.tab as AdminTab)}
                                        className="flex items-center gap-4 p-5 hover:bg-zinc-50 transition-colors text-left group">
                                        <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-lg shadow-sm shrink-0`}>{s.icon}</div>
                                        <div>
                                            <p className="text-2xl font-black text-zinc-800 tabular-nums leading-none">{s.value}</p>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{s.label}</p>
                                        </div>
                                        <ArrowRight size={13} className="ml-auto text-zinc-200 group-hover:text-indigo-400 transition-colors"/>
                                    </button>
                                ))}
                            </div>

                            {/* ── Row 2: Deposits + Withdrawals ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Deposits */}
                                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
                                        <span className="font-black text-[10px] text-zinc-500 uppercase tracking-widest">Deposits</span>
                                        <button onClick={() => setActiveTab('deposits_all')} className="text-[9px] text-indigo-500 font-black hover:underline">Tümü →</button>
                                    </div>
                                    <div className="divide-y divide-zinc-50">
                                        {[
                                            { label: 'Total Accounts Amount', value: `${allTransactions.filter(t=>t.type==='deposit').reduce((a,t)=>a+(t.amount||0),0).toFixed(4)} BTC`, color: 'bg-blue-500', icon: '🏦' },
                                            { label: 'Total Pending Amount', value: `${allTransactions.filter(t=>t.type==='deposit'&&t.status==='pending').reduce((a,t)=>a+(t.amount||0),0).toFixed(4)} BTC`, color: 'bg-orange-400', icon: '⏳' },
                                            { label: 'Total Deposited Amount', value: `${allTransactions.filter(t=>t.type==='deposit'&&t.status==='approved').reduce((a,t)=>a+(t.amount||0),0).toFixed(4)} BTC`, color: 'bg-teal-500', icon: '✅' },
                                            { label: 'Total Rejected Charge', value: `${allTransactions.filter(t=>t.type==='deposit'&&t.status==='rejected').length} adet`, color: 'bg-red-400', icon: '❌' },
                                        ].map((row,i) => (
                                            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                                                <div className={`w-8 h-8 rounded-lg ${row.color} flex items-center justify-center text-sm`}>{row.icon}</div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{row.label}</p>
                                                </div>
                                                <span className="font-black text-sm text-zinc-800 tabular-nums">{row.value}</span>
                                                <ArrowRight size={12} className="text-zinc-300"/>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Withdrawals */}
                                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
                                        <span className="font-black text-[10px] text-zinc-500 uppercase tracking-widest">Withdrawals</span>
                                        <button onClick={() => setActiveTab('withdrawals_all')} className="text-[9px] text-indigo-500 font-black hover:underline">Tümü →</button>
                                    </div>
                                    <div className="divide-y divide-zinc-50">
                                        {[
                                            { label: 'Total Withdrawals', value: `${withdrawals.length} adet`, color: 'bg-blue-500', icon: '📤' },
                                            { label: 'Total Withdrawals Amount', value: `${withdrawals.filter(w=>w.status==='approved').reduce((a,w)=>a+(w.amount||0),0).toFixed(4)} BTC`, color: 'bg-teal-500', icon: '💸' },
                                            { label: 'Rejected Withdrawals', value: `${withdrawals.filter(w=>w.status==='rejected').length} adet`, color: 'bg-red-400', icon: '🚫' },
                                            { label: 'Withdrawal Charge', value: '$0.0000', color: 'bg-indigo-500', icon: '💵' },
                                        ].map((row,i) => (
                                            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                                                <div className={`w-8 h-8 rounded-lg ${row.color} flex items-center justify-center text-sm`}>{row.icon}</div>
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{row.label}</p>
                                                </div>
                                                <span className="font-black text-sm text-zinc-800 tabular-nums">{row.value}</span>
                                                <ArrowRight size={12} className="text-zinc-300"/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── Row 3: Mining Tracks ── */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm divide-x divide-zinc-100">
                                {[
                                    { label: 'Total Mining Tracks', value: miningItems.length.toString(), icon: '⛏️', color: 'bg-blue-500' },
                                    { label: 'Active Mining Tracks', value: miningItems.filter(m=>m.available!==false).length.toString(), icon: '🟢', color: 'bg-blue-500' },
                                    { label: 'Total Returned', value: `${allTransactions.filter(t=>t.type==='mining_reward').reduce((a,t)=>a+(t.amount||0),0).toFixed(4)} BTC`, icon: '💹', color: 'bg-green-500' },
                                    { label: 'Total Transferred', value: '$0.0000', icon: '🔄', color: 'bg-indigo-500' },
                                ].map((s,i) => (
                                    <div key={i} className="flex items-center gap-4 p-5">
                                        <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-lg shadow-sm shrink-0`}>{s.icon}</div>
                                        <div>
                                            <p className="text-2xl font-black text-zinc-800 tabular-nums leading-none">{s.value}</p>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{s.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Row 4: Charts ── Returned Amount + Transactions ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Returned Amount Chart */}
                                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-black text-xs text-zinc-700 uppercase tracking-widest">Returned Amount</span>
                                        <div className="flex items-center gap-2">
                                            <select className="h-7 px-2 rounded-lg bg-zinc-100 border border-zinc-200 text-[9px] font-bold text-zinc-600 cursor-pointer focus:outline-none">
                                                <option>ADA</option><option>BTC</option>
                                            </select>
                                            <select className="h-7 px-2 rounded-lg bg-white border border-zinc-200 text-[9px] font-bold text-zinc-600 cursor-pointer focus:outline-none flex items-center gap-1">
                                                <option>Last 15 Days</option><option>Last 30 Days</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="h-52">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={kpiData}>
                                                <defs>
                                                    <linearGradient id="gradReturn" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false}/>
                                                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#a1a1aa' }} axisLine={false} tickLine={false}/>
                                                <YAxis tick={{ fontSize: 9, fill: '#a1a1aa' }} axisLine={false} tickLine={false}/>
                                                <Tooltip contentStyle={{ background:'#fff', border:'1px solid #e4e4e7', borderRadius:'12px', fontSize:'10px', fontWeight:'700' }}/>
                                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradReturn)" name="Gelir"/>
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {kpiData.every(d=>d.revenue===0) && (
                                        <p className="text-center text-zinc-400 text-[9px] font-bold uppercase -mt-20 relative z-10">No data available</p>
                                    )}
                                </div>

                                {/* Transactions Chart */}
                                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-black text-xs text-zinc-700 uppercase tracking-widest">Transactions</span>
                                        <div className="flex items-center gap-2">
                                            <select className="h-7 px-2 rounded-lg bg-zinc-100 border border-zinc-200 text-[9px] font-bold text-zinc-600 cursor-pointer focus:outline-none">
                                                <option>USD</option><option>BTC</option>
                                            </select>
                                            <select className="h-7 px-2 rounded-lg bg-white border border-zinc-200 text-[9px] font-bold text-zinc-600 cursor-pointer focus:outline-none">
                                                <option>Last 15 Days</option><option>Last 30 Days</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="h-52">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={kpiData}>
                                                <defs>
                                                    <linearGradient id="gradTx" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false}/>
                                                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#a1a1aa' }} axisLine={false} tickLine={false}/>
                                                <YAxis tick={{ fontSize: 9, fill: '#a1a1aa' }} axisLine={false} tickLine={false}/>
                                                <Tooltip contentStyle={{ background:'#fff', border:'1px solid #e4e4e7', borderRadius:'12px', fontSize:'10px', fontWeight:'700' }}/>
                                                <Area type="monotone" dataKey="newUsers" stroke="#10b981" strokeWidth={2.5} fill="url(#gradTx)" name="İşlem"/>
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {kpiData.every(d=>d.newUsers===0) && (
                                        <p className="text-center text-zinc-400 text-[9px] font-bold uppercase -mt-20 relative z-10">No data available</p>
                                    )}
                                </div>
                            </div>

                            {/* ── Row 5: 3 Donut Charts ── Login By Browser / OS / Country ── */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    {
                                        title: 'Login By Browser (Last 30 Days)',
                                        data: [
                                            { name: 'Chrome', value: Math.max(1, Math.round(players.length * 0.52)), color: '#f97316' },
                                            { name: 'Safari', value: Math.max(1, Math.round(players.length * 0.24)), color: '#ef4444' },
                                            { name: 'Firefox', value: Math.max(1, Math.round(players.length * 0.12)), color: '#a855f7' },
                                            { name: 'Edge', value: Math.max(1, Math.round(players.length * 0.08)), color: '#eab308' },
                                            { name: 'Other', value: Math.max(1, Math.round(players.length * 0.04)), color: '#6366f1' },
                                        ]
                                    },
                                    {
                                        title: 'Login By OS (Last 30 Days)',
                                        data: [
                                            { name: 'Android', value: Math.max(1, Math.round(players.length * 0.44)), color: '#f97316' },
                                            { name: 'iOS', value: Math.max(1, Math.round(players.length * 0.27)), color: '#ef4444' },
                                            { name: 'Windows', value: Math.max(1, Math.round(players.length * 0.18)), color: '#a855f7' },
                                            { name: 'Mac', value: Math.max(1, Math.round(players.length * 0.07)), color: '#fbbf24' },
                                            { name: 'Linux', value: Math.max(1, Math.round(players.length * 0.04)), color: '#6366f1' },
                                        ]
                                    },
                                    {
                                        title: 'Login By Country (Last 30 Days)',
                                        data: [
                                            { name: 'Türkiye', value: Math.max(1, Math.round(players.length * 0.38)), color: '#ef4444' },
                                            { name: 'USA', value: Math.max(1, Math.round(players.length * 0.22)), color: '#a855f7' },
                                            { name: 'Germany', value: Math.max(1, Math.round(players.length * 0.16)), color: '#f97316' },
                                            { name: 'UK', value: Math.max(1, Math.round(players.length * 0.13)), color: '#eab308' },
                                            { name: 'Other', value: Math.max(1, Math.round(players.length * 0.11)), color: '#6366f1' },
                                        ]
                                    }
                                ].map((chart, ci) => (
                                    <div key={ci} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{chart.title}</p>
                                        <div className="flex justify-center">
                                            <PieChart width={180} height={180}>
                                                <Pie data={chart.data} cx={85} cy={85} innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                                                    {chart.data.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color}/>
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ background:'#fff', border:'1px solid #e4e4e7', borderRadius:'12px', fontSize:'10px', fontWeight:'700' }}/>
                                            </PieChart>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                                            {chart.data.map((d, di) => (
                                                <div key={di} className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }}/>
                                                    <span className="text-[9px] font-bold text-zinc-500 truncate">{d.name}</span>
                                                    <span className="text-[9px] font-black text-zinc-800 ml-auto tabular-nums">{d.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Row 6: Son İşlemler + Aktif Oturumlar ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
                                        <span className="font-black text-xs text-zinc-700 uppercase tracking-widest flex items-center gap-2"><Activity size={13} className="text-indigo-500"/> Son İşlemler</span>
                                        <button onClick={() => setActiveTab('transactions_all')} className="text-[9px] text-indigo-500 font-black hover:underline flex items-center gap-1">Tümünü Gör <ArrowRight size={10}/></button>
                                    </div>
                                    <div className="divide-y divide-zinc-50">
                                        {allTransactions.slice(0, 7).map(tx => (
                                            <div key={tx.id} className="flex items-center gap-4 px-5 py-3">
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0",
                                                    tx.type==='deposit' ? "bg-emerald-500" : tx.type==='withdrawal' ? "bg-red-500" : "bg-indigo-500")}>
                                                    {tx.type==='deposit'?'↑':tx.type==='withdrawal'?'↓':'⟳'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-zinc-800 truncate">{tx.username||'—'}</p>
                                                    <p className="text-[8px] text-zinc-400 font-mono capitalize">{tx.type}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={cn("font-black text-sm tabular-nums", tx.amount>0?"text-emerald-600":"text-red-600")}>
                                                        {tx.amount>0?'+':''}{(tx.amount||0).toFixed(6)}
                                                    </p>
                                                    <p className="text-[8px] text-zinc-400 font-mono">{tx.created_at?.slice(0,10)||''}</p>
                                                </div>
                                                <span className={cn("px-2 py-0.5 rounded-lg text-[7px] font-black uppercase border",
                                                    tx.status==='approved'||tx.status==='success'?"bg-emerald-50 text-emerald-600 border-emerald-100":
                                                    tx.status==='pending'?"bg-orange-50 text-orange-600 border-orange-100":
                                                    "bg-red-50 text-red-500 border-red-100"
                                                )}>{tx.status||'—'}</span>
                                            </div>
                                        ))}
                                        {allTransactions.length===0 && <p className="p-8 text-center text-zinc-400 text-[9px] font-bold uppercase">İşlem bulunamadı</p>}
                                    </div>
                                </div>

                                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                                    <p className="font-black text-xs text-zinc-700 uppercase tracking-widest flex items-center gap-2"><Wifi size={13} className="text-emerald-500"/> Anlık Sistem</p>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Aktif Oturumlar', value: activeSessions.toString(), icon: <Monitor size={14}/>, color: 'text-indigo-600 bg-indigo-50' },
                                            { label: 'VIP Oyuncular', value: vipCount.toString(), icon: <Award size={14}/>, color: 'text-amber-600 bg-amber-50' },
                                            { label: 'Bekleyen Çekim', value: withdrawals.filter(w=>w.status==='pending').length.toString(), icon: <Upload size={14}/>, color: 'text-orange-600 bg-orange-50' },
                                            { label: 'Açık Destek Talebi', value: tickets.filter(t=>t.status==='open').length.toString(), icon: <LifeBuoy size={14}/>, color: 'text-red-600 bg-red-50' },
                                            { label: 'Aktif Etkinlik', value: gameEvents.filter(e=>e.active).length.toString(), icon: <Flame size={14}/>, color: 'text-orange-500 bg-orange-50' },
                                            { label: 'Promo Kod', value: promoCodes.length.toString(), icon: <Gift size={14}/>, color: 'text-purple-600 bg-purple-50' },
                                        ].map((item,i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}>{item.icon}</div>
                                                    <span className="text-[10px] font-bold text-zinc-500">{item.label}</span>
                                                </div>
                                                <span className="font-black text-sm text-zinc-800 tabular-nums">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-3 border-t border-zinc-100 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Sistem Aktif</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {(activeTab.startsWith('players_') || activeTab === 'players') && activeTab !== 'players_notification' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {/* Advanced Search & Filter Bar */}
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="relative group flex-1">
                                    <input
                                        type="text"
                                        placeholder="Kullanıcı adı, UID, e-posta veya seviye ile ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full h-14 bg-white border border-zinc-200 rounded-2xl px-14 text-zinc-800 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all placeholder:text-zinc-400 shadow-sm"
                                    />
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-2 p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200">
                                    {(['all','active','banned','vip','admin'] as const).map(f => (
                                        <button key={f} onClick={() => setPlayerFilterStatus(f)}
                                            className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                playerFilterStatus === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                                            )}>
                                            {f === 'all' ? 'Hepsi' : f === 'active' ? 'Aktif' : f === 'banned' ? 'Banlı' : f === 'vip' ? 'VIP' : 'Admin'}
                                        </button>
                                    ))}
                                </div>

                                {/* Sort */}
                                <select value={playerSortBy} onChange={(e) => setPlayerSortBy(e.target.value as any)}
                                    className="h-14 px-4 bg-white border border-zinc-200 rounded-2xl text-zinc-800 text-xs font-bold focus:outline-none shadow-sm cursor-pointer">
                                    <option value="username">Ada Göre</option>
                                    <option value="btcBalance">BTC'ye Göre</option>
                                    <option value="level">Seviyeye Göre</option>
                                </select>
                            </div>

                            {/* Bulk Action Bar */}
                            {selectedPlayerIds.size > 0 && (
                                <div className="flex items-center gap-4 p-4 bg-indigo-600 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                            <Users size={16} className="text-white" />
                                        </div>
                                        <span className="text-white font-black text-xs uppercase tracking-widest">{selectedPlayerIds.size} kullanıcı seçildi</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button onClick={handleBulkBan} disabled={bulkActionLoading}
                                            className="px-4 py-2 rounded-xl bg-red-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 active:scale-95">
                                            Toplu Ban
                                        </button>
                                        <button onClick={handleBulkUnban} disabled={bulkActionLoading}
                                            className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 active:scale-95">
                                            Ban Kaldır
                                        </button>
                                        <button onClick={() => handleBulkAddBtc(0.001)} disabled={bulkActionLoading}
                                            className="px-4 py-2 rounded-xl bg-orange-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95">
                                            +0.001 BTC
                                        </button>
                                        <button onClick={() => handleBulkAddTp(100)} disabled={bulkActionLoading}
                                            className="px-4 py-2 rounded-xl bg-purple-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-purple-600 transition-all disabled:opacity-50 active:scale-95">
                                            +100 TP
                                        </button>
                                        <button onClick={() => setSelectedPlayerIds(new Set())}
                                            className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all">
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-12 gap-8">
                                <div className="col-span-12 lg:col-span-8 space-y-4">
                                    <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-zinc-50/50 border-b border-zinc-100 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                    <th className="p-4 pl-6">
                                                        <input type="checkbox"
                                                            checked={selectedPlayerIds.size > 0 && players.filter(p => {
                                                                const matchesSearch = !searchTerm || (p.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.id || '').includes(searchTerm);
                                                                if (!matchesSearch) return false;
                                                                if (playerFilterStatus === 'active') return !p.isBanned;
                                                                if (playerFilterStatus === 'banned') return p.isBanned;
                                                                if (playerFilterStatus === 'vip') return p.vip?.isActive;
                                                                if (playerFilterStatus === 'admin') return p.isAdmin;
                                                                if (activeTab === 'players_active') return !p.isBanned;
                                                                if (activeTab === 'players_banned') return p.isBanned;
                                                                if (activeTab === 'players_kyc_pending') return p.riskScore > 50;
                                                                return true;
                                                            }).every(p => selectedPlayerIds.has(p.id))}
                                                            onChange={(e) => {
                                                                const filtered = players.filter(p => {
                                                                    const matchesSearch = !searchTerm || (p.username || '').toLowerCase().includes(searchTerm.toLowerCase());
                                                                    if (!matchesSearch) return false;
                                                                    if (playerFilterStatus === 'active') return !p.isBanned;
                                                                    if (playerFilterStatus === 'banned') return p.isBanned;
                                                                    if (playerFilterStatus === 'vip') return p.vip?.isActive;
                                                                    if (playerFilterStatus === 'admin') return p.isAdmin;
                                                                    return true;
                                                                });
                                                                if (e.target.checked) setSelectedPlayerIds(new Set(filtered.map(p => p.id)));
                                                                else setSelectedPlayerIds(new Set());
                                                            }}
                                                            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th className="p-4">Kullanıcı</th>
                                                    <th className="p-4">Bakiye (BTC)</th>
                                                    <th className="p-4">Seviye</th>
                                                    <th className="p-4">İletişim</th>
                                                    <th className="p-4">Durum</th>
                                                    <th className="p-4 text-right">İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-50">
                                                {players.filter(p => {
                                                    const matchesSearch = !searchTerm || (p.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.id || '').includes(searchTerm) || (p.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.phone || '').includes(searchTerm);
                                                    if (!matchesSearch) return false;
                                                    if (playerFilterStatus === 'active') return !p.isBanned;
                                                    if (playerFilterStatus === 'banned') return p.isBanned;
                                                    if (playerFilterStatus === 'vip') return p.vip?.isActive;
                                                    if (playerFilterStatus === 'admin') return p.isAdmin;
                                                    if (activeTab === 'players_active') return !p.isBanned;
                                                    if (activeTab === 'players_banned') return p.isBanned;
                                                    if (activeTab === 'players_email_unverified') return p.email_verified === false;
                                                    if (activeTab === 'players_kyc_pending') return p.riskScore > 50;
                                                    return true;
                                                }).sort((a, b) => {
                                                    if (playerSortBy === 'btcBalance') return (b.btcBalance || 0) - (a.btcBalance || 0);
                                                    if (playerSortBy === 'level') return (b.level || 0) - (a.level || 0);
                                                    return (a.username || '').localeCompare(b.username || '');
                                                }).slice(0, 20).map(player => (
                                                    <tr key={player.id} className={cn("hover:bg-zinc-50/80 transition-colors group", selectedPlayerIds.has(player.id) && "bg-indigo-50/50")}>
                                                        <td className="p-4 pl-6">
                                                            <input type="checkbox"
                                                                checked={selectedPlayerIds.has(player.id)}
                                                                onChange={(e) => {
                                                                    const next = new Set(selectedPlayerIds);
                                                                    if (e.target.checked) next.add(player.id); else next.delete(player.id);
                                                                    setSelectedPlayerIds(next);
                                                                }}
                                                                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border transition-all",
                                                                    player.isBanned ? "bg-red-50 border-red-100 text-red-500" :
                                                                    player.isAdmin ? "bg-indigo-600 border-indigo-600 text-white" :
                                                                    player.vip?.isActive ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                                    "bg-zinc-100 border-zinc-200 text-zinc-500 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600"
                                                                )}>
                                                                    {player.avatarUrl 
                                                                        ? <img src={player.avatarUrl} className="w-full h-full rounded-xl object-cover" alt="avatar"/>
                                                                        : (player.username?.charAt(0) || '?').toUpperCase()
                                                                    }
                                                                </div>
                                                                <div>
                                                                    <p className="text-zinc-800 font-bold text-sm tracking-tight leading-none">{player.username}</p>
                                                                    <p className="text-[8px] text-zinc-400 font-mono mt-0.5 truncate max-w-[100px]">{player.id?.substring(0,12)}...</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-orange-600 font-black text-xs tabular-nums">{(player.btcBalance || 0).toFixed(6)}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-indigo-600 font-black text-xs">LVL {player.level || 1}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-bold text-zinc-500 flex items-center gap-1">
                                                                    <Mail size={8} /> {player.email || '—'}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-zinc-500 flex items-center gap-1">
                                                                    <Smartphone size={8} /> {player.phone || '—'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            {player.isBanned ? (
                                                                <span className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[8px] font-black uppercase border border-red-100">Banlı</span>
                                                            ) : player.isAdmin ? (
                                                                <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase border border-indigo-100">Admin</span>
                                                            ) : player.vip?.isActive ? (
                                                                <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-600 text-[8px] font-black uppercase border border-amber-100">VIP</span>
                                                            ) : (
                                                                <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase border border-emerald-100">Aktif</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button onClick={() => setSelectedPlayer(player)} className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"><Edit3 size={14} /></button>
                                                                <button onClick={() => handleUpdatePlayer(player.id, { isBanned: !player.isBanned })} className={cn("p-2 rounded-xl border transition-all shadow-sm", player.isBanned ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50")}>
                                                                    {player.isBanned ? <Unlock size={14} /> : <Lock size={14} />}
                                                                </button>
                                                                <button onClick={() => handleDeletePlayer(player.id)} className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"><Trash2 size={14} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {players.length === 0 && <div className="p-16 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Veritabanında eşleşen kayıt bulunamadı</div>}
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-4 space-y-6">
                                    <div className="p-8 rounded-[2rem] bg-white border border-zinc-200 shadow-sm space-y-6">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                            <BarChart3 size={18} className="text-indigo-500" /> Kullanıcı Metrikleri
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-center">
                                                <p className="text-2xl font-black text-zinc-900">{players.length}</p>
                                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1">Toplam</p>
                                            </div>
                                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
                                                <p className="text-2xl font-black text-red-600">{players.filter(p => p.isBanned).length}</p>
                                                <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mt-1">Banlı</p>
                                            </div>
                                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                                                <p className="text-2xl font-black text-amber-600">{vipCount}</p>
                                                <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mt-1">VIP</p>
                                            </div>
                                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                                                <p className="text-2xl font-black text-indigo-600">{players.filter(p => p.isAdmin).length}</p>
                                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1">Admin</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4 pt-4 border-t border-zinc-100">
                                            <InsightProgress label="Kapasite Doluluk" value={players.length} max={1000} color="emerald" light />
                                            <InsightProgress label="VIP Dönüşüm" value={vipCount} max={players.length || 1} color="blue" light />
                                        </div>
                                        <button className="w-full h-12 rounded-xl bg-zinc-900 text-white font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 active:scale-95">
                                            Dışa Aktar <ArrowRight size={12} />
                                        </button>
                                    </div>

                                    {/* Live Activity Feed */}
                                    <div className="p-6 rounded-[2rem] bg-[#161c2d] border border-white/5 shadow-sm space-y-4 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                Canlı Akış
                                            </h3>
                                            <span className="text-[8px] font-black text-zinc-500 uppercase">Gerçek Zamanlı</span>
                                        </div>
                                        <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                                            {liveActivityFeed.length === 0 && (
                                                <p className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest text-center py-4">Aktivite bekleniyor...</p>
                                            )}
                                            {liveActivityFeed.map(act => (
                                                <div key={act.id} className="flex items-start gap-2 animate-in slide-in-from-top-1 duration-300">
                                                    <span className="w-1 h-1 rounded-full bg-zinc-600 mt-2 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("text-[9px] font-bold truncate", act.color)}>{act.msg}</p>
                                                        <p className="text-[8px] text-zinc-600 font-mono">{act.time.toLocaleTimeString('tr-TR')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedPlayer && currentPlayer && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/60 backdrop-blur-md p-6 overflow-y-auto no-scrollbar">
                                    <div className="w-full max-w-4xl bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                                        <div className="p-8 border-b border-zinc-100 bg-gradient-to-br from-zinc-50 to-white">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-5">
                                                    {/* Enhanced Avatar */}
                                                    <div className="relative shrink-0">
                                                        <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl",
                                                            currentPlayer.isAdmin ? "bg-indigo-600" : currentPlayer.vip?.isActive ? "bg-amber-500" : currentPlayer.isBanned ? "bg-red-500" : "bg-zinc-700"
                                                        )}>
                                                            {currentPlayer.avatarUrl
                                                                ? <img src={currentPlayer.avatarUrl} className="w-full h-full rounded-2xl object-cover" alt="avatar"/>
                                                                : (currentPlayer.username?.charAt(0) || '?').toUpperCase()
                                                            }
                                                        </div>
                                                        <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white",
                                                            currentPlayer.isBanned ? "bg-red-500" : "bg-emerald-500"
                                                        )}/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{currentPlayer.username}</h3>
                                                            {currentPlayer.isAdmin && <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase rounded-lg border border-indigo-200">Admin</span>}
                                                            {currentPlayer.vip?.isActive && <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded-lg border border-amber-200">VIP</span>}
                                                            {currentPlayer.isBanned && <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-[8px] font-black uppercase rounded-lg border border-red-200">Banlı</span>}
                                                        </div>
                                                        <p className="text-zinc-400 font-mono text-[9px] mt-1">{currentPlayer.id}</p>
                                                        {/* Quick stats row */}
                                                        <div className="flex items-center gap-5 mt-3 flex-wrap">
                                                            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                                                                <Calendar size={10} className="text-zinc-400"/>
                                                                Kayıt: {currentPlayer.created_at ? new Date(currentPlayer.created_at).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                                                                <Activity size={10} className="text-zinc-400"/>
                                                                Son Giriş: {currentPlayer.last_sign_in_at ? new Date(currentPlayer.last_sign_in_at).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
                                                                <Globe size={10} className="text-zinc-400"/>
                                                                {currentPlayer.lastIp || '—'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                                                                <Mail size={10} className="text-zinc-400"/>
                                                                {currentPlayer.email || '—'}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                                                                <Smartphone size={10} className="text-zinc-400"/>
                                                                {currentPlayer.phone || '—'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => setSelectedPlayer(null)} className="p-3 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-600 transition-all active:scale-95 shrink-0"><X size={18} /></button>
                                            </div>

                                            {/* Quick stat pills */}
                                            <div className="grid grid-cols-4 gap-3 mt-6">
                                                {[
                                                    { label: 'BTC', value: (currentPlayer.btcBalance||0).toFixed(6), color: 'bg-orange-50 text-orange-700 border-orange-100' },
                                                    { label: 'TP', value: (currentPlayer.tycoonPoints||0).toLocaleString(), color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                                                    { label: 'Seviye', value: `LVL ${currentPlayer.level||1}`, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                                                    { label: 'XP', value: (currentPlayer.xp||0).toLocaleString(), color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                                                ].map(s => (
                                                    <div key={s.label} className={cn("p-3 rounded-xl border text-center", s.color)}>
                                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">{s.label}</p>
                                                        <p className="font-black text-sm tabular-nums">{s.value}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-3 mt-6">
                                                {['profile', 'miners', 'transactions'].map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setModalTab(t as any)}
                                                        className={cn(
                                                            "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                                                            modalTab === t
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                                                                : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300 hover:text-zinc-600"
                                                        )}
                                                    >
                                                        {t === 'profile' ? 'Profil Düzenle' : t === 'miners' ? 'Ekipmanlar' : 'İşlem Geçmişi'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-8">
                                            {modalTab === 'profile' && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                    {/* IP History */}
                                                    {(currentPlayer.ipHistory || currentPlayer.lastIp) && (
                                                        <div className="p-5 bg-zinc-50 border border-zinc-100 rounded-2xl">
                                                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Globe size={10}/> IP Geçmişi</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(currentPlayer.ipHistory || [currentPlayer.lastIp]).filter(Boolean).map((ip: string, i: number) => (
                                                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg">
                                                                        <span className="font-mono text-[9px] text-zinc-700 font-bold">{ip}</span>
                                                                        <button onClick={() => { const updated = [...ipBlacklist, ip]; setIpBlacklist(updated); handleUpdateSettings({ ipBlacklist: updated }); notify({ type: 'warning', title: 'IP Engellendi', message: `${ip} kara listeye eklendi.` }); }}
                                                                            className="text-[8px] font-black text-red-400 hover:text-red-600 uppercase tracking-wide">Ban</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <InputGroup label="BTC Cüzdan Bakiyesi" value={currentPlayer.btcBalance?.toString()} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { btcBalance: parseFloat(v) })} icon={<Bitcoin className="text-orange-500" size={18} />} placeholder="0.0" light />
                                                        <InputGroup label="Tycoon Puanı (TP)" value={currentPlayer.tycoonPoints?.toString()} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { tycoonPoints: parseInt(v) })} icon={<Database className="text-indigo-500" size={18} />} placeholder="0" light />
                                                        <InputGroup label="E-posta Adresi" value={currentPlayer.email || ''} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { email: v })} icon={<Mail className="text-pink-500" size={18} />} placeholder="email@example.com" light />
                                                        <InputGroup label="Telefon Numarası" value={currentPlayer.phone || ''} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { phone: v })} icon={<Smartphone className="text-emerald-500" size={18} />} placeholder="+90 ..." light />
                                                        <InputGroup label="Mevcut Seviye" value={currentPlayer.level?.toString()} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { level: parseInt(v) })} icon={<TrendingUp className="text-blue-500" size={18} />} placeholder="1" light />
                                                        <InputGroup label="Deneyim (XP)" value={currentPlayer.xp?.toString()} onChange={(v) => handleUpdatePlayer(currentPlayer.id, { xp: parseInt(v) })} icon={<Zap className="text-amber-500" size={18} />} placeholder="0" light />
                                                    </div>
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

                    {activeTab === 'players_notification' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Compose Form */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="p-8 bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm space-y-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                                <Send size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-zinc-800 font-black text-sm uppercase tracking-tight">Bildirim Oluştur</h3>
                                                <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">Hedef kitleye anlık push bildirimi gönder</p>
                                            </div>
                                        </div>

                                        {/* Notification Type */}
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Bildirim Tipi</p>
                                            <div className="flex gap-3">
                                                {(['info', 'success', 'warning'] as const).map(t => (
                                                    <button key={t} onClick={() => setNotifType(t)}
                                                        className={cn("px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all",
                                                            notifType === t
                                                                ? t === 'info' ? "bg-blue-600 border-blue-600 text-white" : t === 'success' ? "bg-emerald-600 border-emerald-600 text-white" : "bg-amber-500 border-amber-500 text-white"
                                                                : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                                                        )}>
                                                        {t === 'info' ? 'Bilgi' : t === 'success' ? 'Başarı' : 'Uyarı'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Target Audience */}
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Hedef Kitle</p>
                                            <div className="flex gap-3 flex-wrap">
                                                {(['all', 'vip', 'single'] as const).map(t => (
                                                    <button key={t} onClick={() => setNotifTarget(t)}
                                                        className={cn("px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all",
                                                            notifTarget === t ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                                                        )}>
                                                        {t === 'all' ? `Tüm Kullanıcılar (${players.length})` : t === 'vip' ? `VIP Üyeler (${vipCount})` : 'Tek Kullanıcı'}
                                                    </button>
                                                ))}
                                            </div>
                                            {notifTarget === 'single' && (
                                                <input
                                                    type="text"
                                                    placeholder="Kullanıcı adı veya UID girin..."
                                                    value={notifTargetUid}
                                                    onChange={(e) => setNotifTargetUid(e.target.value)}
                                                    className="mt-3 w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-5 text-sm font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 transition-all"
                                                />
                                            )}
                                        </div>

                                        {/* Title */}
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Başlık</p>
                                            <input
                                                type="text"
                                                placeholder="Bildirim başlığı..."
                                                value={notifTitle}
                                                onChange={(e) => setNotifTitle(e.target.value)}
                                                className="w-full h-13 bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-3 text-sm font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 transition-all"
                                            />
                                        </div>

                                        {/* Body */}
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Mesaj İçeriği</p>
                                            <textarea
                                                placeholder="Bildirim mesajını buraya yazın..."
                                                value={notifBody}
                                                onChange={(e) => setNotifBody(e.target.value)}
                                                rows={4}
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-4 text-sm font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 transition-all resize-none leading-relaxed"
                                            />
                                        </div>

                                        {/* Preview */}
                                        {(notifTitle || notifBody) && (
                                            <div className={cn("p-5 rounded-2xl border-l-4 animate-in fade-in duration-300",
                                                notifType === 'info' ? "bg-blue-50 border-blue-500" :
                                                notifType === 'success' ? "bg-emerald-50 border-emerald-500" :
                                                "bg-amber-50 border-amber-500"
                                            )}>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Önizleme</p>
                                                <p className="font-black text-zinc-800 text-sm">{notifTitle || 'Başlık...'}</p>
                                                <p className="text-zinc-600 text-xs mt-1 leading-relaxed">{notifBody || 'Mesaj...'}</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleSendNotification}
                                            disabled={notifSending || !notifTitle || !notifBody}
                                            className="w-full h-14 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        >
                                            {notifSending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                                            {notifSending ? 'Gönderiliyor...' : `${
                                                notifTarget === 'all' ? players.length :
                                                notifTarget === 'vip' ? vipCount : 1
                                            } Kullanıcıya Gönder`}
                                        </button>
                                    </div>
                                </div>

                                {/* Stats & Recent */}
                                <div className="space-y-6">
                                    <div className="p-6 bg-white border border-zinc-200 rounded-[2rem] shadow-sm space-y-5">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest">Kitle İstatistikleri</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center"><Users size={14} className="text-indigo-600" /></div>
                                                    <span className="text-xs font-black text-zinc-700 uppercase tracking-wide">Tüm Kullanıcılar</span>
                                                </div>
                                                <span className="font-black text-indigo-600 tabular-nums">{players.length}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Zap size={14} className="text-amber-600" /></div>
                                                    <span className="text-xs font-black text-zinc-700 uppercase tracking-wide">VIP Üyeler</span>
                                                </div>
                                                <span className="font-black text-amber-600 tabular-nums">{vipCount}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Activity size={14} className="text-emerald-600" /></div>
                                                    <span className="text-xs font-black text-zinc-700 uppercase tracking-wide">Aktif Kullanıcılar</span>
                                                </div>
                                                <span className="font-black text-emerald-600 tabular-nums">{players.filter(p => !p.isBanned).length}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-[#161c2d] border border-white/5 rounded-[2rem] shadow-sm space-y-4">
                                        <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            Son Bildirimler
                                        </h3>
                                        <div className="space-y-3">
                                            {adminLogs.filter(l => l.action === 'send_notification' || l.action === 'broadcast_notification').slice(0, 5).map(log => (
                                                <div key={log.id} className="p-3 bg-white/5 rounded-xl">
                                                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest truncate">{log.details?.title || 'Duyuru'}</p>
                                                    <p className="text-[8px] text-zinc-600 font-mono mt-1">{new Date(log.created_at).toLocaleString()}</p>
                                                </div>
                                            ))}
                                            {adminLogs.filter(l => l.action === 'send_notification' || l.action === 'broadcast_notification').length === 0 && (
                                                <p className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest text-center py-4">Henüz bildirim gönderilmedi</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Discord */}
                                <div className="p-8 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2] border border-[#5865F2]/20"><MessageSquare size={22}/></div>
                                        <div>
                                            <p className="text-zinc-800 font-black text-sm uppercase tracking-tight">Discord Entegrasyonu</p>
                                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Kritik Kanal Bildirimleri</p>
                                        </div>
                                    </div>
                                    <InputGroup label="Discord Webhook URL" value={state.globalSettings.discordWebhookUrl || ''} onChange={(v) => handleUpdateSettings({ discordWebhookUrl: v })} icon={<Link size={16}/>} placeholder="https://discord.com/api/webhooks/..." light/>
                                    <div className="space-y-4 pt-4 border-t border-zinc-100">
                                        {[
                                            { label: 'Giriş Bildirimleri', key: 'discordLoginNotify', desc: 'Kullanıcı oturum açtığında uyar' },
                                            { label: 'Çekim Bildirimleri', key: 'discordWithdrawNotify', desc: 'Yeni çekim talebi geldiğinde uyar' },
                                            { label: 'Ban Bildirimleri', key: 'discordBanNotify', desc: 'Kullanıcı banlandığında uyar' },
                                        ].map(item => (
                                            <div key={item.key} className="flex items-center justify-between py-2">
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">{item.label}</p>
                                                    <p className="text-[9px] text-zinc-400 font-bold">{item.desc}</p>
                                                </div>
                                                <div className="w-10 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center px-1 cursor-pointer" onClick={() => handleUpdateSettings({ [item.key]: !(state.globalSettings as any)[item.key] })}>
                                                    <div className={cn("w-4 h-4 rounded-full transition-all duration-300 shadow-md", (state.globalSettings as any)[item.key] ? "bg-[#5865F2] translate-x-4" : "bg-zinc-300 translate-x-0")}/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => notify({ type: 'success', title: 'Test Sinyali', message: 'Discord webhook test gönderildi.' })}
                                        className="w-full h-12 rounded-xl bg-[#5865F2] text-white font-black text-[9px] uppercase tracking-widest hover:bg-[#4752c4] transition-all active:scale-95 flex items-center justify-center gap-2">
                                        <Zap size={14}/> Test Sinyali Gönder
                                    </button>
                                </div>

                                {/* Custom Webhooks */}
                                <div className="p-8 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-6">
                                    <h3 className="text-zinc-800 font-black text-sm uppercase tracking-tight flex items-center gap-2"><Link size={16} className="text-indigo-500"/> Özel Webhook Uç Noktaları</h3>
                                    <InputGroup label="Genel Webhook URL" value={state.globalSettings.customWebhookUrl || ''} onChange={(v) => handleUpdateSettings({ customWebhookUrl: v })} icon={<Globe size={16}/>} placeholder="https://your-server.com/webhook" light/>
                                    <InputGroup label="Gizli Anahtar (Secret)" value={state.globalSettings.webhookSecret || ''} onChange={(v) => handleUpdateSettings({ webhookSecret: v })} icon={<Key size={16}/>} placeholder="whsec_..." light/>
                                    <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Tetikleyici Olaylar</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['user.created','user.banned','deposit.created','withdrawal.approved','withdrawal.rejected'].map(ev => (
                                                <span key={ev} className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg text-[9px] font-mono text-zinc-600 font-bold">{ev}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-zinc-100 space-y-2">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Son Webhook Logları</p>
                                        {adminLogs.filter(l => l.action?.includes('webhook') || l.action?.includes('notify')).slice(0,4).map(log => (
                                            <div key={log.id} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                                                <span className="text-[9px] font-bold text-zinc-700 uppercase">{log.action}</span>
                                                <span className="text-[8px] font-mono text-zinc-400">{new Date(log.created_at).toLocaleTimeString('tr-TR')}</span>
                                            </div>
                                        ))}
                                        {adminLogs.filter(l => l.action?.includes('webhook')).length === 0 && (
                                            <p className="text-zinc-400 text-[9px] uppercase font-bold tracking-widest text-center py-3">Log bulunamadı</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Otomatik Kural Motoru */}
                            <div className="p-8 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-zinc-800 font-black text-sm uppercase tracking-tight flex items-center gap-2"><Zap size={16} className="text-amber-500"/> Otomatik Kural Motoru</h3>
                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[8px] font-black uppercase border border-amber-100 rounded-lg">{rules.filter(r=>r.enabled).length} Aktif Kural</span>
                                </div>

                                {/* Rule List */}
                                <div className="space-y-3">
                                    {rules.map(rule => (
                                        <div key={rule.id} className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-all",
                                            rule.enabled ? "bg-white border-zinc-200" : "bg-zinc-50/50 border-zinc-100 opacity-60"
                                        )}>
                                            <div className="flex-1">
                                                <p className="text-zinc-800 font-black text-xs uppercase tracking-wide">{rule.name}</p>
                                                <p className="text-[9px] font-mono text-zinc-400 mt-0.5">
                                                    {rule.condition} &gt; <span className="text-indigo-600 font-black">{rule.threshold}</span>
                                                    {' → '}
                                                    <span className={cn("font-black", rule.action === 'auto_hold' ? "text-amber-600" : rule.action === 'flag_review' ? "text-blue-600" : "text-purple-600")}>
                                                        {rule.action === 'auto_hold' ? 'Otomatik Hold' : rule.action === 'flag_review' ? 'İncelemeye Al' : 'Admin Uyarısı'}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-5 rounded-full border flex items-center px-0.5 cursor-pointer transition-colors"
                                                    style={{ background: rule.enabled ? '#10b981' : '#e4e4e7', borderColor: rule.enabled ? '#10b981' : '#d4d4d8' }}
                                                    onClick={() => handleToggleRule(rule.id)}>
                                                    <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300", rule.enabled ? "translate-x-4" : "translate-x-0")}/>
                                                </div>
                                                <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add New Rule */}
                                <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Yeni Kural Ekle</p>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        <input value={newRuleName} onChange={e=>setNewRuleName(e.target.value)} placeholder="Kural Adı"
                                            className="h-10 px-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 col-span-2 lg:col-span-1"/>
                                        <select value={newRuleCondition} onChange={e=>setNewRuleCondition(e.target.value)}
                                            className="h-10 px-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer">
                                            <option value="withdrawal_amount_gt">Çekim Tutarı &gt;</option>
                                            <option value="same_ip_count_gt">Aynı IP Sayısı &gt;</option>
                                            <option value="balance_spike_gt">Bakiye Artışı &gt;</option>
                                            <option value="login_attempts_gt">Giriş Denemesi &gt;</option>
                                        </select>
                                        <input value={newRuleThreshold} onChange={e=>setNewRuleThreshold(e.target.value)} placeholder="Eşik Değeri" type="number"
                                            className="h-10 px-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300"/>
                                        <select value={newRuleAction} onChange={e=>setNewRuleAction(e.target.value)}
                                            className="h-10 px-3 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer">
                                            <option value="auto_hold">Otomatik Hold</option>
                                            <option value="flag_review">İncelemeye Al</option>
                                            <option value="notify_admin">Admin Uyarısı</option>
                                            <option value="auto_ban">Otomatik Ban</option>
                                        </select>
                                    </div>
                                    <button onClick={handleAddRule} className="h-10 px-6 rounded-xl bg-zinc-900 text-white font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95">
                                        Kuralı Kaydet
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-12 gap-8">
                                <div className="col-span-12 lg:col-span-8 space-y-6">
                                    <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                        <ShieldAlert className="text-red-500" size={18}/> Akıllı Tehdit Tespit Sistemi
                                    </h3>
                                    <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                        <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{players.filter(p => p.riskScore > 0).length} Şüpheli Aktör</span>
                                            <button onClick={() => handleExportJSON(players.filter(p=>p.riskScore>0), 'tehditler')} className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[8px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-1"><Download size={10}/> Dışa Aktar</button>
                                        </div>
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-zinc-100 bg-zinc-50/30 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                    <th className="px-6 py-4">Şüpheli Aktör</th>
                                                    <th className="px-6 py-4">Tespit Vektörü</th>
                                                    <th className="px-6 py-4">IP</th>
                                                    <th className="px-6 py-4 text-right">Müdahale</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-50">
                                                {players.filter(p => p.riskScore > 0).map(player => (
                                                    <tr key={player.id} className="hover:bg-red-50/30 transition-colors group">
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-black text-xs">
                                                                    {(player.username?.charAt(0)||'?').toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <span className="text-zinc-800 font-extrabold text-sm uppercase tracking-tight block">{player.username}</span>
                                                                    <span className="text-[8px] text-zinc-400 font-mono">{player.id.substring(0,8)}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[8px] font-black uppercase border border-red-100">
                                                                {player.riskReason || 'Çoklu Hesap'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-zinc-500 font-mono text-[10px] font-bold">{player.lastIp || '—'}</td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {player.lastIp && (
                                                                    <button onClick={() => handleAddIp.call(null) || setNewIp(player.lastIp)}
                                                                        className="px-3 py-2 rounded-xl bg-zinc-100 text-zinc-600 font-black text-[8px] uppercase hover:bg-zinc-200 transition-all">
                                                                        IP Ban
                                                                    </button>
                                                                )}
                                                                <button onClick={() => handleUpdatePlayer(player.id, { isBanned: true })} className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-black text-[8px] uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95">
                                                                    Hesap Ban
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {players.filter(p => p.riskScore > 0).length === 0 && (
                                                    <tr><td colSpan={4} className="p-16 text-center text-zinc-400 font-bold uppercase text-[10px] tracking-widest italic">Şu anda kritik tehdit tespit edilmedi</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* IP Blacklist Management */}
                                    <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm space-y-5">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Lock size={14} className="text-red-500"/> IP Kara Listesi</h3>
                                            <span className="px-3 py-1 bg-red-50 text-red-600 text-[8px] font-black uppercase border border-red-100 rounded-lg">{ipBlacklist.length} Engelli IP</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <input value={newIp} onChange={e=>setNewIp(e.target.value)} placeholder="192.168.x.x veya CIDR..."
                                                onKeyDown={e => e.key === 'Enter' && handleAddIp()}
                                                className="flex-1 h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold text-zinc-800 focus:outline-none focus:border-red-300 transition-all"/>
                                            <button onClick={handleAddIp} className="h-11 px-5 rounded-xl bg-red-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95">
                                                Ekle
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                            {ipBlacklist.map(ip => (
                                                <div key={ip} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl">
                                                    <span className="font-mono text-[9px] text-red-700 font-bold">{ip}</span>
                                                    <button onClick={() => handleRemoveIp(ip)} className="text-red-400 hover:text-red-700 transition-colors"><X size={11}/></button>
                                                </div>
                                            ))}
                                            {ipBlacklist.length === 0 && <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest text-center py-3">Kara listede IP yok</p>}
                                        </div>
                                        <button onClick={() => { setIpBlacklist([]); handleUpdateSettings({ ipBlacklist: [] }); }}
                                            className="w-full h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                                            Tüm Listeyi Temizle
                                        </button>
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-4 space-y-6">
                                    <div className="p-6 rounded-[2rem] bg-white border border-zinc-200 shadow-sm space-y-6">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-emerald-500"/> Güvenlik Direktifleri
                                        </h3>
                                        <div className="space-y-5">
                                            {[
                                                { label: '2FA Zorunluluğu', key: 'twoFaRequired', desc: 'Tüm kullanıcılar için zorunlu 2FA', color: 'bg-emerald-600', local: true },
                                                { label: 'Anti-Cheat Çekirdeği', key: 'antiCheatEnabled', desc: 'Anormal hash paternlerini durdur', color: 'bg-red-600' },
                                                { label: 'IP Senkronizasyonu', key: 'ipLimitEnabled', desc: 'IP başına maks. 2 benzersiz ID', color: 'bg-indigo-600' },
                                                { label: 'Rate Limiting', key: 'rateLimitEnabled', desc: 'Dakikada maks. 100 istek/kullanıcı', color: 'bg-amber-500' },
                                            ].map(item => (
                                                <div key={item.key} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                                                    <div>
                                                        <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">{item.label}</p>
                                                        <p className="text-[8px] text-zinc-400 font-bold mt-0.5">{item.desc}</p>
                                                    </div>
                                                    <div className="w-10 h-6 rounded-full border flex items-center px-0.5 cursor-pointer transition-all duration-300"
                                                        style={{
                                                            background: (item.local ? twoFaRequired : (state.globalSettings as any)[item.key]) ? item.color.replace('bg-','') === 'emerald-600' ? '#10b981' : item.color.replace('bg-','') === 'red-600' ? '#dc2626' : item.color.replace('bg-','') === 'indigo-600' ? '#4f46e5' : '#f59e0b' : '#e4e4e7',
                                                            borderColor: (item.local ? twoFaRequired : (state.globalSettings as any)[item.key]) ? 'transparent' : '#d4d4d8'
                                                        }}
                                                        onClick={() => {
                                                            if (item.local) { const next = !twoFaRequired; setTwoFaRequired(next); handleUpdateSettings({ twoFaRequired: next }); }
                                                            else handleUpdateSettings({ [item.key]: !(state.globalSettings as any)[item.key] });
                                                        }}>
                                                        <div className={cn("w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300",
                                                            (item.local ? twoFaRequired : (state.globalSettings as any)[item.key]) ? "translate-x-4" : "translate-x-0"
                                                        )}/>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Security Score */}
                                    <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 shadow-xl backdrop-blur-md">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                                <ShieldCheck size={14} className="text-indigo-400"/> Güvenlik Skoru
                                            </h3>
                                            <div className="flex items-baseline gap-1">
                                                <span className={cn("text-2xl font-black tabular-nums tracking-tighter",
                                                    (securityDirectives.filter(d => !!state.globalSettings[d.key as keyof typeof state.globalSettings]).length) >= 4 ? "text-emerald-400" :
                                                    (securityDirectives.filter(d => !!state.globalSettings[d.key as keyof typeof state.globalSettings]).length) >= 2 ? "text-amber-400" : "text-red-400"
                                                )}>
                                                    {securityDirectives.filter(d => !!state.globalSettings[d.key as keyof typeof state.globalSettings]).length}
                                                </span>
                                                <span className="text-zinc-500 font-black text-[10px]">/ 5</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div className={cn("h-full transition-all duration-1000",
                                                (securityDirectives.filter(d => !!state.globalSettings[d.key as keyof typeof state.globalSettings]).length) >= 4 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" :
                                                (securityDirectives.filter(d => !!state.globalSettings[d.key as keyof typeof state.globalSettings]).length) >= 2 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                            )} style={{ width: `${(securityDirectives.filter(d => !!state.globalSettings[d.key as keyof typeof state.globalSettings]).length / 5) * 100}%` }} />
                                        </div>
                                        <p className="text-[9px] text-zinc-500 font-bold uppercase mt-3 tracking-widest text-center">Protocol Integrity: {((securityDirectives.filter(d => !!state.globalSettings[d.key as keyof typeof state.globalSettings]).length / 5) * 100).toFixed(0)}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeTab.startsWith('withdrawals_') || activeTab === 'withdrawals') && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-zinc-800 font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><Banknote className="text-emerald-500" size={20} /> Çekim Talepleri</h3>
                                    <div className="flex gap-3 flex-wrap">
                                        <div className="px-5 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 font-black text-[9px] uppercase tracking-widest">
                                            Bekleyen: {withdrawals.filter(w => w.status === 'pending').length}
                                        </div>
                                        <div className="px-5 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-black text-[9px] uppercase tracking-widest">
                                            Onaylı: {withdrawals.filter(w => w.status === 'approved').length}
                                        </div>
                                        <button onClick={() => handleExportCSV(withdrawals, 'cekimler')} className="h-9 px-4 rounded-xl bg-zinc-900 text-white font-black text-[9px] uppercase hover:bg-indigo-600 transition-all flex items-center gap-2"><Download size={12}/> CSV</button>
                                        <button onClick={() => handleExportJSON(withdrawals, 'cekimler')} className="h-9 px-4 rounded-xl bg-zinc-100 text-zinc-700 font-black text-[9px] uppercase hover:bg-zinc-200 transition-all flex items-center gap-2"><Download size={12}/> JSON</button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-1.5 bg-zinc-100 rounded-2xl w-fit border border-zinc-200">
                                    {(['all', 'pending', 'approved', 'on_hold', 'rejected'] as const).map(f => (
                                        <button key={f} onClick={() => setWithdrawalFilter(f)}
                                            className={cn("px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                withdrawalFilter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                                            )}>
                                            {f === 'all' ? 'Hepsi' : f === 'pending' ? 'Bekliyor' : f === 'approved' ? 'Onaylı' : f === 'on_hold' ? 'Beklemede' : 'İptal'}
                                        </button>
                                    ))}
                                </div>

                                {/* Bulk action bar for withdrawals */}
                                {selectedWithdrawalIds.size > 0 && (
                                    <div className="flex items-center gap-4 p-4 bg-emerald-600 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                        <span className="text-white font-black text-xs uppercase tracking-widest flex-1">{selectedWithdrawalIds.size} çekim seçildi</span>
                                        <button onClick={handleBulkWithdrawalApprove} disabled={bulkActionLoading}
                                            className="px-5 py-2 rounded-xl bg-white text-emerald-700 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-50 transition-all disabled:opacity-50 active:scale-95">
                                            Toplu Onayla
                                        </button>
                                        <button onClick={handleBulkWithdrawalReject} disabled={bulkActionLoading}
                                            className="px-5 py-2 rounded-xl bg-red-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 active:scale-95">
                                            Toplu Reddet
                                        </button>
                                        <button onClick={() => setSelectedWithdrawalIds(new Set())} className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all"><X size={14} /></button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl backdrop-blur-md">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            <th className="p-5 pl-6">
                                                <input type="checkbox"
                                                    checked={selectedWithdrawalIds.size > 0}
                                                    onChange={(e) => {
                                                        const filtered = withdrawals.filter(req => {
                                                            if (withdrawalFilter === 'all') return true;
                                                            return req.status === withdrawalFilter;
                                                        });
                                                        if (e.target.checked) setSelectedWithdrawalIds(new Set(filtered.map(r => r.id)));
                                                        else setSelectedWithdrawalIds(new Set());
                                                    }}
                                                    className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                                                />
                                            </th>
                                            <th className="p-5">Oyuncu</th>
                                            <th className="p-5">Tutar & Tarih</th>
                                            <th className="p-5">Cüzdan Adresi</th>
                                            <th className="p-5">Durum</th>
                                            <th className="p-5 text-right">İşlemler</th>
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
                                                <tr key={req.id} className={cn("hover:bg-zinc-50/50 transition-colors group", selectedWithdrawalIds.has(req.id) && "bg-emerald-50/50")}>
                                                    <td className="p-5 pl-6">
                                                        <input type="checkbox"
                                                            checked={selectedWithdrawalIds.has(req.id)}
                                                            onChange={(e) => {
                                                                const next = new Set(selectedWithdrawalIds);
                                                                if (e.target.checked) next.add(req.id); else next.delete(req.id);
                                                                setSelectedWithdrawalIds(next);
                                                            }}
                                                            className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 font-black text-xs">
                                                                {(req.username?.charAt(0) || '?').toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-zinc-800 font-extrabold text-sm uppercase">{req.username}</span>
                                                                <span className="text-[8px] text-zinc-400 font-mono">{req.userId?.substring(0, 8)}...</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-emerald-600 font-mono font-black text-sm">{req.amount.toFixed(8)} BTC</span>
                                                            <span className="text-[9px] text-zinc-400 font-bold uppercase">{new Date(req.created_at).toLocaleString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-2 group/addr">
                                                            <code className="text-[10px] font-mono text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100 max-w-[120px] truncate">{req.address}</code>
                                                            <button
                                                                onClick={() => navigator.clipboard.writeText(req.address)}
                                                                className="p-2 rounded-lg bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-opacity opacity-0 group-hover/addr:opacity-100"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
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
                                                    <td className="p-5">
                                                        <div className="flex items-center justify-end gap-2 text-white">
                                                            {req.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleWithdrawalStatusChange(req.id, 'approved')}
                                                                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                                                                        title="Onayla"
                                                                    >
                                                                        <CheckCircle2 size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleWithdrawalStatusChange(req.id, 'on_hold')}
                                                                        className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10 transition-all active:scale-95"
                                                                        title="Beklet"
                                                                    >
                                                                        <Clock size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleWithdrawalStatusChange(req.id, 'rejected')}
                                                                        className="p-2.5 rounded-xl bg-zinc-900 hover:bg-red-600 shadow-lg transition-all active:scale-95"
                                                                        title="İptal Et"
                                                                    >
                                                                        <XCircle size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {req.status !== 'pending' && (
                                                                <button
                                                                    onClick={() => handleWithdrawalStatusChange(req.id, 'pending')}
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
                                            <tr><td colSpan={6} className="p-20 text-center text-zinc-400 font-black uppercase text-xs tracking-widest italic">Herhangi bir çekim talebi bulunmuyor</td></tr>
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
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><History className="text-indigo-400" size={20} /> Küresel İşlem Geçmişi</h3>
                            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl backdrop-blur-md">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            <th className="p-5 pl-8">İşlem Tipi</th>
                                            <th className="p-5">Oyuncu</th>
                                            <th className="p-5">Tutar</th>
                                            <th className="p-5">Açıklama</th>
                                            <th className="p-5 pr-8 text-right">Tarih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(allTransactions || []).slice(0, 100).map((tx: any) => (
                                            <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-5 pl-8">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border",
                                                        tx.type === 'deposit' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                            tx.type === 'withdrawal' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                                "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                                    )}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-black text-[10px] uppercase">{tx.username || 'Sistem'}</span>
                                                        <span className="text-[8px] text-zinc-500 font-mono italic">{tx.user_id?.substring(0, 8)}...</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className={cn("font-mono font-black text-xs", tx.amount > 0 ? "text-emerald-400" : "text-red-400")}>
                                                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(8)} BTC
                                                    </span>
                                                </td>
                                                <td className="p-5 text-[9px] text-zinc-500 font-bold uppercase">{tx.description || '—'}</td>
                                                <td className="p-5 pr-8 text-right text-[9px] text-zinc-500 font-mono">{new Date(tx.created_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {allTransactions.length === 0 && (
                                            <tr><td colSpan={5} className="p-20 text-center text-zinc-500 font-black uppercase text-xs tracking-widest italic">Henüz bir işlem bulunmuyor</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-3"><ShoppingBag className="text-emerald-400" size={20} /> Market İlanları (Orders)</h3>
                            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl backdrop-blur-md">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            <th className="p-5 pl-8">Satıcı</th>
                                            <th className="p-5">Öge</th>
                                            <th className="p-5">Fiyat</th>
                                            <th className="p-5">Tarih</th>
                                            <th className="p-5 pr-8 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(orders || []).map((order: any) => (
                                            <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-5 pl-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-black text-[10px] uppercase">{order.seller_username}</span>
                                                        <span className="text-[8px] text-zinc-500 font-mono italic">{order.seller_id?.substring(0, 8)}...</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className="text-white font-black text-xs uppercase italic tracking-tight">{order.item_name}</span>
                                                </td>
                                                <td className="p-5">
                                                    <span className="text-emerald-400 font-mono font-black text-xs">{order.price.toFixed(8)} BTC</span>
                                                </td>
                                                <td className="p-5 text-[9px] text-zinc-500 font-mono">{new Date(order.created_at).toLocaleString()}</td>
                                                <td className="p-5 pr-8 text-right">
                                                    <button
                                                        onClick={() => handleDeleteOrder(order.id)}
                                                        className="px-4 py-2 rounded-xl bg-red-500/10 text-[9px] font-black uppercase text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                                    >
                                                        İlanı Kaldır
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr><td colSpan={5} className="p-20 text-center text-zinc-500 font-black uppercase text-xs tracking-widest italic">Herhangi bir market ilanı bulunmuyor</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab.startsWith('deposits_') && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-3">
                                    <Download className="text-indigo-400" size={20} /> Mevduat İşlemleri
                                </h3>
                                <div className="flex gap-3 flex-wrap">
                                    <div className="px-5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] uppercase tracking-widest">
                                        Onaylı: {allTransactions.filter(t => t.type === 'deposit' && t.status === 'approved').length}
                                    </div>
                                    <div className="px-5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-[9px] uppercase tracking-widest">
                                        Bekleyen: {allTransactions.filter(t => t.type === 'deposit' && t.status === 'pending').length}
                                    </div>
                                    <div className="px-5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-black text-[9px] uppercase tracking-widest">
                                        Reddedilen: {allTransactions.filter(t => t.type === 'deposit' && t.status === 'rejected').length}
                                    </div>
                                    <button onClick={() => handleExportCSV(allTransactions.filter(t=>t.type==='deposit'), 'yatirmalar')} className="h-9 px-4 rounded-xl bg-white/10 text-white font-black text-[9px] uppercase hover:bg-indigo-600 transition-all flex items-center gap-2 border border-white/5"><Download size={12}/> CSV</button>
                                    <button onClick={() => handleExportJSON(allTransactions.filter(t=>t.type==='deposit'), 'yatirmalar')} className="h-9 px-4 rounded-xl bg-white/5 text-zinc-400 font-black text-[9px] uppercase hover:bg-white/10 transition-all flex items-center gap-2 border border-white/5"><Download size={12}/> JSON</button>
                                </div>
                            </div>

                            {/* Search + Filter */}
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="relative group flex-1">
                                    <input type="text" placeholder="Kullanıcı adı veya açıklama ile ara..."
                                        value={depositSearchTerm} onChange={(e) => setDepositSearchTerm(e.target.value)}
                                        className="w-full h-13 bg-white/5 border border-white/5 rounded-2xl px-14 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-white/20 transition-all placeholder:text-zinc-500 shadow-xl backdrop-blur-md"
                                    />
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                </div>
                                <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                                    {(['all','pending','approved','rejected'] as const).map(f => (
                                        <button key={f} onClick={() => setDepositFilter(f)}
                                            className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                depositFilter === f ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" : "text-zinc-500 hover:text-white"
                                            )}>
                                            {f === 'all' ? 'Hepsi' : f === 'pending' ? 'Bekleyen' : f === 'approved' ? 'Onaylı' : 'Reddedilen'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl backdrop-blur-md">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            <th className="p-6">Oyuncu</th>
                                            <th className="p-6">Tutar</th>
                                            <th className="p-6">Durum</th>
                                            <th className="p-6">Açıklama</th>
                                            <th className="p-6 text-right">Tarih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {allTransactions
                                            .filter(tx => tx.type === 'deposit')
                                            .filter(tx => {
                                                if (depositFilter !== 'all' && tx.status !== depositFilter) return false;
                                                if (depositSearchTerm) return (tx.username || '').toLowerCase().includes(depositSearchTerm.toLowerCase()) || (tx.description || '').toLowerCase().includes(depositSearchTerm.toLowerCase());
                                                return true;
                                            })
                                            .map((tx: any) => (
                                                <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs">
                                                                {(tx.username?.charAt(0) || '?').toUpperCase()}
                                                            </div>
                                                            <span className="text-white font-extrabold text-sm uppercase">{tx.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className="text-emerald-400 font-mono font-black text-sm">+{(tx.amount || 0).toFixed(8)} BTC</span>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase border",
                                                            tx.status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                            tx.status === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                            tx.status === 'rejected' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                            "bg-white/5 text-zinc-500 border-white/5"
                                                        )}>
                                                            {tx.status || 'İşlendi'}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-zinc-500 text-xs font-bold uppercase tracking-tight">
                                                        {tx.description || 'Para Yatırma'}
                                                    </td>
                                                    <td className="p-6 text-right text-zinc-500 font-bold text-[9px] uppercase font-mono">
                                                        {new Date(tx.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        {allTransactions.filter(tx => tx.type === 'deposit').length === 0 && (
                                            <tr><td colSpan={5} className="p-20 text-center text-zinc-400 font-black uppercase text-xs tracking-widest italic">Henüz bir mevduat işlemi bulunmuyor</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports_login' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="p-20 bg-white/5 border border-white/5 rounded-[3.5rem] shadow-xl backdrop-blur-md flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 mb-6">
                                    <LogIn size={40} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Giriş Kayıtları</h3>
                                <p className="text-zinc-500 text-sm max-w-sm mt-2 mb-8 uppercase font-bold tracking-widest text-[10px]">Siber güvenlik denetimi için tüm oturum açma işlemleri kayıt altına alınmaktadır.</p>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 w-full max-w-lg text-left backdrop-blur-md">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest mb-4">Son 5 Giriş Denemesi</p>
                                    <div className="space-y-3">
                                        {players.slice(0, 5).map(p => (
                                            <div key={p.id} className="flex items-center justify-between text-[10px] font-bold text-zinc-500 border-b border-white/5 pb-2 last:border-0">
                                                <span className="text-zinc-400">{p.username}</span>
                                                <span className="font-mono text-indigo-400">{p.lastIp || '192.168.1.1'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'reports_notifications' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="p-20 bg-white/5 border border-white/5 rounded-[3.5rem] shadow-xl backdrop-blur-md flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6">
                                    <Bell size={40} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Bildirim Geçmişi</h3>
                                <p className="text-zinc-500 text-sm max-w-sm mt-2 mb-8 uppercase font-bold tracking-widest text-[10px]">Global duyurular ve sistem uyarılarının gönderim raporları yakında burada listelenecek.</p>
                             </div>
                        </div>
                    )}

                    {activeTab === 'info_app' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                 <div className="p-10 bg-white/5 border border-white/5 rounded-[2.5rem] shadow-xl backdrop-blur-md space-y-6">
                                     <h4 className="text-white font-black text-xs uppercase tracking-widest">Uygulama Mimarisi</h4>
                                     <div className="space-y-4">
                                         <StabilityRow label="Frontend Engine" value="React 18 + Vite" color="bg-blue-400" />
                                         <StabilityRow label="Backend Service" value="Supabase (Postgres)" color="bg-emerald-400" />
                                         <StabilityRow label="Realtime Engine" value="WebSockets (Go)" color="bg-indigo-400" />
                                         <StabilityRow label="Styling" value="Tailwind CSS" color="bg-sky-400" />
                                     </div>
                                 </div>
                                 <div className="p-10 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] shadow-xl backdrop-blur-md text-white space-y-6">
                                     <h4 className="text-zinc-500 font-black text-xs uppercase tracking-widest">Build Bilgisi</h4>
                                     <div className="space-y-4 font-mono text-[10px]">
                                         <div className="flex justify-between border-b border-white/5 pb-2">
                                             <span className="text-zinc-600">VERSION</span>
                                             <span className="text-emerald-400">2.4.0-RELEASE</span>
                                         </div>
                                         <div className="flex justify-between border-b border-white/5 pb-2">
                                             <span className="text-zinc-600">BUILD ID</span>
                                             <span>CTM-992-PX8</span>
                                         </div>
                                         <div className="flex justify-between border-b border-white/5 pb-2">
                                             <span className="text-zinc-600">ENVIRONMENT</span>
                                             <span className="text-amber-400">PRODUCTION</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'info_server' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="p-10 bg-white/5 border border-white/5 rounded-[2.5rem] shadow-xl backdrop-blur-md">
                                 <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-3 mb-10"><Database className="text-indigo-400" size={20} /> Sunucu Metrikleri (Canlı)</h3>
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
                                     <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                         <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">CPU Kullanımı</p>
                                         <p className="text-sm font-black text-white">%{liveNetworkData[liveNetworkData.length - 1]?.load || 0}</p>
                                     </div>
                                     <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                         <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">RAM (8GB)</p>
                                         <p className="text-sm font-black text-white">Dynamic allocation</p>
                                     </div>
                                     <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                         <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Uptime</p>
                                         <p className="text-sm font-black text-white">Live service</p>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}
                    {activeTab === 'info_cache' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="p-20 bg-white/5 border border-white/5 rounded-[3.5rem] shadow-xl backdrop-blur-md flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 mb-6">
                                    <RefreshCw size={40} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Önbellek Yönetimi</h3>
                                <p className="text-zinc-500 text-sm max-w-sm mt-2 mb-8 uppercase font-bold tracking-widest text-[10px]">İstemci ve sunucu tarafındaki geçici verileri temizleyerek senkronizasyon sorunlarını giderin.</p>
                                <button className="px-10 py-5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95">TÜM ÖNBELLEĞİ TEMİZLE (PURGE ALL)</button>
                             </div>
                        </div>
                    )}

                    {activeTab === 'info_update' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                             <div className="p-20 bg-white/5 border border-white/5 rounded-[3.5rem] shadow-xl backdrop-blur-md flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6">
                                    <Zap size={40} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Güncelleme Kontrolü</h3>
                                <p className="text-zinc-500 text-sm max-w-sm mt-2 mb-8 uppercase font-bold tracking-widest text-[10px]">Mevcut versiyon (`v2.4.0`) güncel. Yeni bir dağıtım (OTA) bulunmuyor.</p>
                                <div className="flex gap-4">
                                    <button className="px-8 py-4 bg-white/5 text-zinc-500 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-not-allowed border border-white/5">GÜNCELLEME YOK</button>
                                    <button className="px-8 py-4 bg-white/10 border border-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/20 transition-all">MANUEL KONTROL</button>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* ===== MADENCİ EKİPMANLARI ===== */}
                    {activeTab === 'mining_items' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <h3 className="font-black text-sm text-white uppercase tracking-widest flex items-center gap-2"><Zap className="text-amber-400" size={18}/> Madenci Ekipmanları</h3>
                                <button onClick={() => { setEditingMiningItem({}); setMiningItemForm({ name:'', description:'', price:0, hashrate:0, energy:0, tier:1, icon:'⛏️', available:true }); }}
                                    className="h-10 px-5 rounded-xl bg-white/10 text-white font-black text-[9px] uppercase hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2 border border-white/5">
                                    <Zap size={12}/> Yeni Ekipman Ekle
                                </button>
                            </div>

                            {editingMiningItem !== null && (
                                <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] shadow-xl backdrop-blur-md space-y-6 transition-all">
                                    <h4 className="font-black text-xs text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={14}/> {editingMiningItem.id ? 'Ekipmanı Düzenle' : 'Yeni Ekipman'}
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {[
                                            { key: 'name', label: 'İsim', placeholder: 'Örn: RTX 4090' },
                                            { key: 'icon', label: 'İkon (Emoji)', placeholder: '⛏️' },
                                            { key: 'price', label: 'Fiyat (BTC)', placeholder: '0.001', type: 'number' },
                                            { key: 'hashrate', label: 'Hashrate (H/s)', placeholder: '1000', type: 'number' },
                                            { key: 'energy', label: 'Enerji Tüketimi', placeholder: '100', type: 'number' },
                                            { key: 'tier', label: 'Tier (1-5)', placeholder: '1', type: 'number' },
                                            { key: 'daily_reward', label: 'Günlük BTC Ödül', placeholder: '0.00001', type: 'number' },
                                            { key: 'max_owned', label: 'Maks. Sahiplik', placeholder: '10', type: 'number' },
                                        ].map(f => (
                                            <div key={f.key}>
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">{f.label}</p>
                                                <input type={f.type || 'text'} placeholder={f.placeholder}
                                                    value={miningItemForm[f.key] ?? ''}
                                                    onChange={e => setMiningItemForm((prev: any) => ({ ...prev, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                                                    className="w-full h-11 px-4 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-all"/>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" id="item-available" checked={miningItemForm.available !== false}
                                                onChange={e => setMiningItemForm((prev: any) => ({ ...prev, available: e.target.checked }))}
                                                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"/>
                                            <label htmlFor="item-available" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer">Mağazada Listele</label>
                                        </div>
                                        <div className="flex gap-3 ml-auto">
                                            <button onClick={() => { setEditingMiningItem(null); setMiningItemForm({}); }} className="h-11 px-6 rounded-xl bg-white/5 text-zinc-400 font-black text-[10px] uppercase hover:bg-white/10 hover:text-white transition-all border border-white/5">Vazgeç</button>
                                            <button onClick={handleSaveMiningItem} className="h-11 px-8 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20">Ekipmanı Kaydet</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {miningItems.map(item => (
                                    <div key={item.id} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] shadow-xl backdrop-blur-md space-y-4 group hover:bg-white/10 transition-all duration-300">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{item.icon || '⛏️'}</span>
                                                <div>
                                                    <p className="font-black text-zinc-800 text-sm uppercase tracking-tight">{item.name}</p>
                                                    <p className="text-[8px] font-bold text-zinc-400 uppercase">Tier {item.tier || 1}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${item.available !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}>
                                                {item.available !== false ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100">
                                            <div className="text-center p-2 bg-orange-50 rounded-xl"><p className="text-[7px] text-zinc-400 font-black uppercase">Fiyat</p><p className="text-xs font-black text-orange-600">{item.price} BTC</p></div>
                                            <div className="text-center p-2 bg-blue-50 rounded-xl"><p className="text-[7px] text-zinc-400 font-black uppercase">Hashrate</p><p className="text-xs font-black text-blue-600">{item.hashrate} H/s</p></div>
                                            <div className="text-center p-2 bg-amber-50 rounded-xl"><p className="text-[7px] text-zinc-400 font-black uppercase">Enerji</p><p className="text-xs font-black text-amber-600">{item.energy}W</p></div>
                                            <div className="text-center p-2 bg-emerald-50 rounded-xl"><p className="text-[7px] text-zinc-400 font-black uppercase">Günlük BTC</p><p className="text-xs font-black text-emerald-600">{item.daily_reward || 0}</p></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingMiningItem(item); setMiningItemForm({ ...item }); }} className="flex-1 h-8 rounded-xl bg-zinc-100 text-zinc-600 font-black text-[8px] uppercase hover:bg-zinc-200 transition-all flex items-center justify-center gap-1"><Edit3 size={11}/> Düzenle</button>
                                            <button onClick={() => handleDeleteMiningItem(item.id)} className="h-8 px-3 rounded-xl bg-red-50 text-red-500 font-black text-[8px] uppercase hover:bg-red-500 hover:text-white transition-all"><Trash2 size={11}/></button>
                                        </div>
                                    </div>
                                ))}
                                {miningItems.length === 0 && (
                                    <div className="col-span-3 p-16 text-center text-zinc-400 font-bold text-[9px] uppercase tracking-widest">
                                        Henüz ekipman yok. "Yeni Ekipman Ekle" butonu ile başlayın.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ===== MADENCİLİK PLANLARI ===== */}
                    {activeTab === 'mining_plans' && !miningPlanAnalyticsId && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {/* Header */}
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <h3 className="font-black text-sm text-zinc-800 uppercase tracking-widest flex items-center gap-2">
                                    <Route className="text-indigo-500" size={18}/> Madencilik Planları
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14}/>
                                        <input
                                            type="text"
                                            placeholder="Başlık / Para Birimi"
                                            value={miningPlanSearch}
                                            onChange={e => setMiningPlanSearch(e.target.value)}
                                            className="h-10 pl-9 pr-4 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 shadow-sm w-52"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingMiningPlan(null);
                                            setMiningPlanForm({ title: '', currency: 'Bitcoin', price: 0, return_amount: 0, return_type: 'Fixed', hashrate_value: 1, hashrate_unit: 'MH/s', period_value: 1, period_unit: 'Day', maintenance_cost: 0, features: [], description: '', status: 'enabled' });
                                            setShowMiningPlanModal(true);
                                        }}
                                        className="h-10 px-5 rounded-xl bg-indigo-600 text-white font-black text-[9px] uppercase hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                    >
                                        <Zap size={12}/> + Yeni Plan Ekle
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-indigo-600 text-white">
                                            {['Başlık','Para Birimi','Fiyat','Hashrate','Süre','Getiri/Gün','Bakım','Durum','İşlem'].map(h => (
                                                <th key={h} className="px-4 py-4 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {miningPlans
                                            .filter(p => !miningPlanSearch || p.title?.toLowerCase().includes(miningPlanSearch.toLowerCase()) || p.currency?.toLowerCase().includes(miningPlanSearch.toLowerCase()))
                                            .map(plan => (
                                            <tr key={plan.id} className="hover:bg-zinc-50/70 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <p className="font-black text-xs text-zinc-800 uppercase tracking-tight">{plan.title}</p>
                                                </td>
                                                <td className="px-4 py-3 text-xs font-bold text-zinc-600">{plan.currency}</td>
                                                <td className="px-4 py-3 text-xs font-black text-zinc-800">${Number(plan.price || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-xs font-bold text-zinc-600">{plan.hashrate_value} {plan.hashrate_unit}</td>
                                                <td className="px-4 py-3 text-xs font-bold text-zinc-600">{plan.period_value} {plan.period_unit}</td>
                                                <td className="px-4 py-3 text-xs font-bold text-zinc-600">{plan.return_amount} {plan.currency?.slice(0,3).toUpperCase()}</td>
                                                <td className="px-4 py-3 text-xs font-bold text-zinc-600">{plan.maintenance_cost || 0} %</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                                                        plan.status === 'enabled'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                            : 'bg-amber-50 text-amber-600 border-amber-200'
                                                    }`}>
                                                        {plan.status === 'enabled' ? 'Aktif' : 'Pasif'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => { setEditingMiningPlan(plan); setMiningPlanForm({ ...plan, features: plan.features || [] }); setShowMiningPlanModal(true); }}
                                                            className="h-7 px-3 rounded-lg border border-indigo-200 text-indigo-600 font-black text-[8px] uppercase hover:bg-indigo-50 transition-all flex items-center gap-1"
                                                        ><Edit3 size={10}/> Düzenle</button>
                                                        <button
                                                            onClick={() => handleToggleMiningPlan(plan.id, plan.status)}
                                                            className={`h-7 px-3 rounded-lg border font-black text-[8px] uppercase transition-all flex items-center gap-1 ${
                                                                plan.status === 'enabled'
                                                                    ? 'border-red-200 text-red-500 hover:bg-red-50'
                                                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                                            }`}
                                                        >
                                                            {plan.status === 'enabled' ? <><X size={10}/> Kapat</> : <><Eye size={10}/> Aç</>}
                                                        </button>
                                                        <button
                                                            onClick={() => { loadMiningPlanAnalytics(plan.id); }}
                                                            className="h-7 px-3 rounded-lg border border-blue-200 text-blue-600 font-black text-[8px] uppercase hover:bg-blue-50 transition-all flex items-center gap-1"
                                                        ><BarChart3 size={10}/> Analitik</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {miningPlans.length === 0 && (
                                            <tr><td colSpan={9} className="px-6 py-16 text-center text-zinc-400 text-[9px] font-bold uppercase tracking-widest">Henüz plan yok. "Yeni Plan Ekle" ile başlayın.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Add / Edit Modal */}
                            {showMiningPlanModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                                    <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden">
                                        {/* Modal Header */}
                                        <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-100">
                                            <h4 className="font-black text-sm text-zinc-800 uppercase tracking-tight">
                                                {editingMiningPlan?.id ? `Planı Düzenle - ${editingMiningPlan.title}` : 'Plan Ekle'}
                                            </h4>
                                            <button onClick={() => { setShowMiningPlanModal(false); setEditingMiningPlan(null); }} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors"><X size={18}/></button>
                                        </div>
                                        {/* Modal Body */}
                                        <div className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
                                            <div className="grid grid-cols-2 gap-5">
                                                {/* Title */}
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Başlık <span className="text-red-500">*</span></p>
                                                    <input type="text" placeholder="Plan Başlığı Girin"
                                                        value={miningPlanForm.title || ''}
                                                        onChange={e => setMiningPlanForm((p: any) => ({ ...p, title: e.target.value }))}
                                                        className="w-full h-11 px-4 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 bg-white"/>
                                                </div>
                                                {/* Currency */}
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Para Birimi</p>
                                                    <select value={miningPlanForm.currency || 'Bitcoin'}
                                                        onChange={e => setMiningPlanForm((p: any) => ({ ...p, currency: e.target.value }))}
                                                        className="w-full h-11 px-4 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 bg-white">
                                                        {['Bitcoin','Litecoin','Ethereum','Dogecoin','Ripple','Tron','Eddy','USD'].map(c => <option key={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                {/* Price */}
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Fiyat <span className="text-red-500">*</span></p>
                                                    <div className="flex">
                                                        <span className="h-11 px-3 bg-zinc-100 border border-r-0 border-zinc-200 rounded-l-xl flex items-center text-xs font-black text-zinc-500">$</span>
                                                        <input type="number" placeholder="0"
                                                            value={miningPlanForm.price || ''}
                                                            onChange={e => setMiningPlanForm((p: any) => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                                                            className="flex-1 h-11 px-3 border border-zinc-200 rounded-r-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 bg-white"/>
                                                    </div>
                                                </div>
                                                {/* Return Amount Type */}
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Getiri Tipi</p>
                                                    <select value={miningPlanForm.return_type || 'Fixed'}
                                                        onChange={e => setMiningPlanForm((p: any) => ({ ...p, return_type: e.target.value }))}
                                                        className="w-full h-11 px-4 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 bg-white">
                                                        <option>Fixed</option><option>Percentage</option><option>Range</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {/* Return Amount / Day */}
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Günlük Getiri <span className="text-red-500">*</span></p>
                                                <div className="flex">
                                                    <input type="text" placeholder="Günlük Getiri Girin"
                                                        value={miningPlanForm.return_amount || ''}
                                                        onChange={e => setMiningPlanForm((p: any) => ({ ...p, return_amount: e.target.value }))}
                                                        className="flex-1 h-11 px-4 border border-zinc-200 rounded-l-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 bg-white"/>
                                                    <span className="h-11 px-4 bg-zinc-100 border border-l-0 border-zinc-200 rounded-r-xl flex items-center text-xs font-black text-zinc-500">
                                                        {(miningPlanForm.currency || 'BTC').slice(0,3).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Hashrate + Period + Maintenance */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Hashrate <span className="text-red-500">*</span></p>
                                                    <div className="flex">
                                                        <input type="number"
                                                            value={miningPlanForm.hashrate_value || ''}
                                                            onChange={e => setMiningPlanForm((p: any) => ({ ...p, hashrate_value: parseFloat(e.target.value) || 0 }))}
                                                            className="flex-1 h-11 px-3 border border-zinc-200 rounded-l-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 bg-white min-w-0"/>
                                                        <select value={miningPlanForm.hashrate_unit || 'MH/s'}
                                                            onChange={e => setMiningPlanForm((p: any) => ({ ...p, hashrate_unit: e.target.value }))}
                                                            className="h-11 px-2 border border-l-0 border-zinc-200 rounded-r-xl text-[10px] font-black text-zinc-600 bg-zinc-50 focus:outline-none">
                                                            {['MH/s','GH/s','TH/s','KH/s'].map(u => <option key={u}>{u}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Süre <span className="text-red-500">*</span></p>
                                                    <div className="flex">
                                                        <input type="number"
                                                            value={miningPlanForm.period_value || ''}
                                                            onChange={e => setMiningPlanForm((p: any) => ({ ...p, period_value: parseFloat(e.target.value) || 0 }))}
                                                            className="flex-1 h-11 px-3 border border-zinc-200 rounded-l-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 bg-white min-w-0"/>
                                                        <select value={miningPlanForm.period_unit || 'Day'}
                                                            onChange={e => setMiningPlanForm((p: any) => ({ ...p, period_unit: e.target.value }))}
                                                            className="h-11 px-2 border border-l-0 border-zinc-200 rounded-r-xl text-[10px] font-black text-zinc-600 bg-zinc-50 focus:outline-none">
                                                            {['Day','Week','Month','Year'].map(u => <option key={u}>{u}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Bakım Maliyeti <span className="text-red-500">*</span></p>
                                                    <div className="flex">
                                                        <input type="number" step="0.01"
                                                            value={miningPlanForm.maintenance_cost || ''}
                                                            onChange={e => setMiningPlanForm((p: any) => ({ ...p, maintenance_cost: parseFloat(e.target.value) || 0 }))}
                                                            className="flex-1 h-11 px-3 border border-zinc-200 rounded-l-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 bg-white min-w-0"/>
                                                        <span className="h-11 px-3 bg-zinc-100 border border-l-0 border-zinc-200 rounded-r-xl flex items-center text-[10px] font-black text-zinc-500 whitespace-nowrap">% Per Day</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Features */}
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Özellikler</p>
                                                <div className="min-h-[44px] px-3 py-2 border border-zinc-200 rounded-xl bg-white flex flex-wrap gap-2 items-center">
                                                    {(miningPlanForm.features || []).map((f: string, i: number) => (
                                                        <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-lg border border-indigo-100">
                                                            {f}
                                                            <button onClick={() => setMiningPlanForm((p: any) => ({ ...p, features: p.features.filter((_: any, j: number) => j !== i) }))} className="text-indigo-400 hover:text-red-500"><X size={10}/></button>
                                                        </span>
                                                    ))}
                                                    <input
                                                        type="text"
                                                        placeholder="Özellik ekle, Enter'a bas"
                                                        value={miningPlanFeatureInput}
                                                        onChange={e => setMiningPlanFeatureInput(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter' && miningPlanFeatureInput.trim()) {
                                                                setMiningPlanForm((p: any) => ({ ...p, features: [...(p.features||[]), miningPlanFeatureInput.trim()] }));
                                                                setMiningPlanFeatureInput('');
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="flex-1 min-w-[120px] h-8 text-xs font-bold text-zinc-800 focus:outline-none bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                            {/* Description */}
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Açıklama</p>
                                                <textarea rows={3}
                                                    value={miningPlanForm.description || ''}
                                                    onChange={e => setMiningPlanForm((p: any) => ({ ...p, description: e.target.value }))}
                                                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 bg-white resize-none"/>
                                            </div>
                                        </div>
                                        {/* Modal Footer */}
                                        <div className="px-8 py-5 border-t border-zinc-100">
                                            <button onClick={handleSaveMiningPlan}
                                                className="w-full h-12 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20">
                                                Kaydet
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== MADENCİLİK PLANI ANALİTİĞİ ===== */}
                    {activeTab === 'mining_plans' && miningPlanAnalyticsId && (() => {
                        const plan = miningPlans.find(p => p.id === miningPlanAnalyticsId);
                        const orders = miningPlanAnalyticsData?.orders || [];
                        const miners = miningPlanAnalyticsData?.miners || [];
                        const totalRevenue = orders.reduce((a: number, o: any) => a + (o.amount || 0), 0);
                        const activeMiners = miners.filter((m: any) => m.status === 'active').length;
                        const completedMiners = miners.filter((m: any) => m.status === 'completed' || m.status === 'expired').length;
                        const totalReturn = miners.reduce((a: number, m: any) => a + (m.total_return || 0), 0);
                        const totalMaintenance = miners.reduce((a: number, m: any) => a + (m.total_maintenance || 0), 0);

                        // Build chart data (last 7 days)
                        const chartDays = miningPlanAnalyticsRange === '7d' ? 7 : 30;
                        const chartData = Array.from({ length: chartDays }, (_, i) => {
                            const d = new Date(); d.setDate(d.getDate() - (chartDays - 1 - i));
                            const ds = d.toISOString().slice(0,10);
                            const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).replace(/ /g, '-');
                            const dayOrders = orders.filter((o: any) => o.created_at?.slice(0,10) === ds);
                            const dayMiners = miners.filter((m: any) => m.started_at?.slice(0,10) === ds);
                            return {
                                label,
                                revenue: dayOrders.reduce((a: number, o: any) => a + (o.amount || 0), 0),
                                returnAmount: dayMiners.reduce((a: number, m: any) => a + (m.daily_return || plan?.return_amount || 1), 0),
                                maintenance: dayMiners.reduce((a: number, m: any) => a + (m.daily_maintenance || 0), 0),
                            };
                        });

                        const statCards = [
                            { icon: <Route size={22} className="text-white"/>, bg: 'bg-indigo-600', label: 'Toplam Madencilik İzleri', value: miners.length, badge: 'Tümünü Görüntüle' },
                            { icon: <Zap size={22} className="text-white"/>, bg: 'bg-emerald-500', label: 'Aktif Madencilik Yolları', value: activeMiners, badge: 'Tümünü Görüntüle' },
                            { icon: <Route size={22} className="text-white"/>, bg: 'bg-[#1a2744]', label: 'Tamamlanmış Maden Yolları', value: completedMiners, badge: 'Tümünü Görüntüle' },
                            { icon: <ShoppingCart size={22} className="text-white"/>, bg: 'bg-indigo-500', label: 'Toplam Sipariş Tutarı', value: `$${totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 1 })}`, badge: 'Tümünü Görüntüle' },
                            { icon: <TrendingUp size={22} className="text-white"/>, bg: 'bg-amber-500', label: 'Toplam Getiri Tutarı', value: `${totalReturn.toFixed(2)} ${(plan?.currency||'BTC').slice(0,3).toUpperCase()}`, badge: 'Tümünü Görüntüle' },
                            { icon: <RefreshCw size={22} className="text-white"/>, bg: 'bg-blue-500', label: 'Toplam Bakım Maliyeti', value: `${totalMaintenance.toFixed(2)} ${(plan?.currency||'BTC').slice(0,3).toUpperCase()}`, badge: 'Tümünü Görüntüle' },
                        ];

                        return (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                {/* Back button */}
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-sm text-zinc-800 uppercase tracking-widest">
                                        {plan?.title} Analitiği
                                    </h3>
                                    <button
                                        onClick={() => { setMiningPlanAnalyticsId(null); setMiningPlanAnalyticsData(null); }}
                                        className="h-9 px-5 rounded-xl border border-zinc-200 text-zinc-600 font-black text-[9px] uppercase hover:bg-zinc-50 transition-all flex items-center gap-2"
                                    >
                                        <ChevronRight size={12} className="rotate-180"/> Geri
                                    </button>
                                </div>

                                {/* Stat Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {statCards.map((s, i) => (
                                        <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 relative group hover:shadow-md transition-all">
                                            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xl font-black text-zinc-800 tracking-tight truncate">{s.value}</p>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide mt-0.5 leading-tight">{s.label}</p>
                                            </div>
                                            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-zinc-100 text-[7px] font-black text-zinc-400 uppercase tracking-widest border border-zinc-200">{s.badge}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Revenue Chart */}
                                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-black text-xs text-zinc-700 uppercase tracking-widest">Sipariş Miktarı Tarihe Göre</h4>
                                            <select value={miningPlanAnalyticsRange} onChange={e => { setMiningPlanAnalyticsRange(e.target.value as any); loadMiningPlanAnalytics(miningPlanAnalyticsId!); }}
                                                className="h-8 px-3 text-[9px] font-black border border-zinc-200 rounded-xl bg-white text-zinc-600 focus:outline-none">
                                                <option value="7d">Son 7 Gün</option>
                                                <option value="30d">Son 30 Gün</option>
                                            </select>
                                        </div>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                                                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={v => v.slice(0,10)}/>
                                                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }}/>
                                                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, border: '1px solid #e2e8f0' }}/>
                                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#eef2ff" strokeWidth={2} dot={false} name="USD"/>
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Return vs Maintenance Chart */}
                                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-black text-xs text-zinc-700 uppercase tracking-widest">Tarihe Göre İade Tutarı</h4>
                                            <select value={miningPlanAnalyticsRange} onChange={e => { setMiningPlanAnalyticsRange(e.target.value as any); loadMiningPlanAnalytics(miningPlanAnalyticsId!); }}
                                                className="h-8 px-3 text-[9px] font-black border border-zinc-200 rounded-xl bg-white text-zinc-600 focus:outline-none">
                                                <option value="7d">Son 7 Gün</option>
                                                <option value="30d">Son 30 Gün</option>
                                            </select>
                                        </div>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                                                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={v => v.slice(0,10)}/>
                                                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }}/>
                                                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, border: '1px solid #e2e8f0' }}/>
                                                <Legend iconSize={8} wrapperStyle={{ fontSize: 9, fontWeight: 700 }}/>
                                                <Bar dataKey="returnAmount" fill="#10b981" name="Return Amount" radius={[4,4,0,0]}/>
                                                <Bar dataKey="maintenance" fill="#ef4444" name="Maintenance Cost" radius={[4,4,0,0]}/>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    {activeTab === 'flash_offers' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {/* Header */}
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h3 className="font-black text-sm text-zinc-800 uppercase tracking-widest flex items-center gap-2">
                                        <Flame className="text-orange-500" size={18}/> Flaş Teklifler
                                    </h3>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Market ekranındaki flaş teklifler — Mining Plans ile senkronize</p>
                                </div>
                                <button
                                    onClick={() => { setEditingFlashOffer(null); setFlashOfferForm({ ...defaultFlashForm }); setShowFlashOfferModal(true); }}
                                    className="h-10 px-5 rounded-xl bg-orange-500 text-white font-black text-[9px] uppercase hover:bg-orange-600 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-orange-500/20"
                                >
                                    <Flame size={12}/> + Yeni Flaş Teklif
                                </button>
                            </div>

                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {flashOffers.map(offer => {
                                    const linkedPlan = miningPlans.find(p => p.id === offer.linked_plan_id);
                                    return (
                                        <div key={offer.id} className={cn("bg-[#1a1a1a] rounded-3xl p-6 space-y-4 border transition-all", offer.active ? 'border-orange-500/30' : 'border-white/5 opacity-60')}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Flame size={14} className="text-orange-500"/>
                                                        <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Flaş Teklifler</span>
                                                    </div>
                                                    <p className="font-black text-white text-sm uppercase tracking-tight">{offer.title}</p>
                                                    {offer.subtitle && <p className="text-[9px] text-amber-400 font-black uppercase">{offer.subtitle}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-white tabular-nums">{offer.hashrate_value}</p>
                                                    <p className="text-[9px] font-bold text-zinc-400">{offer.hashrate_unit}</p>
                                                    {offer.bonus_hashrate > 0 && <p className="text-[9px] font-black text-amber-400">+{offer.bonus_hashrate} Flaş Bonus</p>}
                                                </div>
                                            </div>
                                            {offer.badge_text && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-500/20 border border-orange-500/40 text-[8px] font-black text-orange-400 uppercase tracking-widest">
                                                    {offer.badge_text}
                                                </span>
                                            )}
                                            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                                <div>
                                                    <p className="text-[8px] text-zinc-500 font-black uppercase">Teklif Fiyatı</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-base font-black text-white">${offer.offer_price}</p>
                                                        <p className="text-[9px] text-zinc-500 line-through">${offer.original_price}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] text-zinc-500 font-black uppercase">Süre Sonu</p>
                                                    <p className="text-[10px] font-black text-zinc-300">{offer.expires_minutes} dk</p>
                                                </div>
                                            </div>
                                            {linkedPlan && (
                                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                                    <Route size={10} className="text-indigo-400"/>
                                                    <p className="text-[9px] font-black text-indigo-400 uppercase">Plan: {linkedPlan.title}</p>
                                                </div>
                                            )}
                                            <div className="flex gap-2 pt-1">
                                                <button onClick={() => { setEditingFlashOffer(offer); setFlashOfferForm({ ...offer }); setShowFlashOfferModal(true); }}
                                                    className="flex-1 h-8 rounded-xl bg-white/5 text-zinc-300 font-black text-[8px] uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-1">
                                                    <Edit3 size={10}/> Düzenle
                                                </button>
                                                <button onClick={() => handleToggleFlashOffer(offer.id, offer.active)}
                                                    className={cn("h-8 px-3 rounded-xl font-black text-[8px] uppercase transition-all", offer.active ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20')}>
                                                    {offer.active ? <X size={11}/> : <Eye size={11}/>}
                                                </button>
                                                <button onClick={() => handleDeleteFlashOffer(offer.id)}
                                                    className="h-8 px-3 rounded-xl bg-red-500/10 text-red-400 font-black text-[8px] uppercase hover:bg-red-500/20 transition-all">
                                                    <Trash2 size={11}/>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {flashOffers.length === 0 && (
                                    <div className="col-span-3 p-16 text-center">
                                        <Flame size={32} className="text-zinc-700 mx-auto mb-3"/>
                                        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Henüz flaş teklif yok</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal */}
                            {showFlashOfferModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                                    <div className="w-full max-w-xl bg-[#111] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
                                        <div className="flex items-center justify-between px-8 py-5 border-b border-white/10">
                                            <h4 className="font-black text-sm text-white uppercase tracking-tight flex items-center gap-2">
                                                <Flame size={16} className="text-orange-500"/>
                                                {editingFlashOffer?.id ? 'Flaş Teklifi Düzenle' : 'Yeni Flaş Teklif'}
                                            </h4>
                                            <button onClick={() => { setShowFlashOfferModal(false); setEditingFlashOffer(null); }} className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 transition-colors"><X size={18}/></button>
                                        </div>
                                        <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Başlık *</p>
                                                    <input type="text" placeholder="Yıldırım Madenci" value={flashOfferForm.title || ''}
                                                        onChange={e => setFlashOfferForm((p: any) => ({ ...p, title: e.target.value }))}
                                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-orange-500/50"/>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Alt Başlık</p>
                                                    <input type="text" placeholder="%50 EKSTRA HIZ AKTİF" value={flashOfferForm.subtitle || ''}
                                                        onChange={e => setFlashOfferForm((p: any) => ({ ...p, subtitle: e.target.value }))}
                                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500/50"/>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Rozet Metni</p>
                                                    <input type="text" placeholder="SINIRLI STOK" value={flashOfferForm.badge_text || ''}
                                                        onChange={e => setFlashOfferForm((p: any) => ({ ...p, badge_text: e.target.value }))}
                                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500/50"/>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Hashrate Değeri</p>
                                                    <div className="flex">
                                                        <input type="number" value={flashOfferForm.hashrate_value || ''} onChange={e => setFlashOfferForm((p: any) => ({ ...p, hashrate_value: parseFloat(e.target.value)||0 }))}
                                                            className="flex-1 h-11 px-3 bg-white/5 border border-white/10 rounded-l-xl text-xs font-bold text-white focus:outline-none min-w-0"/>
                                                        <select value={flashOfferForm.hashrate_unit || 'GH/s'} onChange={e => setFlashOfferForm((p: any) => ({ ...p, hashrate_unit: e.target.value }))}
                                                            className="h-11 px-2 bg-white/5 border border-l-0 border-white/10 rounded-r-xl text-[10px] font-black text-zinc-300 focus:outline-none">
                                                            {['KH/s','MH/s','GH/s','TH/s'].map(u => <option key={u} className="bg-zinc-900">{u}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Bonus Hashrate</p>
                                                    <input type="number" placeholder="1200" value={flashOfferForm.bonus_hashrate || ''} onChange={e => setFlashOfferForm((p: any) => ({ ...p, bonus_hashrate: parseFloat(e.target.value)||0 }))}
                                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500/50"/>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Normal Fiyat ($)</p>
                                                    <input type="number" placeholder="129.99" value={flashOfferForm.original_price || ''} onChange={e => setFlashOfferForm((p: any) => ({ ...p, original_price: parseFloat(e.target.value)||0 }))}
                                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500/50"/>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Teklif Fiyatı ($)</p>
                                                    <input type="number" placeholder="69.99" value={flashOfferForm.offer_price || ''} onChange={e => setFlashOfferForm((p: any) => ({ ...p, offer_price: parseFloat(e.target.value)||0 }))}
                                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500/50"/>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Süre (Dakika)</p>
                                                    <input type="number" placeholder="60" value={flashOfferForm.expires_minutes || ''} onChange={e => setFlashOfferForm((p: any) => ({ ...p, expires_minutes: parseInt(e.target.value)||60 }))}
                                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500/50"/>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Bağlı Mining Plan (Opsiyonel)</p>
                                                    <select value={flashOfferForm.linked_plan_id || ''} onChange={e => setFlashOfferForm((p: any) => ({ ...p, linked_plan_id: e.target.value }))}
                                                        className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500/50">
                                                        <option value="" className="bg-zinc-900">— Plan Seç —</option>
                                                        {miningPlans.map(pl => <option key={pl.id} value={pl.id} className="bg-zinc-900">{pl.title} ({pl.currency})</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-span-2 flex items-center gap-3">
                                                    <input type="checkbox" id="fo-active" checked={flashOfferForm.active !== false}
                                                        onChange={e => setFlashOfferForm((p: any) => ({ ...p, active: e.target.checked }))}
                                                        className="w-4 h-4 accent-orange-500 cursor-pointer"/>
                                                    <label htmlFor="fo-active" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer">Aktif (Market'te Göster)</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-8 py-5 border-t border-white/10">
                                            <button onClick={handleSaveFlashOffer}
                                                className="w-full h-12 rounded-xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-[0.98] shadow-lg">
                                                Kaydet
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== ÜCRETSİZ SEÇENEKLER ===== */}
                    {activeTab === 'free_options' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-sm text-zinc-800 uppercase tracking-widest flex items-center gap-2">
                                        <Gift className="text-emerald-500" size={18}/> Ücretsiz Seçenekler
                                    </h3>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Market ekranındaki ücretsiz seçenekleri yapılandır</p>
                                </div>
                                <button onClick={handleSaveFreeOptions} disabled={freeOptionsSaving}
                                    className="h-10 px-6 rounded-xl bg-emerald-600 text-white font-black text-[9px] uppercase hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                    {freeOptionsSaving ? <RefreshCw size={12} className="animate-spin"/> : <CheckCircle2 size={12}/>}
                                    Kaydet
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Daily Bonus Config */}
                                <div className="bg-white border border-zinc-200 rounded-[2rem] p-7 shadow-sm space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                                <Gift size={18} className="text-emerald-600"/>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-xs text-zinc-800 uppercase tracking-tight">Günlük Bonus</h4>
                                                <p className="text-[8px] text-zinc-400 font-bold uppercase">Reklam izle ve kazan</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-zinc-500 uppercase">{freeOptions.daily_bonus_enabled ? 'Aktif' : 'Pasif'}</span>
                                            <div className="w-10 h-6 rounded-full border flex items-center px-0.5 cursor-pointer transition-all duration-300"
                                                style={{ background: freeOptions.daily_bonus_enabled ? '#10b981' : '#e4e4e7', borderColor: freeOptions.daily_bonus_enabled ? '#10b981' : '#d4d4d8' }}
                                                onClick={() => setFreeOptions((p: any) => ({ ...p, daily_bonus_enabled: !p.daily_bonus_enabled }))}>
                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${freeOptions.daily_bonus_enabled ? 'translate-x-4' : 'translate-x-0'}`}/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2 border-t border-zinc-100">
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Reklam URL (Video/iFrame)</p>
                                            <input type="text" placeholder="https://ads.example.com/video.mp4" value={freeOptions.daily_bonus_ad_url || ''}
                                                onChange={e => setFreeOptions((p: any) => ({ ...p, daily_bonus_ad_url: e.target.value }))}
                                                className="w-full h-10 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-300"/>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Min. İzleme (sn) <span className="text-orange-500">≥20</span></p>
                                                <input type="number" min={20} value={freeOptions.daily_bonus_ad_duration || 20}
                                                    onChange={e => setFreeOptions((p: any) => ({ ...p, daily_bonus_ad_duration: Math.max(20, parseInt(e.target.value)||20) }))}
                                                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-300"/>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Madencilik (+Saat)</p>
                                                <input type="number" min={1} value={freeOptions.daily_bonus_mining_hours || 3}
                                                    onChange={e => setFreeOptions((p: any) => ({ ...p, daily_bonus_mining_hours: parseInt(e.target.value)||3 }))}
                                                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-300"/>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">TP Ödülü</p>
                                                <input type="number" min={0} value={freeOptions.daily_bonus_tp_reward || 50}
                                                    onChange={e => setFreeOptions((p: any) => ({ ...p, daily_bonus_tp_reward: parseInt(e.target.value)||50 }))}
                                                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-300"/>
                                            </div>
                                        </div>
                                        {/* Info Box */}
                                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                            <Info size={14} className="text-amber-500 shrink-0 mt-0.5"/>
                                            <p className="text-[9px] font-bold text-amber-700 leading-relaxed">
                                                Kullanıcı reklamı en az <strong>{freeOptions.daily_bonus_ad_duration}sn</strong> izlediğinde <strong>{freeOptions.daily_bonus_mining_hours} saatlik</strong> madencilik hızı bonusu ve <strong>{freeOptions.daily_bonus_tp_reward} TP</strong> kazanır. Günde 1 kez kullanılabilir.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Free Miner Config */}
                                <div className="bg-white border border-zinc-200 rounded-[2rem] p-7 shadow-sm space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center">
                                                <Zap size={18} className="text-indigo-600"/>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-xs text-zinc-800 uppercase tracking-tight">Ücretsiz Madenci</h4>
                                                <p className="text-[8px] text-zinc-400 font-bold uppercase">Sınırlı süreli hız</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-zinc-500 uppercase">{freeOptions.free_miner_enabled ? 'Aktif' : 'Pasif'}</span>
                                            <div className="w-10 h-6 rounded-full border flex items-center px-0.5 cursor-pointer transition-all duration-300"
                                                style={{ background: freeOptions.free_miner_enabled ? '#6366f1' : '#e4e4e7', borderColor: freeOptions.free_miner_enabled ? '#6366f1' : '#d4d4d8' }}
                                                onClick={() => setFreeOptions((p: any) => ({ ...p, free_miner_enabled: !p.free_miner_enabled }))}>
                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${freeOptions.free_miner_enabled ? 'translate-x-4' : 'translate-x-0'}`}/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2 border-t border-zinc-100">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Günlük Maks ($) <span className="text-red-500">≤0.50</span></p>
                                                <input type="number" step="0.01" max={0.50} value={freeOptions.free_miner_daily_max_usd || 0.50}
                                                    onChange={e => setFreeOptions((p: any) => ({ ...p, free_miner_daily_max_usd: Math.min(0.50, parseFloat(e.target.value)||0.50) }))}
                                                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300"/>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Hashrate</p>
                                                <input type="number" value={freeOptions.free_miner_hashrate || 5}
                                                    onChange={e => setFreeOptions((p: any) => ({ ...p, free_miner_hashrate: parseFloat(e.target.value)||5 }))}
                                                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300"/>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Birim</p>
                                                <select value={freeOptions.free_miner_hashrate_unit || 'GH/s'}
                                                    onChange={e => setFreeOptions((p: any) => ({ ...p, free_miner_hashrate_unit: e.target.value }))}
                                                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300">
                                                    {['KH/s','MH/s','GH/s','TH/s'].map(u => <option key={u}>{u}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                            <Info size={14} className="text-indigo-500 shrink-0 mt-0.5"/>
                                            <p className="text-[9px] font-bold text-indigo-700 leading-relaxed">
                                                Kullanıcılar ücretsiz madenci ile günlük maksimum <strong>${freeOptions.free_miner_daily_max_usd}</strong> değerinde kazanç sağlayabilir. Hashrate: <strong>{freeOptions.free_miner_hashrate} {freeOptions.free_miner_hashrate_unit}</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Ödüllü Reklam Birimi ─────────────────────────────────── */}
                            <div className="bg-white border-2 border-orange-100 rounded-[2rem] p-7 shadow-sm space-y-5">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200">
                                            <Play size={20} className="text-white"/>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xs text-zinc-800 uppercase tracking-tight">Ödüllü Reklam Birimi</h4>
                                            <p className="text-[8px] text-zinc-400 font-bold uppercase">İzle & Kazan — AdRewardModal ödülleri</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase" style={{ color: freeOptions.ad_reward_enabled ? '#f97316' : '#a1a1aa' }}>
                                            {freeOptions.ad_reward_enabled ? 'Aktif' : 'Pasif'}
                                        </span>
                                        <div className="w-10 h-6 rounded-full border flex items-center px-0.5 cursor-pointer transition-all duration-300"
                                            style={{ background: freeOptions.ad_reward_enabled ? '#f97316' : '#e4e4e7', borderColor: freeOptions.ad_reward_enabled ? '#f97316' : '#d4d4d8' }}
                                            onClick={() => setFreeOptions((p: any) => ({ ...p, ad_reward_enabled: !p.ad_reward_enabled }))}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${freeOptions.ad_reward_enabled ? 'translate-x-4' : 'translate-x-0'}`}/>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview pill */}
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Bitcoin size={14} className="text-orange-500 shrink-0"/>
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">PARA ÖDÜLÜ</p>
                                            <p className="text-sm font-black text-orange-600 tabular-nums">{Number(freeOptions.ad_reward_btc || 0).toFixed(10)} BTC</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-orange-100"/>
                                    <div className="flex items-center gap-2 flex-1">
                                        <Database size={14} className="text-amber-500 shrink-0"/>
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">TP ÖDÜLÜ</p>
                                            <p className="text-sm font-black text-amber-600 tabular-nums">+{freeOptions.ad_reward_tp || 0} TP</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-orange-100"/>
                                    <div className="flex items-center gap-2 flex-1">
                                        <Clock size={14} className="text-zinc-400 shrink-0"/>
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">SÜRE</p>
                                            <p className="text-sm font-black text-zinc-700 tabular-nums">{freeOptions.ad_reward_duration || 30}sn</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="pt-2 border-t border-zinc-100 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Bitcoin size={10} className="text-orange-500"/> BTC Ödülü (izleme başına)
                                            </p>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.0000001"
                                                    min={0}
                                                    value={freeOptions.ad_reward_btc || 0}
                                                    onChange={e => setFreeOptions((p: any) => ({ ...p, ad_reward_btc: parseFloat(e.target.value) || 0 }))}
                                                    className="w-full h-10 px-3 pr-12 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black text-zinc-800 focus:outline-none focus:border-orange-300 tabular-nums"
                                                    placeholder="0.000001"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-orange-400">BTC</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Database size={10} className="text-amber-500"/> TP Ödülü (izleme başına)
                                            </p>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={freeOptions.ad_reward_tp || 0}
                                                    onChange={e => setFreeOptions((p: any) => ({ ...p, ad_reward_tp: parseInt(e.target.value) || 0 }))}
                                                    className="w-full h-10 px-3 pr-10 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black text-zinc-800 focus:outline-none focus:border-amber-300 tabular-nums"
                                                    placeholder="50"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-amber-400">TP</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <Clock size={10} className="text-blue-500"/> Min. İzleme Süresi (sn)
                                            </p>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={5}
                                                    value={freeOptions.ad_reward_duration || 30}
                                                    onChange={e => setFreeOptions((p: any) => ({ ...p, ad_reward_duration: Math.max(5, parseInt(e.target.value) || 30) }))}
                                                    className="w-full h-10 px-3 pr-10 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black text-zinc-800 focus:outline-none focus:border-blue-300 tabular-nums"
                                                    placeholder="30"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-400">sn</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                <RefreshCw size={10} className="text-emerald-500"/> Günlük Limit (kullanıcı başına)
                                            </p>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={100}
                                                    value={freeOptions.ad_reward_daily_limit || 10}
                                                    onChange={e => setFreeOptions((p: any) => ({ ...p, ad_reward_daily_limit: Math.max(1, parseInt(e.target.value) || 10) }))}
                                                    className="w-full h-10 px-3 pr-14 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black text-zinc-800 focus:outline-none focus:border-emerald-300 tabular-nums"
                                                    placeholder="10"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-400">/ gün</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info box */}
                                    <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                        <Info size={14} className="text-orange-500 shrink-0 mt-0.5"/>
                                        <p className="text-[9px] font-bold text-orange-700 leading-relaxed">
                                            Kullanıcı <strong>{freeOptions.ad_reward_duration || 30} saniye</strong> reklam izlediğinde{' '}
                                            <strong className="text-orange-600">{Number(freeOptions.ad_reward_btc || 0).toFixed(10)} BTC</strong>{' '}
                                            ve <strong className="text-amber-600">+{freeOptions.ad_reward_tp || 0} TP</strong> kazanır.{' '}
                                            Günde en fazla <strong>{freeOptions.ad_reward_daily_limit || 10}</strong> kez kullanılabilir.{' '}
                                            Bu değerler uygulama açıldığında <code className="bg-orange-100 px-1 rounded">AdRewardModal</code>'a otomatik yansır.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== KONTRAT MERKEZİ ===== */}
                    {activeTab === 'contracts' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h3 className="font-black text-sm text-zinc-800 uppercase tracking-widest flex items-center gap-2">
                                        <Layout className="text-indigo-500" size={18}/> Aktif İşler — Kurumsal Kontrat Merkezi
                                    </h3>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Kullanılabilir fırsatları yönet — Prestij seviyesine göre kilit aç</p>
                                </div>
                                <button onClick={() => { setEditingContract(null); setContractForm({ ...defaultContractForm }); setShowContractModal(true); }}
                                    className="h-10 px-5 rounded-xl bg-indigo-600 text-white font-black text-[9px] uppercase hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                                    <Layout size={12}/> + Yeni Kontrat
                                </button>
                            </div>

                            {/* Contracts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {contracts.map(contract => (
                                    <div key={contract.id} className={cn("bg-white border rounded-[2rem] p-6 shadow-sm space-y-4 transition-all hover:shadow-md", contract.active ? 'border-zinc-200' : 'border-zinc-100 opacity-60')}>
                                        <div className="flex items-start justify-between">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                                                <Briefcase size={20} className="text-indigo-600"/>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-xl text-[7px] font-black uppercase border ${contract.active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}>
                                                {contract.active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-zinc-800 uppercase tracking-tight leading-tight">{contract.title}</h4>
                                            <p className="text-[9px] text-zinc-500 font-bold mt-1 leading-relaxed line-clamp-2">{contract.description}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2.5 bg-orange-50 rounded-xl">
                                                <p className="text-[7px] text-zinc-400 font-black uppercase">Ödül</p>
                                                <p className="text-xs font-black text-orange-600">{contract.reward_amount} {contract.reward_currency}</p>
                                            </div>
                                            <div className="p-2.5 bg-indigo-50 rounded-xl">
                                                <p className="text-[7px] text-zinc-400 font-black uppercase">Prestij Gerek</p>
                                                <p className="text-xs font-black text-indigo-600">Lv. {contract.prestige_required}</p>
                                            </div>
                                            <div className="p-2.5 bg-blue-50 rounded-xl">
                                                <p className="text-[7px] text-zinc-400 font-black uppercase">Süre</p>
                                                <p className="text-xs font-black text-blue-600">{contract.duration_days} Gün</p>
                                            </div>
                                            <div className="p-2.5 bg-zinc-50 rounded-xl">
                                                <p className="text-[7px] text-zinc-400 font-black uppercase">Maks. Katılım</p>
                                                <p className="text-xs font-black text-zinc-700">{contract.max_participants}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingContract(contract); setContractForm({ ...contract }); setShowContractModal(true); }}
                                                className="flex-1 h-8 rounded-xl bg-zinc-100 text-zinc-600 font-black text-[8px] uppercase hover:bg-zinc-200 transition-all flex items-center justify-center gap-1">
                                                <Edit3 size={10}/> Düzenle
                                            </button>
                                            <button onClick={() => handleToggleContract(contract.id, contract.active)}
                                                className={cn("h-8 px-3 rounded-xl font-black text-[8px] uppercase transition-all", contract.active ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')}>
                                                {contract.active ? <X size={11}/> : <Eye size={11}/>}
                                            </button>
                                            <button onClick={() => handleDeleteContract(contract.id)}
                                                className="h-8 px-3 rounded-xl bg-red-50 text-red-500 font-black text-[8px] uppercase hover:bg-red-500 hover:text-white transition-all">
                                                <Trash2 size={11}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {contracts.length === 0 && (
                                    <div className="col-span-3 p-16 rounded-[2rem] bg-white border border-zinc-200 text-center">
                                        <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
                                            <Award size={28} className="text-indigo-300"/>
                                        </div>
                                        <p className="font-black text-zinc-400 text-[9px] uppercase tracking-widest">Kurumsal kontratları tamamlayarak saygınlığını artır. Prestij seviyen yükseldikçe daha yüksek ödüllü işler merkezimize eklenecektir.</p>
                                    </div>
                                )}
                            </div>

                            {/* Contract Modal */}
                            {showContractModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                                    <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden">
                                        <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-100">
                                            <h4 className="font-black text-sm text-zinc-800 uppercase tracking-tight flex items-center gap-2">
                                                <Layout size={16} className="text-indigo-600"/>
                                                {editingContract?.id ? 'Kontratı Düzenle' : 'Yeni Kontrat'}
                                            </h4>
                                            <button onClick={() => { setShowContractModal(false); setEditingContract(null); }} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors"><X size={18}/></button>
                                        </div>
                                        <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Kontrat Başlığı *</p>
                                                <input type="text" placeholder="Örn: Yüksek Performans Madenciliği" value={contractForm.title || ''}
                                                    onChange={e => setContractForm((p: any) => ({ ...p, title: e.target.value }))}
                                                    className="w-full h-11 px-4 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300"/>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Açıklama</p>
                                                <textarea rows={3} placeholder="Kontrat detaylarını girin..." value={contractForm.description || ''}
                                                    onChange={e => setContractForm((p: any) => ({ ...p, description: e.target.value }))}
                                                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 resize-none"/>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Ödül Miktarı</p>
                                                    <input type="number" step="0.0001" value={contractForm.reward_amount || ''}
                                                        onChange={e => setContractForm((p: any) => ({ ...p, reward_amount: parseFloat(e.target.value)||0 }))}
                                                        className="w-full h-11 px-4 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300"/>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Ödül Para Birimi</p>
                                                    <select value={contractForm.reward_currency || 'BTC'}
                                                        onChange={e => setContractForm((p: any) => ({ ...p, reward_currency: e.target.value }))}
                                                        className="w-full h-11 px-4 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300 bg-white">
                                                        {['BTC','LTC','ETH','TP','USD'].map(c => <option key={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Prestij Gereksinimi</p>
                                                    <input type="number" min={1} value={contractForm.prestige_required || 1}
                                                        onChange={e => setContractForm((p: any) => ({ ...p, prestige_required: parseInt(e.target.value)||1 }))}
                                                        className="w-full h-11 px-4 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300"/>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Süre (Gün)</p>
                                                    <input type="number" min={1} value={contractForm.duration_days || 7}
                                                        onChange={e => setContractForm((p: any) => ({ ...p, duration_days: parseInt(e.target.value)||7 }))}
                                                        className="w-full h-11 px-4 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300"/>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Maks. Katılımcı</p>
                                                    <input type="number" min={1} value={contractForm.max_participants || 100}
                                                        onChange={e => setContractForm((p: any) => ({ ...p, max_participants: parseInt(e.target.value)||100 }))}
                                                        className="w-full h-11 px-4 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-300"/>
                                                </div>
                                                <div className="flex items-end pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <input type="checkbox" id="c-active" checked={contractForm.active !== false}
                                                            onChange={e => setContractForm((p: any) => ({ ...p, active: e.target.checked }))}
                                                            className="w-4 h-4 accent-indigo-500 cursor-pointer"/>
                                                        <label htmlFor="c-active" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer">Aktif</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-8 py-5 border-t border-zinc-100">
                                            <button onClick={handleSaveContract}
                                                className="w-full h-12 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20">
                                                Kaydet
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'game_events' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Create Event */}
                                <div className="p-7 bg-white border border-zinc-200 rounded-[2rem] shadow-sm space-y-5">
                                    <h3 className="font-black text-xs text-zinc-800 uppercase tracking-widest flex items-center gap-2"><Flame className="text-orange-500" size={14}/> Yeni Etkinlik Oluştur</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Etkinlik Adı</p>
                                            <input value={newEvent.name} onChange={e => setNewEvent(p => ({ ...p, name: e.target.value }))} placeholder="Örn: 2x Madencilik Haftası"
                                                className="w-full h-10 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800 focus:outline-none focus:border-orange-300"/>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Tür</p>
                                                <select value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}
                                                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer">
                                                    <option value="multiplier">Çarpan Etkinliği</option>
                                                    <option value="discount">İndirim Etkinliği</option>
                                                    <option value="bonus_drop">Bonus Drop</option>
                                                    <option value="vip_special">VIP Özel</option>
                                                </select>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Süre (Saat)</p>
                                                <input type="number" value={newEvent.duration_hours} onChange={e => setNewEvent(p => ({ ...p, duration_hours: parseInt(e.target.value) || 1 }))}
                                                    className="w-full h-10 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800 focus:outline-none"/>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Çarpan Değeri</p>
                                                <input type="number" step="0.1" value={newEvent.multiplier} onChange={e => setNewEvent(p => ({ ...p, multiplier: parseFloat(e.target.value) || 1 }))}
                                                    className="w-full h-10 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-800 focus:outline-none"/>
                                            </div>
                                            <div className="flex items-center gap-2 self-end pb-1">
                                                <input type="checkbox" id="event-active" checked={newEvent.active} onChange={e => setNewEvent(p => ({ ...p, active: e.target.checked }))} className="accent-orange-500"/>
                                                <label htmlFor="event-active" className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Hemen Başlat</label>
                                            </div>
                                        </div>
                                        <button onClick={handleCreateEvent} className="w-full h-11 rounded-xl bg-orange-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <Flame size={14}/> Etkinliği Oluştur
                                        </button>
                                    </div>
                                </div>

                                {/* Active Events */}
                                <div className="p-7 bg-white border border-zinc-200 rounded-[2rem] shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-xs text-zinc-800 uppercase tracking-widest flex items-center gap-2"><Activity className="text-emerald-500" size={14}/> Mevcut Etkinlikler</h3>
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase border border-emerald-100 rounded-lg">{gameEvents.filter(e=>e.active).length} Aktif</span>
                                    </div>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {gameEvents.map(ev => (
                                            <div key={ev.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${ev.active ? 'bg-orange-50 border-orange-100' : 'bg-white border-zinc-100'}`}>
                                                <div className="flex-1">
                                                    <p className="font-black text-zinc-800 text-xs uppercase tracking-tight">{ev.name}</p>
                                                    <p className="text-[8px] text-zinc-400 font-bold mt-0.5">{ev.type} • {ev.multiplier}x • {ev.duration_hours}s</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-5 rounded-full border flex items-center px-0.5 cursor-pointer transition-all duration-300"
                                                        style={{ background: ev.active ? '#f97316' : '#e4e4e7', borderColor: ev.active ? '#f97316' : '#d4d4d8' }}
                                                        onClick={() => handleToggleEvent(ev.id, !ev.active)}>
                                                        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-300 ${ev.active ? 'translate-x-3' : 'translate-x-0'}`}/>
                                                    </div>
                                                    <button onClick={() => { supabase.from('game_events').delete().eq('id', ev.id); setGameEvents(prev => prev.filter(e => e.id !== ev.id)); }}
                                                        className="text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                                                </div>
                                            </div>
                                        ))}
                                        {gameEvents.length === 0 && <p className="text-center text-zinc-400 text-[9px] font-bold uppercase tracking-widest py-8">Henüz etkinlik yok</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== PROMO KODLAR ===== */}
                    {activeTab === 'promo_codes' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Create */}
                                <div className="p-7 bg-white border border-zinc-200 rounded-[2rem] shadow-sm space-y-4">
                                    <h3 className="font-black text-xs text-zinc-800 uppercase tracking-widest flex items-center gap-2"><Gift className="text-purple-500" size={14}/> Yeni Promo Kodu</h3>
                                    {[
                                        { key: 'code', label: 'Kod', placeholder: 'ÖRNEK2025', type: 'text' },
                                        { key: 'reward_btc', label: 'BTC Ödülü', placeholder: '0.0001', type: 'number' },
                                        { key: 'reward_tp', label: 'TP Ödülü', placeholder: '500', type: 'number' },
                                        { key: 'max_uses', label: 'Maks. Kullanım', placeholder: '100', type: 'number' },
                                        { key: 'expires_at', label: 'Son Kullanım Tarihi', placeholder: '', type: 'date' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">{f.label}</p>
                                            <input type={f.type} placeholder={f.placeholder}
                                                value={(newPromo as any)[f.key]}
                                                onChange={e => setNewPromo(p => ({ ...p, [f.key]: f.type === 'number' ? parseFloat(e.target.value)||0 : e.target.value }))}
                                                className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-purple-300"/>
                                        </div>
                                    ))}
                                    <button onClick={handleCreatePromo} className="w-full h-10 rounded-xl bg-purple-600 text-white font-black text-[9px] uppercase hover:bg-purple-700 transition-all active:scale-95">Kodu Oluştur</button>
                                </div>

                                {/* Table */}
                                <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                    <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                                        <span className="font-black text-xs text-zinc-800 uppercase tracking-widest">{promoCodes.length} Promo Kod</span>
                                        <button onClick={() => handleExportCSV(promoCodes, 'promo_kodlar')} className="h-8 px-4 rounded-xl bg-zinc-900 text-white font-black text-[8px] uppercase hover:bg-indigo-600 transition-all flex items-center gap-1"><Download size={10}/> CSV</button>
                                    </div>
                                    <table className="w-full text-left border-collapse">
                                        <thead><tr className="border-b border-zinc-100 bg-zinc-50/50 text-[8px] font-black uppercase tracking-widest text-zinc-400">
                                            <th className="px-5 py-3">Kod</th><th className="px-5 py-3">BTC</th><th className="px-5 py-3">TP</th><th className="px-5 py-3">Kullanım</th><th className="px-5 py-3">Son Tarih</th><th className="px-5 py-3 text-right">Sil</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-zinc-50">
                                            {promoCodes.map(p => (
                                                <tr key={p.id} className="hover:bg-zinc-50/50">
                                                    <td className="px-5 py-4"><span className="font-mono font-black text-sm text-zinc-800 px-2 py-1 bg-zinc-100 rounded-lg">{p.code}</span></td>
                                                    <td className="px-5 py-4 text-orange-600 font-black text-xs">{p.reward_btc} BTC</td>
                                                    <td className="px-5 py-4 text-indigo-600 font-black text-xs">{p.reward_tp} TP</td>
                                                    <td className="px-5 py-4"><span className={`text-xs font-black ${p.used_count >= p.max_uses ? 'text-red-500' : 'text-emerald-600'}`}>{p.used_count || 0}/{p.max_uses}</span></td>
                                                    <td className="px-5 py-4 text-zinc-400 text-[9px] font-mono">{p.expires_at ? new Date(p.expires_at).toLocaleDateString('tr-TR') : '—'}</td>
                                                    <td className="px-5 py-4 text-right"><button onClick={() => handleDeletePromo(p.id)} className="text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={13}/></button></td>
                                                </tr>
                                            ))}
                                            {promoCodes.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-zinc-400 text-[9px] font-bold uppercase">Henüz promo kod yok</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== LIDERLIK TABLOSU ===== */}
                    {activeTab === 'leaderboard' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <h3 className="font-black text-sm text-zinc-800 uppercase tracking-widest flex items-center gap-2"><Award className="text-amber-500" size={18}/> Sıralama Tablosu</h3>
                                <div className="flex p-1 bg-zinc-100 rounded-xl gap-1 border border-zinc-200">
                                    {[{v:'btc',l:'BTC Bakiye'},{v:'tp',l:'Tycoon P.'},{v:'level',l:'Seviye'},{v:'miners',l:'Madenci'}].map(t => (
                                        <button key={t.v} onClick={() => setLeaderboardType(t.v as any)}
                                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${leaderboardType === t.v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>{t.l}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead><tr className="border-b border-zinc-100 bg-zinc-50/50 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                        <th className="px-6 py-4 w-12">#</th><th className="px-6 py-4">Oyuncu</th><th className="px-6 py-4">Seviye</th>
                                        <th className="px-6 py-4">{leaderboardType === 'btc' ? 'BTC Bakiye' : leaderboardType === 'tp' ? 'Tycoon Puanı' : leaderboardType === 'level' ? 'XP' : 'Madenci Sayısı'}</th>
                                        <th className="px-6 py-4">Durum</th><th className="px-6 py-4 text-right">İşlem</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {[...players]
                                            .sort((a,b) => {
                                                if (leaderboardType === 'btc') return (b.btcBalance||0) - (a.btcBalance||0);
                                                if (leaderboardType === 'tp') return (b.tycoonPoints||0) - (a.tycoonPoints||0);
                                                if (leaderboardType === 'level') return (b.xp||0) - (a.xp||0);
                                                return (b.minerCount||0) - (a.minerCount||0);
                                            })
                                            .slice(0, 50)
                                            .map((p, i) => (
                                            <tr key={p.id} className={`hover:bg-zinc-50/50 transition-colors ${i < 3 ? 'bg-amber-50/30' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <span className={`font-black text-sm tabular-nums ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-orange-600' : 'text-zinc-300'}`}>
                                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center font-black text-xs text-zinc-600">
                                                            {(p.username?.charAt(0)||'?').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-zinc-800 text-xs uppercase">{p.username}</p>
                                                            <p className="text-[8px] font-mono text-zinc-400">{p.id?.substring(0,8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase border border-blue-100 rounded-lg">LVL {p.level||1}</span></td>
                                                <td className="px-6 py-4 font-black text-zinc-800 text-sm tabular-nums">
                                                    {leaderboardType === 'btc' ? `${(p.btcBalance||0).toFixed(8)} BTC` :
                                                     leaderboardType === 'tp' ? `${(p.tycoonPoints||0).toLocaleString()} TP` :
                                                     leaderboardType === 'level' ? `${(p.xp||0).toLocaleString()} XP` :
                                                     `${p.minerCount||0} adet`}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${p.vip?.isActive ? 'bg-amber-50 text-amber-600 border-amber-100' : p.isBanned ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                        {p.vip?.isActive ? 'VIP' : p.isBanned ? 'Banlı' : 'Aktif'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => setSelectedPlayer(p)} className="h-8 px-4 rounded-xl bg-zinc-100 text-zinc-600 font-black text-[8px] uppercase hover:bg-indigo-600 hover:text-white transition-all">Profil</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===== VIP YÖNETİMİ ===== */}
                    {activeTab === 'vip_management' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-600"><ShieldCheck size={22}/></div>
                                    <div><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Aktif VIP</p><p className="text-2xl font-black text-amber-600 tabular-nums">{players.filter(p=>p.vip?.isActive).length}</p></div>
                                </div>
                                <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600"><Clock size={22}/></div>
                                    <div><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Bu Ay Sona Eren</p><p className="text-2xl font-black text-zinc-800 tabular-nums">{players.filter(p=>p.vip?.expiresAt && new Date(p.vip.expiresAt) < new Date(Date.now()+30*86400000) && p.vip.isActive).length}</p></div>
                                </div>
                                <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600"><Users size={22}/></div>
                                    <div><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Toplam Kullanıcı</p><p className="text-2xl font-black text-zinc-800 tabular-nums">{players.length}</p></div>
                                </div>
                            </div>

                            <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                                    <span className="font-black text-xs text-zinc-500 uppercase tracking-widest">Tüm Kullanıcılar — VIP Yönetimi</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleExportCSV(players.filter(p=>p.vip?.isActive), 'vip_uyeler')} className="h-8 px-4 rounded-xl bg-zinc-900 text-white font-black text-[8px] uppercase hover:bg-amber-500 transition-all flex items-center gap-1"><Download size={10}/> VIP Listesi</button>
                                    </div>
                                </div>
                                <table className="w-full text-left border-collapse">
                                    <thead><tr className="border-b border-zinc-100 bg-zinc-50/30 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                        <th className="px-6 py-4">Kullanıcı</th><th className="px-6 py-4">VIP Durumu</th><th className="px-6 py-4">Bitiş Tarihi</th><th className="px-6 py-4 text-right">İşlem</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {[...players].sort((a,b) => (b.vip?.isActive ? 1 : 0) - (a.vip?.isActive ? 1 : 0)).slice(0,80).map(p => (
                                            <tr key={p.id} className="hover:bg-amber-50/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white ${p.vip?.isActive ? 'bg-amber-400' : 'bg-zinc-300'}`}>{(p.username?.charAt(0)||'?').toUpperCase()}</div>
                                                        <div><p className="font-black text-zinc-800 text-xs uppercase">{p.username}</p><p className="text-[8px] font-mono text-zinc-400">{p.id?.substring(0,8)}</p></div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border ${p.vip?.isActive ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}>
                                                        {p.vip?.isActive ? '⭐ VIP Aktif' : 'Standart'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400 text-[9px] font-mono">
                                                    {p.vip?.expiresAt ? new Date(p.vip.expiresAt).toLocaleDateString('tr-TR') : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!p.vip?.isActive ? (
                                                            <>
                                                                {[7,30,90].map(d => (
                                                                    <button key={d} onClick={() => handleGrantVip(p.id, d)}
                                                                        className="h-7 px-3 rounded-lg bg-amber-50 text-amber-600 font-black text-[8px] uppercase border border-amber-100 hover:bg-amber-400 hover:text-white transition-all">
                                                                        +{d}g
                                                                    </button>
                                                                ))}
                                                            </>
                                                        ) : (
                                                            <button onClick={() => handleRevokeVip(p.id)} className="h-7 px-4 rounded-lg bg-red-50 text-red-500 font-black text-[8px] uppercase border border-red-100 hover:bg-red-500 hover:text-white transition-all">
                                                                İptal Et
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===== VERİTABANI GEZGİNİ ===== */}
                    {activeTab === 'db_explorer' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="p-6 bg-[#0f172a] border border-white/10 rounded-[2rem] shadow-xl space-y-5">
                                <h3 className="font-black text-xs text-emerald-400 uppercase tracking-widest flex items-center gap-2"><Database size={14}/> Veritabanı Gezgini</h3>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex flex-wrap gap-2">
                                        {DB_TABLES.map(t => (
                                            <button key={t} onClick={() => { setDbTable(t); setDbRows([]); }}
                                                className={`px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold transition-all border ${dbTable === t ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13}/>
                                        <input value={dbQuery} onChange={e => setDbQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDbQuery()}
                                            placeholder="Filtre: alan=değer (örn: status=pending)"
                                            className="w-full h-10 pl-9 pr-4 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-600"/>
                                    </div>
                                    <button onClick={handleDbQuery} disabled={!dbTable || dbLoading}
                                        className="h-10 px-6 rounded-xl bg-emerald-500 text-white font-black text-[9px] uppercase hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-40 flex items-center gap-2">
                                        {dbLoading ? <RefreshCw size={12} className="animate-spin"/> : <Play size={12}/>} Sorgula
                                    </button>
                                    {dbRows.length > 0 && (
                                        <button onClick={() => handleExportJSON(dbRows, dbTable)} className="h-10 px-4 rounded-xl bg-white/10 text-zinc-300 font-black text-[9px] uppercase hover:bg-white/20 transition-all flex items-center gap-2"><Download size={12}/> JSON</button>
                                    )}
                                </div>
                            </div>

                            {dbRows.length > 0 && (
                                <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                    <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                                        <span className="font-mono text-xs text-zinc-500 font-bold">{dbTable} — <span className="text-zinc-800">{dbRows.length} kayıt</span></span>
                                        <button onClick={() => handleExportCSV(dbRows, dbTable)} className="h-8 px-4 rounded-xl bg-zinc-900 text-white font-black text-[8px] uppercase hover:bg-indigo-600 transition-all flex items-center gap-1"><Download size={10}/> CSV</button>
                                    </div>
                                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead className="sticky top-0">
                                                <tr className="border-b border-zinc-100 bg-zinc-50 text-[8px] font-black uppercase tracking-widest text-zinc-400">
                                                    {Object.keys(dbRows[0]).map(k => <th key={k} className="px-4 py-3 whitespace-nowrap">{k}</th>)}
                                                    <th className="px-4 py-3">Sil</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-50">
                                                {dbRows.map((row, i) => (
                                                    <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                                                        {Object.values(row).map((val: any, j) => (
                                                            <td key={j} className="px-4 py-3 font-mono text-zinc-700 whitespace-nowrap max-w-[200px] truncate">
                                                                {typeof val === 'object' ? JSON.stringify(val).substring(0,40) : String(val ?? '—').substring(0,40)}
                                                            </td>
                                                        ))}
                                                        <td className="px-4 py-3">
                                                            <button onClick={() => handleDbDelete(dbTable, row.id)} className="text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {dbTable && dbRows.length === 0 && !dbLoading && (
                                <div className="p-12 text-center text-zinc-400 font-bold text-[9px] uppercase tracking-widest bg-white border border-zinc-200 rounded-2xl">
                                    Tablo seçili: <span className="text-zinc-700 font-mono">{dbTable}</span> — Sorgulamak için butona tıkla
                                </div>
                            )}
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

                    {/* ===== SİSTEM AYARLARI ===== */}
                    {activeTab === 'settings' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                            {/* Genel Sistem Durumu */}
                            <div className="p-7 bg-white border border-zinc-200 rounded-[2rem] shadow-sm space-y-5">
                                <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                    <SettingsIcon size={14} className="text-indigo-500"/> Genel Sistem Durumu
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Bakım Modu */}
                                    <button
                                        onClick={() => handleUpdateSettings({ isMaintenance: !state.globalSettings.isMaintenance })}
                                        className={cn("w-full h-20 rounded-2xl border-2 flex items-center gap-5 px-6 transition-all group",
                                            state.globalSettings.isMaintenance ? "bg-red-50 border-red-200" : "bg-white border-zinc-100 hover:bg-zinc-50"
                                        )}>
                                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                            state.globalSettings.isMaintenance ? "bg-red-500 text-white" : "bg-zinc-100 text-zinc-400"
                                        )}>
                                            {state.globalSettings.isMaintenance ? <Lock size={18}/> : <Unlock size={18}/>}
                                        </div>
                                        <div className="text-left">
                                            <p className={cn("text-sm font-black uppercase tracking-tight", state.globalSettings.isMaintenance ? "text-red-600" : "text-zinc-800")}>
                                                {state.globalSettings.isMaintenance ? 'Bakım Modu AKTİF' : 'Sistem Çalışıyor'}
                                            </p>
                                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                                                {state.globalSettings.isMaintenance ? 'Kullanıcılar giriş yapamıyor' : 'Tıkla bakım moduna al'}
                                            </p>
                                        </div>
                                        <div className={cn("ml-auto w-10 h-6 rounded-full border flex items-center px-0.5 transition-all duration-300",
                                            state.globalSettings.isMaintenance ? "bg-red-500 border-red-500" : "bg-zinc-100 border-zinc-200"
                                        )}>
                                            <div className={cn("w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300",
                                                state.globalSettings.isMaintenance ? "translate-x-4" : "translate-x-0"
                                            )}/>
                                        </div>
                                    </button>

                                    {/* VIP Etkinlik */}
                                    <button
                                        onClick={() => handleUpdateSettings({ isVipEvent: !state.globalSettings.isVipEvent })}
                                        className={cn("w-full h-20 rounded-2xl border-2 flex items-center gap-5 px-6 transition-all group",
                                            state.globalSettings.isVipEvent ? "bg-amber-50 border-amber-200" : "bg-white border-zinc-100 hover:bg-zinc-50"
                                        )}>
                                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                            state.globalSettings.isVipEvent ? "bg-amber-400 text-white" : "bg-zinc-100 text-zinc-400"
                                        )}>
                                            <Flame size={18}/>
                                        </div>
                                        <div className="text-left">
                                            <p className={cn("text-sm font-black uppercase tracking-tight", state.globalSettings.isVipEvent ? "text-amber-600" : "text-zinc-800")}>
                                                VIP Etkinliği {state.globalSettings.isVipEvent ? 'AKTİF' : 'Kapalı'}
                                            </p>
                                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">VIP üyeler için özel ödüller</p>
                                        </div>
                                        <div className={cn("ml-auto w-10 h-6 rounded-full border flex items-center px-0.5 transition-all duration-300",
                                            state.globalSettings.isVipEvent ? "bg-amber-400 border-amber-400" : "bg-zinc-100 border-zinc-200"
                                        )}>
                                            <div className={cn("w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300",
                                                state.globalSettings.isVipEvent ? "translate-x-4" : "translate-x-0"
                                            )}/>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Madencilik & Çarpanlar */}
                                <div className="p-7 bg-white border border-zinc-200 rounded-[2rem] shadow-sm space-y-6">
                                    <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={14} className="text-amber-500"/> Madencilik & Çarpanlar
                                    </h3>

                                    {/* Event Multiplier */}
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Etkinlik Çarpanı (Şu An: <span className="text-indigo-600">{state.globalSettings.eventMultiplier || 1.0}x</span>)</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[1.0, 1.5, 2.0, 3.0].map(m => (
                                                <button key={m} onClick={() => handleUpdateSettings({ eventMultiplier: m })}
                                                    className={cn("h-12 rounded-xl font-black text-xs transition-all border-2",
                                                        state.globalSettings.eventMultiplier === m
                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                                            : "bg-white border-zinc-100 text-zinc-400 hover:text-zinc-600 hover:border-zinc-200"
                                                    )}>{m}x</button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mining Difficulty */}
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Madencilik Zorluğu</p>
                                        <div className="flex items-center gap-3">
                                            <input type="range" min={1} max={100}
                                                value={state.globalSettings.miningDifficulty || 50}
                                                onChange={e => handleUpdateSettings({ miningDifficulty: parseInt(e.target.value) })}
                                                className="flex-1 accent-indigo-600"/>
                                            <span className="w-12 text-center font-black text-sm text-zinc-800 tabular-nums bg-zinc-50 border border-zinc-200 rounded-xl py-1">
                                                {state.globalSettings.miningDifficulty || 50}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Market Discount */}
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Market İndirimi (%)</p>
                                        <div className="flex items-center gap-3">
                                            <input type="range" min={0} max={80}
                                                value={state.globalSettings.marketDiscount || 0}
                                                onChange={e => handleUpdateSettings({ marketDiscount: parseInt(e.target.value) })}
                                                className="flex-1 accent-emerald-500"/>
                                            <span className="w-12 text-center font-black text-sm text-zinc-800 tabular-nums bg-zinc-50 border border-zinc-200 rounded-xl py-1">
                                                %{state.globalSettings.marketDiscount || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bot Settings */}
                                    <div className="pt-4 border-t border-zinc-100 space-y-4">
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Bot Ayarları</p>
                                        <InputGroup
                                            label={`Bot Sayısı (${state.globalSettings.botCount || 0} / 500)`}
                                            value={(state.globalSettings.botCount || 0).toString()}
                                            onChange={v => handleUpdateSettings({ botCount: parseInt(v) || 0 })}
                                            icon={<Cpu size={16}/>}
                                            placeholder="0"
                                            light
                                        />
                                        <InputGroup
                                            label="Bot Satın Alma Limiti"
                                            value={(state.globalSettings.botBuyLimit || 0).toString()}
                                            onChange={v => handleUpdateSettings({ botBuyLimit: parseInt(v) || 0 })}
                                            icon={<ShoppingCart size={16}/>}
                                            placeholder="10"
                                            light
                                        />
                                        <div className="flex items-center justify-between py-2">
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Otomatik Bot Listeleme</p>
                                                <p className="text-[9px] text-zinc-400 font-bold mt-0.5">Botlar otomatik piyasaya çıksın</p>
                                            </div>
                                            <div className="w-10 h-6 rounded-full border flex items-center px-0.5 cursor-pointer transition-all duration-300"
                                                style={{ background: state.globalSettings.autoBotListing ? '#6366f1' : '#e4e4e7', borderColor: state.globalSettings.autoBotListing ? '#6366f1' : '#d4d4d8' }}
                                                onClick={() => handleUpdateSettings({ autoBotListing: !state.globalSettings.autoBotListing })}>
                                                <div className={cn("w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300", state.globalSettings.autoBotListing ? "translate-x-4" : "translate-x-0")}/>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Akıllı Bot Fiyatlandırma</p>
                                                <p className="text-[9px] text-zinc-400 font-bold mt-0.5">Arz/talebe göre fiyat ayarla</p>
                                            </div>
                                            <div className="w-10 h-6 rounded-full border flex items-center px-0.5 cursor-pointer transition-all duration-300"
                                                style={{ background: state.globalSettings.smartBotPricing ? '#6366f1' : '#e4e4e7', borderColor: state.globalSettings.smartBotPricing ? '#6366f1' : '#d4d4d8' }}
                                                onClick={() => handleUpdateSettings({ smartBotPricing: !state.globalSettings.smartBotPricing })}>
                                                <div className={cn("w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300", state.globalSettings.smartBotPricing ? "translate-x-4" : "translate-x-0")}/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Referral & Quest */}
                                <div className="space-y-6">
                                    <div className="p-7 bg-white border border-zinc-200 rounded-[2rem] shadow-sm space-y-5">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                            <Gift size={14} className="text-purple-500"/> Referans Sistemi
                                        </h3>
                                        <InputGroup
                                            label="BTC Ödülü (referral başına)"
                                            value={(state.globalSettings.referralBtcReward || 0.0001).toString()}
                                            onChange={v => handleUpdateSettings({ referralBtcReward: parseFloat(v) || 0 })}
                                            icon={<Bitcoin size={16} className="text-orange-500"/>}
                                            placeholder="0.0001"
                                            light
                                        />
                                        <InputGroup
                                            label="TP Ödülü (referral başına)"
                                            value={(state.globalSettings.referralTpReward || 50).toString()}
                                            onChange={v => handleUpdateSettings({ referralTpReward: parseInt(v) || 0 })}
                                            icon={<Database size={16} className="text-indigo-500"/>}
                                            placeholder="50"
                                            light
                                        />
                                        <div className="flex items-center justify-between py-2 border-t border-zinc-100 mt-2">
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Seviye Kısıtlaması</p>
                                                <p className="text-[9px] text-zinc-400 font-bold mt-0.5">Min. seviye şartı uygula</p>
                                            </div>
                                            <div className="w-10 h-6 rounded-full border flex items-center px-0.5 cursor-pointer transition-all duration-300"
                                                style={{ background: state.globalSettings.referralLevelGate ? '#6366f1' : '#e4e4e7', borderColor: state.globalSettings.referralLevelGate ? '#6366f1' : '#d4d4d8' }}
                                                onClick={() => handleUpdateSettings({ referralLevelGate: !state.globalSettings.referralLevelGate })}>
                                                <div className={cn("w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300", state.globalSettings.referralLevelGate ? "translate-x-4" : "translate-x-0")}/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-7 bg-white border border-zinc-200 rounded-[2rem] shadow-sm space-y-5">
                                        <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                            <Award size={14} className="text-emerald-500"/> Haftalık Görev
                                        </h3>
                                        <InputGroup
                                            label="Haftalık Görev Hedefi"
                                            value={(state.globalSettings.weeklyQuestGoal || 100).toString()}
                                            onChange={v => handleUpdateSettings({ weeklyQuestGoal: parseInt(v) || 0 })}
                                            icon={<TrendingUp size={16} className="text-blue-500"/>}
                                            placeholder="100"
                                            light
                                        />
                                        <InputGroup
                                            label="Görev BTC Ödülü"
                                            value={(state.globalSettings.weeklyQuestReward || 0.001).toString()}
                                            onChange={v => handleUpdateSettings({ weeklyQuestReward: parseFloat(v) || 0 })}
                                            icon={<Bitcoin size={16} className="text-orange-500"/>}
                                            placeholder="0.001"
                                            light
                                        />
                                        <button
                                            onClick={() => handleUpdateSettings({ lastQuestReset: Date.now(), questResetTrigger: Math.random() })}
                                            className="w-full h-11 rounded-xl bg-zinc-900 text-white font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <RefreshCw size={13}/> Görevi Sıfırla
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Duyuru Metni */}
                            <div className="p-7 bg-white border border-zinc-200 rounded-[2rem] shadow-sm space-y-4">
                                <h3 className="text-zinc-800 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                    <Bell size={14} className="text-blue-500"/> Sistem Duyurusu
                                </h3>
                                <textarea
                                    rows={3}
                                    value={state.globalSettings.announcement || ''}
                                    onChange={e => handleUpdateSettings({ announcement: e.target.value })}
                                    placeholder="Tüm kullanıcılara gösterilecek duyuru metnini buraya yazın..."
                                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm text-zinc-700 font-medium focus:outline-none focus:border-indigo-300 resize-none transition-all"
                                />
                                {state.globalSettings.announcement && (
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
                                        <Info size={14} className="text-indigo-500 shrink-0 mt-0.5"/>
                                        <p className="text-zinc-600 text-xs font-medium leading-relaxed">{state.globalSettings.announcement}</p>
                                    </div>
                                )}
                            </div>

                            {/* Tehlike Bölgesi */}
                            <div className="p-7 bg-red-50 border border-red-100 rounded-[2rem] space-y-4">
                                <h3 className="text-red-700 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle size={14}/> Tehlike Bölgesi
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <button onClick={() => { if (window.confirm('Tüm önbelleği temizlemek istediğinizden emin misiniz?')) notify({ type: 'warning', title: 'Önbellek Temizlendi', message: 'Sistem önbelleği sıfırlandı.' }); }}
                                        className="h-12 rounded-xl bg-white border border-red-100 text-red-600 font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2">
                                        <Trash2 size={13}/> Önbelleği Temizle
                                    </button>
                                    <button onClick={() => { if (window.confirm('Tüm oturumları kapatmak istediğinizden emin misiniz?')) notify({ type: 'warning', title: 'Oturumlar Kapatıldı', message: 'Tüm aktif oturumlar sonlandırıldı.' }); }}
                                        className="h-12 rounded-xl bg-white border border-red-100 text-red-600 font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2">
                                        <LogOut size={13}/> Tüm Oturumları Kapat
                                    </button>
                                    <button onClick={() => handleUpdateSettings({ isMaintenance: true })}
                                        className="h-12 rounded-xl bg-red-600 text-white border border-red-600 font-black text-[9px] uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                                        <Lock size={13}/> Acil Bakım Modu
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== DESTEK / TICKET SİSTEMİ ===== */}
                    {(activeTab === 'support_pending' || activeTab === 'support_all' || activeTab === 'support_answered' || activeTab === 'support_closed') && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {/* Ticket Detail Modal */}
                            {selectedTicket && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-900/70 backdrop-blur-sm p-6">
                                    <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                                        <div className="p-8 border-b border-zinc-100 bg-zinc-50 flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border",
                                                        selectedTicket.status === 'open' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                        selectedTicket.status === 'answered' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    )}>{selectedTicket.status === 'open' ? 'Açık' : selectedTicket.status === 'answered' ? 'Yanıtlandı' : 'Kapalı'}</span>
                                                    <span className="text-[9px] font-mono text-zinc-400">#{selectedTicket.id?.substring(0,8)}</span>
                                                </div>
                                                <h3 className="font-black text-zinc-900 text-lg uppercase tracking-tight">{selectedTicket.subject || 'Destek Talebi'}</h3>
                                                <p className="text-[9px] text-zinc-400 font-bold mt-1">
                                                    {selectedTicket.username || selectedTicket.user_id?.substring(0,8)} • {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString('tr-TR') : ''}
                                                </p>
                                            </div>
                                            <button onClick={() => setSelectedTicket(null)} className="p-3 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-700 transition-all"><X size={18}/></button>
                                        </div>
                                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                                            {/* Original message */}
                                            <div className="p-5 bg-zinc-50 border border-zinc-100 rounded-2xl">
                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Kullanıcı Mesajı</p>
                                                <p className="text-zinc-700 text-sm font-medium leading-relaxed">{selectedTicket.message || selectedTicket.content || 'İçerik yok.'}</p>
                                            </div>
                                            {/* Previous admin reply */}
                                            {selectedTicket.admin_reply && (
                                                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Önceki Admin Yanıtı</p>
                                                    <p className="text-zinc-700 text-sm font-medium leading-relaxed">{selectedTicket.admin_reply}</p>
                                                </div>
                                            )}
                                            {/* Reply box */}
                                            {selectedTicket.status !== 'closed' && (
                                                <div className="space-y-3">
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Yanıt Yaz</p>
                                                    <textarea value={ticketReply} onChange={e => setTicketReply(e.target.value)} rows={4}
                                                        placeholder="Kullanıcıya yanıtınızı yazın..."
                                                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm text-zinc-700 font-medium focus:outline-none focus:border-indigo-300 resize-none transition-all"/>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => handleReplyTicket(selectedTicket.id)} className="flex-1 h-11 rounded-xl bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                                                            <Send size={13}/> Yanıt Gönder
                                                        </button>
                                                        <button onClick={() => handleCloseTicket(selectedTicket.id)} className="h-11 px-5 rounded-xl bg-zinc-100 text-zinc-600 font-black text-[9px] uppercase hover:bg-zinc-200 transition-all active:scale-95">
                                                            Kapat
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Header */}
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-zinc-800 font-black text-sm uppercase tracking-widest flex items-center gap-2"><LifeBuoy className="text-blue-500" size={18}/> Destek Talepleri</h3>
                                    <div className="flex items-center gap-2">
                                        {[
                                            { key: 'open', label: 'Açık', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                                            { key: 'answered', label: 'Yanıtlandı', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                                            { key: 'closed', label: 'Kapalı', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                                        ].map(s => (
                                            <span key={s.key} className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border", s.color)}>
                                                {tickets.filter(t => t.status === s.key).length} {s.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex p-1 bg-zinc-100 rounded-xl gap-1 border border-zinc-200">
                                        {[
                                            { val: 'open', label: 'Açık' },
                                            { val: 'answered', label: 'Yanıtlandı' },
                                            { val: 'closed', label: 'Kapalı' },
                                            { val: 'all', label: 'Hepsi' },
                                        ].map(f => (
                                            <button key={f.val} onClick={() => setTicketFilter(f.val as any)}
                                                className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    ticketFilter === f.val ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                                )}>{f.label}</button>
                                        ))}
                                    </div>
                                    <button onClick={() => handleExportCSV(tickets, 'destek_talepleri')} className="h-9 px-4 rounded-xl bg-zinc-900 text-white font-black text-[9px] uppercase hover:bg-indigo-600 transition-all flex items-center gap-2"><Download size={12}/> CSV</button>
                                </div>
                            </div>

                            {/* Ticket List */}
                            <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                            <th className="px-6 py-4">Kullanıcı</th>
                                            <th className="px-6 py-4">Konu</th>
                                            <th className="px-6 py-4">Durum</th>
                                            <th className="px-6 py-4">Tarih</th>
                                            <th className="px-6 py-4 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {tickets
                                            .filter(t => ticketFilter === 'all' || t.status === ticketFilter)
                                            .map(ticket => (
                                            <tr key={ticket.id} className="hover:bg-zinc-50/50 transition-colors cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                                                            {(ticket.username?.charAt(0) || '?').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-zinc-800 text-xs uppercase tracking-wide">{ticket.username || 'Anonim'}</p>
                                                            <p className="text-[8px] font-mono text-zinc-400">{ticket.user_id?.substring(0,8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-zinc-700 text-xs font-bold truncate max-w-[200px]">{ticket.subject || 'Konu belirtilmedi'}</p>
                                                    <p className="text-[8px] text-zinc-400 truncate max-w-[200px] mt-0.5">{ticket.message?.substring(0,60)}...</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border",
                                                        ticket.status === 'open' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                        ticket.status === 'answered' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                        "bg-zinc-100 text-zinc-500 border-zinc-200"
                                                    )}>
                                                        {ticket.status === 'open' ? 'Açık' : ticket.status === 'answered' ? 'Yanıtlandı' : 'Kapalı'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-zinc-400 text-[9px] font-mono">
                                                    {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('tr-TR') : '—'}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button onClick={e => { e.stopPropagation(); setSelectedTicket(ticket); setTicketReply(''); }}
                                                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-[8px] uppercase hover:bg-indigo-700 transition-all active:scale-95">
                                                        {ticket.status === 'open' ? 'Yanıtla' : 'Görüntüle'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {tickets.filter(t => ticketFilter === 'all' || t.status === ticketFilter).length === 0 && (
                                            <tr><td colSpan={5} className="p-16 text-center text-zinc-400 font-bold uppercase text-[9px] tracking-widest">
                                                {tickets.length === 0 ? 'Henüz destek talebi yok' : 'Bu filtreye uygun talep bulunamadı'}
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===== ABONE / SUBSCRIBER YÖNETİMİ ===== */}
                    {activeTab === 'subscribers' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {/* Header & Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600"><Users size={22}/></div>
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Toplam Abone</p>
                                        <p className="text-2xl font-black text-zinc-900 tabular-nums">{subscribers.length}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600"><Mail size={22}/></div>
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">E-posta Abonesi</p>
                                        <p className="text-2xl font-black text-zinc-900 tabular-nums">{subscribers.filter(s => s.email_subscribed !== false).length}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600"><Bell size={22}/></div>
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Push Abonesi</p>
                                        <p className="text-2xl font-black text-zinc-900 tabular-nums">{subscribers.filter(s => s.push_token).length}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Search & Export */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14}/>
                                    <input value={subSearchTerm} onChange={e => setSubSearchTerm(e.target.value)} placeholder="E-posta veya kullanıcı ara..."
                                        className="w-full h-11 pl-10 pr-4 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 focus:outline-none focus:border-indigo-300 transition-all"/>
                                </div>
                                <button onClick={() => handleExportCSV(subscribers, 'aboneler')} className="h-11 px-5 rounded-xl bg-zinc-900 text-white font-black text-[9px] uppercase hover:bg-indigo-600 transition-all flex items-center gap-2 active:scale-95"><Download size={12}/> CSV</button>
                                <button onClick={() => handleExportJSON(subscribers, 'aboneler')} className="h-11 px-5 rounded-xl bg-zinc-100 text-zinc-700 font-black text-[9px] uppercase hover:bg-zinc-200 transition-all flex items-center gap-2 active:scale-95"><Download size={12}/> JSON</button>
                            </div>

                            {/* Subscribers Table */}
                            <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-100 bg-zinc-50/50 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                            <th className="px-6 py-4">Kullanıcı</th>
                                            <th className="px-6 py-4">E-posta</th>
                                            <th className="px-6 py-4">Push Token</th>
                                            <th className="px-6 py-4">Kayıt</th>
                                            <th className="px-6 py-4 text-right">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-50">
                                        {subscribers
                                            .filter(s => !subSearchTerm || s.email?.includes(subSearchTerm) || s.username?.toLowerCase().includes(subSearchTerm.toLowerCase()))
                                            .slice(0, 50)
                                            .map(sub => (
                                            <tr key={sub.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 font-black text-xs">
                                                            {(sub.username?.charAt(0) || sub.email?.charAt(0) || '?').toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-zinc-800 text-xs">{sub.username || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-600 text-xs font-mono">{sub.email || '—'}</td>
                                                <td className="px-6 py-4">
                                                    {sub.push_token
                                                        ? <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase border border-emerald-100 rounded-lg">Aktif</span>
                                                        : <span className="px-2 py-1 bg-zinc-100 text-zinc-400 text-[8px] font-black uppercase border border-zinc-200 rounded-lg">Yok</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-zinc-400 text-[9px] font-mono">
                                                    {sub.created_at ? new Date(sub.created_at).toLocaleDateString('tr-TR') : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border",
                                                        sub.email_subscribed !== false
                                                            ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                                                            : "bg-zinc-100 text-zinc-400 border-zinc-200"
                                                    )}>
                                                        {sub.email_subscribed !== false ? 'Abone' : 'Abonelik Yok'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {subscribers.length === 0 && (
                                            <tr><td colSpan={5} className="p-16 text-center text-zinc-400 font-bold uppercase text-[9px] tracking-widest">
                                                Henüz abone yok
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
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
