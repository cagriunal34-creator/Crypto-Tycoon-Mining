import React, { useState } from 'react';
import {
  X,
  Wallet,
  QrCode,
  AlertTriangle,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { supabase, TABLES } from '../lib/supabase';
import { useGame } from '../context/GameContext';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  balance: number;
}

export default function WithdrawModal({ isOpen, onClose, onSuccess, balance }: WithdrawModalProps) {
  const { state, dispatch } = useGame();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; address?: string }>({});
  const fee = 0.00005;
  const total = Math.max(0, parseFloat(amount || '0') - fee);
  const MIN_AMOUNT = 0.001;

  // BTC adres regex: Legacy (1...), P2SH (3...) veya Bech32 (bc1...)
  const BTC_ADDRESS_REGEX = /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{6,87})$/;

  const validate = () => {
    const newErrors: { amount?: string; address?: string } = {};
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Geçerli bir tutar girin.';
    } else if (numAmount < MIN_AMOUNT) {
      newErrors.amount = `Minimum çekim tutarı ${MIN_AMOUNT} BTC.`;
    } else if (numAmount > balance) {
      newErrors.amount = 'Bakiyeniz yetersiz.';
    }
    if (!address.trim()) {
      newErrors.address = 'Cüzdan adresi gerekli.';
    } else if (!BTC_ADDRESS_REGEX.test(address.trim())) {
      newErrors.address = 'Geçersiz BTC adresi formatı.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSubmitting || !state.user) return;

    setIsSubmitting(true);
    try {
      const numAmount = parseFloat(amount);

      // 1. Create Withdrawal Request
      await supabase.from(TABLES.WITHDRAWALS).insert({
        user_id: state.user.id,
        username: state.username,
        amount: numAmount,
        address: address.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // 2. Add to User Transactions (for their history)
      await supabase.from(TABLES.TRANSACTIONS).insert({
        user_id: state.user.id,
        amount: -numAmount,
        type: 'transfer_out',
        description: 'BTC Çekim Talebi',
        timestamp: new Date().toISOString()
      });

      dispatch({
        type: 'REMOVE_BTC',
        amount: numAmount,
        label: 'BTC Çekim Talebi',
        txId: `wd-${Date.now()}`
      });

      // 3. Update Profile Balance Immediately (Persistence)
      const newBalance = Math.max(0, balance - numAmount);
      await supabase.from(TABLES.PROFILES)
        .update({ btcBalance: newBalance })
        .eq('id', state.user.id);

      onSuccess();
    } catch (error) {
      console.error("Çekim hatası:", error);
      setErrors({ amount: 'İşlem sırasında bir hata oluştu.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-t-[32px] p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">BTC Çek</h2>
            <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-zinc-400">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Balance Info */}
            <div className="text-center space-y-1">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Kullanılabilir Bakiye</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-black">{balance}</span>
                <span className="text-xl font-bold text-emerald-500">BTC</span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Çekilecek Tutar</label>
                <span className="text-[10px] text-zinc-500 font-mono">Min: {MIN_AMOUNT} BTC</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: undefined })); }}
                  placeholder="0.00"
                  className={cn(
                    "w-full bg-white/5 border rounded-2xl p-4 text-lg font-bold outline-none transition-all",
                    errors.amount ? "border-red-500/60 focus:border-red-500" : "border-white/10 focus:border-emerald-500/50"
                  )}
                />
                <button
                  onClick={() => setAmount(balance.toString())}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest"
                >
                  MAX
                </button>
              </div>
              {errors.amount && <p className="text-[10px] text-red-400 font-bold">{errors.amount}</p>}
            </div>

            {/* Address Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Harici Cüzdan Adresi</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Wallet size={18} />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setErrors(prev => ({ ...prev, address: undefined })); }}
                    placeholder="Adres yapıştırın veya taratın"
                    className={cn(
                      "w-full bg-white/5 border rounded-2xl p-4 pl-12 text-xs font-medium outline-none transition-all",
                      errors.address ? "border-red-500/60 focus:border-red-500" : "border-white/10 focus:border-emerald-500/50"
                    )}
                  />
                </div>
                <button className="p-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-400">
                  <QrCode size={20} />
                </button>
              </div>
              {errors.address && <p className="text-[10px] text-red-400 font-bold">{errors.address}</p>}
            </div>

            {/* Fee Info */}
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500 font-bold uppercase tracking-widest">Ağ Ücreti (Fee)</span>
                <span className="font-mono font-bold">{fee} BTC</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500 font-bold uppercase tracking-widest">Tahmini Süre</span>
                <span className="font-mono font-bold">~10-30 Dk</span>
              </div>
              <div className="pt-3 border-t border-white/5 flex justify-between items-end">
                <span className="text-xs font-bold">Toplam Çekim</span>
                <div className="text-right">
                  <p className="text-lg font-black text-emerald-500">{total.toFixed(8)} BTC</p>
                  <p className="text-[10px] text-zinc-500">≈ {(total * 91000).toFixed(2)} USD</p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex gap-3 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
              <AlertTriangle size={18} className="text-yellow-500 shrink-0" />
              <p className="text-[10px] text-yellow-500/80 leading-relaxed">
                Lütfen girilen cüzdan adresinin <b>BTC (Bitcoin)</b> ağına ait olduğundan emin olun. Yanlış ağa yapılan gönderimler geri alınamaz.
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                "w-full py-4 rounded-2xl text-black font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                isSubmitting ? "bg-emerald-500/50 cursor-not-allowed" : "bg-emerald-500 neon-glow hover:brightness-110"
              )}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>TRANSFERİ ONAYLA</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
