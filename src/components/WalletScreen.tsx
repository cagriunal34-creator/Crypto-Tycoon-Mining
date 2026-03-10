/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowUpRight, ArrowDownLeft, RefreshCw, Eye, EyeOff,
  ChevronRight, Wallet as WalletIcon, TrendingUp, CheckCircle, Zap,
  X, Copy
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useGame } from '../context/GameContext';

export default function WalletScreen({ onOpenWithdraw }: { onOpenWithdraw: () => void }) {
  const { state, btcToUsd, formatBtc } = useGame();
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'incoming' | 'outgoing' | 'mining'>('all');
  const [hideBalance, setHideBalance] = React.useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const myAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

  const handleCopy = () => {
    navigator.clipboard.writeText(myAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTransactions = (state.transactions || []).filter(tx => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'incoming') return tx.type === 'transfer_in';
    if (activeFilter === 'outgoing') return tx.type === 'transfer_out' || tx.type === 'purchase';
    if (activeFilter === 'mining') return tx.type === 'mining' || tx.type === 'bonus';
    return true;
  });

  const formatDate = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Az önce';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} sa önce`;
    return `${Math.floor(diff / 86400000)} gün önce`;
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Balance Card */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-emerald-700/20 rounded-3xl blur opacity-30" />
        <div className="relative bg-gradient-to-br from-[#0f1712] to-[#050505] border border-emerald-500/20 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Toplam Bakiye</span>
            <button onClick={() => setHideBalance(v => !v)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              {hideBalance ? <EyeOff size={16} className="text-zinc-500" /> : <Eye size={16} className="text-zinc-500" />}
            </button>
          </div>

          <div className="space-y-1">
            {hideBalance ? (
              <div className="text-4xl font-black tracking-tight">••••••</div>
            ) : (
              <>
                {/* USD primary */}
                <div className="text-4xl font-black tracking-tight">{btcToUsd(state.btcBalance)}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-mono text-zinc-400 tabular-nums">{formatBtc(state.btcBalance)}</span>
                  <span className="text-xs font-bold text-emerald-500">BTC</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-[10px] text-emerald-500 font-bold">+4.2% Son 24s</span>
            </div>
            <span className="text-[9px] text-zinc-600 font-mono">${state.usdRate.toLocaleString()}/BTC</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: ArrowUpRight, label: 'GÖNDER', color: 'bg-emerald-500 text-black', action: onOpenWithdraw },
          { icon: ArrowDownLeft, label: 'AL', color: 'bg-zinc-900 text-emerald-500 border border-white/5', action: () => setIsReceiveOpen(true) },
          { icon: RefreshCw, label: 'DEĞİŞTİR', color: 'bg-zinc-900 text-emerald-500 border border-white/5', action: () => {} },
        ].map(action => (
          <button
            key={action.label}
            onClick={action.action}
            className={cn('flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.95]', action.color)}
          >
            <action.icon size={20} />
            <span className="text-[10px] font-black tracking-widest">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Withdraw Banner */}
      <button
        onClick={onOpenWithdraw}
        className="w-full glass-card rounded-2xl p-4 flex items-center justify-between group hover:border-emerald-500/30 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <WalletIcon size={24} />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold">BTC ÇEK</h4>
            <p className="text-[10px] text-zinc-500">Harici Cüzdana Transfer</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
          <ChevronRight size={16} />
        </div>
      </button>

      {/* Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight">Son İşlemler</h3>
          <span className="text-[9px] text-zinc-500">{(state.transactions || []).length} işlem</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {([
            { key: 'all', label: 'Tümü' },
            { key: 'incoming', label: 'Gelen' },
            { key: 'outgoing', label: 'Giden' },
            { key: 'mining', label: 'Kazanç' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'px-5 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all',
                activeFilter === tab.key ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white/5 text-zinc-500 hover:text-zinc-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-zinc-600 font-bold">Bu kategoride işlem yok.</div>
          ) : (
            filteredTransactions.slice(0, 15).map(tx => (
              <div key={tx.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                    tx.type === 'mining' || tx.type === 'bonus' ? 'bg-emerald-500/10 text-emerald-500' :
                    tx.type === 'transfer_in' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-red-500/10 text-red-500'
                  )}>
                    {tx.type === 'mining' || tx.type === 'bonus' ? <Zap size={16} fill="currentColor" /> :
                     tx.type === 'transfer_in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{tx.label}</h4>
                    <p className="text-[9px] text-zinc-500">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn('text-xs font-bold font-mono', tx.amount > 0 ? 'text-emerald-500' : 'text-white')}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(8)} BTC
                  </p>
                  <p className="text-[9px] text-zinc-600 font-mono">{btcToUsd(Math.abs(tx.amount))}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Receive Modal */}
      {isReceiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsReceiveOpen(false)} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">BTC Yatır</h3>
              <p className="text-xs text-zinc-500">Bu adrese sadece Bitcoin (BTC) gönderin.</p>
            </div>
            
            {/* QR Code */}
            <div className="bg-white p-4 rounded-xl mx-auto w-48 h-48 flex items-center justify-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${myAddress}`} 
                alt="QR Code" 
                className="w-full h-full object-contain opacity-90"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cüzdan Adresi</label>
              <button 
                onClick={handleCopy}
                className="w-full flex items-center justify-between bg-black/50 border border-white/10 rounded-xl p-4 group hover:border-emerald-500/50 transition-all active:scale-[0.98]"
              >
                <span className="text-xs font-mono text-zinc-300 truncate mr-2 select-all">{myAddress}</span>
                {copied ? (
                  <div className="flex items-center gap-1 text-emerald-500">
                    <span className="text-[10px] font-bold">Kopyalandı</span>
                    <CheckCircle size={18} />
                  </div>
                ) : (
                  <Copy size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
