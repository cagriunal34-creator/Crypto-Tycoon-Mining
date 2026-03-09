import React from 'react';
import {
  History,
  Zap,
  Clock,
  Star,
  ChevronRight,
  Flame,
  Gift,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useGame } from '../context/GameContext';
import { Contract, OwnedContract } from '../types';
import { useNotify } from '../context/NotificationContext';

const flashOffers = [
  {
    id: 'flash-1',
    name: 'Yıldırım Madenci',
    tier: 'Flash',
    hashRate: 4500,
    price: 69.99,
    oldPrice: 129.99,
    bonus: 1200,
    initialSeconds: 15620,
    isLimited: true
  }
];

function CountdownTimer({ initialSeconds, className }: { initialSeconds: number, className?: string }) {
  const [seconds, setSeconds] = React.useState(initialSeconds);

  React.useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}s ${m.toString().padStart(2, '0')}dk ${s.toString().padStart(2, '0')}sn`;
  };

  return <span className={className}>{formatTime(seconds)}</span>;
}

const contracts = [
  {
    id: 'bronze',
    name: 'Başlangıç Madenci',
    tier: 'Bronze',
    hashRate: 105,
    price: 4.99,
    bonus: 5,
    duration: 30
  },
  {
    id: 'silver',
    name: 'Pro Madenci',
    tier: 'Silver',
    hashRate: 550,
    price: 19.99,
    bonus: 35,
    duration: 30,
    isPopular: true
  },
  {
    id: 'gold',
    name: 'Uzman Madenci',
    tier: 'Gold',
    hashRate: 2100,
    price: 49.99,
    bonus: 150,
    duration: 30
  }
];

export default function ContractsScreen({ onPurchaseSuccess, onWatchAd }: { onPurchaseSuccess: () => void, onWatchAd: () => void }) {
  const { dispatch } = useGame();
  const [activeTab, setActiveTab] = React.useState<'owned' | 'buy'>('buy');

  const handlePurchase = (contract: typeof contracts[0]) => {
    const newContract: OwnedContract = {
      id: `${contract.id}-${Date.now()}`,
      name: contract.name,
      tier: contract.tier as any,
      hashRate: contract.hashRate,
      purchasedAt: Date.now(),
      durationDays: contract.duration,
      condition: 100,
      lastMaintenance: Date.now(),
    };

    dispatch({
      type: 'PURCHASE_CONTRACT',
      contract: newContract,
      cost: contract.price
    });
    onPurchaseSuccess();
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Header Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
        <button
          onClick={() => setActiveTab('owned')}
          className={cn("flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors", activeTab === 'owned' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-400 hover:text-white")}
        >
          Sözleşmelerim
        </button>
        <button
          onClick={() => setActiveTab('buy')}
          className={cn("flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors", activeTab === 'buy' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-400 hover:text-white")}
        >
          Yeni Al
        </button>
        <button className="p-2.5 text-zinc-400 hover:text-white transition-colors">
          <History size={18} />
        </button>
      </div>

      {activeTab === 'owned' ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Server size={28} className="text-zinc-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Henüz Sözleşmen Yok</h3>
            <p className="text-[10px] text-zinc-500 mt-1">Yeni Al sekmesinden bir paket satın alabilirsin.</p>
          </div>
          <button
            onClick={() => setActiveTab('buy')}
            className="px-6 py-2.5 rounded-2xl bg-emerald-500 text-black text-xs font-bold hover:brightness-110 transition-all"
          >
            Paketlere Bak
          </button>
        </div>
      ) : (
        <>

          {/* Flash Offers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-orange-500" fill="currentColor" />
                <h3 className="text-sm font-bold tracking-tight">Flaş Teklifler</h3>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Clock size={12} className="text-orange-500" />
                <div className="text-[10px] text-orange-500 font-bold font-mono flex gap-1">
                  <span>SONA ERMESİNE:</span>
                  <CountdownTimer initialSeconds={flashOffers[0].initialSeconds} />
                </div>
              </div>
            </div>

            {flashOffers.map((offer) => (
              <div key={offer.id} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative glass-card rounded-2xl p-4 border-orange-500/30">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold">{offer.name}</h4>
                        <div className="px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 flex items-center gap-1">
                          <Clock size={8} className="text-orange-500" />
                          <CountdownTimer initialSeconds={offer.initialSeconds} className="text-[7px] font-bold text-orange-500 font-mono" />
                        </div>
                      </div>
                      <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">%50 EKSTRA HIZ AKTİF</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black">{offer.hashRate}</div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">Gh/s</div>
                      <div className="text-[10px] text-orange-500 font-bold">+{offer.bonus} Flaş Bonus</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">TEKLİF FİYATI</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">${offer.price}</span>
                        <span className="text-xs text-zinc-500 line-through">${offer.oldPrice}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-bold hover:bg-zinc-700 transition-colors">İncele</button>
                      <button className="px-4 py-2 rounded-xl bg-orange-500 text-black text-xs font-bold hover:brightness-110 transition-all">Hemen Al</button>
                    </div>
                  </div>

                  {offer.isLimited && (
                    <div className="absolute top-4 right-32 px-2 py-0.5 bg-orange-600 text-[8px] font-black text-white rounded uppercase tracking-widest">
                      Sınırlı Stok
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Free Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">Ücretsiz Seçenekler</h3>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Bonus</span>
            </div>

            <div className="grid gap-3">
              <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Gift size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Günlük Bonus</h4>
                    <p className="text-[10px] text-zinc-500">Reklam izle ve kazan</p>
                  </div>
                </div>
                <button
                  onClick={onWatchAd}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold active:scale-95 transition-transform"
                >
                  Aktif Et
                </button>
              </div>

              <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Server size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Ücretsiz Madenci</h4>
                    <p className="text-[10px] text-zinc-500">Sınırlı süreli hız</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold">Aktif Et</button>
              </div>
            </div>
          </div>

          {/* Package Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold tracking-tight">Paket Seçenekleri</h3>
            <div className="grid gap-4">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className={cn(
                    "glass-card rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:border-emerald-500/30",
                    contract.isPopular && "border-emerald-500/50 bg-emerald-500/[0.02]"
                  )}
                >
                  {contract.isPopular && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                      En Çok Tercih Edilen
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        contract.tier === 'Bronze' ? "bg-orange-500/10 text-orange-500" :
                          contract.tier === 'Silver' ? "bg-zinc-400/10 text-zinc-400" :
                            "bg-yellow-500/10 text-yellow-500"
                      )}>
                        <Server size={24} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold">{contract.name}</h4>
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          contract.tier === 'Bronze' ? "text-orange-500" :
                            contract.tier === 'Silver' ? "text-zinc-400" :
                              "text-yellow-500"
                        )}>{contract.tier} Paket</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black">{contract.hashRate}</div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">Gh/s</div>
                      <div className="text-[10px] text-emerald-500 font-bold">+{contract.bonus} Bonus</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-white/5">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">AYLIK</p>
                      <span className="text-xl font-bold">${contract.price}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2.5 rounded-xl bg-zinc-800 text-xs font-bold hover:bg-zinc-700 transition-colors">Hemen İncele</button>
                      <button
                        onClick={() => handlePurchase(contract)}
                        className="px-4 py-2.5 rounded-xl bg-yellow-500 text-black text-xs font-bold hover:brightness-110 transition-all"
                      >
                        Satın Al
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
