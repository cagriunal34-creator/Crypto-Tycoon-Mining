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
    Globe,
    Search,
    Plus,
    Save
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';
import { supabase, TABLES } from '../lib/supabase';
import { Download, Upload, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
    const { state, dispatch, adminSetBtc, adminSetTp, adminSetLevel, adminTriggerEvent } = useGame();
    const { theme } = useTheme();
    const { notify } = useNotify();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'overview' | 'economy' | 'users' | 'events' | 'withdrawals' | 'support' | 'localization'>('overview');
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [supportLinks, setSupportLinks] = useState({
        supportUs: '',
        contactUs: '',
        terms: '',
        privacy: ''
    });
    const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
    const [loadingSupport, setLoadingSupport] = useState(false);
    
    // Localization State
    const [allTranslations, setAllTranslations] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingLocales, setLoadingLocales] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editLocals, setEditLocals] = useState({ tr: '', en: '' });
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newKey, setNewKey] = useState('');

    const triggerEvent = async (type: any) => {
        try {
            await adminTriggerEvent(type);
            notify({ type: 'success', title: t('admin.notify.event_success'), message: `${type} ${t('admin.notify.update_success')}` });
        } catch (e) {
            notify({ type: 'error', title: t('admin.notify.error'), message: t('admin.notify.error') });
        }
    };

    const handleSetBtc = async (val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        try {
            await adminSetBtc(num);
            notify({ type: 'success', title: t('admin.notify.update_success'), message: t('admin.stats.btc_balance') + ' ' + t('admin.notify.update_success') });
        } catch (e) {
            notify({ type: 'error', title: t('admin.notify.error'), message: t('admin.notify.error') });
        }
    };

    const handleSetTp = async (val: string) => {
        const num = parseInt(val);
        if (isNaN(num)) return;
        try {
            await adminSetTp(num);
            notify({ type: 'success', title: t('admin.notify.update_success'), message: t('admin.stats.tp_balance') + ' ' + t('admin.notify.update_success') });
        } catch (e) {
            notify({ type: 'error', title: t('admin.notify.error'), message: t('admin.notify.error') });
        }
    };

    const handleSetLevel = async (val: string) => {
        const num = parseInt(val);
        if (isNaN(num)) return;
        try {
            await adminSetLevel(num);
            notify({ type: 'success', title: t('admin.notify.update_success'), message: t('admin.stats.level') + ' ' + t('admin.notify.update_success') });
        } catch (e) {
            notify({ type: 'error', title: t('admin.notify.error'), message: t('admin.notify.error') });
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
            notify({ type: 'success', title: t('admin.notify.update_success'), message: `${t('admin.tabs.withdrawals')} ${status === 'approved' ? t('admin.withdrawals.approve') : t('admin.withdrawals.reject')}.` });
        } catch (e) {
            notify({ type: 'error', title: t('admin.notify.error'), message: t('admin.notify.error') });
        }
    };

    React.useEffect(() => {
        if (activeTab === 'support') fetchSupportLinks();
        if (activeTab === 'localization') fetchLocales();
    }, [activeTab]);

    const fetchLocales = async () => {
        setLoadingLocales(true);
        try {
            const { data } = await supabase.from(TABLES.TRANSLATIONS).select('*').order('id');
            if (data) setAllTranslations(data);
        } finally {
            setLoadingLocales(false);
        }
    };

    const handleSaveLocale = async (id: string, tr: string, en: string) => {
        try {
            const { error } = await supabase.from(TABLES.TRANSLATIONS).upsert({ id, tr, en, updated_at: new Date().toISOString() });
            if (error) throw error;
            notify({ type: 'success', title: t('admin.notify.update_success'), message: t('admin.tabs.localization') + ' ' + t('admin.notify.update_success') });
            setEditingKey(null);
            fetchLocales();
        } catch (e) {
            notify({ type: 'error', title: t('admin.notify.error'), message: t('admin.notify.error') });
        }
    };

    const handleAddNewLocale = async () => {
        if (!newKey) return;
        try {
            const { error } = await supabase.from(TABLES.TRANSLATIONS).insert({ 
                id: newKey, 
                tr: editLocals.tr || newKey, 
                en: editLocals.en || newKey,
                category: newKey.split('.')[0] || 'general'
            });
            if (error) throw error;
            notify({ type: 'success', title: t('admin.notify.add_success'), message: t('admin.tabs.localization') + ' ' + t('admin.notify.add_success') });
            setIsAddingNew(false);
            setNewKey('');
            setEditLocals({ tr: '', en: '' });
            fetchLocales();
        } catch (e) {
            notify({ type: 'error', title: t('admin.notify.error'), message: t('admin.notify.error') });
        }
    };

    React.useEffect(() => {
        if (activeTab === 'support') {
            fetchSupportLinks();
        }
    }, [activeTab]);

    const fetchSupportLinks = async () => {
        setLoadingSupport(true);
        try {
            const { data } = await supabase.from(TABLES.SETTINGS).select('value').eq('id', 'support_legal_links').single();
            if (data?.value) setSupportLinks(data.value);
        } finally {
            setLoadingSupport(false);
        }
    };

    const handleSaveSupport = async () => {
        setLoadingSupport(true);
        try {
            const { error } = await supabase.from(TABLES.SETTINGS).upsert({
                id: 'support_legal_links',
                value: supportLinks,
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
            notify({ type: 'success', title: t('admin.notify.update_success'), message: t('admin.tabs.support') + ' ' + t('admin.notify.update_success') });
        } catch (e) {
            notify({ type: 'error', title: t('admin.notify.error'), message: t('admin.notify.error') });
        } finally {
            setLoadingSupport(false);
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
                        <h1 className="text-xl font-black uppercase tracking-tighter">{t('admin.title')}</h1>
                        <p className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">{t('admin.access_granted')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 relative z-10 shrink-0 overflow-x-auto no-scrollbar">
                {(['overview', 'economy', 'users', 'events', 'withdrawals', 'support', 'localization'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 min-w-[80px] py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                            : 'text-zinc-500 hover:text-white'
                            }`}
                    >
                        {t(`admin.tabs.${tab}`)}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 relative z-10">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard label={t('admin.stats.btc_balance')} value={state.btcBalance.toFixed(8)} icon={<Bitcoin size={16} />}
                                color="orange" />
                            <StatCard label={t('admin.stats.tp_balance')} value={state.tycoonPoints.toLocaleString()} icon={<Database size={16} />} color="blue" />
                            <StatCard label={t('admin.stats.level')} value={state.level.toString()} icon={<TrendingUp size={16} />} color="emerald" />
                            <StatCard label={t('admin.stats.energy')} value={`${Math.floor(state.energyCells)}/${state.maxEnergyCells}`} icon={<Zap size={16} />} color="yellow" />
                        </div>
                    </div>
                )}

                {activeTab === 'economy' && (
                    <div className="space-y-6">
                        <InputGroup
                            label={t('admin.economy.set_btc')}
                            placeholder="0.00000000"
                            value={state.btcBalance.toString()}
                            onChange={handleSetBtc}
                            icon={<Bitcoin size={18} />}
                            applyText={t('admin.common.apply')}
                        />
                        <InputGroup
                            label={t('admin.economy.set_tp')}
                            placeholder="1000"
                            value={state.tycoonPoints.toString()}
                            onChange={handleSetTp}
                            icon={<Database size={18} />}
                            applyText={t('admin.common.apply')}
                        />
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 px-2">{t('admin.events.trigger_title')}</h2>
                        <div className="grid gap-3">
                            <EventButton
                                label={t('admin.events.flash_pool.title')}
                                desc={t('admin.events.flash_pool.desc')}
                                onTrigger={() => triggerEvent('flash_pool')}
                                color="emerald"
                            />
                            <EventButton
                                label={t('admin.events.hash_storm.title')}
                                desc={t('admin.events.hash_storm.desc')}
                                onTrigger={() => triggerEvent('hash_storm')}
                                color="blue"
                            />
                            <EventButton
                                label={t('admin.events.energy_surge.title')}
                                desc={t('admin.events.energy_surge.desc')}
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
                                label={t('admin.users.set_level')}
                                placeholder="3"
                                value={state.level.toString()}
                                onChange={handleSetLevel}
                                icon={<TrendingUp size={18} />}
                                applyText={t('admin.common.apply')}
                            />
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <button
                                onClick={() => {
                                    if (window.confirm(t('admin.users.reset_confirm'))) dispatch({ type: 'ADMIN_RESET_GAME' });
                                }}
                                className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                            >
                                <RefreshCw size={16} />
                                {t('admin.users.reset_game')}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'withdrawals' && (
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 px-2 flex items-center justify-between">
                            {t('admin.withdrawals.title')}
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
                                            {t('admin.withdrawals.approve')}
                                        </button>
                                        <button 
                                            onClick={() => handleWithdrawal(w.id, 'rejected')}
                                            className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                                        >
                                            {t('admin.withdrawals.reject')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                                <div className="py-12 text-center">
                                    <CheckCircle2 size={32} className="mx-auto text-zinc-800 mb-3" />
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('admin.withdrawals.no_requests')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'support' && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 px-2 flex items-center justify-between">
                                {t('admin.support.title')}
                                {loadingSupport && <RefreshCw size={12} className="animate-spin text-emerald-500" />}
                            </h2>
                            
                            <div className="grid gap-4">
                                <AdminInput
                                    label={t('admin.support.label_support_us')}
                                    value={supportLinks.supportUs}
                                    onChange={(v) => setSupportLinks({ ...supportLinks, supportUs: v })}
                                    placeholder="mailto:support@example.com"
                                />
                                <AdminInput
                                    label={t('admin.support.label_contact_us')}
                                    value={supportLinks.contactUs}
                                    onChange={(v) => setSupportLinks({ ...supportLinks, contactUs: v })}
                                    placeholder="https://t.me/example"
                                />
                                <AdminInput
                                    label={t('admin.support.label_terms')}
                                    value={supportLinks.terms}
                                    onChange={(v) => setSupportLinks({ ...supportLinks, terms: v })}
                                    placeholder="/terms"
                                />
                                <AdminInput
                                    label={t('admin.support.label_privacy')}
                                    value={supportLinks.privacy}
                                    onChange={(v) => setSupportLinks({ ...supportLinks, privacy: v })}
                                    placeholder="/privacy"
                                />
                            </div>

                            <button
                                onClick={handleSaveSupport}
                                disabled={loadingSupport}
                                className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loadingSupport ? t('admin.support.saving') : t('admin.support.save_btn')}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'localization' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                             <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">{t('admin.locale.manager_title')}</h2>
                             <button onClick={() => setIsAddingNew(true)} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <Plus size={16} />
                             </button>
                        </div>

                        <div className="relative mx-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                            <input 
                                type="text"
                                placeholder={t('admin.locale.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>

                        <div className="space-y-3 px-2">
                            {allTranslations
                                .filter(t => t.id.toLowerCase().includes(searchQuery.toLowerCase()) || t.tr.toLowerCase().includes(searchQuery.toLowerCase()) || t.en.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map(trans => (
                                    <div key={trans.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-emerald-500">{trans.id}</span>
                                            {editingKey !== trans.id && (
                                                <button onClick={() => {
                                                    setEditingKey(trans.id);
                                                    setEditLocals({ tr: trans.tr, en: trans.en });
                                                }} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white">{t('admin.locale.edit_btn')}</button>
                                            )}
                                        </div>
                                        
                                        {editingKey === trans.id ? (
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black uppercase text-zinc-500">TR</label>
                                                    <textarea 
                                                        value={editLocals.tr}
                                                        onChange={(e) => setEditLocals({ ...editLocals, tr: e.target.value })}
                                                        className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black uppercase text-zinc-500">EN</label>
                                                    <textarea 
                                                        value={editLocals.en}
                                                        onChange={(e) => setEditLocals({ ...editLocals, en: e.target.value })}
                                                        className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingKey(null)} className="flex-1 py-2 rounded-lg bg-white/5 text-[10px] font-black uppercase">{t('admin.common.cancel')}</button>
                                                    <button onClick={() => handleSaveLocale(trans.id, editLocals.tr, editLocals.en)} className="flex-1 py-2 rounded-lg bg-emerald-500 text-black text-[10px] font-black uppercase">{t('admin.common.save')}</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black uppercase text-zinc-500">TR</span>
                                                    <p className="text-xs line-clamp-2">{trans.tr}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black uppercase text-zinc-500">EN</span>
                                                    <p className="text-xs line-clamp-2">{trans.en}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Add New Translation Modal */}
            <AnimatePresence>
                {isAddingNew && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
                        <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500">{t('admin.locale.add_new')}</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-zinc-500">{t('admin.locale.key_label')}</label>
                                    <input 
                                        type="text" 
                                        value={newKey}
                                        onChange={(e) => setNewKey(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-zinc-500">{t('admin.locale.tr_label')}</label>
                                    <textarea 
                                        value={editLocals.tr}
                                        onChange={(e) => setEditLocals({ ...editLocals, tr: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs min-h-[80px]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-zinc-500">{t('admin.locale.en_label')}</label>
                                    <textarea 
                                        value={editLocals.en}
                                        onChange={(e) => setEditLocals({ ...editLocals, en: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs min-h-[80px]"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsAddingNew(false)} className="flex-1 py-3 rounded-2xl bg-white/5 font-black text-[10px] uppercase">{t('admin.common.cancel')}</button>
                                <button onClick={handleAddNewLocale} className="flex-1 py-3 rounded-2xl bg-emerald-500 text-black font-black text-[10px] uppercase">{t('admin.common.add')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
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

function InputGroup({ label, placeholder, value, onChange, icon, applyText }: { label: string, placeholder: string, value: string, onChange: (v: string) => void, icon: React.ReactNode, applyText?: string }) {
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
                    {applyText || 'Uygula'}
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

function AdminInput({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
        </div>
    );
}
