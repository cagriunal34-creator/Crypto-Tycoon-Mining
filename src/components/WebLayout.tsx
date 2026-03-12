import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WebSidebar from './WebSidebar';
import AmbientBackground from './AmbientBackground';
import ParticleBackground from './ParticleBackground';
import ScanlineOverlay from './ScanlineOverlay';
import FeverOverlay from './FeverOverlay';
import { useGame } from '../context/GameContext';

interface WebLayoutProps {
  children: React.ReactNode;
  activeScreen: string;
  onNavigate: (screen: any) => void;
}

const WebLayout: React.FC<WebLayoutProps> = ({ children, activeScreen, onNavigate }) => {
  const { state } = useGame();

  return (
    <div className="min-h-screen bg-[#020202] text-white flex overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <AmbientBackground />
        <ParticleBackground />
        <ScanlineOverlay />
        <FeverOverlay />
        
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-[var(--ct-sidebar-width)] w-[600px] h-[600px] bg-blue-500/5 blur-[100px] rounded-full translate-y-1/2" />
      </div>

      {/* Sidebar */}
      <WebSidebar activeScreen={activeScreen} onNavigate={onNavigate} />

      {/* Content Area */}
      <main className="flex-1 ml-[var(--ct-sidebar-width)] relative z-10 h-screen overflow-y-auto no-scrollbar pt-8 pb-12">
        <div className="max-w-6xl mx-auto px-8">
          {/* Header Area */}
          <header className="mb-10 flex items-end justify-between">
            <div>
              <motion.h2 
                key={activeScreen}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-black tracking-tighter uppercase italic text-white"
              >
                {activeScreen === 'panel' ? 'Dashboard' : 
                 activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1)}
              </motion.h2>
              <p className="text-zinc-500 text-sm font-bold mt-1 tracking-wide">
                Crypto Tycoon Mining v3.0 · <span className="text-emerald-500">Çevrimiçi</span>
              </p>
            </div>
            
            {/* Quick Stats Bar */}
            <div className="flex gap-4">
              <div className="premium-glass px-6 py-3 rounded-2xl border border-white/5 flex flex-col items-center min-w-[140px]">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Hashrate</span>
                <span className="text-xl font-black text-white italic">{state.totalHashRate} GH/s</span>
              </div>
              <div className="premium-glass px-6 py-3 rounded-2xl border border-white/5 flex flex-col items-center min-w-[140px]">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">TP Puanı</span>
                <span className="text-xl font-black text-emerald-400 italic">{state.tycoonPoints}</span>
              </div>
            </div>
          </header>

          {/* Main Content Grid */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WebLayout;
