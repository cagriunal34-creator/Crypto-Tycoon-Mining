import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { LogIn, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginScreen: React.FC = () => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        setError(null);
        try {
            const redirectUrl = window.location.origin + window.location.pathname;
            console.info("🚀 Starting Google Login. Redirect URL:", redirectUrl);
            
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        prompt: 'select_account', // Force account selection to avoid auto-login issues
                        access_type: 'offline',
                    }
                }
            });
            if (authError) throw authError;
        } catch (err: any) {
            console.error("❌ Login Error:", err);
            setError(err.message || "Giriş yapılamadı.");
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050505] flex items-center justify-center p-6 z-[9999]">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="relative w-full max-w-md"
            >
                {/* Glass Card */}
                <div className="relative p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full" />

                    <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                        {/* Logo/Icon */}
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-blue-500 p-0.5 shadow-lg shadow-emerald-500/20">
                            <div className="w-full h-full rounded-[1.4rem] bg-[#050505] flex items-center justify-center">
                                <ShieldCheck className="text-emerald-400" size={40} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                                CryptoTycoon <Sparkles className="text-emerald-400" size={20} />
                            </h1>
                            <p className="text-zinc-500 text-sm font-medium">
                                Maden imparatorluğuna giriş yapın ve <br /> gerçek zamanlı yönetime başlayın.
                            </p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoggingIn}
                            className="group relative w-full py-4 bg-white text-black font-black rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-xl shadow-white/5"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {isLoggingIn ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        <span>Google ile Giriş Yap</span>
                                    </>
                                )}
                            </div>

                            {/* Hover Gradient Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <div className="pt-4 border-t border-white/5 w-full">
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                Güvenli Giriş & Bulut Senkronizasyonu
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Labels */}
                <div className="mt-8 flex justify-center gap-6">
                    <div className="flex items-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">V3.0 Evolution</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">Secured by Supabase</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
