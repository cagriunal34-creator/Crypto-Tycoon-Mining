import React, { useState } from 'react';
import {
  Zap,
  Gift,
  Trophy,
  Coins,
  Play,
  RotateCcw,
  Bitcoin,
  Database,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame } from '../context/GameContext';
import { useNotify } from '../context/NotificationContext';
import CoinShower from './CoinShower';

export default function LuckyWheel() {
  const { state, dispatch } = useGame();
  const { notify } = useNotify();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<any | null>(null);
  const [showResult, setShowResult] = useState(false);

  // BUG-010 FIX: Fallback rewards when DB table is empty
  const FALLBACK_REWARDS = [
    { id: 'f1', label: '100 TP', type: 'tp', value: 100, probability: '0.30', color: '#10b981' },
    { id: 'f2', label: '250 TP', type: 'tp', value: 250, probability: '0.25', color: '#6366f1' },
    { id: 'f3', label: '500 TP', type: 'tp', value: 500, probability: '0.20', color: '#8b5cf6' },
    { id: 'f4', label: '0.000001 BTC', type: 'btc', value: 0.000001, probability: '0.15', color: '#f59e0b' },
    { id: 'f5', label: '2x Hız (1 Saat)', type: 'speed', value: '1 Saat', probability: '0.07', color: '#3b82f6' },
    { id: 'f6', label: '0.00001 BTC', type: 'btc', value: 0.00001, probability: '0.03', color: '#ef4444' },
  ];
  const rewards = (state.wheelRewards && state.wheelRewards.length > 0) ? state.wheelRewards : FALLBACK_REWARDS;

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

    // --- Weighted Random Selection ---
    const totalProb = rewards.reduce((acc, r) => acc + (parseFloat(r.probability) || 0), 0);
    let random = Math.random() * totalProb;
    let winningIndex = 0;
    
    for (let i = 0; i < rewards.length; i++) {
        random -= (parseFloat(rewards[i].probability) || 0);
        if (random <= 0) {
            winningIndex = i;
            break;
        }
    }

    const winningReward = rewards[winningIndex];

    // Deduct cost and start spin
    dispatch({ type: 'LUCKY_WHEEL_SPIN', cost: SPIN_COST });
    setIsSpinning(true);
    setShowResult(false);

    // Calculate rotation to stop at winningIndex
    // Segment i starts at i * bucketSize.
    const segmentSize = 360 / rewards.length;
    
    // Normalize current rotation to find base
    const currentBase = rotation - (rotation % 360);
    const targetRotationOffset = 360 - (winningIndex * segmentSize);
    
    // Add 4-5 full turns for effect
    const finalRotation = currentBase + 1440 + targetRotationOffset;
    
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(winningReward);
      setShowResult(true);

      // Claim reward in global state
      const labelLower = winningReward.label.toLowerCase();
      const isBoilerplate = labelLower.includes('pas') || 
                            labelLower.includes('boş') ||
                            (winningReward.type === 'tp' && parseFloat(winningReward.value) === 0);

      if (winningReward.type !== 'badge' && !isBoilerplate) {
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
        type: isBoilerplate ? 'info' : 'success',
        title: 'Çark Sonucu',
        message: isBoilerplate ? 'Bu sefer boş çıktı!' : `${winningReward.label} kazandın!`
      });
    }, 4000);
  };

  return (
    <div className="space-y-6 pt-2 pb-8 text-white">
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
              key={reward.id || i}
              className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
              style={{
                transform: `rotate(${i * (360 / rewards.length)}deg)`,
                backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
              }}
            >
              <div
                className="absolute top-4 left-4 transform text-center w-20"
                style={{ transform: `rotate(${180 / rewards.length}deg) translateX(20px) translateY(10px)` }}
              >
                <p className="text-[8px] font-black uppercase tracking-tighter leading-tight" style={{ color: reward.color }}>
                  {reward.label}
                </p>
                <div className="mt-1 flex justify-center">
                  {reward.type === 'speed' && <Zap size={10} className="text-zinc-500" />}
                  {reward.type === 'btc' && <Bitcoin size={10} className="text-zinc-500" />}
                  {reward.type === 'tp' && <Database size={10} className="text-zinc-500" />}
                  {reward.type === 'badge' && <Award size={10} className="text-zinc-500" />}
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
            <RotateCcw size={14} className="text-zinc-500" />
            <span className="text-sm font-bold text-zinc-400">60s bekleme</span>
          </div>
        </div>

        <button
          onClick={spinWheel}
          disabled={isSpinning || rewards.length === 0}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95",
            (isSpinning || rewards.length === 0)
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
      <CoinShower active={showResult && result !== null && !result.label.toLowerCase().includes('pas') && !result.label.toLowerCase().includes('boş') && (result.type !== 'tp' || parseFloat(result.value) > 0)} />

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
