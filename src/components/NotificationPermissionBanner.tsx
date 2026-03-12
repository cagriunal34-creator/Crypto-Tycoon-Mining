/**
 * NotificationPermissionBanner
 * 
 * İlk açılışta kullanıcıdan bildirim izni isteyen güzel bir banner.
 * - Uygulama açıldıktan 3 saniye sonra gösterilir (anında popup kullanıcıyı iter)
 * - Reddedilince 7 gün boyunca tekrar gösterilmez
 * - İzin verince otomatik kaybolur
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, BellOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onRequestPermission: () => Promise<boolean>;
}

const LS_KEY = 'pn_banner_dismissed_until';

export default function NotificationPermissionBanner({ onRequestPermission }: Props) {
  const { theme } = useTheme();
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Bildirim desteklenmiyor mu?
    if (!('Notification' in window)) return;
    // Zaten izin verilmiş mi?
    if (Notification.permission === 'granted') return;
    // Kalıcı olarak reddedilmiş mi?
    if (Notification.permission === 'denied') return;

    // 7 gün dismiss kontrolü
    try {
      const dismissedUntil = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
      if (Date.now() < dismissedUntil) return;
    } catch {}

    // 3 saniye sonra göster (UX: kullanıcı önce oyunu görsün)
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    const granted = await onRequestPermission();
    setLoading(false);
    if (granted) {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    // 7 gün sonrasına kadar tekrar gösterme
    try {
      localStorage.setItem(LS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    } catch {}
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'calc(100% - 32px)',
            maxWidth: 420,
          }}
        >
          <div
            style={{
              background: 'var(--ct-card-bg, rgba(10,14,20,0.96))',
              border: `1px solid ${a1}30`,
              borderRadius: 20,
              padding: '16px 18px',
              boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${a1}15`,
              backdropFilter: 'blur(20px)',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            {/* İkon */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: `${a1}15`,
                border: `1px solid ${a1}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <motion.div
                animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                transition={{ duration: 0.7, delay: 0.5, repeat: Infinity, repeatDelay: 4 }}
              >
                <Bell size={20} color={a1} />
              </motion.div>
            </div>

            {/* İçerik */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--ct-text, #fff)',
                  marginBottom: 4,
                  letterSpacing: '-0.01em',
                }}
              >
                Depon dolduğunda haber ver! ⛏️
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--ct-muted, #71717a)',
                  lineHeight: 1.5,
                  marginBottom: 12,
                }}
              >
                BTC depon dolunca, enerji bitince veya hacker saldırısında anında bildirim al.
              </div>

              {/* Butonlar */}
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAllow}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${a1}, ${a2})`,
                    border: 'none',
                    color: '#000',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: loading ? 'wait' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {loading ? (
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: '2px solid rgba(0,0,0,0.2)',
                        borderTopColor: '#000',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                  ) : (
                    <Bell size={13} />
                  )}
                  {loading ? 'İzin isteniyor…' : 'Evet, haber ver'}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDismiss}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--ct-muted, #71717a)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <BellOff size={12} />
                  Hayır
                </motion.button>
              </div>
            </div>

            {/* Kapat */}
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ct-muted, #71717a)',
                padding: 2,
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Shimmer top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 20,
              right: 20,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${a1}60, ${a2}40, transparent)`,
              borderRadius: '100%',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
