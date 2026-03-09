import React from 'react';
import { GameProvider } from './context/GameContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminPanel from './admin/AdminPortal';
import AmbientBackground from './components/AmbientBackground';

export default function AdminApp() {
    return (
        <ThemeProvider>
            <GameProvider>
                <NotificationProvider>
                    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
                        <AmbientBackground />
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                            <div className="w-full max-w-4xl h-[90vh] glass-panel overflow-hidden shadow-2xl border border-white/10">
                                <AdminPanel onClose={() => window.location.href = '/'} />
                            </div>
                        </div>
                    </div>
                </NotificationProvider>
            </GameProvider>
        </ThemeProvider>
    );
}
