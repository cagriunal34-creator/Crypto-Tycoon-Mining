import React, { useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import { NotificationProvider, useNotify } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminPanel from './admin/AdminPortal';
import AmbientBackground from './components/AmbientBackground';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { RefreshCw, ShieldAlert, Lock } from 'lucide-react';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<'loading' | 'unauthorized' | 'authorized'>('loading');
    const { notify } = useNotify();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setStatus('unauthorized');
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));

                if (userDoc.exists() && userDoc.data().isAdmin === true) {
                    setStatus('authorized');
                } else {
                    setStatus('unauthorized');
                    notify({ type: 'error', title: 'Yetkisiz Erişim', message: 'Bu sayfaya erişim yetkiniz yok.' });
                }
            } catch (error) {
                console.error("Auth guard error:", error);
                setStatus('unauthorized');
            }
        });

        return () => unsubscribe();
    }, [notify]);

    if (status === 'loading') {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-emerald-500 gap-4">
                <RefreshCw className="animate-spin" size={32} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sistem Yetkisi Doğrulanıyor...</span>
            </div>
        );
    }

    if (status === 'unauthorized') {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-black p-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                    <ShieldAlert className="text-red-500" size={40} />
                </div>
                <h1 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Erişim Reddedildi</h1>
                <p className="text-zinc-500 text-sm max-w-sm mb-8">
                    Admin paneline erişmek için yetkili bir hesapla giriş yapmış olmanız gerekmektedir.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-8 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                >
                    Ana Sayfaya Dön
                </button>
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
                            <div className="relative z-10 w-full h-screen flex flex-col">
                                <AdminPanel onClose={() => window.location.href = '/'} />
                            </div>
                        </div>
                    </AdminAuthGuard>
                </NotificationProvider>
            </GameProvider>
        </ThemeProvider>
    );
}
