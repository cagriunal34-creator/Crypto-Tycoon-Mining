/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, TriangleAlert, Info, Zap, X } from 'lucide-react';
import { cn } from '../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = 'success' | 'warning' | 'info' | 'mining' | 'error';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = permanent until dismissed
}

interface NotifContextValue {
  notify: (notif: Omit<Notification, 'id'>) => void;
  requestPushPermission: () => Promise<boolean>;
  pushEnabled: boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const NotifContext = createContext<NotifContextValue | null>(null);

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICONS: Record<NotifType, React.ElementType> = {
  success: CheckCircle,
  warning: TriangleAlert,
  info: Info,
  mining: Zap,
  error: TriangleAlert,
};

const COLORS: Record<NotifType, string> = {
  success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  warning: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  mining: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  error: 'text-red-500 bg-red-500/10 border-red-500/30',
};

const ICON_COLORS: Record<NotifType, string> = {
  success: 'text-emerald-500',
  warning: 'text-orange-500',
  info: 'text-blue-400',
  mining: 'text-yellow-400',
  error: 'text-red-500',
};

// ─── Toast Component ──────────────────────────────────────────────────────────

function Toast({ notif, onDismiss }: { notif: Notification; onDismiss: () => void }) {
  const Icon = ICONS[notif.type];

  useEffect(() => {
    if (notif.duration === 0) return;
    const timer = setTimeout(onDismiss, notif.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [notif.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'flex items-start gap-3 p-3 rounded-2xl border backdrop-blur-md max-w-[320px] shadow-xl',
        COLORS[notif.type]
      )}
    >
      <div className={cn('mt-0.5 shrink-0', ICON_COLORS[notif.type])}>
        <Icon size={16} fill={notif.type === 'mining' ? 'currentColor' : 'none'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white leading-tight">{notif.title}</p>
        {notif.message && (
          <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{notif.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = useCallback((notif: Omit<Notification, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    setNotifications(prev => [{ ...notif, id }, ...prev].slice(0, 5));
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    try {
      const result = await Notification.requestPermission();
      const granted = result === 'granted';
      setPushEnabled(granted);
      if (granted) {
        notify({ type: 'success', title: 'Bildirimler Açıldı!', message: 'Madencilik güncellemelerini alacaksın.' });
      }
      return granted;
    } catch {
      return false;
    }
  }, [notify]);

  // Check existing permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setPushEnabled(true);
    }
  }, []);

  return (
    <NotifContext.Provider value={{ notify, requestPushPermission, pushEnabled }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-20 right-3 z-[300] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map(notif => (
            <div key={notif.id} className="pointer-events-auto">
              <Toast notif={notif} onDismiss={() => dismiss(notif.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotifContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotify() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider');
  return ctx;
}
