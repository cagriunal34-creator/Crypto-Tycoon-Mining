import React from 'react';
import { 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'withdraw' | 'package';
  data?: any;
}

export default function SuccessModal({ isOpen, onClose, type, data }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
      >
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Success Icon */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="relative w-24 h-24 mx-auto"
          >
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-emerald-500/10 border-4 border-emerald-500 flex items-center justify-center text-emerald-500">
              <CheckCircle size={48} />
            </div>
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">İşlem Başarılı!</h2>
            <p className="text-sm text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
              {type === 'withdraw' 
                ? 'BTC transfer talebiniz alındı ve işleme konuldu.'
                : 'Yeni madencilik paketiniz başarıyla aktif edildi. Kazançlarınız artmaya başladı.'}
            </p>
          </div>

          {type === 'withdraw' ? (
            <div className="glass-card rounded-3xl p-6 space-y-6 text-left">
              <div className="text-center space-y-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Toplam Tutar</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black">0.0054</span>
                  <span className="text-lg font-bold text-emerald-500">BTC</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cüzdan Adresi</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400 truncate pr-4">3FZbg129cpjq...QGg</span>
                    <Copy size={14} className="text-zinc-500 shrink-0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">İşlem Kimliği (TXID)</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-500 truncate pr-4">f4184fc5...a3c2</span>
                    <ExternalLink size={14} className="text-zinc-500 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-6 space-y-6">
              <div className="relative rounded-2xl overflow-hidden aspect-video">
                <img 
                  src="https://picsum.photos/seed/mining-rig/600/400" 
                  alt="" 
                  className="w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500 text-black text-[8px] font-black rounded uppercase tracking-widest">
                  Active
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Toplam Hız</p>
                  <p className="text-2xl font-black">5000 <span className="text-xs text-zinc-500 font-bold uppercase">Gh/s</span></p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <p className="text-[8px] font-black uppercase tracking-widest">Artış Oranı</p>
                  <p className="text-xs font-bold">+15%</p>
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 font-bold hover:bg-white/10 transition-all"
          >
            {type === 'withdraw' ? 'Ana Sayfaya Dön' : 'Madenciliğe Başla'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
