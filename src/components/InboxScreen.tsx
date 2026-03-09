import React from 'react';
import { 
  Bell, 
  Wallet, 
  Settings as SettingsIcon, 
  Zap, 
  Shield, 
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '../lib/utils';

const notifications = [
  {
    id: '1',
    title: 'Cüzdan Transferi Başarılı',
    desc: '0.05 BTC tutarındaki transferiniz blokzinciri ağında başarıyla...',
    time: '14:30',
    date: 'BUGÜN',
    icon: Wallet,
    color: 'text-emerald-500',
    isNew: true
  },
  {
    id: '2',
    title: 'Sistem Güncellemesi',
    desc: 'Uygulama bakımı bu gece saat 02:00’de gerçekleştirilecektir.',
    time: '11:00',
    date: 'DÜN',
    icon: SettingsIcon,
    color: 'text-zinc-400',
    isNew: false
  },
  {
    id: '3',
    title: 'Madencilik Ödülü',
    desc: 'Günlük madencilik ödülünüz hesabınıza eklendi. Kontrol...',
    time: '2 gün önce',
    date: 'GEÇEN HAFTA',
    icon: Zap,
    color: 'text-zinc-400',
    isNew: false
  },
  {
    id: '4',
    title: 'Yeni Giriş Tespit Edildi',
    desc: 'Hesabınıza yeni bir cihazdan (iPhone 15 Pro) giriş yapıldı.',
    time: '4 gün önce',
    date: 'GEÇEN HAFTA',
    icon: Shield,
    color: 'text-zinc-400',
    isNew: false
  }
];

export default function InboxScreen() {
  const groups = notifications.reduce((acc, note) => {
    if (!acc[note.date]) acc[note.date] = [];
    acc[note.date].push(note);
    return acc;
  }, {} as Record<string, typeof notifications>);

  return (
    <div className="space-y-6 pt-2 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight">Gelen Kutusu</h2>
        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <MoreHorizontal size={20} className="text-zinc-500" />
        </button>
      </div>

      <div className="space-y-8">
        {Object.entries(groups).map(([date, notes]) => (
          <div key={date} className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{date}</h3>
              {date === 'BUGÜN' && (
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">1 YENİ</span>
              )}
            </div>
            
            <div className="space-y-3">
              {notes.map((note) => (
                <button 
                  key={note.id} 
                  className="w-full glass-card rounded-3xl p-5 flex items-start gap-4 text-left hover:bg-white/5 transition-all group"
                >
                  <div className="relative">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center transition-all group-hover:scale-110",
                      note.color
                    )}>
                      <note.icon size={24} fill={note.isNew ? "currentColor" : "none"} />
                    </div>
                    {note.isNew && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050505]" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold">{note.title}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono">{note.time}</span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{note.desc}</p>
                  </div>
                  
                  <div className="self-center">
                    <ChevronRight size={16} className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
