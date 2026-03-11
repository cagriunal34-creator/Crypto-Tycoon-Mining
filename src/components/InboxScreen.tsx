import React, { useState } from 'react';
import { 
  Bell, Wallet, Settings as SettingsIcon, Zap, Shield, Gift,
  Info, AlertTriangle, CheckCircle2, RefreshCw, Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame } from '../context/GameContext';
import { supabase, TABLES } from '../lib/supabase';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  info:    { icon: Info,         color: 'text-blue-400',    bg: 'bg-blue-500/10',    label: 'Bilgi'     },
  warning: { icon: AlertTriangle,color: 'text-orange-400',  bg: 'bg-orange-500/10',  label: 'Uyarı'    },
  reward:  { icon: Gift,         color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Ödül'     },
  system:  { icon: SettingsIcon, color: 'text-zinc-400',    bg: 'bg-zinc-500/10',    label: 'Sistem'   },
  success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Başarılı' },
  mining:  { icon: Zap,          color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  label: 'Madencilik'},
  vip:     { icon: Shield,       color: 'text-purple-400',  bg: 'bg-purple-500/10',  label: 'VIP'      },
  wallet:  { icon: Wallet,       color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Cüzdan'   },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (min < 1) return 'Az önce';
  if (min < 60) return `${min}dk önce`;
  if (h < 24) return `${h}s önce`;
  if (d < 7) return `${d}g önce`;
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

export default function InboxScreen() {
  const { state, dispatch, markNotificationRead } = useGame();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);

  const notifications = state.inboxNotifications || [];
  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    notifications.filter(n => !n.read).forEach(n => dispatch({ type: 'MARK_NOTIFICATION_READ', id: n.id }));
    try {
      if (state.user?.uid) await supabase.from(TABLES.NOTIFICATIONS).update({ read: true }).eq('target_id', state.user.uid).eq('read', false);
    } catch (_) {}
  };

  const handleRefresh = async () => {
    if (!state.user?.uid) return;
    setLoading(true);
    try {
      const { data } = await supabase.from(TABLES.NOTIFICATIONS).select('*').eq('target_id', state.user.uid).order('created_at', { ascending: false }).limit(50);
      if (data) dispatch({ type: 'SET_INBOX_NOTIFICATIONS', notifications: data.map(n => ({ ...n, read: n.read ?? false })) });
    } catch (_) {}
    setLoading(false);
  };

  const groups: Record<string, typeof filtered> = {};
  filtered.forEach(n => {
    const d = new Date(n.created_at);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let label = d.toLocaleDateString('tr-TR');
    if (d.toDateString() === today.toDateString()) label = 'BUGÜN';
    else if (d.toDateString() === yesterday.toDateString()) label = 'DÜN';
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });

  return (
    <div className="space-y-4 pt-2 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-white text-lg uppercase tracking-tight">Gelen Kutusu</h2>
          {unreadCount > 0 && (
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">{unreadCount} okunmamış</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-[9px] font-black text-zinc-400 hover:text-white uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              Tümünü Oku
            </button>
          )}
          <button onClick={handleRefresh} disabled={loading} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {[{ id: 'all', label: `Tümü (${notifications.length})` }, { id: 'unread', label: `Okunmamış (${unreadCount})` }].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id as any)}
            className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              filter === tab.id ? "bg-emerald-500 text-black" : "bg-white/5 text-zinc-400 hover:bg-white/10")}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
            <Inbox size={28} className="text-zinc-600" />
          </div>
          <div>
            <p className="font-black text-zinc-500 text-sm uppercase tracking-widest">
              {filter === 'unread' ? 'Okunmamış bildirim yok' : 'Henüz bildirim yok'}
            </p>
            <p className="text-zinc-600 text-[10px] mt-1 font-bold uppercase">Admin panelinden gönderilen bildirimler burada görünür</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {Object.entries(groups).map(([dateLabel, items]) => (
          <div key={dateLabel} className="space-y-2">
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">{dateLabel}</p>
            {items.map((notif, idx) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <motion.button key={notif.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                  onClick={() => handleMarkRead(notif.id)}
                  className={cn("w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left border",
                    notif.read ? "bg-white/[0.02] border-white/5 opacity-60" : "bg-white/[0.04] border-white/10 hover:bg-white/[0.07]")}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("font-black text-sm", notif.read ? "text-zinc-400" : "text-white")}>{notif.title}</p>
                      <span className="text-[9px] font-bold text-zinc-600 shrink-0 mt-0.5">{timeAgo(notif.created_at)}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{notif.body}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>{cfg.label}</span>
                      {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
