/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Suspense } from 'react';
import {
  LayoutDashboard, Wallet, Settings, Bell, FileText,
  TrendingUp, Award, RotateCcw, Users, Box, Menu, X,
  Star, ShoppingCart, Crown, Shield, Zap, RefreshCw, Microscope, Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdRewardModal from './components/AdRewardModal';
import { LoginScreen } from './components/LoginScreen';
import { db, requestForToken, onMessageListener } from './lib/firebase';
import { doc, getDoc, setDoc, collection, query, orderBy, limit } from 'firebase/firestore';
const NewsTicker = React.lazy(() => import('./components/NewsTicker'));
import { Screen, MarketListing, Guild, Transaction } from './types';
import { cn } from './lib/utils';
import { GameProvider, useGame } from './context/GameContext';
import { NotificationProvider, useNotify } from './context/NotificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { INITIAL_STATE } from './context/GameContext'; // Assuming INITIAL_STATE is exported from GameContext

import AmbientBackground from './components/AmbientBackground';
import ParticleBackground from './components/ParticleBackground';
import FlyingEffect from './components/FlyingEffect';
import ScanlineOverlay from './components/ScanlineOverlay';
import AnimatedNumber from './components/AnimatedNumber';
import FeverOverlay from './components/FeverOverlay';
import LoginStreak from './components/LoginStreak';
import OfflineEarningsHandler from './components/OfflineEarningsHandler';
import MiningPanel from './components/MiningPanel';
import MiningShop from './components/MiningShop';
import ContractsScreen from './components/ContractsScreen';
import WalletScreen from './components/WalletScreen';
import SocialScreen from './components/SocialScreen';
import SettingsScreen from './components/SettingsScreen';
import InboxScreen from './components/InboxScreen';
import QuestsScreen from './components/QuestsScreen';
import MiningFarm from './components/MiningFarm';
import ResearchTree from './components/ResearchTree';
import LuckyWheel from './components/LuckyWheel';
import WithdrawModal from './components/WithdrawModal';
import SuccessModal from './components/SuccessModal';
// Phase 1 new components
import OfflineEarningsModal from './components/OfflineEarningsModal';
import PrestigeModal from './components/PrestigeModal';
// Phase 2 new screens
import BattlePassScreen from './components/BattlePassScreen';
import MarketplaceScreen from './components/MarketplaceScreen';
import VIPScreen from './components/VIPScreen';
// import AdminPanel from './components/AdminPanel';
import HackerAttack from './components/HackerAttack';
import { InfrastructureScreen } from './components/InfrastructureScreen';


function AppInner() {
  const { state, dispatch } = useGame();
  const { notify } = useNotify();
  const { theme } = useTheme();

  if (!state) return null; // Safety guard for context initialization

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const [activeScreen, setActiveScreen] = useState<Screen>('panel');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; type: 'withdraw' | 'package' }>({ isOpen: false, type: 'withdraw' });
  const [showHackerAttack, setShowHackerAttack] = useState(false);

  // Trigger Hacker Attack randomly
  useEffect(() => {
    const id = setInterval(() => {
      if (activeScreen === 'panel' && Math.random() < 0.05) { // 5% chance every 2 min
        setShowHackerAttack(true);
      }
    }, 120000); // Check every 2 min
    return () => clearInterval(id);
  }, [activeScreen]);

  // 🕒 Interstitial Ad Logic (Auto Popup)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // Trigger if interval met AND not already watching/menu
      if (state && state.lastInterstitialAdAt !== undefined &&
        Date.now() - state.lastInterstitialAdAt >= (state.interstitialAdInterval || 300000) &&
        !isWatchingAd && !menuOpen) {
        setIsWatchingAd(true);
        dispatch({ type: 'RESET_INTERSTITIAL_TIMER' });
      }
    }, 5000); // Check every 5s for performance

    return () => clearInterval(checkInterval);
  }, [state.lastInterstitialAdAt, state.interstitialAdInterval, isWatchingAd, menuOpen, dispatch]);

  const handleHackerSuccess = () => {
    setShowHackerAttack(false);
    dispatch({ type: 'ADD_TP', amount: 500 });
    notify({ type: 'success', title: 'SİSTEM KORUNDU!', message: 'Hacker püskürtüldü. +500 TP kazandın.' });
  };

  const handleHackerFailure = () => {
    setShowHackerAttack(false);
    dispatch({ type: 'REMOVE_ENERGY_CELLS', amount: 5 });
    notify({ type: 'warning', title: 'SİSTEM ÇÖKTÜ!', message: 'Hacker içeri girdi. Enerji kaybı yaşandı.' });
  };

  const handleWithdrawSuccess = () => {
    setIsWithdrawOpen(false);
    setSuccessModal({ isOpen: true, type: 'withdraw' });
    notify({ type: 'success', title: 'Talep Alındı!', message: 'Çekim talebiniz işleme alınmıştır.' });
  };

  const handlePackageSuccess = () => {
    setSuccessModal({ isOpen: true, type: 'package' });
    notify({ type: 'success', title: 'Paket Satın Alındı!', message: 'Hashrate güncellendi.' });
  };

  const handleWatchAd = () => {
    setIsWatchingAd(true);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'panel': return <MiningPanel onOpenContracts={() => setActiveScreen('shop')} onWatchAd={handleWatchAd} onOpenPrestige={() => setIsPrestigeOpen(true)} onNavigate={(screen) => setActiveScreen(screen as Screen)} />;
      case 'shop': return <MiningShop onPurchaseSuccess={handlePackageSuccess} onWatchAd={handleWatchAd} />;
      case 'contracts': return <ContractsScreen />;
      case 'wallet': return <WalletScreen onOpenWithdraw={() => setIsWithdrawOpen(true)} />;
      case 'referral': return <SocialScreen />;
      case 'settings': return <SettingsScreen onNavigate={(screen) => setActiveScreen(screen as Screen)} />;
      case 'inbox': return <InboxScreen />;
      case 'quests': return <QuestsScreen />;
      case 'farm': return <MiningFarm />;
      case 'wheel': return <LuckyWheel />;
      case 'battlepass': return <BattlePassScreen />;
      case 'marketplace': return <MarketplaceScreen />;
      case 'vip': return <VIPScreen />;
      case 'infrastructure': return <InfrastructureScreen />;
      case 'research': return <ResearchTree />;
      default: return <MiningPanel onOpenContracts={() => setActiveScreen('contracts')} onWatchAd={handleWatchAd} onOpenPrestige={() => setIsPrestigeOpen(true)} onNavigate={(screen) => setActiveScreen(screen as Screen)} />;
    }
  };

  const primaryNav = [
    { id: 'panel', label: 'Panel', icon: LayoutDashboard },
    { id: 'shop', label: 'Market', icon: ShoppingCart },
    { id: 'contracts', label: 'Kontrat', icon: FileText },
    { id: 'research', label: 'Gelişim', icon: Microscope },
    { id: 'quests', label: 'Görevler', icon: Award },
    { id: 'wallet', label: 'Cüzdan', icon: Wallet },
    { id: 'referral', label: 'Sosyal', icon: Users },
  ];

  const secondaryNav = [
    { id: 'farm', label: 'Çiftlik', icon: Box },
    { id: 'wheel', label: 'Çark', icon: RotateCcw },
    { id: 'battlepass', label: 'Battle Pass', icon: Star },
    { id: 'marketplace', label: 'Pazaryeri', icon: ShoppingCart },
    { id: 'infrastructure', label: 'Altyapı', icon: Zap },
    { id: 'vip', label: 'VIP', icon: Crown },
    { id: 'inbox', label: 'Gelen Kutusu', icon: Bell },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  const navigate = (id: string) => { setActiveScreen(id as Screen); setMenuOpen(false); };

  // 🔐 Auth logic moved to GameContext (Supabase)
  useEffect(() => {
    if (state.user) {
      const initFirebaseExtras = async () => {
        try {
          // Initialize FCM
          const token = await requestForToken();
          if (token) {
            await setDoc(doc(db, 'users', state.user.id), { fcmToken: token }, { merge: true });
          }

          // Listen for foreground messages
          onMessageListener((payload: any) => {
            notify({
              type: 'info',
              title: payload.notification?.title || 'Bildirim',
              message: payload.notification?.body || 'Yeni bir mesajınız var.'
            });
          });
        } catch (error) {
          console.warn("FCM or Firebase sync failed, but continuing app:", error);
        }
      };

      initFirebaseExtras();
    }
  }, [state.user, notify]);

  // 💾 User state is now managed by Supabase (GameContext)
  // Firebase syncing removed to prevent data conflicts

  // 🕒 5s Tick (for earnings and effects)

  // 1. Dedicated Callback Screen (MUST BE FIRST)
  if (window.location.pathname === '/auth/callback') {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto items-center justify-center text-blue-400 bg-zinc-950">
        <RefreshCw className="animate-spin text-blue-400" size={40} />
        <p className="mt-4 text-zinc-500 text-xs uppercase tracking-widest font-black italic">Giriş tamamlanıyor...</p>
      </div>
    );
  }

  // 2. Initial Global Loading
  if (state.isLoading) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto items-center justify-center text-emerald-500 bg-zinc-900">
        <RefreshCw className="animate-spin" size={48} />
        <span className="mt-4 text-sm font-black uppercase tracking-[0.2em]">Oturum Kontrol Ediliyor...</span>
      </div>
    );
  }

  if (!state.user) {
    return <LoginScreen />;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto overflow-hidden relative"
      style={{ background: 'var(--ct-bg, #030303)' }}>

      <AmbientBackground />
      <Suspense fallback={null}>
        {state.announcement && <NewsTicker announcement={state.announcement} />}
      </Suspense>

      {/* 🛠️ Maintenance Overlay */}
      <AnimatePresence>
        {state.isMaintenance && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-zinc-950 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute inset-0 bg-[#10b98110] blur-[100px] rounded-full" />
            </div>

            <div className="relative">
              <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 animate-pulse">
                <Settings className="text-emerald-500" size={48} />
              </div>
              <motion.div
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg"
              >
                BAKIMDA
              </motion.div>
            </div>

            <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase italic">Sistem Bakımı</h2>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-[280px]">
              Daha iyi bir deneyim için şu an çalışıyoruz. Lütfen kısa süre sonra tekrar deneyin.
            </p>

            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Hazırlanıyor...</span>
              </div>

              {/* Hidden Admin Access Trigger for Devs */}
              <button
                onClick={() => window.location.href = '/admin.html'}
                className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.3em] hover:text-zinc-700 transition-colors"
              >
                Admin Control Access
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isWatchingAd && (
        <AdRewardModal isOpen={isWatchingAd} onClose={() => setIsWatchingAd(false)} />
      )}

      <AnimatePresence>
        {showHackerAttack && (
          <HackerAttack onSuccess={handleHackerSuccess} onFailure={handleHackerFailure} />
        )}
      </AnimatePresence>

      {/* ── Overflow Menu ──────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm rounded-3xl p-4 shadow-2xl backdrop-blur-xl"
              style={{ background: `${theme.vars['--ct-surface']}F5`, border: `1px solid ${a1}20` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--ct-muted)' }}>Diğer Ekranlar</p>
              <div className="grid grid-cols-2 gap-2">
                {secondaryNav.map(item => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  return (
                    <button key={item.id} onClick={() => navigate(item.id)}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all text-left"
                      style={{
                        background: isActive ? `${a1}12` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isActive ? a1 + '30' : 'rgba(255,255,255,0.06)'}`,
                        color: isActive ? a1 : 'var(--ct-muted)',
                      }}>
                      <Icon size={18} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ParticleBackground />
      <FlyingEffect />
      <ScanlineOverlay />
      <FeverOverlay />
      <LoginStreak />
      <OfflineEarningsHandler />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 sticky top-0 z-50 backdrop-blur-xl relative"
        style={{ background: `${theme.vars['--ct-bg']}CC`, borderBottom: `1px solid ${a1}12` }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${a1}70, ${a2}60, transparent)` }} />
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-xl blur-md opacity-50"
              style={{ background: `linear-gradient(135deg,${a1},${a2})` }} />
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg,${a1}30,${a2}25)`, border: `1px solid ${a1}40` }}>
              <TrendingUp size={18} style={{ color: a1 }} />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold" style={{ color: 'var(--ct-text)' }}>{state.username}</h1>
            <div className="flex items-center gap-2">
              <p className="text-[9px] font-mono" style={{ color: 'var(--ct-muted)' }}>
                ID: {state.userId} · Lv.{state.level}
                {state.prestigeLevel > 0 && <span style={{ color: a1 }}> · P{state.prestigeLevel}</span>}
              </p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ml-2">
                <span className="text-[10px] font-black text-emerald-400">
                  <AnimatedNumber value={state.btcBalance} precision={8} />
                </span>
                <span className="text-[8px] font-black text-emerald-500/60 uppercase">BTC</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Ad Reward Trigger */}
          <button
            onClick={handleWatchAd}
            className="p-2 rounded-full hover:bg-white/5 transition-colors relative group"
            title="Ödüllü Reklam İzle"
          >
            <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Gift size={18} className="text-emerald-500 relative z-10" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-900 animate-pulse" />
          </button>

          <button onClick={() => navigate('inbox')} className="p-2 rounded-full hover:bg-white/5 transition-colors relative">
            <Bell size={18} style={{ color: activeScreen === 'inbox' ? a1 : 'var(--ct-muted)' }} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full border"
              style={{ background: a1, boxShadow: `0 0 6px ${a1}`, borderColor: 'var(--ct-bg)' }} />
          </button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-28 px-4 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={activeScreen}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}>
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom Nav ─────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-2 py-2 z-50 backdrop-blur-xl"
        style={{ background: `${theme.vars['--ct-bg']}EE`, borderTop: `1px solid ${a1}12` }}>
        <div className="flex items-center justify-around">
          {primaryNav.map(item => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button key={item.id} onClick={() => setActiveScreen(item.id as Screen)}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200"
                style={{ color: isActive ? a1 : 'var(--ct-muted)' }}>
                <div className="p-1.5 rounded-xl transition-all duration-200"
                  style={{ background: isActive ? `${a1}14` : 'transparent' }}>
                  <Icon size={20} />
                </div>
                <span className="text-[9px] font-bold">{item.label}</span>
                {isActive && (
                  <motion.div layoutId="nav-indicator" className="w-1 h-1 rounded-full"
                    style={{ background: a1, boxShadow: `0 0 6px ${a1}` }} />
                )}
              </button>
            );
          })}
          <button onClick={() => setMenuOpen(v => !v)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200"
            style={{ color: menuOpen ? a1 : 'var(--ct-muted)' }}>
            <div className="p-1.5 rounded-xl" style={{ background: menuOpen ? `${a1}14` : 'transparent' }}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </div>
            <span className="text-[9px] font-bold">Daha Fazla</span>
          </button>
        </div>
      </nav>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} onSuccess={handleWithdrawSuccess} balance={state.btcBalance} />
      <SuccessModal isOpen={successModal.isOpen} onClose={() => setSuccessModal({ ...successModal, isOpen: false })} type={successModal.type} />

      {/* Phase 1 modals */}
      {state.pendingOfflineEarnings > 0 && !state.offlineEarningsShown && (
        <OfflineEarningsModal
          earnings={state.pendingOfflineEarnings}
          onClose={() => dispatch({ type: 'DISMISS_OFFLINE_EARNINGS' })}
        />
      )}
      <PrestigeModal isOpen={isPrestigeOpen} onClose={() => setIsPrestigeOpen(false)} />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GameProvider>
        <NotificationProvider>
          <AppInner />
        </NotificationProvider>
      </GameProvider>
    </ThemeProvider>
  );
}
