/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GameContext v3 — Phase 1: Game Mechanics & Addiction
 *   ✅ Prestige system (permanent multiplier, reset with reward)
 *   ✅ Offline earnings (calculate + modal trigger on startup)
 *   ✅ Mining events (Flash Pool, Hash Storm, Energy Surge, Block Halving)
 *   ✅ Real mining cycle (energy directly scales effective hashrate 30%–100%)
 */

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import {
  LightingColor,
  RigTier,
  RigStatus,
  FarmSettings,
  OwnedContract,
  Transaction,
  QuestProgress,
  Guild,
  MiningEvent,
  MiningEventType,
  BattlePassReward,
  BattlePassState,
  MarketListing,
  VIPState,
  PrestigeRecord
} from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, runTransaction, increment, collection, deleteDoc } from 'firebase/firestore';

export type {
  LightingColor,
  RigTier,
  RigStatus,
  FarmSettings,
  OwnedContract,
  Transaction,
  QuestProgress,
  Guild,
  MiningEvent,
  MiningEventType,
  BattlePassReward,
  BattlePassState,
  MarketListing,
  VIPState,
  PrestigeRecord
};

// ─── Game State ───────────────────────────────────────────────────────────────

export interface GameState {
  // Balances
  btcBalance: number;
  tycoonPoints: number;
  usdRate: number;

  // Mining
  energyCells: number;
  maxEnergyCells: number;
  baseHashRate: number;
  totalHashRate: number;
  miningActive: boolean;
  lastMiningTick: number;

  // Happy Hour (legacy, kept for compatibility)
  happyHourActive: boolean;
  happyHourEndsAt: number;

  // Halving
  currentBlock: number;
  nextHalvingBlock: number;

  // Contracts
  ownedContracts: OwnedContract[];

  // Guilds
  guilds: Guild[];
  userGuildId: string | null;

  // Transactions
  transactions: Transaction[];

  // Quests
  questProgress: QuestProgress;

  // Progression
  level: number;
  xp: number;
  xpToNextLevel: number;
  loginStreak: number;
  lastLoginDate: string;

  // Referral
  referralCode: string;
  referralCount: number;
  redeemedReferralCode: string | null;

  // User
  username: string;
  userId: string;
  rankTitle: string;

  // ── NEW: Prestige ──────────────────────────────────────────────────────────
  prestigeLevel: number;            // How many times user has prestiged
  prestigeMultiplier: number;       // Permanent BTC multiplier (1.0 + 0.25 * prestigeLevel)
  prestigeHistory: PrestigeRecord[];

  // ── NEW: Mining Events ─────────────────────────────────────────────────────
  activeMiningEvents: MiningEvent[];
  lastEventCheckAt: number;         // timestamp — so we don't spam events

  // ── Phase 2: Battle Pass ───────────────────────────────────────────────────
  battlePass: BattlePassState;

  // ── Phase 2: Marketplace ───────────────────────────────────────────────────
  marketListings: MarketListing[];

  // ── Phase 2: VIP ───────────────────────────────────────────────────────────
  vip: VIPState;

  // ── Phase 2: Mining Farm ────────────────────────────────────────────────────
  farmSettings: FarmSettings;

  // Environment
  isNight: boolean;
  isInfiniteEnergy: boolean;

  // Click & Combo
  comboCount: number;
  lastClickTime: number;
  isFeverMode: boolean;
  feverEndsAt: number;

  // Rewards & Retention
  lastWheelSpin: number;
  streak: {
    count: number;
    lastClaim: number;
  };

  // Offline
  pendingOfflineEarnings: number;
  offlineEarningsShown: boolean;

  // Phase 3: Mining Empire
  activeContracts: Array<{
    id: string;
    label: string;
    goalHash: number;
    reward: number;
    endsAt: number;
    startedAt: number;
  }>;
  availableJobs: Array<{
    id: string;
    label: string;
    client: string;
    goalHash: number;
    duration: number;
    reward: number;
    description: string;
  }>;
  researchedNodes: string[]; // IDs of unlocked tech tree nodes
  // ── NEW: Ad Rewards ────────────────────────────────────────────────────────
  lastAdWatchTime: number;
  adRewardBtc: number;
  adRewardTp: number;
  adCooldown: number; // ms
  // ── NEW: Interstitial Ads ──────────────────────────────────────────────────
  interstitialAdInterval: number; // ms
  lastInterstitialAdAt: number;   // timestamp
  // ── NEW: Firebase Auth & Sync ─────────────────────────────────────────────
  user: any | null; // Firebase User object
  isLoading: boolean;
  globalMultiplier: number; // Global event/setting multiplier
}

// ─── Initial State ────────────────────────────────────────────────────────────

export const INITIAL_STATE: GameState = {
  btcBalance: 0.00000000001,
  tycoonPoints: 1500,
  usdRate: 91200,

  energyCells: 24,
  maxEnergyCells: 24,
  baseHashRate: 0.5,
  totalHashRate: 50,
  miningActive: true,
  lastMiningTick: Date.now(),

  happyHourActive: true,
  happyHourEndsAt: Date.now() + 42 * 60 * 1000,

  currentBlock: 900000,
  nextHalvingBlock: 1050000,

  ownedContracts: [],

  guilds: [
    { id: 'g1', name: 'Kripto Titanları', description: 'En büyük madenciler buraya!', members: 48, totalHash: 142000, rank: 1, badge: '🏆', level: 5, xp: 1200, xpToNextLevel: 5000 },
    { id: 'g2', name: 'Diamond Miners', description: 'Elmas eller.', members: 35, totalHash: 98000, rank: 2, badge: '💎', level: 3, xp: 450, xpToNextLevel: 3000 },
    { id: 'g3', name: 'Hash Lords', description: 'Hız bizim işimiz.', members: 29, totalHash: 72000, rank: 3, badge: '⚡', level: 2, xp: 100, xpToNextLevel: 1500 },
  ],
  userGuildId: null,

  transactions: [
    { id: 't1', type: 'mining', amount: 0.00000000002, label: 'Madencilik Kazancı', date: Date.now() - 3600000, status: 'completed' },
    { id: 't2', type: 'transfer_out', amount: -0.00000000005, label: 'Transfer Giden', date: Date.now() - 86400000, status: 'completed' },
    { id: 't3', type: 'transfer_in', amount: 0.0000000001, label: 'Transfer Gelen', date: Date.now() - 172800000, status: 'completed' },
  ],

  questProgress: {
    adsWatched: 1,
    contractsPurchased: 0,
    referralsDone: 0,
    loginStreak: 1,
    claimedQuestIds: [],
  },

  level: 3,
  xp: 340,
  xpToNextLevel: 500,
  loginStreak: 1,
  lastLoginDate: new Date().toISOString().split('T')[0],

  referralCode: 'A84B2X-128',
  referralCount: 156,
  redeemedReferralCode: null,

  username: 'cagara50',
  userId: '2591866',
  rankTitle: 'Garaj Madencisi',

  // Prestige defaults
  prestigeLevel: 0,
  prestigeMultiplier: 1.0,
  prestigeHistory: [],

  // Events defaults
  activeMiningEvents: [],
  lastEventCheckAt: 0,

  // Phase 2: Battle Pass
  battlePass: {
    season: 1,
    currentLevel: 0,
    currentXP: 0,
    xpPerLevel: 500,
    isPremium: false,
    claimedRewardIds: [],
    endsAt: Date.now() + 30 * 24 * 3600 * 1000,
  },

  // Phase 2: Marketplace seed listings
  marketListings: [
    { id: 'ml-1', contractId: 'ext-1', contractName: 'Silver Madenci', tier: 'Silver' as const, hashRate: 800, daysRemaining: 18, sellerName: 'Ahmet_K', price: 2500, listedAt: Date.now() - 3600000 },
    { id: 'ml-2', contractId: 'ext-2', contractName: 'Gold Madenci', tier: 'Gold' as const, hashRate: 2200, daysRemaining: 25, sellerName: 'CryptoWolf', price: 6800, listedAt: Date.now() - 7200000 },
    { id: 'ml-3', contractId: 'ext-3', contractName: 'Baslangic', tier: 'Bronze' as const, hashRate: 105, daysRemaining: 12, sellerName: 'Miner99', price: 400, listedAt: Date.now() - 1800000 },
    { id: 'ml-4', contractId: 'ext-4', contractName: 'Silver Madenci', tier: 'Silver' as const, hashRate: 850, daysRemaining: 29, sellerName: 'HashQueen', price: 2900, listedAt: Date.now() - 900000 },
    { id: 'ml-5', contractId: 'ext-5', contractName: 'Flash Ozel', tier: 'Flash' as const, hashRate: 4500, daysRemaining: 7, sellerName: 'SpeedMiner', price: 12000, listedAt: Date.now() - 300000 },
  ],

  // Phase 2: VIP
  vip: { isActive: false, tier: 'none' as const, expiresAt: 0, perks: [] },
  farmSettings: {
    lighting: 'emerald',
    coolingLevel: 1,
    powerSupplyLevel: 1,
    activeRigs: 4,
    rigTier: 'Basic',
    rigStatuses: Array.from({ length: 48 }).map((_, i) => ({
      id: i,
      isBroken: false,
      efficiency: 100,
      fanSpeed: 50,
      condition: 100,
      heat: 40,
      serialNumber: `ASIC-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.floor(Math.random() * 999)}`
    })),
    baseElectricityCost: 5, // TP per tick (simulated as minute)
  },

  // Environment
  isNight: false,
  isInfiniteEnergy: false,

  // Click & Combo
  comboCount: 0,
  lastClickTime: 0,
  isFeverMode: false,
  feverEndsAt: 0,

  // Rewards & Retention
  lastWheelSpin: 0,
  streak: {
    count: 0,
    lastClaim: 0,
  },

  // Offline
  pendingOfflineEarnings: 0,
  offlineEarningsShown: true,

  // Phase 3: Mining Empire
  activeContracts: [],
  availableJobs: [
    { id: 'job-1', label: 'Veri Merkezi Desteği', client: 'GlobalHash Corp', goalHash: 250, duration: 300, reward: 0.0000000005, description: 'Yeni açılan veri merkezimiz için acil hashrate desteği gerekiyor.' },
    { id: 'job-2', label: 'AI Model Eğitimi', client: 'NeuroCompute', goalHash: 800, duration: 600, reward: 0.000000002, description: 'LLM model eğitimi için yüksek stabiliteye sahip güç kaynağı aranıyor.' },
    { id: 'job-3', label: 'Güvenlik Denetimi', client: 'CyberShield', goalHash: 1500, duration: 1200, reward: 0.000000005, description: 'Ağ stres testi için 20 dakika boyunca kesintisiz güç sağlamanız bekleniyor.' },
  ],
  researchedNodes: [],
  lastAdWatchTime: 0,
  adRewardBtc: 0.00000001,
  adRewardTp: 100,
  adCooldown: 300000, // 5 min
  interstitialAdInterval: 120000, // 2 min
  lastInterstitialAdAt: Date.now(),
  user: null,
  isLoading: true,
  globalMultiplier: 1.0,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'MINING_TICK' }
  | { type: 'SET_USD_RATE'; rate: number }
  | { type: 'ADD_ENERGY_CELLS'; amount: number }
  | { type: 'REMOVE_ENERGY_CELLS'; amount: number }
  | { type: 'WATCH_AD' }
  | { type: 'PURCHASE_CONTRACT'; contract: OwnedContract; cost: number }
  | { type: 'WITHDRAW'; amount: number }
  | { type: 'CLAIM_QUEST'; questId: string; reward: { tp?: number; speedBoost?: number } }
  | { type: 'UPDATE_HAPPY_HOUR' }
  | { type: 'ADD_TP'; amount: number }
  | { type: 'ADD_BTC'; amount: number }
  | { type: 'SET_IS_NIGHT'; isNight: boolean }
  | { type: 'CREATE_GUILD'; name: string; description: string; badge: string; cost: number }
  | { type: 'JOIN_GUILD'; guildId: string }
  | { type: 'LEAVE_GUILD' }
  | { type: 'DONATE_TO_GUILD'; amount: number }
  | { type: 'APPLY_REFERRAL_CODE'; code: string }
  | { type: 'LOAD_STATE'; state: GameState }
  // ── NEW ──
  | { type: 'PRESTIGE' }
  | { type: 'DISMISS_OFFLINE_EARNINGS' }
  | { type: 'TICK_EVENTS' }
  | { type: 'TRIGGER_EVENT'; event: MiningEvent }
  | { type: 'CALC_OFFLINE_EARNINGS'; secondsAway: number }
  // ── Phase 2 ──
  | { type: 'BP_ADD_XP'; amount: number }
  | { type: 'BP_CLAIM_REWARD'; rewardId: string; reward: BattlePassReward }
  | { type: 'BP_BUY_PREMIUM' }
  | { type: 'MARKET_LIST_CONTRACT'; listing: MarketListing }
  | { type: 'MARKET_BUY_CONTRACT'; listingId: string }
  | { type: 'MARKET_CANCEL_LISTING'; listingId: string }
  | { type: 'VIP_ACTIVATE'; tier: 'silver' | 'gold'; days: number; cost: number }
  // ── Phase 2: Farm & Wheel ──
  | { type: 'UPDATE_FARM'; settings: Partial<FarmSettings> }
  | { type: 'LUCKY_WHEEL_SPIN'; cost: number }
  | { type: 'CLAIM_WHEEL_REWARD'; reward: { type: 'tp' | 'btc' | 'speed'; value: number | string; label: string } }
  | { type: 'CLAIM_STREAK_REWARD' }
  | { type: 'REPAIR_CONTRACT'; contractId: string; cost: number }
  | { type: 'UPGRADE_INFRASTRUCTURE'; target: 'cooling' | 'power'; cost: number }
  // ── ADMIN ACTIONS ──
  | { type: 'ADMIN_SET_BTC'; amount: number }
  | { type: 'ADMIN_SET_TP'; amount: number }
  | { type: 'ADMIN_SET_XP'; amount: number }
  | { type: 'ADMIN_ADD_XP'; amount: number }
  | { type: 'ADMIN_ADD_HASHRATE'; amount: number }
  | { type: 'ADMIN_TOGGLE_INFINITE_ENERGY' }
  | { type: 'ADMIN_SET_LEVEL'; level: number }
  | { type: 'ADMIN_TRIGGER_EVENT'; eventType: MiningEventType }
  | { type: 'ADMIN_SET_USD_RATE'; rate: number }
  | { type: 'ADMIN_RESET_GAME' }
  | { type: 'CLICK_MINING' }
  // ── Phase 3 ──
  | { type: 'ACCEPT_CONTRACT'; contract: { id: string; label: string; goalHash: number; reward: number; endsAt: number; startedAt: number } }
  | { type: 'COMPLETE_CONTRACT'; contractId: string }
  | { type: 'UNLOCK_RESEARCH'; nodeId: string; cost: number }
  | { type: 'ADMIN_UPDATE_MARKET_LISTING'; listingId: string; updates: Partial<MarketListing> }
  | { type: 'ADMIN_UPDATE_JOB'; jobId: string; updates: Partial<GameState['availableJobs'][0]> }
  | { type: 'ADMIN_UPDATE_AD_SETTINGS'; updates: Partial<{ adRewardBtc: number, adRewardTp: number, adCooldown: number }> }
  | { type: 'ADMIN_UPDATE_INTERSTITIAL_SETTINGS'; updates: Partial<{ interstitialAdInterval: number }> }
  | { type: 'RESET_INTERSTITIAL_TIMER' }
  | { type: 'SET_AUTH_USER'; user: any }
  | { type: 'SET_GAME_STATE'; state: Partial<GameState> }
  | { type: 'SET_MARKETPLACE'; listings: MarketListing[] }
  | { type: 'SET_GUILDS'; guilds: Guild[] }
  | { type: 'SET_GLOBAL_MULTIPLIER'; multiplier: number }
  | { type: 'ADMIN_RESET_GAME' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Energy cells → effective hashrate scale (30% at 0, 100% at max) */
export function energyToHashScale(cells: number, maxCells: number): number {
  if (maxCells === 0) return 0;
  const ratio = cells / maxCells;
  return 0.30 + 0.70 * ratio; // 30%..100%
}

/** BTC per second */
export function calcBtcPerSecond(
  baseHashRate: number,
  events: MiningEvent[],
  prestigeMultiplier: number,
  energyScale: number,
  isFever: boolean = false,
  researchedNodes: string[] = [],
  vipMult: number = 1.0,
  globalMult: number = 1.0
): number {
  if (baseHashRate < 0) return 0; // Ensure non-negative hashrate
  // Sum up event multipliers (multiplicative) and hash boosts
  let eventMult = isFever ? 10.0 : 1.0;
  let hashBoost = 0;
  const now = Date.now();
  events.forEach(ev => {
    if (ev.endsAt > now) {
      eventMult *= ev.multiplier;
      hashBoost += ev.hashBoost;
    }
  });

  const totalHash = baseHashRate + hashBoost;
  const base = totalHash * 1e-9 * 0.5;

  // Research Multipliers
  let researchMult = 1.0;
  if (researchedNodes?.includes('mining-1')) researchMult += 0.1;
  if (researchedNodes?.includes('mining-2')) researchMult += 0.5;

  const finalMult = eventMult * prestigeMultiplier * energyScale * researchMult * (vipMult || 1.0) * (globalMult || 1.0);

  return base * finalMult;
}

function xpForLevel(level: number): number {
  return Math.floor(200 * Math.pow(1.5, level - 1));
}

// ── Event generation pool ─────────────────────────────────────────────────────
const EVENT_POOL: Omit<MiningEvent, 'id' | 'endsAt'>[] = [
  {
    type: 'flash_pool',
    label: 'Flaş Havuz Bonusu',
    description: 'Tüm madenciler 2 saat boyunca 1.5x BTC kazanıyor!',
    emoji: '⚡',
    multiplier: 1.5,
    hashBoost: 0,
  },
  {
    type: 'hash_storm',
    label: 'Hash Fırtınası',
    description: '30 dakika boyunca +500 Gh/s ekstra güç!',
    emoji: '🌪️',
    multiplier: 1.0,
    hashBoost: 500,
  },
  {
    type: 'energy_surge',
    label: 'Enerji Dalgası',
    description: 'Tüm enerji hücreleri anında yenilendi!',
    emoji: '🔋',
    multiplier: 1.2,
    hashBoost: 0,
    energyRestore: 999,
  },
  {
    type: 'block_halving',
    label: 'Blok Yarılanması',
    description: 'Piyasa şoku! 1 saat boyunca kazanç yarı yarıya.',
    emoji: '📉',
    multiplier: 0.5,
    hashBoost: 0,
  },
];

function generateEvent(durationMs: number): MiningEvent {
  const template = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  return {
    ...template,
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    endsAt: Date.now() + durationMs,
  };
}

// ── VIP Perks definition ─────────────────────────────────────────────────────

// ─── Battle Pass Rewards ───────────────────────────────────────────────────────
export const BP_REWARDS: BattlePassReward[] = [
  { id: 'bp-1-f', level: 1, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 100, isPremium: false },
  { id: 'bp-1-p', level: 1, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 200, isPremium: true },
  { id: 'bp-2-f', level: 2, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 200, isPremium: false },
  { id: 'bp-2-p', level: 2, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 400, isPremium: true },
  { id: 'bp-3-f', level: 3, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 600, isPremium: false },
  { id: 'bp-3-p', level: 3, type: 'tp' as const, label: 'Bonus TP', emoji: '💎', value: 1200, isPremium: true },
  { id: 'bp-4-f', level: 4, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 400, isPremium: false },
  { id: 'bp-4-p', level: 4, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 800, isPremium: true },
  { id: 'bp-5-f', level: 5, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 2500, isPremium: false },
  { id: 'bp-5-p', level: 5, type: 'energy' as const, label: 'Enerji Yenileme', emoji: '🔋', value: 6, isPremium: true },
  { id: 'bp-6-f', level: 6, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 1200, isPremium: false },
  { id: 'bp-6-p', level: 6, type: 'tp' as const, label: 'Bonus TP', emoji: '💎', value: 2400, isPremium: true },
  { id: 'bp-7-f', level: 7, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 700, isPremium: false },
  { id: 'bp-7-p', level: 7, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 1400, isPremium: true },
  { id: 'bp-8-f', level: 8, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 800, isPremium: false },
  { id: 'bp-8-p', level: 8, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 1600, isPremium: true },
  { id: 'bp-9-f', level: 9, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 1800, isPremium: false },
  { id: 'bp-9-p', level: 9, type: 'tp' as const, label: 'Bonus TP', emoji: '💎', value: 3600, isPremium: true },
  { id: 'bp-10-f', level: 10, type: 'btc' as const, label: 'BTC Ödülü', emoji: '₿', value: 0.0005, isPremium: false },
  { id: 'bp-10-p', level: 10, type: 'hashboost' as const, label: 'Hashrate Boost', emoji: '⚡', value: 1000, isPremium: true },
  { id: 'bp-11-f', level: 11, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 1100, isPremium: false },
  { id: 'bp-11-p', level: 11, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 2200, isPremium: true },
  { id: 'bp-12-f', level: 12, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 2400, isPremium: false },
  { id: 'bp-12-p', level: 12, type: 'tp' as const, label: 'Bonus TP', emoji: '💎', value: 4800, isPremium: true },
  { id: 'bp-13-f', level: 13, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 1300, isPremium: false },
  { id: 'bp-13-p', level: 13, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 2600, isPremium: true },
  { id: 'bp-14-f', level: 14, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 1400, isPremium: false },
  { id: 'bp-14-p', level: 14, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 2800, isPremium: true },
  { id: 'bp-15-f', level: 15, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 7500, isPremium: false },
  { id: 'bp-15-p', level: 15, type: 'energy' as const, label: 'Enerji Yenileme', emoji: '🔋', value: 6, isPremium: true },
  { id: 'bp-16-f', level: 16, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 1600, isPremium: false },
  { id: 'bp-16-p', level: 16, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 3200, isPremium: true },
  { id: 'bp-17-f', level: 17, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 1700, isPremium: false },
  { id: 'bp-17-p', level: 17, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 3400, isPremium: true },
  { id: 'bp-18-f', level: 18, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 3600, isPremium: false },
  { id: 'bp-18-p', level: 18, type: 'tp' as const, label: 'Bonus TP', emoji: '💎', value: 7200, isPremium: true },
  { id: 'bp-19-f', level: 19, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 1900, isPremium: false },
  { id: 'bp-19-p', level: 19, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 3800, isPremium: true },
  { id: 'bp-20-f', level: 20, type: 'btc' as const, label: 'BTC Ödülü', emoji: '₿', value: 0.001, isPremium: false },
  { id: 'bp-20-p', level: 20, type: 'hashboost' as const, label: 'Hashrate Boost', emoji: '⚡', value: 2000, isPremium: true },
  { id: 'bp-21-f', level: 21, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 4200, isPremium: false },
  { id: 'bp-21-p', level: 21, type: 'tp' as const, label: 'Bonus TP', emoji: '💎', value: 8400, isPremium: true },
  { id: 'bp-22-f', level: 22, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 2200, isPremium: false },
  { id: 'bp-22-p', level: 22, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 4400, isPremium: true },
  { id: 'bp-23-f', level: 23, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 2300, isPremium: false },
  { id: 'bp-23-p', level: 23, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 4600, isPremium: true },
  { id: 'bp-24-f', level: 24, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 4800, isPremium: false },
  { id: 'bp-24-p', level: 24, type: 'tp' as const, label: 'Bonus TP', emoji: '💎', value: 9600, isPremium: true },
  { id: 'bp-25-f', level: 25, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 12500, isPremium: false },
  { id: 'bp-25-p', level: 25, type: 'energy' as const, label: 'Enerji Yenileme', emoji: '🔋', value: 6, isPremium: true },
  { id: 'bp-26-f', level: 26, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 2600, isPremium: false },
  { id: 'bp-26-p', level: 26, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 5200, isPremium: true },
  { id: 'bp-27-f', level: 27, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 5400, isPremium: false },
  { id: 'bp-27-p', level: 27, type: 'tp' as const, label: 'Bonus TP', emoji: '💎', value: 10800, isPremium: true },
  { id: 'bp-28-f', level: 28, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 2800, isPremium: false },
  { id: 'bp-28-p', level: 28, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 5600, isPremium: true },
  { id: 'bp-29-f', level: 29, type: 'tp' as const, label: 'TycoonPoints', emoji: '🎯', value: 2900, isPremium: false },
  { id: 'bp-29-p', level: 29, type: 'tp' as const, label: 'Bonus TP', emoji: '✨', value: 5800, isPremium: true },
  { id: 'bp-30-f', level: 30, type: 'btc' as const, label: 'BTC Ödülü', emoji: '₿', value: 0.0015, isPremium: false },
  { id: 'bp-30-p', level: 30, type: 'hashboost' as const, label: 'Hashrate Boost', emoji: '⚡', value: 3000, isPremium: true },
];

const VIP_PERKS: Record<string, string[]> = {
  silver: ["Reklam yok", "%20 bonus BTC", "Gumus avatar cercevesi", "Oncelikli destek"],
  gold: ["Reklam yok", "%50 bonus BTC", "Altin avatar cercevesi", "Ozel lonca rozeti", "2x Battle Pass XP", "Marketplace 0 komisyon"],
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_IS_NIGHT':
      return { ...state, isNight: action.isNight };

    // ── MINING TICK ─────────────────────────────────────────────────────────
    case 'MINING_TICK': {
      if (!state.miningActive) return state;
      const now = Date.now();
      const elapsed = Math.min((now - state.lastMiningTick) / 1000, 30); // cap 30s

      // Energy consumption: 1 cell per hour
      const energyConsumed = elapsed / 3600;
      const newEnergy = state.isInfiniteEnergy
        ? state.energyCells
        : Math.max(0, state.energyCells - (elapsed * 0.005));

      // Energy scale affects effective hashrate
      const energyScale = energyToHashScale(newEnergy, state.maxEnergyCells);

      // Active events (filter expired)
      const activeEvents = state.activeMiningEvents.filter(ev => ev.endsAt > now);

      const isVipActiveNow = state.vip?.isActive && state.vip.expiresAt > now;
      const vipMult = isVipActiveNow ? (state.vip.tier === 'gold' ? 1.5 : 1.2) : 1.0;

      const farmHashRate = state.farmSettings.rigStatuses
        .filter((_, i) => i < state.farmSettings.activeRigs)
        .reduce((acc, rig) => acc + (rig.isBroken ? 0 : Math.floor(rig.efficiency * 1.2)), 0);

      const totalHashRateWithFarm = state.totalHashRate + farmHashRate;
      const btcEarned = calcBtcPerSecond(
        totalHashRateWithFarm,
        activeEvents,
        state.prestigeMultiplier,
        energyScale,
        state.isFeverMode,
        state.researchedNodes,
        vipMult,
        state.globalMultiplier
      ) * elapsed;
      const tpEarned = Math.floor(elapsed * 0.5 * (state.globalMultiplier || 1.0));
      const xpEarned = Math.floor(elapsed * 0.2 * (state.globalMultiplier || 1.0));

      // Level up
      let newXp = state.xp + xpEarned;
      let newLevel = state.level;
      let newXpToNext = state.xpToNextLevel;
      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel += 1;
        newXpToNext = xpForLevel(newLevel);
      }

      // Update Rank Title
      const ranks = [
        { min: 1, title: 'Garaj Madencisi' },
        { min: 6, title: 'Kripto Çırağı' },
        { min: 11, title: 'Blockchain Uzmanı' },
        { min: 21, title: 'Kripto Şövalye' },
        { min: 30, title: 'Mars İmparatoru' }
      ];
      const newRankTitle = ranks.reverse().find(r => newLevel >= r.min)?.title || state.rankTitle;

      // Battle pass XP (VIP gold = 2x)
      const isVipGold = state.vip?.isActive && state.vip.tier === 'gold' && state.vip.expiresAt > now;
      const bpXpEarned = Math.floor(elapsed * (isVipGold ? 1.0 : 0.5));
      const bp = state.battlePass ?? { currentLevel: 0, currentXP: 0, xpPerLevel: 500, isPremium: false, claimedRewardIds: [], endsAt: 0, season: 1 };
      let newBpXP = bp.currentXP + bpXpEarned;
      let newBpLevel = bp.currentLevel;
      while (newBpXP >= bp.xpPerLevel && newBpLevel < 30) { newBpXP -= bp.xpPerLevel; newBpLevel++; }
      if (newBpLevel >= 30) newBpXP = 0;

      // ── New: Deterioration & Economy ────────────────────────
      const tickMinutes = elapsed / 60;
      const electricityBill = state.farmSettings.baseElectricityCost * tickMinutes;

      // Update Contract Conditions
      const updatedContracts = state.ownedContracts.map(c => ({
        ...c,
        condition: Math.max(0, c.condition - (elapsed * 0.00005)) // ~4.3% reduction per day
      }));

      // Update Rig Conditions & Heat
      const updatedRigs = state.farmSettings.rigStatuses.map(r => {
        const wearRate = 0.00002 * (r.heat / 50); // Wear faster if hot
        const newCondition = Math.max(0, r.condition - (elapsed * wearRate));
        const heatReduction = state.researchedNodes.includes('cooling-1') ? 0.85 : 1.0;
        const heatingFactor = 0.1 * (state.farmSettings.activeRigs / state.farmSettings.coolingLevel) * heatReduction;
        const newHeat = Math.min(100, Math.max(30, r.heat + (elapsed * heatingFactor) - (elapsed * 0.05 * state.farmSettings.coolingLevel)));
        return { ...r, condition: newCondition, heat: newHeat };
      });

      // Calculate Average Efficiency Factor (Impacts BTC earnings)
      const avgCondition = updatedContracts.length > 0
        ? updatedContracts.reduce((acc, c) => acc + c.condition, 0) / updatedContracts.length
        : 100;
      const efficiencyFactor = avgCondition / 100;

      const newTx: Transaction = {
        id: `mining-${now}`,
        type: 'mining',
        amount: btcEarned * efficiencyFactor, // New! Scaled by condition
        label: 'Madencilik Kazancı',
        date: now,
        status: 'completed',
      };


      return {
        ...state,
        btcBalance: state.btcBalance + (btcEarned * efficiencyFactor),
        tycoonPoints: Math.max(0, state.tycoonPoints + tpEarned - electricityBill),
        battlePass: { ...bp, currentXP: newBpXP, currentLevel: newBpLevel },
        energyCells: newEnergy,
        activeMiningEvents: activeEvents,
        xp: newXp,
        level: newLevel,
        rankTitle: newRankTitle,
        xpToNextLevel: newXpToNext,
        lastMiningTick: now,
        currentBlock: state.currentBlock + 1,
        ownedContracts: updatedContracts,
        farmSettings: {
          ...state.farmSettings,
          rigStatuses: updatedRigs,
        },
        transactions: [newTx, ...state.transactions].slice(0, 100),
        isFeverMode: state.isFeverMode && now < state.feverEndsAt,
      };
    }

    // ── OFFLINE EARNINGS ────────────────────────────────────────────────────
    case 'CALC_OFFLINE_EARNINGS': {
      const { secondsAway } = action;
      if (secondsAway < 300) return state; // ignore <5 min

      // Use conservative rate (no events, avg 70% energy)
      const energyScale = energyToHashScale(state.maxEnergyCells * 0.7, state.maxEnergyCells);

      const farmHashRate = state.farmSettings.rigStatuses
        .filter((_, i) => i < state.farmSettings.activeRigs)
        .reduce((acc, rig) => acc + (rig.isBroken ? 0 : Math.floor(rig.efficiency * 1.2)), 0);

      const btcPerSec = calcBtcPerSecond(state.totalHashRate + farmHashRate, [], state.prestigeMultiplier, energyScale, false);
      const cappedSecs = Math.min(secondsAway, 8 * 3600); // cap 8h
      const earned = btcPerSec * cappedSecs;

      const newTx: Transaction = {
        id: `offline-${Date.now()}`,
        type: 'offline',
        amount: earned,
        label: `Çevrimdışı Kazanç (${Math.round(cappedSecs / 3600 * 10) / 10}s)`,
        date: Date.now(),
        status: 'completed',
      };

      return {
        ...state,
        btcBalance: state.btcBalance + earned,
        pendingOfflineEarnings: earned,
        offlineEarningsShown: false,
        lastMiningTick: Date.now(),
        transactions: [newTx, ...state.transactions].slice(0, 100),
      };
    }

    // ── PRESTIGE ──────────────────────────────────────────────────────────── 
    case 'PRESTIGE': {
      if (state.level < 10) return state; // require level 10+

      const newPrestigeLevel = state.prestigeLevel + 1;
      const newMultiplier = 1.0 + newPrestigeLevel * 0.25; // +25% each prestige
      const btcRetained = state.btcBalance * 0.20;       // keep 20% of balance

      const record: PrestigeRecord = {
        level: newPrestigeLevel,
        achievedAt: Date.now(),
        multiplierGained: 0.25,
        btcRetained,
      };

      const newTx: Transaction = {
        id: `prestige-${Date.now()}`,
        type: 'prestige',
        amount: btcRetained - state.btcBalance,
        label: `Prestige ${newPrestigeLevel} — ×${newMultiplier.toFixed(2)} Çarpan`,
        date: Date.now(),
        status: 'completed',
      };

      return {
        ...INITIAL_STATE,
        // Carry over permanent stuff
        username: state.username,
        userId: state.userId,
        referralCode: state.referralCode,
        referralCount: state.referralCount,
        usdRate: state.usdRate,
        guilds: state.guilds,
        userGuildId: state.userGuildId,
        // Prestige rewards
        prestigeLevel: newPrestigeLevel,
        prestigeMultiplier: newMultiplier,
        prestigeHistory: [...state.prestigeHistory, record],
        btcBalance: btcRetained,
        tycoonPoints: state.tycoonPoints,
        transactions: [newTx, ...state.transactions].slice(0, 100),
        lastMiningTick: Date.now(),
        lastEventCheckAt: 0,
      };
    }

    case 'TICK_EVENTS': {
      const now = Date.now();
      const isFeverOver = state.isFeverMode && now > state.feverEndsAt;

      // Random event generation (every ~4h)
      const INTERVAL_MS = 4 * 3600 * 1000;
      const timeSinceLast = now - state.lastEventCheckAt;
      let newEvents = state.activeMiningEvents.filter(ev => ev.endsAt > now);
      let newLastCheckAt = state.lastEventCheckAt;
      let newEnergy = state.energyCells;

      if (timeSinceLast >= INTERVAL_MS) {
        newLastCheckAt = now;
        // 40% chance to fire an event
        if (Math.random() <= 0.4) {
          const durations: Record<MiningEventType, number> = {
            flash_pool: 2 * 3600 * 1000,
            hash_storm: 30 * 60 * 1000,
            energy_surge: 1 * 3600 * 1000,
            block_halving: 1 * 3600 * 1000,
          };
          const event = generateEvent(durations[EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)].type as MiningEventType] || 3600000);
          newEvents = [...newEvents, event];
          if (event.type === 'energy_surge') {
            newEnergy = state.maxEnergyCells;
          }
        }
      }

      return {
        ...state,
        activeMiningEvents: newEvents,
        energyCells: newEnergy,
        lastEventCheckAt: newLastCheckAt,
        isFeverMode: isFeverOver ? false : state.isFeverMode,
      };
    }

    case 'DISMISS_OFFLINE_EARNINGS':
      return {
        ...state,
        pendingOfflineEarnings: 0,
        offlineEarningsShown: true
      };

    // ── EXISTING (unchanged) ────────────────────────────────────────────────
    case 'SET_USD_RATE':
      return { ...state, usdRate: action.rate };

    case 'ADD_ENERGY_CELLS':
      return { ...state, energyCells: Math.min(state.energyCells + action.amount, state.maxEnergyCells) };

    case 'REMOVE_ENERGY_CELLS':
      return { ...state, energyCells: Math.max(state.energyCells - action.amount, 0) };

    case 'WATCH_AD': {
      const now = Date.now();
      if (now - state.lastAdWatchTime < state.adCooldown) return state;

      const newTx: Transaction = {
        id: `ad-reward-${now}`,
        type: 'bonus',
        amount: state.adRewardBtc,
        label: 'Reklam Ödülü',
        date: now,
        status: 'completed',
      };

      return {
        ...state,
        btcBalance: state.btcBalance + state.adRewardBtc,
        tycoonPoints: state.tycoonPoints + state.adRewardTp,
        lastAdWatchTime: now,
        questProgress: { ...state.questProgress, adsWatched: state.questProgress.adsWatched + 1 },
        transactions: [newTx, ...state.transactions].slice(0, 100),
      };
    }

    case 'PURCHASE_CONTRACT': {
      const newHashRate = state.totalHashRate + action.contract.hashRate;
      const newTx: Transaction = {
        id: `purchase-${Date.now()}`, type: 'purchase',
        amount: -action.cost / 1e5, label: `Kontrat: ${action.contract.name}`,
        date: Date.now(), status: 'completed',
      };
      return {
        ...state,
        ownedContracts: [...state.ownedContracts, action.contract],
        totalHashRate: newHashRate,
        tycoonPoints: state.tycoonPoints + 100,
        transactions: [newTx, ...state.transactions].slice(0, 100),
        questProgress: { ...state.questProgress, contractsPurchased: state.questProgress.contractsPurchased + 1 },
      };
    }

    case 'WITHDRAW': {
      const newTx: Transaction = {
        id: `withdraw-${Date.now()}`, type: 'transfer_out',
        amount: -action.amount, label: 'BTC Çekim',
        date: Date.now(), status: 'pending',
      };
      return {
        ...state,
        btcBalance: Math.max(0, state.btcBalance - action.amount),
        transactions: [newTx, ...state.transactions].slice(0, 100),
      };
    }

    case 'CLAIM_QUEST':
      return {
        ...state,
        tycoonPoints: state.tycoonPoints + (action.reward.tp || 0),
        totalHashRate: action.reward.speedBoost
          ? state.totalHashRate * (1 + action.reward.speedBoost / 100)
          : state.totalHashRate,
        questProgress: { ...state.questProgress, claimedQuestIds: [...state.questProgress.claimedQuestIds, action.questId] },
      };

    case 'UPDATE_HAPPY_HOUR':
      return { ...state, happyHourActive: Date.now() < state.happyHourEndsAt };

    case 'ADD_TP': return { ...state, tycoonPoints: state.tycoonPoints + action.amount };
    case 'ADD_BTC': return { ...state, btcBalance: state.btcBalance + action.amount };

    case 'CREATE_GUILD': {
      if (state.tycoonPoints < action.cost) return state;
      const newGuild: Guild = {
        id: `guild-${Date.now()}`, name: action.name, description: action.description,
        members: 1, totalHash: state.totalHashRate, rank: state.guilds.length + 1,
        badge: action.badge, ownerId: state.userId,
        level: 1, xp: 0, xpToNextLevel: 1000,
      };
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - action.cost,
        guilds: [...state.guilds, newGuild],
        userGuildId: newGuild.id,
      };
    }

    case 'JOIN_GUILD': {
      const guildsAfterLeave = state.guilds.map(g =>
        g.id === state.userGuildId
          ? { ...g, members: Math.max(0, g.members - 1), totalHash: Math.max(0, g.totalHash - state.totalHashRate) }
          : g
      );
      return {
        ...state,
        guilds: guildsAfterLeave.map(g =>
          g.id === action.guildId ? { ...g, members: g.members + 1, totalHash: g.totalHash + state.totalHashRate } : g
        ),
        userGuildId: action.guildId,
      };
    }

    case 'LEAVE_GUILD':
      return {
        ...state,
        guilds: state.guilds.map(g =>
          g.id === state.userGuildId
            ? { ...g, members: Math.max(0, g.members - 1), totalHash: Math.max(0, g.totalHash - state.totalHashRate) }
            : g
        ),
        userGuildId: null,
      };

    case 'DONATE_TO_GUILD': {
      if (!state.userGuildId || state.tycoonPoints < action.amount) return state;
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - action.amount,
        guilds: state.guilds.map(g => {
          if (g.id !== state.userGuildId) return g;
          let newXp = g.xp + Math.floor(action.amount * 0.5); // 1 TP = 0.5 XP
          let newLevel = g.level;
          let newXpToNext = g.xpToNextLevel;
          while (newXp >= newXpToNext) {
            newXp -= newXpToNext;
            newLevel++;
            newXpToNext = Math.floor(newXpToNext * 1.5);
          }
          return { ...g, xp: newXp, level: newLevel, xpToNextLevel: newXpToNext };
        }),
      };
    }

    case 'APPLY_REFERRAL_CODE':
      if (state.redeemedReferralCode || action.code === state.referralCode) return state;
      return {
        ...state,
        redeemedReferralCode: action.code,
        tycoonPoints: state.tycoonPoints + 1000,
        totalHashRate: state.totalHashRate * 1.05,
      };

    case 'LOAD_STATE':
      return action.state;

    // ── Phase 2: Battle Pass ──────────────────────────────────────────────────
    case 'BP_ADD_XP': {
      const bp = state.battlePass;
      let newXP = bp.currentXP + action.amount;
      let newLevel = bp.currentLevel;
      while (newXP >= bp.xpPerLevel && newLevel < 30) {
        newXP -= bp.xpPerLevel;
        newLevel++;
      }
      if (newLevel >= 30) newXP = 0;
      return { ...state, battlePass: { ...bp, currentXP: newXP, currentLevel: newLevel } };
    }

    case 'BP_CLAIM_REWARD': {
      const r = action.reward;
      const bp = { ...state.battlePass, claimedRewardIds: [...state.battlePass.claimedRewardIds, action.rewardId] };
      let newState = { ...state, battlePass: bp };
      if (r.type === 'tp') newState = { ...newState, tycoonPoints: state.tycoonPoints + r.value };
      if (r.type === 'btc') newState = { ...newState, btcBalance: state.btcBalance + r.value };
      if (r.type === 'energy') newState = { ...newState, energyCells: Math.min(state.energyCells + r.value, state.maxEnergyCells) };
      if (r.type === 'hashboost') newState = { ...newState, totalHashRate: state.totalHashRate + r.value };
      if (r.type === 'vip_day') {
        const now = Date.now();
        const currentExpiry = state.vip.expiresAt > now ? state.vip.expiresAt : now;
        newState = { ...newState, vip: { ...state.vip, isActive: true, tier: 'silver', expiresAt: currentExpiry + r.value * 86400000, perks: VIP_PERKS.silver } };
      }
      return newState;
    }

    case 'BP_BUY_PREMIUM': {
      const PREMIUM_COST = 3000; // TP
      if (state.tycoonPoints < PREMIUM_COST) return state;
      return { ...state, tycoonPoints: state.tycoonPoints - PREMIUM_COST, battlePass: { ...state.battlePass, isPremium: true } };
    }

    // ── Phase 2: Marketplace ──────────────────────────────────────────────────
    case 'MARKET_LIST_CONTRACT': {
      // Remove contract from owned, add to market
      return {
        ...state,
        ownedContracts: state.ownedContracts.filter(c => c.id !== action.listing.contractId),
        totalHashRate: Math.max(0, state.totalHashRate - (state.ownedContracts.find(c => c.id === action.listing.contractId)?.hashRate ?? 0)),
        marketListings: [action.listing, ...state.marketListings],
      };
    }

    case 'MARKET_BUY_CONTRACT': {
      const listing = state.marketListings.find(l => l.id === action.listingId);
      if (!listing || state.tycoonPoints < listing.price) return state;
      const newContract: OwnedContract = {
        id: 'contract-' + Date.now(),
        name: listing.contractName,
        tier: listing.tier,
        hashRate: listing.hashRate,
        purchasedAt: Date.now(),
        durationDays: listing.daysRemaining,
        condition: 100,
        lastMaintenance: Date.now(),
      };
      const newTx: Transaction = {
        id: 'market-buy-' + Date.now(), type: 'purchase',
        amount: -(listing.price / 100000),
        label: 'Market: ' + listing.contractName,
        date: Date.now(), status: 'completed',
      };
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - listing.price,
        ownedContracts: [...state.ownedContracts, newContract],
        totalHashRate: state.totalHashRate + newContract.hashRate,
        marketListings: state.marketListings.filter(l => l.id !== action.listingId),
        transactions: [newTx, ...state.transactions].slice(0, 100),
      };
    }

    case 'MARKET_CANCEL_LISTING': {
      const listing = state.marketListings.find(l => l.id === action.listingId && l.isOwn);
      if (!listing) return state;
      const restored: OwnedContract = {
        id: listing.contractId, name: listing.contractName, tier: listing.tier,
        hashRate: listing.hashRate, purchasedAt: Date.now(), durationDays: listing.daysRemaining,
        condition: 100,
        lastMaintenance: Date.now(),
      };
      return {
        ...state,
        marketListings: state.marketListings.filter(l => l.id !== action.listingId),
        ownedContracts: [...state.ownedContracts, restored],
        totalHashRate: state.totalHashRate + restored.hashRate,
      };
    }

    // ── Phase 2: VIP ──────────────────────────────────────────────────────────
    case 'VIP_ACTIVATE': {
      const COSTS = { silver: 5000, gold: 12000 };
      const cost = COSTS[action.tier];
      if (state.tycoonPoints < cost) return state;
      const now = Date.now();
      const currentExpiry = state.vip.expiresAt > now ? state.vip.expiresAt : now;
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - cost,
        vip: {
          isActive: true,
          tier: action.tier,
          expiresAt: currentExpiry + action.days * 86400000,
          perks: VIP_PERKS[action.tier],
        },
      };
    }

    // ── Phase 2: Farm & Wheel ────────────────────────────────────────────────
    case 'UPDATE_FARM': {
      const newFarmSettings = { ...state.farmSettings, ...action.settings };
      // Calculate hashrate change if needed (but we'll do it purely via derived state or state update)
      // For now, let's keep it simple: totalHashRate = base (50) + contracts + rig hash
      // But wait, the current system adds contracts TO totalHashRate.
      // So we should probably calculate the rig hash difference.

      return {
        ...state,
        farmSettings: newFarmSettings,
      };
    }

    case 'LUCKY_WHEEL_SPIN': {
      if (state.tycoonPoints < action.cost) return state;
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - action.cost,
      };
    }

    case 'CLAIM_WHEEL_REWARD': {
      const { type, value, label } = action.reward;
      const now = Date.now();
      const newTx: Transaction = {
        id: `wheel-${now}`,
        type: 'bonus',
        amount: type === 'btc' ? (value as number) : 0,
        label: `Çark: ${label}`,
        date: now,
        status: 'completed',
      };

      if (type === 'speed') {
        // Create an 1-hour event for speed 
        const speedMultiplier = (value === '2x Hız') ? 2.0 : 5.0;
        const newEvent: MiningEvent = {
          id: `wheel-speed-${now}`,
          type: 'flash_pool',
          label: 'Çark Hız Bonusu',
          description: `${label} aktif!`,
          emoji: '⚡',
          multiplier: speedMultiplier,
          hashBoost: 0,
          endsAt: now + 3600000, // 1 hour
        };
        return {
          ...state,
          activeMiningEvents: [...state.activeMiningEvents, newEvent],
          transactions: [newTx, ...state.transactions].slice(0, 100),
        };
      }

      return {
        ...state,
        btcBalance: type === 'btc' ? state.btcBalance + (value as number) : state.btcBalance,
        tycoonPoints: type === 'tp' ? state.tycoonPoints + (value as number) : state.tycoonPoints,
        transactions: [newTx, ...state.transactions].slice(0, 100),
      };
    }

    case 'REPAIR_CONTRACT': {
      if (state.tycoonPoints < action.cost) return state;
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - action.cost,
        ownedContracts: state.ownedContracts.map(c =>
          c.id === action.contractId ? { ...c, condition: 100, lastMaintenance: Date.now() } : c
        ),
      };
    }

    case 'UPGRADE_INFRASTRUCTURE': {
      if (state.tycoonPoints < action.cost) return state;
      const { target } = action;
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - action.cost,
        farmSettings: {
          ...state.farmSettings,
          coolingLevel: target === 'cooling' ? state.farmSettings.coolingLevel + 1 : state.farmSettings.coolingLevel,
          powerSupplyLevel: target === 'power' ? state.farmSettings.powerSupplyLevel + 1 : state.farmSettings.powerSupplyLevel,
          baseElectricityCost: target === 'power' ? Math.max(1, state.farmSettings.baseElectricityCost * 0.9) : state.farmSettings.baseElectricityCost,
        }
      };
    }

    // ── ADMIN ACTIONS ───────────────────────────────────────────────────────
    case 'ADMIN_SET_BTC':
      return { ...state, btcBalance: action.amount };
    case 'ADMIN_SET_TP':
      return { ...state, tycoonPoints: action.amount };
    case 'ADMIN_SET_XP':
      return { ...state, xp: action.amount };
    case 'ADMIN_SET_LEVEL':
      return { ...state, level: action.level, xpToNextLevel: xpForLevel(action.level) };
    case 'ADMIN_SET_USD_RATE':
      return { ...state, usdRate: action.rate };
    case 'ADMIN_ADD_XP': {
      let newXp = state.xp + action.amount;
      let newLevel = state.level;
      let newXpToNext = state.xpToNextLevel;
      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = xpForLevel(newLevel);
      }
      return { ...state, xp: newXp, level: newLevel, xpToNextLevel: newXpToNext };
    }
    case 'ADMIN_ADD_HASHRATE':
      return { ...state, totalHashRate: state.totalHashRate + action.amount };
    case 'ADMIN_TOGGLE_INFINITE_ENERGY':
      return { ...state, isInfiniteEnergy: !state.isInfiniteEnergy };
    case 'ADMIN_TRIGGER_EVENT': {
      const template = EVENT_POOL.find(t => t.type === action.eventType) || EVENT_POOL[0];
      const newEvent: MiningEvent = {
        ...template,
        id: `admin-event-${Date.now()}`,
        endsAt: Date.now() + 15 * 60 * 1000, // 15 mins for admin events
      };
      return { ...state, activeMiningEvents: [newEvent, ...state.activeMiningEvents] };
    }

    case 'CLICK_MINING': {
      const now = Date.now();
      const isQuickClick = now - state.lastClickTime < 1500;
      const newCombo = isQuickClick ? state.comboCount + 1 : 1;

      // Multiplier based on combo
      let comboMultiplier = 1;
      if (newCombo >= 20) comboMultiplier = 10;
      else if (newCombo >= 15) comboMultiplier = 5;
      else if (newCombo >= 10) comboMultiplier = 3;
      else if (newCombo >= 5) comboMultiplier = 2;

      // Click power = base (0.0000001 BTC) * multiplier
      const baseClickBtc = 1e-17; // Extreme precision as requested
      const earned = baseClickBtc * comboMultiplier * state.prestigeMultiplier;

      // Auto-trigger Fever at 20 combo
      const triggerFever = newCombo === 20;
      const feverDuration = state.researchedNodes.includes('fever-1') ? 11000 : 8000;
      const feverEnds = triggerFever ? Date.now() + feverDuration : state.feverEndsAt;

      return {
        ...state,
        btcBalance: state.btcBalance + earned,
        comboCount: newCombo,
        lastClickTime: now,
        isFeverMode: triggerFever ? true : state.isFeverMode,
        feverEndsAt: feverEnds,
        xp: state.xp + 1, // 1 XP per click
      };
    }


    case 'CLAIM_STREAK_REWARD': {
      const now = Date.now();
      const streakReward = (state.streak.count + 1) * 200; // Mock reward logic
      return {
        ...state,
        tycoonPoints: state.tycoonPoints + streakReward,
        streak: {
          count: (state.streak.count % 7) + 1,
          lastClaim: now
        }
      };
    }

    case 'ACCEPT_CONTRACT': {
      return {
        ...state,
        activeContracts: [...state.activeContracts, action.contract]
      };
    }

    case 'COMPLETE_CONTRACT': {
      const contract = state.activeContracts.find(c => c.id === action.contractId);
      if (!contract) return state;
      return {
        ...state,
        btcBalance: state.btcBalance + contract.reward,
        activeContracts: state.activeContracts.filter(c => c.id !== action.contractId)
      };
    }

    case 'UNLOCK_RESEARCH': {
      if (state.tycoonPoints < action.cost) return state;
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - action.cost,
        researchedNodes: [...state.researchedNodes, action.nodeId]
      };
    }

    case 'ADMIN_UPDATE_MARKET_LISTING': {
      return {
        ...state,
        marketListings: state.marketListings.map(l => l.id === action.listingId ? { ...l, ...action.updates } : l)
      };
    }

    case 'ADMIN_UPDATE_JOB': {
      return {
        ...state,
        availableJobs: (state.availableJobs || []).map(j => j.id === action.jobId ? { ...j, ...action.updates } : j)
      };
    }
    case 'ADMIN_UPDATE_AD_SETTINGS':
      return { ...state, ...action.updates };
    case 'ADMIN_UPDATE_INTERSTITIAL_SETTINGS':
      return { ...state, ...action.updates };
    case 'RESET_INTERSTITIAL_TIMER':
      return { ...state, lastInterstitialAdAt: Date.now() };
    case 'SET_AUTH_USER':
      return { ...state, user: action.user, isLoading: action.user === null ? false : state.isLoading };
    case 'SET_GAME_STATE':
      return { ...state, ...action.state, isLoading: false };

    case 'SET_MARKETPLACE':
      return { ...state, marketListings: action.listings };

    case 'SET_GUILDS':
      return { ...state, guilds: action.guilds };
    case 'SET_GLOBAL_MULTIPLIER':
      return { ...state, globalMultiplier: action.multiplier };
    case 'ADMIN_RESET_GAME':
      return { ...INITIAL_STATE, lastMiningTick: Date.now() };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  btcToUsd: (btc: number) => string;
  formatBtc: (btc: number) => string;
  earnedTodayBtc: number;
  earnedTodayUsd: string;
  effectiveHashRate: number;
  energyScale: number;
  currentBtcPerSecond: number;
  canPrestige: boolean;
  isVipActive: boolean;
  vipBtcBonus: number;
  // Firestore Async Ops
  listContractOnMarket: (contract: OwnedContract, price: number) => Promise<void>;
  buyContractFromMarket: (listing: MarketListing) => Promise<void>;
  cancelMarketListing: (listingId: string) => Promise<void>;
  createGuildInFirestore: (name: string, desc: string, badge: string, cost: number) => Promise<void>;
  joinGuildInFirestore: (guild: Guild) => Promise<void>;
  leaveGuildInFirestore: (guildId: string, guildName: string) => Promise<void>;
  donateToGuildInFirestore: (amount: number) => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  // 🔐 Firebase Auth & Data Sync Logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch({ type: 'SET_AUTH_USER', user });

      if (user) {
        // Load or create user document in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          dispatch({ type: 'SET_GAME_STATE', state: userSnap.data() as any });
        } else {
          // Initialize new user data in firestore
          const { user: _u, isLoading: _l, ...serializableInitial } = INITIAL_STATE;
          await setDoc(userDocRef, {
            ...serializableInitial,
            lastMiningTick: Date.now()
          });
          dispatch({ type: 'SET_GAME_STATE', state: { isLoading: false } as any });
        }

        // Listen for Global Settings
        const globalRef = doc(db, 'settings', 'v1');
        const unsubscribeGlobal = onSnapshot(globalRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.ads) dispatch({ type: 'ADMIN_UPDATE_AD_SETTINGS', updates: data.ads });
            if (data.interstitials) dispatch({ type: 'ADMIN_UPDATE_INTERSTITIAL_SETTINGS', updates: data.interstitials });
          }
        });
        return () => unsubscribeGlobal();
      } else {
        dispatch({ type: 'SET_GAME_STATE', state: { isLoading: false } as any });
      }
    });

    return () => unsubscribe();
  }, []);

  // 💾 Sync User State to Firestore (Debounced)
  useEffect(() => {
    if (!state.user || state.isLoading) return;

    const timeout = setTimeout(async () => {
      const { user, isLoading, ...serializableState } = state;
      await setDoc(doc(db, 'users', state.user.uid), serializableState, { merge: true });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [
    state.btcBalance,
    state.tycoonPoints,
    state.level,
    state.xp,
    state.farmSettings,
    state.researchedNodes,
    state.prestigeLevel,
    state.prestigeMultiplier,
    state.battlePass,
    state.vip,
    state.activeMiningEvents,
    state.ownedContracts,
    state.activeContracts,
    state.user?.uid,
    state.isLoading
  ]);

  // 🕒 Timers & Side Effects
  useEffect(() => {
    const tick = setInterval(() => dispatch({ type: 'MINING_TICK' }), 5000);
    const events = setInterval(() => dispatch({ type: 'TICK_EVENTS' }), 30000);
    const happyHour = setInterval(() => dispatch({ type: 'UPDATE_HAPPY_HOUR' }), 60000);

    const checkTime = () => {
      const hour = new Date().getHours();
      const isNight = hour >= 20 || hour < 6;
      dispatch({ type: 'SET_IS_NIGHT', isNight });
    };
    checkTime();
    const nightCheck = setInterval(checkTime, 60000);

    const fetchBtc = async () => {
      try {
        const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
        const data = await res.json();
        const rate = parseFloat(data.data?.amount);
        if (!isNaN(rate)) dispatch({ type: 'SET_USD_RATE', rate });
      } catch { }
    };
    fetchBtc();
    const btcPrice = setInterval(fetchBtc, 60000);

    return () => {
      clearInterval(tick);
      clearInterval(events);
      clearInterval(happyHour);
      clearInterval(nightCheck);
      clearInterval(btcPrice);
    };
  }, []);

  // Volatility
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.15) {
        const isCrash = Math.random() < 0.5;
        const change = 0.05 + Math.random() * 0.15;
        const newRate = isCrash ? state.usdRate * (1 - change) : state.usdRate * (1 + change);
        dispatch({ type: 'SET_USD_RATE', rate: newRate });
      }
    }, 45000);
    return () => clearInterval(id);
  }, [state.usdRate]);

  // Helpers
  const btcToUsd = (btc: number) => {
    const usd = btc * state.usdRate;
    if (usd >= 1000) return `$${(usd / 1000).toFixed(2)}K`;
    if (usd >= 0.01) return `$${usd.toFixed(2)}`;
    return `$${usd.toFixed(4)}`;
  };

  const formatBtc = (btc: number) => {
    if (btc >= 0.001) return btc.toFixed(8);
    if (btc >= 0.00000001) return btc.toFixed(12);
    return btc.toFixed(20);
  };

  // Derived State
  const energyScale = energyToHashScale(state.energyCells, state.maxEnergyCells);
  const now = Date.now();
  const activeEvents = state.activeMiningEvents.filter(ev => ev.endsAt > now);
  const farmHashRate = state.farmSettings.rigStatuses
    .filter((_, i) => i < state.farmSettings.activeRigs)
    .reduce((acc, rig) => acc + (rig.isBroken ? 0 : Math.floor(rig.efficiency * 1.2)), 0);
  const totalHashRateWithFarm = state.totalHashRate + farmHashRate;
  const currentBtcPerSecond = calcBtcPerSecond(totalHashRateWithFarm, activeEvents, state.prestigeMultiplier, energyScale, state.isFeverMode);
  const effectiveHashRate = totalHashRateWithFarm * energyScale;
  const earnedTodayBtc = currentBtcPerSecond * 86400;
  const earnedTodayUsd = btcToUsd(earnedTodayBtc);
  const canPrestige = state.level >= 10;
  const isVipActive = state.vip?.isActive && state.vip.expiresAt > Date.now();
  const vipBtcBonus = isVipActive ? (state.vip.tier === 'gold' ? 1.5 : 1.2) : 1.0;

  // 💱 Firestore Async Operations implementation
  const listContractOnMarket = async (contract: OwnedContract, price: number) => {
    if (!state.user) return;
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', state.user!.uid);
        const marketRef = doc(collection(db, 'marketplace'));

        // Add to market
        transaction.set(marketRef, {
          contractId: contract.id,
          contractName: contract.name,
          tier: contract.tier,
          hashRate: contract.hashRate,
          daysRemaining: Math.max(1, contract.durationDays - Math.floor((Date.now() - contract.purchasedAt) / 86400000)),
          sellerName: state.username || 'Anon',
          sellerId: state.user!.uid,
          price,
          listedAt: Date.now()
        });

        // Remove from user (optimistic update is handled by listener eventually, but we dispatch locally for snappiness)
        const newContracts = state.ownedContracts.filter(c => c.id !== contract.id);
        transaction.update(userRef, { ownedContracts: newContracts });
        dispatch({ type: 'MARKET_LIST_CONTRACT', listing: { id: marketRef.id, ...contract } as any }); // Minimal local sync
      });
    } catch (e) {
      console.error("Market list failed", e);
      throw e;
    }
  };

  const buyContractFromMarket = async (listing: MarketListing) => {
    if (!state.user || state.tycoonPoints < listing.price) return;
    try {
      await runTransaction(db, async (transaction) => {
        const buyerRef = doc(db, 'users', state.user!.uid);
        const sellerRef = doc(db, 'users', listing.sellerId!);
        const listingRef = doc(db, 'marketplace', listing.id);

        // Deduct from buyer
        transaction.update(buyerRef, {
          tycoonPoints: increment(-listing.price),
          ownedContracts: [...state.ownedContracts, {
            id: listing.contractId,
            name: listing.contractName,
            tier: listing.tier,
            hashRate: listing.hashRate,
            purchasedAt: Date.now(),
            durationDays: listing.daysRemaining,
            condition: 100,
            lastMaintenance: Date.now()
          }]
        });

        // Add to seller (optional: minus commission if not VIP)
        transaction.update(sellerRef, { tycoonPoints: increment(listing.price) });

        // Delete listing
        transaction.delete(listingRef);
      });
    } catch (e) {
      console.error("Market buy failed", e);
      throw e;
    }
  };

  const cancelMarketListing = async (listingId: string) => {
    if (!state.user) return;
    await deleteDoc(doc(db, 'marketplace', listingId));
  };

  const createGuildInFirestore = async (name: string, desc: string, badge: string, cost: number) => {
    if (!state.user || state.tycoonPoints < cost) return;
    const guildRef = doc(collection(db, 'guilds'));
    const userRef = doc(db, 'users', state.user.uid);

    await runTransaction(db, async (transaction) => {
      transaction.set(guildRef, {
        name,
        description: desc,
        badge,
        members: 1,
        totalHash: state.totalHashRate,
        rank: 999,
        ownerId: state.user!.uid,
        level: 1,
        xp: 0,
        xpToNextLevel: 1000
      });
      transaction.update(userRef, {
        tycoonPoints: increment(-cost),
        userGuildId: guildRef.id
      });
    });
  };

  const joinGuildInFirestore = async (guild: Guild) => {
    if (!state.user) return;
    const guildRef = doc(db, 'guilds', guild.id);
    const userRef = doc(db, 'users', state.user.uid);

    await runTransaction(db, async (transaction) => {
      transaction.update(guildRef, {
        members: increment(1),
        totalHash: increment(state.totalHashRate)
      });
      transaction.update(userRef, { userGuildId: guild.id });
    });
  };

  const leaveGuildInFirestore = async (guildId: string) => {
    if (!state.user) return;
    const guildRef = doc(db, 'guilds', guildId);
    const userRef = doc(db, 'users', state.user.uid);

    await runTransaction(db, async (transaction) => {
      transaction.update(guildRef, {
        members: increment(-1),
        totalHash: increment(-state.totalHashRate)
      });
      transaction.update(userRef, { userGuildId: null });
    });
  };

  const donateToGuildInFirestore = async (amount: number) => {
    if (!state.user || !state.userGuildId || state.tycoonPoints < amount) return;
    const guildRef = doc(db, 'guilds', state.userGuildId);
    const userRef = doc(db, 'users', state.user.uid);

    await runTransaction(db, async (transaction) => {
      transaction.update(guildRef, { xp: increment(amount * 0.5) });
      transaction.update(userRef, { tycoonPoints: increment(-amount) });
    });
  };

  return (
    <GameContext.Provider value={{
      state, dispatch, btcToUsd, formatBtc, earnedTodayBtc, earnedTodayUsd,
      effectiveHashRate, energyScale, currentBtcPerSecond, canPrestige, isVipActive, vipBtcBonus,
      listContractOnMarket, buyContractFromMarket, cancelMarketListing, createGuildInFirestore,
      joinGuildInFirestore, leaveGuildInFirestore, donateToGuildInFirestore
    }}>
      {children}
    </GameContext.Provider>
  );
};

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
