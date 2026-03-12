import React, { useState } from 'react';
import {
  User, Globe, Mail, Shield, FileText, LogOut, Trash2,
  ChevronRight, Heart, MessageSquare, Palette, Check, Crown, Star, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';
import ThemeCard from './ThemeCard';
import { firebaseSignOut } from '../lib/firebase';
import { supabase, TABLES } from '../lib/supabase';

type Tab = 'account' | 'themes';

export default function SettingsScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const { theme, setTheme, allThemes } = useTheme();
  const { state, updateUserProfile, uploadAvatar } = useGame();
  const { notify } = useNotify();
  const [justChanged, setJustChanged] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: state.username,
    email: state.email,
    phone: state.phone
  });
  const [isUploading, setIsUploading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
    } catch (err) {
      console.error('Logout error:', err);
      notify({ type: 'warning', title: 'Hata', message: 'Çıkış yapılırken hata oluştu.' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!state.user?.uid) return;
    setIsDeletingAccount(true);
    try {
      await supabase.from(TABLES.PROFILES).delete().eq('id', state.user.uid);
      await firebaseSignOut();
      notify({ type: 'success', title: 'Hesap Silindi', message: 'Hesabınız başarıyla silindi.' });
    } catch (err) {
      console.error('Delete account error:', err);
      notify({ type: 'warning', title: 'Hata', message: 'Hesap silinirken bir hata oluştu.' });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSupportLink = (label: string) => {
    const urls: Record<string, string> = {
      'Bize Destek Olun': 'mailto:support@cryptotycoon.app',
      'Bize Ulaşın': 'mailto:support@cryptotycoon.app',
      'Şartlar ve Koşullar': '/terms',
      'Gizlilik Politikası': '/privacy',
    };
    const url = urls[label];
    if (url) {
      if (url.startsWith('mailto:')) {
        window.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    }
  };

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];
  const a3 = theme.vars['--ct-a3'];

  const handleSelectTheme = (id: string) => {
    setTheme(id);
    setJustChanged(id);
    setTimeout(() => setJustChanged(null), 2500);
  };

  return (
    <div className="space-y-5 pt-2 pb-10">

      {/* ── Tab Bar ── */}
      <div className="flex gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.04]">
        {([
          { id: 'account', label: 'Hesap',   Icon: User    },
          { id: 'themes',  label: 'Temalar', Icon: Palette },
        ] as { id: Tab; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-xl transition-all duration-200"
              style={active
                ? { background: `${a1}12`, border: `1px solid ${a1}30`, color: a1 }
                : { color: 'var(--ct-muted, #71717a)', border: '1px solid transparent' }}>
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════ TEMALAR TAB ══════════ */}
        {activeTab === 'themes' ? (
          <motion.div key="themes"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-5">

            <div>
              <h2 className="text-xl font-black tracking-tight"
                style={{ background: `linear-gradient(90deg, var(--ct-text, #fff), ${a1})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Uygulama Teması
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--ct-muted, #71717a)' }}>
                Seçtiğin tema anında uygulanır ve cihazına kaydedilir.
              </p>
            </div>

            {/* Active theme badge */}
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'var(--ct-card-bg, rgba(10,10,10,0.8))', border: `1px solid ${a1}20` }}>
              <span className="text-3xl">{theme.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-black" style={{ color: 'var(--ct-text, #fff)' }}>{theme.name}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--ct-muted, #888)' }}>{theme.tag} · Aktif tema</div>
              </div>
              <div className="flex gap-2">
                {(['--ct-a1','--ct-a2','--ct-a3'] as const).map(v => (
                  <div key={v} style={{ width:12, height:12, borderRadius:'50%', background: theme.vars[v], boxShadow:`0 0 6px ${theme.vars[v]}70` }} />
                ))}
              </div>
            </div>

            {/* 2-col preview grid */}
            <div className="grid grid-cols-2 gap-3">
              {allThemes.map(t => (
                <ThemeCard key={t.id} theme={t} isActive={theme.id === t.id} onSelect={() => handleSelectTheme(t.id)} />
              ))}
            </div>

            {/* Success toast */}
            <AnimatePresence>
              {justChanged && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: `${a3}08`, border: `1px solid ${a3}28` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${a3}18`, color: a3 }}>
                    <Check size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-black" style={{ color: 'var(--ct-text, #fff)' }}>Tema Uygulandı!</div>
                    <div className="text-[10px]" style={{ color: 'var(--ct-muted, #888)' }}>
                      {allThemes.find(t => t.id === justChanged)?.emoji}{' '}
                      {allThemes.find(t => t.id === justChanged)?.name} aktif edildi.
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Detailed list */}
            <div className="rounded-3xl overflow-hidden"
              style={{ background: 'var(--ct-card-bg, rgba(10,10,10,0.8))', border: '1px solid rgba(255,255,255,0.05)' }}>
              {allThemes.map((t, i) => (
                <button key={t.id} onClick={() => handleSelectTheme(t.id)}
                  className="w-full flex items-start gap-4 p-4 text-left hover:bg-white/5 transition-colors"
                  style={{
                    borderBottom: i < allThemes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: theme.id === t.id ? `${t.vars['--ct-a1']}07` : 'transparent',
                  }}>
                  <span className="text-xl mt-0.5">{t.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold"
                        style={{ color: theme.id === t.id ? t.vars['--ct-a1'] : 'var(--ct-text, #fff)' }}>
                        {t.name}
                      </span>
                      {theme.id === t.id && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest"
                          style={{ background: `${t.vars['--ct-a1']}18`, color: t.vars['--ct-a1'] }}>
                          AKTİF
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] leading-relaxed" style={{ color: 'var(--ct-muted, #888)' }}>{t.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.keywords.map(k => (
                        <span key={k} className="text-[8px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--ct-muted, #888)' }}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

        ) : (
        /* ══════════ HESAP TAB ══════════ */
          <motion.div key="account"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-6">

            {/* Profile */}
            <div className="flex flex-col items-center space-y-4 py-6">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full blur-md opacity-50 transition-opacity group-hover:opacity-100"
                  style={{ background: `linear-gradient(135deg, ${a1}, ${a2})` }} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="relative w-24 h-24 rounded-full p-0.5 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${a1}, ${a2})` }}>
                  <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center overflow-hidden">
                    {state.avatarUrl ? (
                      <img
                        src={state.avatarUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-3xl font-black" style={{ color: a1 }}>
                        {state.username?.slice(0, 1).toUpperCase() || 'M'}
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // BUG-012 FIX: Validate file size (max 5MB) and MIME type
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                      if (!allowedTypes.includes(file.type)) {
                        notify({ type: 'warning', title: 'Geçersiz Format', message: 'Yalnızca JPG, PNG veya WebP formatı desteklenmektedir.' });
                        e.target.value = '';
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        notify({ type: 'warning', title: 'Dosya Çok Büyük', message: 'Profil resmi 5MB\'dan küçük olmalıdır.' });
                        e.target.value = '';
                        return;
                      }
                      try {
                        setIsUploading(true);
                        const url = await uploadAvatar(file);
                        if (url) {
                          await updateUserProfile({ avatarUrl: url });
                          notify({ type: 'success', title: 'Başarılı', message: 'Profil resmi güncellendi.' });
                        }
                      } catch (err) {
                        console.error("Avatar upload failed:", err);
                        notify({ type: 'warning', title: 'Hata', message: 'Resim yüklenemedi.' });
                      } finally {
                        setIsUploading(false);
                      }
                    }
                  }}
                />
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full border-4 border-[#050505] flex items-center justify-center pointer-events-none"
                  style={{ background: `linear-gradient(135deg, ${a1}, ${a2})` }}>
                  <User size={14} className="text-black" />
                </div>
              </div>

              {isEditing ? (
                <div className="w-full max-w-[280px] space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--ct-muted, #71717a)' }}>Kullanıcı Adı</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm focus:outline-none focus:border-white/20"
                      style={{ color: 'var(--ct-text, #fff)' }}
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--ct-muted, #71717a)' }}>E-posta</label>
                    <input 
                      type="email"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm focus:outline-none focus:border-white/20"
                      style={{ color: 'var(--ct-text, #fff)' }}
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--ct-muted, #71717a)' }}>Telefon</label>
                    <input 
                      type="tel"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm focus:outline-none focus:border-white/20"
                      style={{ color: 'var(--ct-text, #fff)' }}
                      placeholder="+90 5XX XXX XX XX"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/[0.05] border border-white/[0.05] hover:bg-white/[0.1] transition-all"
                      style={{ color: 'var(--ct-text, #fff)' }}>
                      İptal
                    </button>
                    <button 
                      onClick={async () => {
                        // BUG-017 FIX: Validate username max length
                        if (editForm.username && editForm.username.length > 30) {
                          notify({ type: 'warning', title: 'Kullanıcı Adı Çok Uzun', message: 'Kullanıcı adı en fazla 30 karakter olabilir.' });
                          return;
                        }
                        try {
                          await updateUserProfile(editForm);
                          setIsEditing(false);
                          notify({ type: 'success', title: 'Başarılı', message: 'Profil bilgileriniz güncellendi.' });
                        } catch (err: any) {
                          console.error("Profile update failed:", err);
                          const errorMsg = err.message || "Bilinmeyen bir hata oluştu.";
                          notify({ 
                            type: 'warning', 
                            title: 'Hata', 
                            message: `Profil güncellenemedi: ${errorMsg}` 
                          });
                        }
                      }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                      style={{ background: a1, color: '#000' }}>
                      Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--ct-text, #fff)' }}>
                      {state.username || 'Madenci'}
                    </h2>
                    <div className="flex items-center justify-center gap-1.5 mt-1" style={{ color: 'var(--ct-muted, #71717a)' }}>
                      <Mail size={10} />
                      <p className="text-xs">{state.email || 'E-posta belirtilmemiş'}</p>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-1" style={{ color: 'var(--ct-muted, #71717a)' }}>
                      <Smartphone size={10} />
                      <p className="text-[10px]">{state.phone || 'Telefon belirtilmemiş'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setEditForm({
                        username: state.username,
                        email: state.email,
                        phone: state.phone
                      });
                      setIsEditing(true);
                    }}
                    className="px-6 py-2 rounded-full text-xs font-bold transition-all"
                    style={{ border: `1px solid ${a1}35`, color: a1, background: `${a1}08` }}>
                    Profili Düzenle
                  </button>
                </>
              )}
            </div>

            {/* Hesap Ayarları */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest px-2" style={{ color: 'var(--ct-muted, #71717a)' }}>Üyelik ve Durum</h3>
              <div className="rounded-3xl overflow-hidden"
                style={{ background: 'var(--ct-card-bg, rgba(10,10,10,0.8))', border: '1px solid rgba(255,255,255,0.05)' }}>
                
                {/* VIP Status */}
                <button onClick={() => onNavigate('vip')}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl" style={{ background: `${a1}14`, color: a1 }}>
                      <Crown size={18} />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium block" style={{ color: 'var(--ct-text, #fff)' }}>VIP Üyelik</span>
                      <span className="text-[10px]" style={{ color: 'var(--ct-muted, #888)' }}>
                        {state.vip?.isActive ? `${state.vip.tier === 'gold' ? 'Gold' : 'Silver'} Aktif` : 'Aktif değil'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--ct-muted, #888)' }} />
                </button>

                {/* Battle Pass */}
                <button onClick={() => onNavigate('battlepass')}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl" style={{ background: `${a2}14`, color: a2 }}>
                      <Star size={18} />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium block" style={{ color: 'var(--ct-text, #fff)' }}>Battle Pass</span>
                      <span className="text-[10px]" style={{ color: 'var(--ct-muted, #888)' }}>
                        Seviye {state.battlePass?.currentLevel || 0} · {state.battlePass?.isPremium ? 'Premium' : 'Ücretsiz'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--ct-muted, #888)' }} />
                </button>
              </div>
            </div>

            {/* Hesap Ayarları */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest px-2" style={{ color: 'var(--ct-muted, #71717a)' }}>Hesap Ayarları</h3>
              <div className="rounded-3xl overflow-hidden"
                style={{ background: 'var(--ct-card-bg, rgba(10,10,10,0.8))', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl" style={{ background: `${a3}18`, color: a3 }}><Globe size={18} /></div>
                    <span className="text-sm font-medium" style={{ color: 'var(--ct-text, #fff)' }}>Dil</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--ct-muted, #888)' }}>Türkçe</span>
                    <ChevronRight size={16} style={{ color: 'var(--ct-muted, #888)' }} />
                  </div>
                </button>
                <div className="w-full px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-white/10">
                      <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium block" style={{ color: 'var(--ct-text, #fff)' }}>Google</span>
                      <span className="text-[10px] font-bold" style={{ color: a1 }}>Bağlandı</span>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold hover:bg-white/10 transition-all"
                    style={{ color: 'var(--ct-text, #fff)' }}>
                    Bağlantıyı Kes
                  </button>
                </div>
              </div>
            </div>

            {/* Destek */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest px-2" style={{ color: 'var(--ct-muted, #71717a)' }}>Destek ve Bilgi</h3>
              <div className="rounded-3xl overflow-hidden"
                style={{ background: 'var(--ct-card-bg, rgba(10,10,10,0.8))', border: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { Icon: Heart,         label: 'Bize Destek Olun',    color: a1 },
                  { Icon: MessageSquare, label: 'Bize Ulaşın',         color: a2 },
                  { Icon: FileText,      label: 'Şartlar ve Koşullar', color: a3 },
                  { Icon: Shield,        label: 'Gizlilik Politikası', color: a1 },
                ].map(({ Icon, label, color }, i, arr) => (
                  <button key={label} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    onClick={() => handleSupportLink(label)}
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl" style={{ background: `${color}14`, color }}><Icon size={18} /></div>
                      <span className="text-sm font-medium" style={{ color: 'var(--ct-text, #fff)' }}>{label}</span>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--ct-muted, #888)' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div className="rounded-3xl overflow-hidden"
              style={{ background: 'var(--ct-card-bg, rgba(10,10,10,0.8))', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                key="Oturumu Kapat"
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-red-500/5 transition-colors group"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onClick={handleLogout}
              >
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                  <LogOut size={18} />
                </div>
                <span className="text-sm font-bold text-red-500">Oturumu Kapat</span>
              </button>
              <button
                key="Hesabı Sil"
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-red-500/5 transition-colors group"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                  <Trash2 size={18} />
                </div>
                <span className="text-sm font-bold text-red-500">Hesabı Sil</span>
              </button>
            </div>

            {/* Delete Confirm Dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
                <div className="rounded-3xl p-6 space-y-4 max-w-sm w-full"
                  style={{ background: 'var(--ct-card-bg, #111)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-base font-black text-red-500 uppercase tracking-tight">Hesabı Sil</h3>
                  <p className="text-sm text-zinc-400">Bu işlem geri alınamaz. Tüm verileriniz, BTC bakiyeniz ve ilerlemeleriniz kalıcı olarak silinecektir.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 rounded-2xl text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                      style={{ color: 'var(--ct-text, #fff)' }}
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                      className="flex-1 py-3 rounded-2xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                      {isDeletingAccount ? 'Siliniyor...' : 'Evet, Sil'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center py-3">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--ct-muted, #555)' }}>
                {theme.emoji} {theme.name} · v2.4.0

              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
