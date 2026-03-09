import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, TrendingUp, ShoppingCart, Tag, X, Clock, Zap, Check } from 'lucide-react';
import { useGame, OwnedContract } from '../context/GameContext';
import { MarketListing } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useNotify } from '../context/NotificationContext';

const TIER_COLORS = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Flash: '#FF4ECD',
};

function timeAgo(ts: number) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'az önce';
  if (s < 3600) return `${Math.floor(s / 60)}d önce`;
  if (s < 86400) return `${Math.floor(s / 3600)}s önce`;
  return `${Math.floor(s / 86400)}g önce`;
}

const ListingCard: React.FC<{ listing: MarketListing; onBuy: () => void }> = ({ listing, onBuy }) => {
  const { state } = useGame();
  const { theme } = useTheme();
  const tierColor = TIER_COLORS[listing.tier];
  const canAfford = state.tycoonPoints >= listing.price;
  const a1 = theme.vars['--ct-a1'];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 space-y-3"
      style={{ background: `${tierColor}06`, border: `1px solid ${tierColor}25` }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase"
            style={{ background: `${tierColor}18`, border: `1px solid ${tierColor}40`, color: tierColor }}>
            {listing.tier}
          </div>
          <span className="text-sm font-black" style={{ color: theme.vars['--ct-text'] }}>{listing.contractName}</span>
        </div>
        <span className="text-[9px]" style={{ color: theme.vars['--ct-muted'] }}>{timeAgo(listing.listedAt)}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Hashrate', val: `${listing.hashRate.toLocaleString()} Gh/s` },
          { label: 'Süre', val: `${listing.daysRemaining}g` },
          { label: 'Satıcı', val: listing.sellerName },
        ].map(s => (
          <div key={s.label} className="text-center p-2 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[10px] font-black" style={{ color: theme.vars['--ct-text'] }}>{s.val}</div>
            <div className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: theme.vars['--ct-muted'] }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Buy */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-black tabular-nums" style={{ color: tierColor }}>
            {listing.price.toLocaleString()}
            <span className="text-xs font-bold ml-1" style={{ color: theme.vars['--ct-muted'] }}>TP</span>
          </div>
          {!canAfford && (
            <div className="text-[9px] text-red-400 mt-0.5">
              {(listing.price - state.tycoonPoints).toLocaleString()} TP eksik
            </div>
          )}
        </div>
        <motion.button whileTap={canAfford ? { scale: 0.95 } : {}}
          onClick={canAfford ? onBuy : undefined}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all"
          style={canAfford
            ? { background: `linear-gradient(135deg,${tierColor},${tierColor}AA)`, color: '#000', boxShadow: `0 4px 12px ${tierColor}30` }
            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }}>
          <ShoppingCart size={14} />
          Satın Al
        </motion.button>
      </div>
    </motion.div>
  );
}

function SellModal({ contract, onClose, onList }: {
  contract: OwnedContract;
  onClose: () => void;
  onList: (price: number) => void;
}) {
  const { theme } = useTheme();
  const [price, setPrice] = useState(1000);
  const tierColor = TIER_COLORS[contract.tier];
  const a1 = theme.vars['--ct-a1'];

  const daysRemaining = Math.max(1, contract.durationDays - Math.floor((Date.now() - contract.purchasedAt) / 86400000));
  const suggestedPrice = Math.floor(contract.hashRate * daysRemaining * 0.15);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ background: theme.vars['--ct-bg'], border: `1px solid ${tierColor}25`, borderBottom: 'none' }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${tierColor},${tierColor}AA,${tierColor})` }} />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black" style={{ color: theme.vars['--ct-text'] }}>Marketplace'te Listele</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
              <X size={16} style={{ color: theme.vars['--ct-muted'] }} />
            </button>
          </div>

          {/* Contract info */}
          <div className="p-4 rounded-2xl"
            style={{ background: `${tierColor}06`, border: `1px solid ${tierColor}20` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2 py-0.5 rounded-full text-[8px] font-black"
                style={{ background: `${tierColor}18`, color: tierColor }}>{contract.tier}</div>
              <span className="font-black text-sm" style={{ color: theme.vars['--ct-text'] }}>{contract.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-sm font-black" style={{ color: tierColor }}>{contract.hashRate} Gh/s</div>
                <div className="text-[8px]" style={{ color: theme.vars['--ct-muted'] }}>Hashrate</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-black" style={{ color: tierColor }}>{daysRemaining}g</div>
                <div className="text-[8px]" style={{ color: theme.vars['--ct-muted'] }}>Kalan Süre</div>
              </div>
            </div>
          </div>

          {/* Price input */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-black" style={{ color: theme.vars['--ct-text'] }}>Satış Fiyatı (TP)</label>
              <button className="text-[9px] font-bold" style={{ color: a1 }}
                onClick={() => setPrice(suggestedPrice)}>
                Önerilen: {suggestedPrice.toLocaleString()} TP
              </button>
            </div>
            <input type="number" value={price} min={100} max={50000}
              onChange={e => setPrice(Math.max(100, parseInt(e.target.value) || 100))}
              className="w-full px-4 py-3 rounded-xl text-sm font-black outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${a1}25`, color: theme.vars['--ct-text'] }} />
            <p className="text-[9px]" style={{ color: theme.vars['--ct-muted'] }}>
              * Listeleme ücretsiz. VIP kullanıcılar 0 komisyon öder.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} className="py-3 rounded-2xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: theme.vars['--ct-muted'] }}>
              Vazgeç
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => onList(price)}
              className="py-3 rounded-2xl text-sm font-black flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg,${tierColor},${tierColor}AA)`, color: '#000' }}>
              <Tag size={16} />
              Listele
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MarketplaceScreen() {
  const {
    state, dispatch, isVipActive,
    listContractOnMarket, buyContractFromMarket, cancelMarketListing
  } = useGame();
  const { theme } = useTheme();
  const { notify } = useNotify();

  const a1 = theme.vars['--ct-a1'];
  const a2 = theme.vars['--ct-a2'];
  const a3 = theme.vars['--ct-a3'];

  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sellContract, setSellContract] = useState<OwnedContract | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);

  const handleBuy = async (listing: MarketListing) => {
    try {
      await buyContractFromMarket(listing);
      setJustBought(listing.id);
      setTimeout(() => setJustBought(null), 3000);
      notify({ type: 'success', title: 'Kontrat Satın Alındı!', message: `${listing.contractName} cüzdanına eklendi.` });
    } catch (e) {
      notify({ type: 'warning', title: 'Hata', message: 'Satın alma işlemi başarısız oldu.' });
    }
  };

  const handleList = async (contract: OwnedContract, price: number) => {
    try {
      await listContractOnMarket(contract, price);
      setSellContract(null);
      notify({ type: 'success', title: 'Listelendi!', message: `${contract.name} marketplace'e eklendi.` });
    } catch (e) {
      notify({ type: 'warning', title: 'Hata', message: 'Listeleme işlemi başarısız oldu.' });
    }
  };

  const filteredListings = state.marketListings.filter(l => {
    if (filter !== 'all' && l.tier.toLowerCase() !== filter) return false;
    if (search && !l.contractName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const myListings = state.marketListings.filter(l => l.isOwn);

  return (
    <div className="space-y-4 pt-3 pb-12">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-5"
        style={{ background: `${a2}08`, border: `1px solid ${a2}20` }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${a2}80, transparent)` }} />
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-black" style={{ color: theme.vars['--ct-text'] }}>Kontrat Pazarı</h2>
            <p className="text-xs mt-0.5" style={{ color: theme.vars['--ct-muted'] }}>
              {state.marketListings.length} aktif listeleme
              {isVipActive && <span style={{ color: a1 }}> · VIP: 0 komisyon</span>}
            </p>
          </div>
          <div className="px-3 py-1 rounded-xl"
            style={{ background: `${a1}10`, border: `1px solid ${a1}20` }}>
            <div className="text-xs font-black" style={{ color: a1 }}>{state.tycoonPoints.toLocaleString()} TP</div>
            <div className="text-[8px]" style={{ color: theme.vars['--ct-muted'] }}>Bakiye</div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {[{ id: 'buy', label: '🛒 Al', count: state.marketListings.length },
          { id: 'sell', label: '🏷 Sat', count: state.ownedContracts.length }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as 'buy' | 'sell')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition-all"
              style={tab === t.id
                ? { background: `${a1}18`, border: `1px solid ${a1}30`, color: a1 }
                : { color: theme.vars['--ct-muted'] }}>
              {t.label}
              <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.07)', color: theme.vars['--ct-muted'] }}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'buy' ? (
        <>
          {/* Search + Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${a1}15` }}>
              <Search size={14} style={{ color: theme.vars['--ct-muted'] }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Kontrat ara…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: theme.vars['--ct-text'] }} />
              {search && <button onClick={() => setSearch('')}><X size={12} style={{ color: theme.vars['--ct-muted'] }} /></button>}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {['all', 'bronze', 'silver', 'gold', 'flash'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wide shrink-0 transition-all"
                  style={filter === f
                    ? { background: `${a1}18`, border: `1px solid ${a1}35`, color: a1 }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: theme.vars['--ct-muted'] }}>
                  {f === 'all' ? 'Tümü' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Listings */}
          <div className="space-y-3">
            <AnimatePresence>
              {justBought && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: `${a3}08`, border: `1px solid ${a3}25` }}>
                  <Check size={16} style={{ color: a3 }} />
                  <span className="text-xs font-bold" style={{ color: theme.vars['--ct-text'] }}>Kontrat başarıyla satın alındı!</span>
                </motion.div>
              )}
            </AnimatePresence>
            {filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-2">🔍</div>
                <div className="text-sm font-bold" style={{ color: theme.vars['--ct-muted'] }}>Sonuç bulunamadı</div>
              </div>
            ) : (
              filteredListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} onBuy={() => handleBuy(listing)} />
              ))
            )}
          </div>

          {/* My listings */}
          {myListings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest px-1" style={{ color: theme.vars['--ct-muted'] }}>Benim Listelemelerim</h3>
              {myListings.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <div className="text-xs font-black" style={{ color: theme.vars['--ct-text'] }}>{l.contractName}</div>
                    <div className="text-[9px]" style={{ color: theme.vars['--ct-muted'] }}>{l.hashRate} Gh/s · {l.price.toLocaleString()} TP</div>
                  </div>
                  <button onClick={() => cancelMarketListing(l.id)}
                    className="px-3 py-1 rounded-lg text-[9px] font-bold text-red-400"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    İptal
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ── Sell tab ─── */
        <div className="space-y-3">
          {state.ownedContracts.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="text-4xl">📦</div>
              <div className="text-sm font-bold" style={{ color: theme.vars['--ct-muted'] }}>Listeleyecek kontratın yok</div>
              <p className="text-xs" style={{ color: theme.vars['--ct-muted'] }}>Market ekranından kontrat satın al</p>
            </div>
          ) : (
            state.ownedContracts.map(contract => {
              const tc = TIER_COLORS[contract.tier];
              const daysLeft = Math.max(0, contract.durationDays - Math.floor((Date.now() - contract.purchasedAt) / 86400000));
              return (
                <motion.div key={contract.id} whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-2xl"
                  style={{ background: `${tc}06`, border: `1px solid ${tc}22` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 rounded-full text-[8px] font-black"
                        style={{ background: `${tc}18`, color: tc }}>{contract.tier}</div>
                      <span className="font-black text-sm" style={{ color: theme.vars['--ct-text'] }}>{contract.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px]" style={{ color: theme.vars['--ct-muted'] }}>
                      <Clock size={10} />{daysLeft}g kaldı
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold" style={{ color: theme.vars['--ct-muted'] }}>
                      <Zap size={10} className="inline mr-1" style={{ color: tc }} />
                      {contract.hashRate} Gh/s
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => setSellContract(contract)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"
                      style={{ background: `linear-gradient(135deg,${tc},${tc}AA)`, color: '#000' }}>
                      <Tag size={12} />
                      Listele
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Sell modal */}
      <AnimatePresence>
        {sellContract && (
          <SellModal
            contract={sellContract}
            onClose={() => setSellContract(null)}
            onList={(price) => handleList(sellContract, price)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
