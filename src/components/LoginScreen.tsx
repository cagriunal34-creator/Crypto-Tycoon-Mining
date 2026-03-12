import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle } from '../lib/firebase';
import { LogIn, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Bitti — onAuthStateChanged GameContext'te session'ı yakalar
    } catch (err: any) {
      console.error('Login Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Giriş penceresi kapatıldı. Tekrar deneyin.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup engellendi. Tarayıcı ayarlarından popup\'a izin verin.');
      } else {
        setError(err.message || 'Giriş yapılamadı.');
      }
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
        <div className="relative p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-8">
            {/* Logo */}
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
                className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold"
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
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Giriş Yapılıyor...</span>
                  </>
                ) : (
                  <>
                    {/* Google Icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Google ile Giriş Yap</span>
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="pt-4 border-t border-white/5 w-full flex flex-col gap-2">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                Güvenli Giriş · Firebase Auth · Supabase Cloud
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-6">
          <div className="flex items-center gap-2 opacity-30 hover:opacity-60 transition-all">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[8px] font-black text-white uppercase tracking-tighter">V3.0 Evolution</span>
          </div>
          <div className="flex items-center gap-2 opacity-30 hover:opacity-60 transition-all">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[8px] font-black text-white uppercase tracking-tighter">Firebase Auth</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
