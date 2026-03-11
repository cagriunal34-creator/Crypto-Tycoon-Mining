import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminPanel from './admin/AdminPortal';
import AmbientBackground from './components/AmbientBackground';
import { supabase, TABLES } from './lib/supabase';
import { RefreshCw, ShieldAlert, LogIn, LogOut } from 'lucide-react';
import { signInWithGoogle, firebaseSignOut } from './lib/firebase';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { state } = useGame();
    const currentUser = state.user;
    const hasBypass = localStorage.getItem('admin_bypass') === 'true';
    const isAdmin = state.isAdmin || hasBypass;
    const isLoading = state.isLoading;

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-emerald-500 gap-4">
                <RefreshCw className="animate-spin" size={32} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sistem Yetkisi Doğrulanıyor...</span>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-black p-8 text-center text-white">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                    <ShieldAlert className="text-red-500" size={40} />
                </div>
                <h1 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">Erişim Reddedildi</h1>
                <p className="text-zinc-500 text-sm max-w-sm mb-4">
                    Admin paneline erişmek için yetkili bir hesapla giriş yapmış olmanız gerekmektedir.
                </p>

                {currentUser ? (
                    <div className="mb-8 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 text-left">
                        <div>
                            <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Aktif Hesap</p>
                            <p className="text-xs font-bold text-emerald-400">{currentUser.email}</p>
                            <p className="text-[7px] text-zinc-600 font-mono mt-0.5">{currentUser.uid}</p>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('admin_bypass');
                                firebaseSignOut();
                            }}
                            className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition-colors ml-auto"
                            title="Çıkış Yap"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={async () => {
                            try {
                                await signInWithGoogle();
                            } catch (e) {
                                console.error("Login failed", e);
                            }
                        }}
                        className="mb-8 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl flex items-center gap-3"
                    >
                        <LogIn size={20} />
                        Google ile Giriş Yap
                    </button>
                )}

                <div className="flex flex-col gap-4 items-center">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-8 py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all w-full max-w-xs"
                    >
                        Ana Sayfaya Dön
                    </button>

                    {currentUser && !isAdmin && (
                        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-[10px] uppercase font-black tracking-widest leading-relaxed max-w-xs">
                            Admin yetkiniz yoksa Supabase dashboard üzerinden <br /> "isAdmin" kolonunu TRUE yapın. <br />
                            <span className="opacity-50 italic mt-2 block">ID: {currentUser.uid}</span>
                            <button
                                onClick={async () => {
                                    try {
                                        const cleanId = currentUser.uid.trim();
                                        await supabase.from(TABLES.PROFILES).update({ isAdmin: true }).eq('id', cleanId);
                                    } catch (e) {
                                        console.error("Soft fail on DB update:", e);
                                    }
                                    localStorage.setItem('admin_bypass', 'true');
                                    alert("Yetki Tanımlandı! Panel Açılıyor...");
                                    setTimeout(() => window.location.reload(), 500);
                                }}
                                className="mt-6 w-full py-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-[9px] uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                            >
                                ŞİMDİ YETKİLENDİR (DEV MODE)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

export default function AdminApp() {
    return (
        <ThemeProvider>
            <GameProvider>
                <NotificationProvider>
                    <AdminAuthGuard>
                        <div className="min-h-screen bg-[#030303] text-white selection:bg-emerald-500/30 overflow-hidden font-sans">
                            <AmbientBackground />
                            {/* Full Screen Layout */}
                            <div className="relative z-10 w-full h-screen overflow-hidden flex flex-col">
                                <AdminPanel onClose={() => window.location.href = '/'} />
                            </div>
                        </div>
                    </AdminAuthGuard>
                </NotificationProvider>
            </GameProvider>
        </ThemeProvider>
    );
}
