import React from 'react';
import { 
  LayoutDashboard, ShoppingCart, FileText, Microscope, Award, 
  Wallet, Users, Shield, Box, RotateCcw, Star, Zap, Crown, 
  Bell, Settings, TrendingUp 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedNumber from './AnimatedNumber';

interface WebSidebarProps {
  activeScreen: string;
  onNavigate: (screen: any) => void;
}

const WebSidebar: React.FC<WebSidebarProps> = ({ activeScreen, onNavigate }) => {
  const { state } = useGame();
  const { theme } = useTheme();
  
  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];

  const navGroups = [
    {
      label: 'Ana Menü',
      items: [
        { id: 'panel', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'shop', label: 'Market', icon: ShoppingCart },
        { id: 'contracts', label: 'Kontratlar', icon: FileText },
        { id: 'research', label: 'Teknoloji', icon: Microscope },
        { id: 'quests', label: 'Görevler', icon: Award },
      ]
    },
    {
      label: 'Ekonomi & Sosyal',
      items: [
        { id: 'wallet', label: 'Cüzdan', icon: Wallet },
        { id: 'marketplace', label: 'Pazaryeri', icon: ShoppingCart },
        { id: 'referral', label: 'Referans', icon: Users },
        { id: 'guild', label: 'Lonca', icon: Shield },
      ]
    },
    {
      label: 'Sistem',
      items: [
        { id: 'farm', label: 'Madencilik Çiftliği', icon: Box },
        { id: 'infrastructure', label: 'Altyapı', icon: Zap },
        { id: 'wheel', label: 'Şans Çarkı', icon: RotateCcw },
        { id: 'battlepass', label: 'Battle Pass', icon: Star },
        { id: 'vip', label: 'VIP Üyelik', icon: Crown },
      ]
    }
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--ct-sidebar-width)] premium-glass border-r border-white/5 flex flex-col z-50">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-xl blur-lg opacity-40 animate-pulse" 
               style={{ background: `linear-gradient(135deg,${a1},${a2})` }} />
          <div className="relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
               style={{ background: `linear-gradient(135deg,${a1}30,${a2}25)`, border: `1px solid ${a1}40` }}>
            <TrendingUp size={20} style={{ color: a1 }} />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tighter text-white uppercase italic leading-none">Crypto</h1>
          <p className="text-[10px] font-black tracking-[0.2em] text-emerald-500 uppercase">Tycoon</p>
        </div>
      </div>

      {/* Profile Summary */}
      <div className="p-6 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black">
            {state.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-white">{state.username}</p>
            <p className="text-[10px] font-black text-emerald-500 uppercase">Lv.{state.level} Madenci</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-500 font-bold uppercase tracking-widest">BTC Bakiyesi</span>
            <span className="text-emerald-400 font-black">
              <AnimatedNumber value={state.btcBalance} precision={8} />
            </span>
          </div>
          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(state.xp / state.xpToNextLevel) * 100}%` }}
              className="h-full bg-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 no-scrollbar">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h3 className="px-4 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">{group.label}</h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative",
                    isActive ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-sidebar"
                      className="absolute left-0 w-1 h-5 bg-emerald-500 rounded-r-full"
                    />
                  )}
                  <Icon size={18} className={cn("transition-transform group-hover:scale-110", isActive && "text-emerald-500")} />
                  <span className="text-xs font-bold tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Nav */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <button 
          onClick={() => onNavigate('inbox')}
          className={cn(
            "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all",
            activeScreen === 'inbox' ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
          )}
        >
          <div className="flex items-center gap-3">
            <Bell size={18} />
            <span className="text-xs font-bold">Bildirimler</span>
          </div>
          {(state.inboxNotifications?.filter(n => !n.read).length || 0) > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border border-zinc-950">
              {state.inboxNotifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
        <button 
          onClick={() => onNavigate('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
            activeScreen === 'settings' ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
          )}
        >
          <Settings size={18} />
          <span className="text-xs font-bold">Ayarlar</span>
        </button>
      </div>
    </aside>
  );
};

export default WebSidebar;
