import React, { useState } from 'react';
import {
  Dices,
  Zap,
  Gift,
  Trophy,
  Coins,
  Play,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';
import CoinShower from './CoinShower';

interface Reward {
  id: number;
  label: string;
  type: 'speed' | 'btc' | 'tp' | 'badge';
  value: string;
  color: string;
}

const rewards: Reward[] = [
  { id: 0, label: '2x Hız', type: 'speed', value: '1 Saat', color: '#10b981' },
  { id: 1, label: '500 TP', type: 'tp', value: '500', color: '#3b82f6' },
  { id: 2, label: '0.00001 BTC', type: 'btc', value: '0.00001', color: '#f59e0b' },
  { id: 3, label: 'Özel Rozet', type: 'badge', value: 'Lucky', color: '#a855f7' },
  { id: 4, label: '1000 TP', type: 'tp', value: '1000', color: '#ec4899' },
  { id: 5, label: '5x Hız', type: 'speed', value: '30 Dakika', color: '#ef4444' },
  { id: 6, label: '0.00005 BTC', type: 'btc', value: '0.00005', color: '#10b981' },
  { id: 7, label: 'Pas', type: 'tp', value: '0', color: '#3f3f46' },
];

export default function LuckyWheel() {
  const { state, dispatch } = useGame();
  const { notify } = useNotify();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Reward | null>(null);
  const [showResult, setShowResult] = useState(false);

  const spinWheel = () => {
    if (isSpinning) return;

    const cooldown = 60000; // 60s
    const lastSpin = state.lastWheelSpin || 0;
    const timeRemaining = Math.max(0, cooldown - (Date.now() - lastSpin));

    if (timeRemaining > 0) {
      notify({ type: 'info', title: 'Soğuma Süresi', message: `Yeni çevirme için ${Math.ceil(timeRemaining / 1000)}s bekle.` });
      return;
    }

    const SPIN_COST = 100;
    if (state.tycoonPoints < SPIN_COST) {
      notify({ type: 'warning', title: 'Yetersiz TP', message: 'Çarkı çevirmek için 100 TP gerekiyor.' });
      return;
    }

    // Deduct cost and start spin
    dispatch({ type: 'LUCKY_WHEEL_SPIN', cost: SPIN_COST });
    setIsSpinning(true);
    setShowResult(false);

    const extraDegrees = Math.floor(Math.random() * 360) + 1440; // En az 4 tam tur
    const newRotation = rotation + extraDegrees;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const segmentSize = 360 / rewards.length;
      // Çarkın gerçek durduğu konumu hesapla (işaretçi en üstte → 0°)
      const normalizedRotation = ((newRotation % 360) + 360) % 360;
      // İşaretçi üstte olduğundan, hangi segment üste geldiğini bul
      const winningIndex = Math.floor(((360 - normalizedRotation + segmentSize / 2) % 360) / segmentSize) % rewards.length;

      const winningReward = rewards[winningIndex];
      setResult(winningReward);
      setShowResult(true);

      // Claim reward in global state
      if (winningReward.type !== 'badge' && winningReward.label !== 'Pas') {
        dispatch({
          type: 'CLAIM_WHEEL_REWARD',
          reward: {
            type: winningReward.type,
            value: (winningReward.type === 'btc' || winningReward.type === 'tp') ? parseFloat(winningReward.value) : winningReward.label,
            label: winningReward.label
          }
        });
      }

      notify({
        type: (winningReward.label === 'Pas') ? 'info' : 'success',
        title: 'Çark Sonucu',
        message: winningReward.label === 'Pas' ? 'Bu sefer boş çıktı!' : `${winningReward.label} kazandın!`
      });
    }, 4000);
  };

  return (
    <div className="space-y-6 pt-2 pb-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight">Şans Çarkı</h2>
        <p className="text-xs text-zinc-500">TycoonPoints harca, büyük ödülleri yakala!</p>
      </div>

      {/* Wheel Container */}
      <div className="relative aspect-square w-full max-w-[320px] mx-auto flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div className="w-6 h-8 bg-white rounded-b-full shadow-lg flex items-center justify-center">
            <div className="w-2 h-4 bg-red-500 rounded-full" />
          </div>
        </div>

        {/* The Wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.13, 0, 0, 1] }}
          className="relative w-full h-full rounded-full border-8 border-zinc-800 shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden bg-zinc-900"
        >
          {rewards.map((reward, i) => (
            <div
              key={reward.id}
              className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
              style={{
                transform: `rotate(${i * (360 / rewards.length)}deg)`,
                backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
              }}
            >
              <div
                className="absolute top-4 left-4 transform -rotate-45 origin-top-left text-center w-20"
                style={{ transform: `rotate(22.5deg) translateX(20px) translateY(10px)` }}
              >
                <p className="text-[8px] font-black uppercase tracking-tighter leading-tight" style={{ color: reward.color }}>
                  {reward.label}
                </p>
                <div className="mt-1 flex justify-center">
                  {reward.type === 'speed' && <Zap size={10} className="text-zinc-500" />}
                  {reward.type === 'btc' && <Coins size={10} className="text-zinc-500" />}
                  {reward.type === 'tp' && <RotateCcw size={10} className="text-zinc-500" />}
                  {reward.type === 'badge' && <Trophy size={10} className="text-zinc-500" />}
                </div>
              </div>
            </div>
          ))}
          {/* Center Cap */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 border-4 border-zinc-700 shadow-xl z-10 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          <div className="glass-card rounded-2xl px-4 py-2 flex items-center gap-2">
            <Coins size={14} className="text-yellow-500" />
            <span className="text-sm font-bold">{state.tycoonPoints.toLocaleString()} TP</span>
          </div>
          <div className="glass-card rounded-2xl px-4 py-2 flex items-center gap-2">
            <RotateCcw size={14} className="text-emerald-500" />
            <span className="text-sm font-bold">1 Ücretsiz</span>
          </div>
        </div>

        <button
          onClick={spinWheel}
          disabled={isSpinning}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95",
            isSpinning
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-emerald-500 text-black neon-glow hover:brightness-110"
          )}
        >
          {isSpinning ? (
            <>
              <RotateCcw size={24} className="animate-spin" />
              <span>ÇARK DÖNÜYOR...</span>
            </>
          ) : (
            <>
              <Play size={24} fill="currentColor" />
              <span>ŞİMDİ ÇEVİR (100 TP)</span>
            </>
          )}
        </button>

        {/* Cooldown Progress Bar */}
        {state.lastWheelSpin > 0 && Date.now() - state.lastWheelSpin < 60000 && (
          <div className="space-y-1.5 px-1">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <span>Şans Tazeleniyor</span>
              <span>{Math.ceil((60000 - (Date.now() - state.lastWheelSpin)) / 1000)}s</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: Math.max(0, (60000 - (Date.now() - state.lastWheelSpin)) / 1000), ease: "linear" }}
                className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Coin Shower Effect */}
      <CoinShower active={showResult && result !== null && result.label !== 'Pas'} />

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card rounded-3xl p-6 border-emerald-500/30 text-center space-y-4 bg-emerald-500/5"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
              <Trophy size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black">TEBRİKLER!</h3>
              <p className="text-sm text-zinc-400">Harika bir ödül kazandın:</p>
            </div>
            <div className="py-3 px-6 rounded-2xl bg-white/5 border border-white/10 inline-block">
              <span className="text-2xl font-black text-emerald-500">{result.label}</span>
            </div>
            <button
              onClick={() => setShowResult(false)}
              className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm"
            >
              Harika!
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold tracking-tight">Son Kazananlar</h3>
        <div className="space-y-2">
          {[
            { user: 'Mehmet K.', reward: '0.00001 BTC', time: '2dk önce' },
            { user: 'Ayşe N.', reward: '500 TP', time: '5dk önce' },
            { user: 'Caner D.', reward: '2x Hız', time: '12dk önce' },
          ].map((win, i) => (
            <div key={i} className="flex items-center justify-between text-[10px] p-2 rounded-lg bg-white/5 border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="font-bold">{win.user}</span>
                <span className="text-zinc-500">kazandı:</span>
                <span className="text-emerald-500 font-bold">{win.reward}</span>
              </div>
              <span className="text-zinc-600">{win.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
