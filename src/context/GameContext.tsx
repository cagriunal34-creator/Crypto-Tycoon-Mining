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
import { BP_REWARDS, SEASON_2_REWARDS } from '../constants/gameData';
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
  PrestigeRecord,
  FactoryData,
  AltcoinBalances,
  CosmeticsState
} from '../types';
import { supabase, TABLES } from '../lib/supabase';
import { auth, onAuthStateChanged } from '../lib/firebase';

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
  PrestigeRecord,
  FactoryData,
  AltcoinBalances,
  CosmeticsState
};

// ─── Admin-Driven Dynamic Types ───────────────────────────────────────────────

export interface DynamicMiningItem {
  id: string;
  name: string;
  tier: string;
  price: number;         // TP maliyeti (oyun içi para)
  price_usd: number;     // Gerçek USD fiyatı (IAP için)
  hashrate: number;
  daily_btc: number;
  energy_cost: number;
  duration_days: number; // Cihaz ömrü (gün)
  return_rate: number;   // Kullanıcıya geri dönüş oranı (örn: 0.25 = %25)
  description?: string;
  available?: boolean;
}

export interface ActiveGameEvent {
  id: string;
  name: string;
  type: string; // 'multiplier' | 'discount' | 'bonus_tp'
  multiplier: number;
  active: boolean;
  ends_at?: string;
  created_at: string;
}

export interface InboxNotification {
  id: string;
  title: string;
  body: string;
  type: string; // 'info' | 'warning' | 'reward' | 'system'
  target_id: string;
  created_at: string;
  read: boolean;
}

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
  claimedGuildRewards: string[]; // IDs of rewards already claimed

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
  contractsCompleted: number;

  // Referral
  referralCode: string;
  referralCount: number;
  redeemedReferralCode: string | null;

  // User
  username: string;
  email: string;
  phone: string;
  avatarUrl: string;
  userId: string;
  rankTitle: string;
  isAdmin: boolean;

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
  leaderboard: any[];
  cosmetics: CosmeticsState;

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
  adRewardDailyLimit: number;
  adRewardDuration: number;
  adRewardEnabled: boolean;
  adCooldown: number; // ms
  // ── NEW: Interstitial Ads ──────────────────────────────────────────────────
  interstitialAdInterval: number; // ms
  lastInterstitialAdAt: number;   // timestamp
  // ── NEW: Firebase Auth & Sync ─────────────────────────────────────────────
  user: any | null; // Firebase User object
  isLoading: boolean;
  globalMultiplier: number; // Global event/setting multiplier
  isMaintenance: boolean;
  announcement: string;
  activeModal: string | null;
  globalSettings: any;
  rewardedAdUnitId: string;
  bannerAdUnitId: string;
  interstitialAdUnitId: string;
  appOpenAdUnitId: string;
  adFrequencyMinutes: number;
  googleAdsConfig: {
    publisherId: string;
    bannerSlotId: string;
    interstitialSlotId: string;
    rewardedSlotId: string;
    rewardedInterstitialSlotId: string;
    appOpenSlotId: string;
    nativeSlotId: string;
    bannerEnabled: boolean;
    interstitialEnabled: boolean;
    rewardedEnabled: boolean;
    rewardedInterstitialEnabled: boolean;
    appOpenEnabled: boolean;
    nativeEnabled: boolean;
    testMode: boolean;
    bannerPosition: 'top' | 'bottom';
    bannerAutoRefresh: boolean;
    bannerRefreshSeconds: number;
    interstitialFrequencyMinutes: number;
  } | null;
  dailyEarningsBtc: number;
  lastEarningsResetDate: string; // ISO yyyy-mm-dd

  // ── Realtime Admin-Driven Data ──────────────────────────────────────────────
  dynamicMiningItems: DynamicMiningItem[];   // admin'den çekilen ekipmanlar
  activeGameEvents: ActiveGameEvent[];       // admin'den gelen aktif etkinlikler
  inboxNotifications: InboxNotification[];   // admin'den gelen bildirimler

  // ── Overclock Sistemi ───────────────────────────────────────────────────────
  overclockActive: boolean;          // şu an overclock açık mı
  overclockEndsAt: number;           // overclock bitiş timestamp (ms)
  overclockCooldownUntil: number;
  overclockConfig: {
    enabled: boolean;
    multiplier: number;
    penalty: number;
    durationMinutes: number;
    cooldownMinutes: number;
    costTp: number;
    costBtc: number;
  };

  // ── Çekim Limit Sistemi ─────────────────────────────────────────────────────
  totalLifetimeDeposit: number;      // kullanıcının toplam yatırdığı BTC (tüm zamanlar)
  totalLifetimeWithdrawn: number;    // kullanıcının toplam çektiği BTC (tüm zamanlar)
  dailyWithdrawnBtc: number;         // bugün çekilen BTC
  lastWithdrawDate: string;          // ISO yyyy-mm-dd
  adsWatchedForWithdraw: number;     // çekim için izlenen reklam sayısı (bugünkü)
  withdrawConfig: {                  // admin'den ayarlanabilir
    enabled: boolean;
    minAmountBtc: number;            // minimum çekim miktarı
    maxMultiplier: number;           // max_withdraw = totalDeposit × maxMultiplier
    dailyLimitBtc: number;           // günlük toplam çekim limiti (0 = sınırsız)
    adsRequired: number;             // çekim başına gereken reklam izleme sayısı (0 = zorunlu değil)
    depositRequiredBtc: number;      // minimum deposit olmadan çekim yapılamaz
    adRewardMultiplier: number;      // reklam izleyince limit ne kadar artar
  };
  wheelRewards: any[]; // Dinamik çark ödülleri
  factoryData: FactoryData;
  altcoinBalances: AltcoinBalances;
}

// ─── Initial State ────────────────────────────────────────────────────────────

export const INITIAL_STATE: GameState = {
  btcBalance: 0,
  tycoonPoints: 0,
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

  guilds: [],
  userGuildId: null,

  transactions: [],

  questProgress: {
    adsWatched: 0,
    contractsPurchased: 0,
    referralsDone: 0,
    loginStreak: 0,
    contractsCompleted: 0,
    claimedQuestIds: [],
  },

  level: 1,
  xp: 0,
  xpToNextLevel: 500,
  loginStreak: 1,
  lastLoginDate: new Date().toISOString().split('T')[0],
  contractsCompleted: 0,

  referralCode: '',
  referralCount: 0,
  redeemedReferralCode: null,

  username: '',
  email: '',
  phone: '',
  avatarUrl: '',
  userId: '',
  rankTitle: 'Yeni Madenci',
  isAdmin: false,

  // Prestige defaults
  prestigeLevel: 0,
  prestigeMultiplier: 1.0,
  prestigeHistory: [],

  // Events defaults
  activeMiningEvents: [],
  lastEventCheckAt: 0,

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
  marketListings: [],
  leaderboard: [],
  cosmetics: { owned: [], equipped: {} },

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

  comboCount: 0,
  lastClickTime: 0,
  isFeverMode: false,
  feverEndsAt: 0,
  lastWheelSpin: 0,
  wheelRewards: [],

  factoryData: {
    slots: [
      { id:0, state:'idle', recipeId:null, startedAt:0, finishesAt:0, locked:false, unlockCost:0 },
      { id:1, state:'idle', recipeId:null, startedAt:0, finishesAt:0, locked:false, unlockCost:0 },
      { id:2, state:'idle', recipeId:null, startedAt:0, finishesAt:0, locked:true,  unlockCost:3000 },
      { id:3, state:'idle', recipeId:null, startedAt:0, finishesAt:0, locked:true,  unlockCost:6000 },
      { id:4, state:'idle', recipeId:null, startedAt:0, finishesAt:0, locked:true,  unlockCost:12000 },
      { id:5, state:'idle', recipeId:null, startedAt:0, finishesAt:0, locked:true,  unlockCost:25000 },
    ],
    resources: { silicon:15, copper:12, lithium:8, rare:3 },
    unlockedRecipes: ['r_chip', 'r_wire'],
  },
  altcoinBalances: {
    eth:0, sol:0, bnb:0, doge:0, ada:0, avax:0
  },
  streak: {
    count: 0,
    lastClaim: 0,
  },

  // Offline
  pendingOfflineEarnings: 0,
  offlineEarningsShown: false,

  // Phase 3: Mining Empire
  activeContracts: [],
  availableJobs: [
    { id: 'job-1', label: 'Blockchain Doğrulama', client: 'FinTech Ltd.', goalHash: 50,  duration: 300,  reward: 0.000001, description: '5 dk temel görev.' },
    { id: 'job-2', label: 'DeFi Protokol Güvenliği', client: 'CryptoBridge', goalHash: 100, duration: 600,  reward: 0.000003, description: '10 dk orta görev.' },
    { id: 'job-3', label: 'NFT Mint Operasyonu', client: 'ArtChain', goalHash: 200, duration: 1200, reward: 0.000008, description: '20 dk gelişmiş görev.' },
    { id: 'job-4', label: 'DAO Oylaması Güvencesi', client: 'GovernDAO', goalHash: 500, duration: 3600, reward: 0.000025, description: '60 dk uzman görevi.' },
  ],
  researchedNodes: [],
  lastAdWatchTime: 0,
  adRewardBtc: 0,
  adRewardTp: 0,
  adRewardDailyLimit: 10,
  adRewardDuration: 30,
  adRewardEnabled: true,
  adCooldown: 0,
  interstitialAdInterval: 0,
  lastInterstitialAdAt: 0,
  user: null,
  isLoading: true,
  globalMultiplier: 1.0,
  isMaintenance: false,
  announcement: '',
  activeModal: null,
  globalSettings: {},
  rewardedAdUnitId: 'ca-app-pub-6329108306834809/8774596958',
  bannerAdUnitId: '',
  interstitialAdUnitId: '',
  appOpenAdUnitId: '',
  adFrequencyMinutes: 5,
  googleAdsConfig: null,
  dailyEarningsBtc: 0,
  lastEarningsResetDate: new Date().toISOString().split('T')[0],
  dynamicMiningItems: [],
  activeGameEvents: [],
  inboxNotifications: [],
  overclockActive: false,
  overclockEndsAt: 0,
  overclockCooldownUntil: 0,
  overclockConfig: {
    enabled: true,
    multiplier: 1.5,
    penalty: 0.8,
    durationMinutes: 120,
    cooldownMinutes: 240,
    costTp: 50,
    costBtc: 0,
  },
  totalLifetimeDeposit: 0,
  totalLifetimeWithdrawn: 0,
  dailyWithdrawnBtc: 0,
  lastWithdrawDate: new Date().toISOString().split('T')[0],
  adsWatchedForWithdraw: 0,
  withdrawConfig: {
    enabled: true,
    minAmountBtc: 0.001,
    maxMultiplier: 0.25,
    dailyLimitBtc: 0.005,
    adsRequired: 3,
    depositRequiredBtc: 0.0001,
    adRewardMultiplier: 1.0,
  },
  claimedGuildRewards: [],
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_IS_NIGHT'; isNight: boolean }
  | { type: 'MINING_TICK' }
  | { type: 'UPDATE_HAPPY_HOUR' }
  | { type: 'TICK_EVENTS' }
  | { type: 'REPAIR_CONTRACT'; contractId: string; cost: number }
  | { type: 'UPGRADE_INFRASTRUCTURE'; target: 'cooling' | 'power'; cost: number }
  | { type: 'ADMIN_SET_BTC'; amount: number }
  | { type: 'ADMIN_SET_TP'; amount: number }
  | { type: 'ADMIN_SET_XP'; amount: number }
  | { type: 'ADMIN_SET_LEVEL'; level: number }
  | { type: 'ADMIN_SET_USD_RATE'; rate: number }
  | { type: 'ADMIN_ADD_XP'; amount: number }
  | { type: 'ADMIN_ADD_HASHRATE'; amount: number }
  | { type: 'ADMIN_TOGGLE_INFINITE_ENERGY' }
  | { type: 'ADMIN_TRIGGER_EVENT'; eventType: MiningEventType }
  | { type: 'CLICK_MINING' }
  | { type: 'CLAIM_STREAK_REWARD' }
  | { type: 'ACCEPT_CONTRACT'; contract: any }
  | { type: 'COMPLETE_CONTRACT'; contractId: string }
  | { type: 'UNLOCK_RESEARCH'; nodeId: string; cost: number }
  | { type: 'ADMIN_UPDATE_MARKET_LISTING'; listingId: string; updates: any }
  | { type: 'ADMIN_UPDATE_JOB'; jobId: string; updates: any }
  | { type: 'ADMIN_UPDATE_AD_SETTINGS'; updates: any }
  | { type: 'ADMIN_UPDATE_INTERSTITIAL_SETTINGS'; updates: any }
  | { type: 'RESET_INTERSTITIAL_TIMER' }
  | { type: 'SET_AUTH_USER'; user: any }
  | { type: 'SET_GAME_STATE'; state: Partial<GameState> }
  | { type: 'SET_MARKETPLACE'; listings: MarketListing[] }
  | { type: 'SET_LEADERBOARD'; leaders: any[] }
  | { type: 'SET_GUILDS'; guilds: Guild[] }
  | { type: 'SET_AD_REWARD'; btc: number; tp: number; dailyLimit: number; duration: number; enabled: boolean }
  | { type: 'SET_GLOBAL_MULTIPLIER'; multiplier: number }
  | { type: 'SET_MAINTENANCE'; isMaintenance: boolean }
  | { type: 'SET_GLOBAL_SETTINGS'; settings: any }
  | { type: 'SET_GOOGLE_ADS_CONFIG'; config: any }
  | { type: 'SET_ANNOUNCEMENT'; announcement: string }
  | { type: 'SET_USD_RATE'; rate: number }
  | { type: 'REMOVE_BTC'; amount: number; label: string; txId: string }
  | { type: 'ADD_TP'; amount: number }
  | { type: 'COSMETIC_BUY'; id: string; cost: number }
  | { type: 'COSMETIC_EQUIP'; id: string; category: string }
  | { type: 'COSMETIC_UNEQUIP'; category: string }
  | { type: 'ADD_ENERGY'; amount: number }
  | { type: 'REMOVE_ENERGY_CELLS'; amount: number }
  | { type: 'DISMISS_OFFLINE_EARNINGS' }
  | { type: 'SET_TRANSACTIONS'; transactions: Transaction[] }
  | { type: 'BP_CLAIM_REWARD'; rewardId: string }
  | { type: 'BP_BUY_PREMIUM' }
  | { type: 'APPLY_REFERRAL_CODE'; code: string }
  | { type: 'ADMIN_RESET_GAME' }
  | { type: 'PRESTIGE' }
  | { type: 'CLAIM_QUEST'; questId: string; reward: { tp?: number; speedBoost?: number } }
  | { type: 'VIP_ACTIVATE'; tier: 'silver' | 'gold'; days: number; cost: number }
  | { type: 'UPDATE_FARM'; settings: Partial<FarmSettings> }
  | { type: 'PURCHASE_CONTRACT'; contract: OwnedContract; cost: number }
  | { type: 'CALC_OFFLINE_EARNINGS'; secondsAway: number }
  | { type: 'LUCKY_WHEEL_SPIN'; cost: number }
  | { type: 'CLAIM_WHEEL_REWARD'; reward: { type: string; value: number | string; label: string } }
  | { type: 'WATCH_AD' }
  | { type: 'SET_MODAL'; modal: string | null }
  | { type: 'UPDATE_PROFILE'; updates: Partial<{ username: string; email: string; phone: string; avatarUrl: string }> }
  | { type: 'SET_DYNAMIC_MINING_ITEMS'; items: DynamicMiningItem[] }
  | { type: 'SET_ACTIVE_GAME_EVENTS'; events: ActiveGameEvent[] }
  | { type: 'SET_INBOX_NOTIFICATIONS'; notifications: InboxNotification[] }
  | { type: 'MARK_NOTIFICATION_READ'; id: string }
  | { type: 'PREPEND_INBOX_NOTIFICATION'; notification: InboxNotification }
  | { type: 'REDEEM_PROMO_CODE'; code: string; btc: number; tp: number }
  | { type: 'OVERCLOCK_ACTIVATE' }
  | { type: 'OVERCLOCK_TICK' }
  | { type: 'SET_OVERCLOCK_CONFIG'; config: Partial<GameState['overclockConfig']> }
  | { type: 'CONTRACT_ADD_EARNINGS'; contractId: string; btcEarned: number }
  | { type: 'AD_BOOST_MINING'; hoursEquivalent: number } // reklam izle → X saatlik kazanç anında al
  | { type: 'RECORD_WITHDRAWAL'; amount: number }
  | { type: 'SET_WITHDRAW_CONFIG'; config: Partial<GameState['withdrawConfig']> }
  | { type: 'INCREMENT_ADS_FOR_WITHDRAW' }
  | { type: 'RESET_ADS_FOR_WITHDRAW' }
  | { type: 'SET_DEPOSIT_STATS'; totalDeposit: number; totalWithdrawn: number }
  | { type: 'CLAIM_GUILD_REWARD'; goalId: string; rewardBtc: number }
  | { type: 'SET_WHEEL_REWARDS'; rewards: any[] }
  | { type: 'ACTIVATE_SURGE' }
  | { type: 'ADD_BTC', amount: number }
  | { type: 'FACTORY_UPDATE_DATA'; data: Partial<FactoryData> }
  | { type: 'ALTCOIN_SET_BALANCES'; balances: AltcoinBalances };

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function energyToHashScale(cells: number, maxCells: number): number {
  if (maxCells === 0) return 0;
  const ratio = cells / maxCells;
  return 0.30 + 0.70 * ratio; // 30%..100%
}

export function calcBtcPerSecond(
  baseHashRate: number,
  events: MiningEvent[],
  prestigeMultiplier: number,
  energyScale: number,
  isFever: boolean = false,
  researchedNodes: string[] = [],
  vipMult: number = 1.0,
  globalMult: number = 1.0,
  overclockMult: number = 1.0,
  usdRate: number = 91200,
  miningDifficulty: number = 50,
  hashRateTiers?: any
): number {
  if (baseHashRate < 0) return 0;
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
  
  // Admin panelinden gelen gelir dengesi (USD/Saat -> BTC/Saniye)
  const usdPerHourPerGh = hashRateTiers?.gh || 0.05;
  const btcPerSecPerGh = (usdPerHourPerGh / 3600) / (usdRate || 91200);
  
  const baseEarnings = totalHash * btcPerSecPerGh;
  
  // Zorluk Çarpanı (Admin'den 1-100 arası, 50 baz kabul edildi)
  const difficultyMult = 50 / (miningDifficulty || 50);

  let researchMult = 1.0;
  if (researchedNodes?.includes('mining-1')) researchMult += 0.1;
  if (researchedNodes?.includes('mining-2')) researchMult += 0.5;

  const finalMult = eventMult * prestigeMultiplier * energyScale * researchMult * (vipMult || 1.0) * (globalMult || 1.0) * overclockMult * difficultyMult;
  return baseEarnings * finalMult;
}

function xpForLevel(level: number): number {
  return Math.floor(200 * Math.pow(1.5, level - 1));
}

const EVENT_POOL: Omit<MiningEvent, 'id' | 'endsAt'>[] = [
  { type: 'flash_pool', label: 'Flaş Havuz Bonusu', description: 'Tüm madenciler 2 saat boyunca 1.5x BTC kazanıyor!', emoji: '⚡', multiplier: 1.5, hashBoost: 0 },
  { type: 'hash_storm', label: 'Hash Fırtınası', description: '30 dakika boyunca +500 Gh/s ekstra güç!', emoji: '🌪️', multiplier: 1.0, hashBoost: 500 },
  { type: 'energy_surge', label: 'Enerji Dalgası', description: 'Tüm enerji hücreleri anında yenilendi!', emoji: '🔋', multiplier: 1.2, hashBoost: 0, energyRestore: 999 },
  { type: 'block_halving', label: 'Blok Yarılanması', description: 'Piyasa şoku! 1 saat boyunca kazanç yarı yarıya.', emoji: '📉', multiplier: 0.5, hashBoost: 0 },
];

function generateEvent(durationMs: number): MiningEvent {
  const template = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  return {
    ...template,
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    endsAt: Date.now() + durationMs,
  };
}

const VIP_PERKS: Record<string, string[]> = {
  silver: ["Reklam yok", "%20 bonus BTC", "Gumus avatar cercevesi", "Oncelikli destek"],
  gold: ["Reklam yok", "%50 bonus BTC", "Altin avatar cercevesi", "Ozel lonca rozeti", "2x Battle Pass XP", "Marketplace 0 komisyon"],
};


// ─── Reducer ─────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_IS_NIGHT': return { ...state, isNight: action.isNight };
    case 'MINING_TICK': {
      if (!state.miningActive) return state;
      const now = Date.now();
      const elapsed = Math.min((now - state.lastMiningTick) / 1000, 30);
      
      const drainPerSec = 1 / 3600;
      const newEnergy = state.isInfiniteEnergy ? state.energyCells : Math.max(0, state.energyCells - (elapsed * drainPerSec));
      
      const energyScale = energyToHashScale(newEnergy, state.maxEnergyCells);
      const activeEvents = (state.activeMiningEvents || []).filter(ev => ev.endsAt > now);

      const today = new Date().toISOString().split('T')[0];
      let currentDailyEarnings = state.lastEarningsResetDate === today ? state.dailyEarningsBtc : 0;
      
      const isVipActiveNow = state.vip?.isActive && state.vip.expiresAt > now;
      const vipBtcBonus = isVipActiveNow ? (state.vip.tier === 'gold' ? 1.5 : 1.2) : 1.0;
      const farmHashRate = (state.farmSettings?.rigStatuses || []).filter((_, i) => i < (state.farmSettings?.activeRigs || 0)).reduce((acc, rig) => acc + (rig.isBroken ? 0 : Math.floor(rig.efficiency * 1.2)), 0);
      const totalHashRateWithFarm = state.totalHashRate + farmHashRate;

      // Overclock hesaplama: aktifse boost, cooldown'daysa ceza, normalse 1.0
      const isOverclockActive = state.overclockActive && state.overclockEndsAt > now;
      const isInCooldown = !isOverclockActive && now < state.overclockCooldownUntil;
      const overclockMult = isOverclockActive
        ? (state.overclockConfig?.multiplier ?? 1.5)
        : isInCooldown
          ? (state.overclockConfig?.penalty ?? 0.8)
          : 1.0;

      const btcPerSecond = calcBtcPerSecond(
        totalHashRateWithFarm, 
        activeEvents, 
        state.prestigeMultiplier, 
        energyScale, 
        state.isFeverMode, 
        state.researchedNodes, 
        vipBtcBonus, 
        state.globalMultiplier, 
        overclockMult,
        state.usdRate,
        state.globalSettings?.miningDifficulty,
        state.globalSettings?.hashRateTiers
      );
      
      let earnedBtc = btcPerSecond * elapsed;
      
      // limit non-VIP to $1/day
      if (!isVipActiveNow) {
        const maxDailyBtc = 1.0 / (state.usdRate || 91200);
        const remainingAllowance = Math.max(0, maxDailyBtc - currentDailyEarnings);
        if (earnedBtc > remainingAllowance) {
          earnedBtc = remainingAllowance;
        }
      }
      
      return { 
        ...state, 
        btcBalance: state.btcBalance + earnedBtc, 
        energyCells: newEnergy, 
        lastMiningTick: now,
        dailyEarningsBtc: currentDailyEarnings + earnedBtc,
        lastEarningsResetDate: today
      };
    }
    case 'TICK_EVENTS': {
      const now = Date.now();
      const activeEvents = (state.activeMiningEvents || []).filter(ev => ev.endsAt > now);
      if (now - state.lastEventCheckAt > 300000 && Math.random() < 0.3) {
        return { ...state, activeMiningEvents: [...activeEvents, generateEvent(Math.random() * 3600000 + 1800000)], lastEventCheckAt: now };
      }
      return { ...state, activeMiningEvents: activeEvents };
    }
    case 'SET_AUTH_USER': return { ...state, user: action.user };
    case 'SET_GAME_STATE': {
      const { user: _u, isLoading: _l, ...safeState } = action.state as any;
      
      const newState = { ...state, ...safeState };
      
      // Deep merge for complex objects
      if (safeState.farmSettings) {
        newState.farmSettings = { ...state.farmSettings, ...safeState.farmSettings };
        if (safeState.farmSettings.rigStatuses) {
          newState.farmSettings.rigStatuses = safeState.farmSettings.rigStatuses;
        }
      }
      
      if (safeState.questProgress) {
        newState.questProgress = { ...state.questProgress, ...safeState.questProgress };
      }

      return {
        ...newState,
        user: state.user,
        isLoading: (action.state as any).isLoading ?? state.isLoading,
      };
    }
    case 'ADD_TP': return { ...state, tycoonPoints: state.tycoonPoints + action.amount };
    case 'COSMETIC_BUY':
      if (state.cosmetics.owned.includes(action.id)) return state;
      if (state.tycoonPoints < action.cost) return state;
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - action.cost,
        cosmetics: { ...state.cosmetics, owned: [...state.cosmetics.owned, action.id] },
      };
    case 'COSMETIC_EQUIP':
      return {
        ...state,
        cosmetics: {
          ...state.cosmetics,
          equipped: { ...state.cosmetics.equipped, [action.category]: action.id },
        },
      };
    case 'COSMETIC_UNEQUIP':
      return {
        ...state,
        cosmetics: {
          ...state.cosmetics,
          equipped: { ...state.cosmetics.equipped, [action.category]: undefined },
        },
      };
    case 'ADD_ENERGY': return { ...state, energyCells: Math.min(state.maxEnergyCells, state.energyCells + action.amount) };
    case 'REMOVE_BTC': return { ...state, btcBalance: Math.max(0, state.btcBalance - action.amount) };
    case 'REMOVE_ENERGY_CELLS': return { ...state, energyCells: Math.max(0, state.energyCells - action.amount) };
    case 'DISMISS_OFFLINE_EARNINGS': return { ...state, offlineEarningsShown: true, pendingOfflineEarnings: 0 };
    case 'RESET_INTERSTITIAL_TIMER': return { ...state, lastInterstitialAdAt: Date.now() };
    case 'SET_GLOBAL_SETTINGS': return { ...state, globalSettings: action.settings };
    case 'SET_GOOGLE_ADS_CONFIG': return { ...state, googleAdsConfig: action.config };
    case 'SET_AD_REWARD': return {
      ...state,
      adRewardBtc: action.btc,
      adRewardTp: action.tp,
      adRewardDailyLimit: action.dailyLimit,
      adRewardDuration: action.duration,
      adRewardEnabled: action.enabled,
    };
    case 'SET_MAINTENANCE': return { ...state, isMaintenance: action.isMaintenance };
    case 'SET_GUILDS': return { ...state, guilds: action.guilds };
    case 'SET_MARKETPLACE': return { ...state, marketListings: action.listings };
    case 'SET_LEADERBOARD': return { ...state, leaderboard: action.leaders };
    case 'SET_USD_RATE': return { ...state, usdRate: action.rate };
    case 'SET_TRANSACTIONS': return { ...state, transactions: action.transactions };
    case 'APPLY_REFERRAL_CODE': {
      if (state.redeemedReferralCode) return state;
      return {
        ...state,
        tycoonPoints: state.tycoonPoints + 1000,
        redeemedReferralCode: action.code,
        globalMultiplier: state.globalMultiplier * 1.05
      };
    }
    case 'ADMIN_SET_BTC': return { ...state, btcBalance: action.amount };
    case 'ADMIN_SET_TP': return { ...state, tycoonPoints: action.amount };
    case 'ADMIN_SET_LEVEL': return { ...state, level: action.level };
    case 'ADMIN_TOGGLE_INFINITE_ENERGY': return { ...state, isInfiniteEnergy: !state.isInfiniteEnergy };
    case 'PRESTIGE': {
      const nextLevel = state.prestigeLevel + 1;
      const nextMult = 1.0 + nextLevel * 0.25;
      return {
        ...state,
        prestigeLevel: nextLevel,
        prestigeMultiplier: nextMult,
        btcBalance: state.btcBalance * 0.20,
        level: 1,
        xp: 0,
        xpToNextLevel: 500,
        energyCells: state.maxEnergyCells,
        ownedContracts: [],
        activeMiningEvents: [],
        activeContracts: [],
      };
    }
    case 'CLAIM_QUEST': return {
      ...state,
      tycoonPoints: state.tycoonPoints + (action.reward.tp || 0),
      questProgress: {
        ...state.questProgress,
        claimedQuestIds: [...state.questProgress.claimedQuestIds, action.questId]
      }
    };
    case 'VIP_ACTIVATE': {
      const newVip = {
        isActive: true,
        tier: action.tier,
        expiresAt: Date.now() + action.days * 86400000,
        perks: VIP_PERKS[action.tier] || []
      };
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - action.cost,
        vip: newVip
      };
    }
    case 'UPDATE_FARM': return {
      ...state,
      farmSettings: { ...state.farmSettings, ...action.settings }
    };
    case 'PURCHASE_CONTRACT': return {
      ...state,
      btcBalance: state.btcBalance - action.cost,
      ownedContracts: [...state.ownedContracts, {
        ...action.contract,
        totalEarnedBtc: action.contract.totalEarnedBtc ?? 0,
        maxEarningsBtc: action.contract.maxEarningsBtc ?? 0,
        purchasePriceUsd: action.contract.purchasePriceUsd ?? 0,
        dailyBtcTarget: action.contract.dailyBtcTarget ?? 0,
      }]
    };

    // Cihazın kazancını güncelle; tavan aşılmışsa cihazı deaktive et
    case 'CONTRACT_ADD_EARNINGS': {
      const updated = state.ownedContracts.map(c => {
        if (c.id !== action.contractId) return c;
        const newTotal = (c.totalEarnedBtc ?? 0) + action.btcEarned;
        const capReached = c.maxEarningsBtc > 0 && newTotal >= c.maxEarningsBtc;
        return {
          ...c,
          totalEarnedBtc: Math.min(newTotal, c.maxEarningsBtc || newTotal),
          condition: capReached ? 0 : c.condition,
        };
      });
      return { ...state, ownedContracts: updated };
    }

    // Reklam izle → X saatlik madencilik kazancını anında ver
    case 'AD_BOOST_MINING': {
      const energyScaleAd = energyToHashScale(state.energyCells, state.maxEnergyCells);
      const btcPerSec = calcBtcPerSecond(
        state.totalHashRate, 
        state.activeMiningEvents, 
        state.prestigeMultiplier, 
        energyScaleAd, 
        state.isFeverMode, 
        state.researchedNodes,
        1.0,
        state.globalMultiplier,
        1.0,
        state.usdRate,
        state.globalSettings?.miningDifficulty,
        state.globalSettings?.hashRateTiers
      );
      const boostSeconds = action.hoursEquivalent * 3600;
      const earned = btcPerSec * boostSeconds;
      return {
        ...state,
        btcBalance: state.btcBalance + earned,
        dailyEarningsBtc: (state.dailyEarningsBtc || 0) + earned,
      };
    }
    case 'CALC_OFFLINE_EARNINGS': {
      // Very simple offline calc for now
      const energyScale = energyToHashScale(state.energyCells, state.maxEnergyCells);
      const btcPerSec = calcBtcPerSecond(
        state.totalHashRate, 
        state.activeMiningEvents, 
        state.prestigeMultiplier, 
        energyScale,
        false,
        state.researchedNodes,
        1.0,
        state.globalMultiplier,
        1.0,
        state.usdRate,
        state.globalSettings?.miningDifficulty,
        state.globalSettings?.hashRateTiers
      );
      const earned = btcPerSec * action.secondsAway * 0.5; // 50% efficiency while offline
      return {
        ...state,
        pendingOfflineEarnings: state.btcBalance + earned,
        offlineEarningsShown: false
      };
    }
    case 'BP_BUY_PREMIUM': return {
      ...state,
      battlePass: { ...state.battlePass, isPremium: true }
    };
    case 'BP_CLAIM_REWARD': return {
      ...state,
      battlePass: { ...state.battlePass, claimedRewardIds: [...state.battlePass.claimedRewardIds, action.rewardId] }
    };
    case 'LUCKY_WHEEL_SPIN': return {
      ...state,
      tycoonPoints: state.tycoonPoints - action.cost,
      lastWheelSpin: Date.now()
    };
    case 'CLAIM_WHEEL_REWARD': {
      const { type, value } = action.reward;
      if (type === 'tp') return { ...state, tycoonPoints: state.tycoonPoints + (value as number) };
      if (type === 'btc') return { ...state, btcBalance: state.btcBalance + (value as number) };
      if (type === 'speed') {
        const boost = value as number;
        return {
          ...state,
          activeMiningEvents: [
            ...state.activeMiningEvents,
            {
              id: `wheel-${Date.now()}`,
              type: 'WHEEL_BOOST',
              label: 'Çark Bonusu',
              description: `×${boost} Madencilik Hızı`,
              emoji: '🎡',
              multiplier: boost,
              hashBoost: 0,
              endsAt: Date.now() + (60 * 60 * 1000) // 1 saat
            }
          ]
        };
      }
      return state;
    }
    case 'WATCH_AD': {
      const today = new Date().toISOString().split('T')[0];
      let currentDailyEarnings = state.lastEarningsResetDate === today ? state.dailyEarningsBtc : 0;
      const isVipActiveNow = state.vip?.isActive && state.vip.expiresAt > Date.now();
      
      let rewardBtc = state.adRewardBtc;
      if (!isVipActiveNow) {
        const maxDailyBtc = 1.0 / (state.usdRate || 91200);
        const remainingAllowance = Math.max(0, maxDailyBtc - currentDailyEarnings);
        if (rewardBtc > remainingAllowance) {
          rewardBtc = remainingAllowance;
        }
      }

      return {
        ...state,
        btcBalance: state.btcBalance + rewardBtc,
        tycoonPoints: state.tycoonPoints + state.adRewardTp,
        energyCells: Math.min(state.maxEnergyCells, state.energyCells + 2), // +2 Hücre kazanımı
        lastAdWatchTime: Date.now(),
        dailyEarningsBtc: currentDailyEarnings + rewardBtc,
        lastEarningsResetDate: today,
        questProgress: {
          ...state.questProgress,
          adsWatched: (state.questProgress.adsWatched || 0) + 1
        }
      };
    }
    case 'CLICK_MINING': {
      // Manual tap/click mining — gives a small instant BTC reward based on current hashrate
      const energyScaleClick = energyToHashScale(state.energyCells, state.maxEnergyCells);
      const btcPerSecClick = calcBtcPerSecond(
        state.totalHashRate,
        state.activeMiningEvents,
        state.prestigeMultiplier,
        energyScaleClick,
        state.isFeverMode,
        state.researchedNodes,
        1.0,
        state.globalMultiplier,
        1.0,
        state.usdRate,
        state.globalSettings?.miningDifficulty,
        state.globalSettings?.hashRateTiers
      );
      const clickReward = btcPerSecClick * 2; // 2 seconds worth of mining per click
      const now = Date.now();
      const newCombo = now - state.lastClickTime < 2000 ? state.comboCount + 1 : 1;
      const feverTriggered = newCombo >= 10 && !state.isFeverMode;
      return {
        ...state,
        btcBalance: state.btcBalance + clickReward,
        comboCount: newCombo,
        lastClickTime: now,
        isFeverMode: feverTriggered ? true : state.isFeverMode,
        feverEndsAt: feverTriggered ? now + 10000 : state.feverEndsAt,
      };
    }
    case 'CLAIM_STREAK_REWARD': {
      const today = new Date().toISOString().split('T')[0];
      const lastClaimDate = state.streak.lastClaim ? new Date(state.streak.lastClaim).toISOString().split('T')[0] : null;
      if (lastClaimDate === today) return state;

      const currentDayIndex = state.streak.count % 28;
      const reward = [
        // Hafta 1
        { type: 'tp',     value: 200 },
        { type: 'tp',     value: 400 },
        { type: 'energy', value: 8 },
        { type: 'tp',     value: 600 },
        { type: 'btc',    value: 0.000003 },
        { type: 'tp',     value: 1000 },
        { type: 'btc',    value: 0.00002 }, // Süper
        // Hafta 2
        { type: 'tp',     value: 300 },
        { type: 'energy', value: 12 },
        { type: 'tp',     value: 750 },
        { type: 'btc',    value: 0.000005 },
        { type: 'tp',     value: 1200 },
        { type: 'energy', value: 20 },
        { type: 'btc',    value: 0.00005 }, // Süper
        // Hafta 3
        { type: 'tp',     value: 500 },
        { type: 'btc',    value: 0.000008 },
        { type: 'energy', value: 15 },
        { type: 'tp',     value: 1500 },
        { type: 'btc',    value: 0.00001 },
        { type: 'tp',     value: 2000 },
        { type: 'btc',    value: 0.0001 },  // Süper
        // Hafta 4
        { type: 'tp',     value: 800 },
        { type: 'energy', value: 24 },
        { type: 'btc',    value: 0.000015 },
        { type: 'tp',     value: 2500 },
        { type: 'btc',    value: 0.00002 },
        { type: 'tp',     value: 3000 },
        { type: 'btc',    value: 0.0003 },  // Süper
      ][currentDayIndex];

      let newState = {
        ...state,
        streak: {
          count: state.streak.count + 1,
          lastClaim: Date.now()
        },
        loginStreak: state.streak.count + 1 // Keep both for now (legacy compatibility)
      };

      if (reward.type === 'tp') newState.tycoonPoints += reward.value;
      if (reward.type === 'btc') newState.btcBalance += reward.value;
      if (reward.type === 'energy') newState.energyCells = Math.min(state.maxEnergyCells, state.energyCells + reward.value);

      return newState;
    }
    case 'SET_MODAL': return { ...state, activeModal: action.modal };
    case 'UPDATE_PROFILE': return { ...state, ...action.updates };
    case 'SET_DYNAMIC_MINING_ITEMS': return { ...state, dynamicMiningItems: action.items };
    case 'SET_ACTIVE_GAME_EVENTS': return { ...state, activeGameEvents: action.events };
    case 'SET_INBOX_NOTIFICATIONS': return { ...state, inboxNotifications: action.notifications };
    case 'MARK_NOTIFICATION_READ': return {
      ...state,
      inboxNotifications: state.inboxNotifications.map(n => n.id === action.id ? { ...n, read: true } : n)
    };
    case 'PREPEND_INBOX_NOTIFICATION': return {
      ...state,
      inboxNotifications: [action.notification, ...state.inboxNotifications]
    };
    case 'REDEEM_PROMO_CODE': return {
      ...state,
      btcBalance: state.btcBalance + action.btc,
      tycoonPoints: state.tycoonPoints + action.tp
    };

    case 'OVERCLOCK_ACTIVATE': {
      const cfg = state.overclockConfig;
      const now = Date.now();
      // Guard: cooldown bitmemişse, yeterli TP/BTC yoksa veya feature kapalıysa reddet
      if (!cfg.enabled) return state;
      if (now < state.overclockCooldownUntil) return state;
      if (state.overclockActive) return state;
      if (state.tycoonPoints < cfg.costTp) return state;
      if (cfg.costBtc > 0 && state.btcBalance < cfg.costBtc) return state;
      return {
        ...state,
        overclockActive: true,
        overclockEndsAt: now + cfg.durationMinutes * 60 * 1000,
        overclockCooldownUntil: now + (cfg.durationMinutes + cfg.cooldownMinutes) * 60 * 1000,
        tycoonPoints: state.tycoonPoints - cfg.costTp,
        btcBalance: cfg.costBtc > 0 ? Math.max(0, state.btcBalance - cfg.costBtc) : state.btcBalance,
      };
    }

    case 'OVERCLOCK_TICK': {
      if (!state.overclockActive) return state;
      if (Date.now() < state.overclockEndsAt) return state;
      // Süre bitti — overclock kapat
      return { ...state, overclockActive: false };
    }

    case 'SET_OVERCLOCK_CONFIG': return {
      ...state,
      overclockConfig: { ...state.overclockConfig, ...action.config }
    };

    case 'RECORD_WITHDRAWAL': {
      const today = new Date().toISOString().split('T')[0];
      const isToday = state.lastWithdrawDate === today;
      return {
        ...state,
        totalLifetimeWithdrawn: state.totalLifetimeWithdrawn + action.amount,
        dailyWithdrawnBtc: isToday ? state.dailyWithdrawnBtc + action.amount : action.amount,
        lastWithdrawDate: today,
        adsWatchedForWithdraw: 0, // çekim sonrası sıfırla
      };
    }

    case 'SET_WITHDRAW_CONFIG': return {
      ...state,
      withdrawConfig: { ...state.withdrawConfig, ...action.config }
    };

    case 'INCREMENT_ADS_FOR_WITHDRAW': return {
      ...state,
      adsWatchedForWithdraw: state.adsWatchedForWithdraw + 1
    };

    case 'RESET_ADS_FOR_WITHDRAW': return {
      ...state,
      adsWatchedForWithdraw: 0
    };

    case 'SET_DEPOSIT_STATS': return {
      ...state,
      totalLifetimeDeposit: action.totalDeposit,
      totalLifetimeWithdrawn: action.totalWithdrawn,
    };
    case 'CLAIM_GUILD_REWARD': return {
      ...state,
      btcBalance: state.btcBalance + action.rewardBtc,
      claimedGuildRewards: [...state.claimedGuildRewards, action.goalId]
    };

    // ── ACCEPT_CONTRACT ─────────────────────────────────────────
    case 'ACCEPT_CONTRACT':
      return {
        ...state,
        activeContracts: [...(state.activeContracts || []), action.contract],
        questProgress: {
          ...state.questProgress,
          contractsCompleted: (state.questProgress?.contractsCompleted || 0)
        }
      };

    // ── COMPLETE_CONTRACT ────────────────────────────────────────
    case 'COMPLETE_CONTRACT': {
      const contract = (state.activeContracts || []).find(c => c.id === action.contractId);
      if (!contract) return state;
      return {
        ...state,
        btcBalance: state.btcBalance + (contract.reward || 0),
        activeContracts: (state.activeContracts || []).filter(c => c.id !== action.contractId),
        questProgress: {
          ...state.questProgress,
          contractsCompleted: (state.questProgress?.contractsCompleted || 0) + 1
        }
      };
    }

    // ── UNLOCK_RESEARCH ─────────────────────────────────────────
    case 'UNLOCK_RESEARCH':
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - action.cost,
        researchedNodes: [...(state.researchedNodes || []), action.nodeId]
      };

    // ── UPGRADE_INFRASTRUCTURE ──────────────────────────────────
    case 'UPGRADE_INFRASTRUCTURE': {
      const upgCost = action.cost || 0;
      const target = action.target as 'cooling' | 'power';
      const infraState = (state as any).infrastructure || { cooling: 1, power: 1 };
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - upgCost,
        infrastructure: {
          ...infraState,
          [target]: (infraState[target] || 1) + 1
        }
      } as any;
    }

    // ── REPAIR_CONTRACT ─────────────────────────────────────────
    case 'REPAIR_CONTRACT': {
      const repairCost = action.cost || 0;
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - repairCost,
        ownedContracts: (state.ownedContracts || []).map(c =>
          c.id === action.contractId ? { ...c, condition: 100 } : c
        )
      };
    }

    // ── ACTIVATE_SURGE ──────────────────────────────────────────
    case 'ACTIVATE_SURGE': {
      const surgeBoost = 2.0; // 2x hashrate multiplier
      const surgeDuration = 5 * 60 * 1000; // 5 dakika
      return {
        ...state,
        energyCells: Math.max(0, state.energyCells - 5),
        farmSettings: {
          ...(state.farmSettings || {}),
          surgeActive: true,
          surgeEndsAt: Date.now() + surgeDuration,
          surgeMultiplier: surgeBoost
        }
      } as any;
    }

    // ── ADD_BTC ─────────────────────────────────────────────────
    // AdRewardModal tarafından kullanılır (WATCH_AD'den bağımsız ekstra BTC)
    case 'ADD_BTC': {
      const today = new Date().toISOString().split('T')[0];
      const currentDaily = state.lastEarningsResetDate === today ? state.dailyEarningsBtc : 0;
      return {
        ...state,
        btcBalance: state.btcBalance + (action.amount || 0),
        dailyEarningsBtc: currentDaily + (action.amount || 0),
        lastEarningsResetDate: today
      };
    }

    // ── SET_ANNOUNCEMENT ────────────────────────────────────────
    case 'SET_ANNOUNCEMENT':
      return {
        ...state,
        announcement: action.announcement
      };

    // ── SET_GLOBAL_MULTIPLIER ────────────────────────────────────
    case 'LUCKY_WHEEL_SPIN':
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - action.cost,
        lastWheelSpin: Date.now()
      };

    case 'CLAIM_WHEEL_REWARD': {
      const { type, value } = action.reward;
      const today = new Date().toISOString().split('T')[0];
      const currentDaily = state.lastEarningsResetDate === today ? state.dailyEarningsBtc : 0;

      if (type === 'tp') {
        return { ...state, tycoonPoints: state.tycoonPoints + (value as number) };
      }
      if (type === 'btc') {
        return {
          ...state,
          btcBalance: state.btcBalance + (value as number),
          dailyEarningsBtc: currentDaily + (value as number),
          lastEarningsResetDate: today
        };
      }
      if (type === 'speed') {
        const durationMs = value === '1 Saat' ? 3600000 : 1800000;
        const multiplier = (value === '2x Hız' || value === '1 Saat') ? 2 : 5;
        const newEvent: MiningEvent = {
          id: `wheel-speed-${Date.now()}`,
          type: 'wheel_speed',
          label: 'Çark Hız Takviyesi',
          description: `${multiplier}x Kazanç Artışı`,
          emoji: '⚡',
          multiplier,
          hashBoost: 0,
          endsAt: Date.now() + durationMs
        };
        return { ...state, activeMiningEvents: [...state.activeMiningEvents, newEvent] };
      }
      return state;
    }

    case 'SET_GLOBAL_MULTIPLIER':
      return {
        ...state,
        globalMultiplier: action.multiplier
      };

    case 'SET_WHEEL_REWARDS':
      return { ...state, wheelRewards: action.rewards };

    case 'FACTORY_UPDATE_DATA':
      return {
        ...state,
        factoryData: { ...state.factoryData, ...action.data }
      };

    case 'ALTCOIN_SET_BALANCES':
      return {
        ...state,
        altcoinBalances: { ...state.altcoinBalances, ...action.balances }
      };

    case 'COSMETIC_BUY':
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - action.cost,
        cosmetics: {
          ...state.cosmetics,
          owned: [...(state.cosmetics.owned || []), action.id]
        }
      };

    case 'COSMETIC_EQUIP':
      return {
        ...state,
        cosmetics: {
          ...state.cosmetics,
          equipped: {
            ...(state.cosmetics.equipped || {}),
            [action.category]: action.id
          }
        }
      };

    case 'COSMETIC_UNEQUIP': {
      const newEquipped = { ...(state.cosmetics.equipped || {}) };
      delete (newEquipped as any)[action.category];
      return {
        ...state,
        cosmetics: {
          ...state.cosmetics,
          equipped: newEquipped
        }
      };
    }

    case 'BP_CLAIM_REWARD': {
      const reward = SEASON_2_REWARDS.find(r => r.id === action.rewardId) || 
                    BP_REWARDS.find(r => r.id === action.rewardId);
      if (!reward) return state;

      let newState = {
        ...state,
        battlePass: {
          ...state.battlePass,
          claimedRewardIds: [...(state.battlePass.claimedRewardIds || []), action.rewardId]
        }
      };

      if (reward.type === 'tp') newState.tycoonPoints += (reward.value as number);
      if (reward.type === 'btc') newState.btcBalance += (reward.value as number);
      if (reward.type === 'energy') {
        newState.energyCells = Math.min(state.maxEnergyCells, state.energyCells + (reward.value as number));
      }
      if (reward.type === 'vip_day') {
        const now = Date.now();
        const currentExp = state.vip?.expiresAt || now;
        const newExp = Math.max(now, currentExp) + (reward.value as number) * 24 * 3600 * 1000;
        newState.vip = {
          ...state.vip,
          isActive: true,
          expiresAt: newExp,
          tier: state.vip?.tier === 'none' ? 'silver' : state.vip?.tier,
          perks: state.vip?.perks || []
        };
      }
      return newState;
    }

    case 'BP_BUY_PREMIUM':
      return {
        ...state,
        tycoonPoints: state.tycoonPoints - 3000,
        battlePass: { ...state.battlePass, isPremium: true }
      };

    default: return state;
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
  dailyEarnedBtc: number;
  dailyCapBtc: number;
  dailyEarnedPct: number;
  dailyCapReached: boolean;
  isVipCapExempt: boolean;
  listContractOnMarket: (contract: OwnedContract, price: number) => Promise<void>;
  buyContractFromMarket: (listing: MarketListing) => Promise<void>;
  cancelMarketListing: (listingId: string) => Promise<void>;
  createGuildInFirestore: (name: string, desc: string, badge: string, cost: number) => Promise<void>;
  joinGuildInFirestore: (guild: Guild) => Promise<void>;
  leaveGuildInFirestore: (guildId: string) => Promise<void>;
  donateToGuildInFirestore: (amount: number) => Promise<void>;
  claimGuildReward: (goalId: string, btcValue: number) => Promise<void>;
  // Admin Helpers
  adminSetBtc: (amount: number, userId?: string) => Promise<void>;
  adminSetTp: (amount: number, userId?: string) => Promise<void>;
  adminSetLevel: (level: number, userId?: string) => Promise<void>;
  adminUpdateSettings: (updates: any) => Promise<void>;
  adminTriggerEvent: (eventType: string) => Promise<void>;
  updateUserProfile: (updates: Partial<{ username: string; email: string; phone: string; avatarUrl: string }>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  claimStreakReward: () => Promise<void>;
  redeemPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  activateOverclock: () => { success: boolean; message: string };
  isOverclockActive: boolean;
  isOverclockCooldown: boolean;
  overclockMultiplier: number;
  overclockSecondsLeft: number;
  cooldownSecondsLeft: number;
  adBoostMining: (hoursEquivalent: number) => void;
  calcWithdrawLimits: () => ReturnType<any>;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  const fetchTransactions = async (userId: string) => {
    try {
      const { data } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        const mapped = data.map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          label: t.description || 'İşlem',
          date: new Date(t.created_at || t.timestamp).getTime(),
          status: t.status || 'completed'
        }));
        dispatch({ type: 'SET_TRANSACTIONS', transactions: mapped });
      }
    } catch (e) {
      console.error('Transactions error:', e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from(TABLES.PROFILES)
        .select('id, username, btcBalance, totalHashRate, level')
        .order('btcBalance', { ascending: false })
        .limit(50);

      if (data) {
        const mapped = data.map((p: any, i: number) => ({
          rank: i + 1,
          id: p.id,
          name: p.username || 'Madenci',
          btcMined: p.btcBalance || 0,
          hashRate: p.totalHashRate || 0,
          level: p.level || 1,
          avatar: p.username?.slice(0, 2).toUpperCase() || 'M',
          change: 'same' as const
        }));
        dispatch({ type: 'SET_LEADERBOARD', leaders: mapped });
      }
    } catch (e) {
      console.error('Leaderboard error:', e);
    }
  };

  const fetchWheelRewards = async () => {
    try {
      const { data } = await supabase
        .from(TABLES.LUCKY_WHEEL_REWARDS)
        .select('*')
        .order('created_at', { ascending: true });
      if (data) dispatch({ type: 'SET_WHEEL_REWARDS', rewards: data });
    } catch (e) {
      console.error('Wheel rewards error:', e);
    }
  };

  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase() + 
           '-' + Math.floor(Math.random() * 1000);
  };

  const fetchProfile = async (uid: string, displayName?: string, email?: string) => {
    try {
      const { data: profile, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (profile && !error) {
        const { id, user: _u, isLoading: _l, factory_data, altcoin_balances, ...rest } = profile as any;
        const gameData = { 
          ...rest, 
          userId: id,
          factoryData: factory_data ||rest.factoryData,
          altcoinBalances: altcoin_balances || rest.altcoinBalances
        };
        
        // Referral code yoksa üret ve güncelle
        if (!profile.referralCode) {
          const newCode = generateReferralCode();
          console.info('🎟️ Referans kodu üretiliyor:', newCode);
          await supabase.from(TABLES.PROFILES).update({ referralCode: newCode }).eq('id', uid);
          gameData.referralCode = newCode;
        }

        dispatch({ type: 'SET_GAME_STATE', state: gameData as any });
      } else {
        console.info('✨ Yeni profil oluşturuluyor...');
        const newCode = generateReferralCode();
        const { data: newProfile } = await supabase
          .from(TABLES.PROFILES)
          .upsert({
            id: uid,
            username: displayName || email?.split('@')[0] || 'Madenci',
            email: email,
            userId: uid.substring(0, 7),
            referralCode: generateReferralCode(),
            btcBalance: 0,
            tycoonPoints: 1500,
            level: 1,
            xp: 0,
            rankTitle: 'Garaj Madencisi',
            streak: { count: 0, lastClaim: 0 },
            ownedContracts: [],
            questProgress: {
              adsWatched: 0,
              contractsPurchased: 0,
              referralsDone: 0,
              claimedQuestIds: []
            },
            farmSettings: {
              activeRigs: 0,
              maxRigs: 8,
              rigStatuses: Array(8).fill({
                efficiency: 0,
                isBroken: false,
                lastRepairAt: 0
              })
            },
            researchedNodes: [],
            factory_data: INITIAL_STATE.factoryData,
            altcoin_balances: INITIAL_STATE.altcoinBalances,
            battlePass: {
              level: 1,
              xp: 0,
              isPremium: false,
              claimedRewardIds: []
            },
            dailyEarningsBtc: 0,
            lastEarningsResetDate: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (newProfile) {
          const { id, user: _u, isLoading: _l, ...rest } = newProfile as any;
          const gameData = { ...rest, userId: id };
          dispatch({ type: 'SET_GAME_STATE', state: gameData as any });
        }
      }
    } catch (e) {
      console.error('Profile error:', e);
    }
  };


  // Main Init & Auth Effect
  useEffect(() => {
    // ── Firebase Auth Listener ─────────────────────────────────
    // onAuthStateChanged: popup kapanır kapanmaz user gelir, redirect yok
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.info('🔥 Firebase Auth:', firebaseUser?.email ?? 'no user');

      if (firebaseUser) {
        // 1. User'ı hemen set et
        dispatch({ type: 'SET_AUTH_USER', user: firebaseUser });
        // 2. isLoading'i kapat
        dispatch({ type: 'SET_GAME_STATE', state: { isLoading: false } as any });

        // 3. Yardımcıları kullanarak veri çek
        fetchProfile(firebaseUser.uid, firebaseUser.displayName || undefined, firebaseUser.email || undefined);
        fetchTransactions(firebaseUser.uid);

        // 4a. Deposit & withdraw istatistiklerini yükle
        (async () => {
          try {
            const { data: txs } = await supabase
              .from(TABLES.TRANSACTIONS)
              .select('amount, type, timestamp')
              .eq('user_id', firebaseUser.uid)
              .in('type', ['deposit', 'transfer_out']);
            if (txs) {
              const totalDeposit = txs.filter(t => t.type === 'deposit' && (t.amount || 0) > 0).reduce((s, t) => s + (t.amount || 0), 0);
              const totalWithdrawn = txs.filter(t => t.type === 'transfer_out').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
              dispatch({ type: 'SET_DEPOSIT_STATS', totalDeposit, totalWithdrawn });
            }
          } catch (_) {}
        })();

        // 4. Realtime profile subscription
        const profileSub = supabase
          .channel(`profiles:${firebaseUser.uid}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: TABLES.PROFILES,
            filter: `id=eq.${firebaseUser.uid}`
          }, (payload) => {
            const { user: _u, isLoading: _i, ...gameData } = payload.new as any;
            dispatch({ type: 'SET_GAME_STATE', state: gameData as any });
          })
          .subscribe();

        return () => profileSub.unsubscribe();
      } else {
        // Kullanıcı çıkış yaptı
        dispatch({ type: 'SET_AUTH_USER', user: null });
        dispatch({ type: 'SET_GAME_STATE', state: { isLoading: false } as any });
      }
    });
    
    // ── Global Data (auth gerektirmiyor) ────────────────────────
    const loadGlobal = async () => {
      try {
        const { data: settings } = await supabase
          .from(TABLES.SETTINGS)
          .select('*')
          .eq('id', 'v1')
          .maybeSingle();

        if (settings) {
          dispatch({ type: 'SET_GLOBAL_SETTINGS', settings });
          dispatch({ type: 'SET_MAINTENANCE', isMaintenance: settings.isMaintenance });
          if (settings.announcement) dispatch({ type: 'SET_ANNOUNCEMENT', announcement: settings.announcement });
          dispatch({ type: 'SET_GLOBAL_MULTIPLIER', multiplier: settings.globalMultiplier || 1.0 });
        }

        // ── Çark Ödüllerini Yükle ──────────────────────────────────────────
        await fetchWheelRewards();

        // ── Google Ads Config yükle ──────────────────────────────────────
        try {
          const { data: adsRow } = await supabase
            .from(TABLES.SETTINGS)
            .select('value')
            .eq('id', 'google_ads_config')
            .maybeSingle();
          if (adsRow?.value) {
            dispatch({ type: 'SET_GOOGLE_ADS_CONFIG', config: adsRow.value });
            // Google Ads Manager'ı başlat
            if (typeof window !== 'undefined') {
              import('../lib/googleAds').then(({ googleAds }) => {
                googleAds.init(adsRow.value).catch(() => {});
              }).catch(() => {});
            }
          }
        } catch (_) {}

        const [{ data: marketData }, { data: guilds }] = await Promise.all([
          supabase.from(TABLES.MARKETPLACE).select('*').order('created_at', { ascending: false }),
          supabase.from(TABLES.GUILDS).select('*').order('rank', { ascending: true }),
        ]);

        if (guilds) dispatch({ type: 'SET_GUILDS', guilds });
        if (marketData) {
          // Marketplace isOwn logic
          const currentUserId = auth.currentUser?.uid;
          const mappedMarket: MarketListing[] = marketData.map(l => ({
            id: l.id,
            contractId: l.contractId,
            contractName: l.label,
            tier: l.rarity as any,
            hashRate: l.hashRate,
            daysRemaining: l.daysRemaining,
            sellerName: l.sellerName,
            sellerId: l.seller_id,
            price: l.price,
            listedAt: new Date(l.created_at).getTime(),
            isOwn: currentUserId === l.seller_id
          }));
          dispatch({ type: 'SET_MARKETPLACE', listings: mappedMarket });
        }

        // ── Ödüllü reklam ödüllerini free_options'dan yükle ─────────────
        // maybeSingle() kullanıyoruz: kayıt yoksa null döner, 406 hatası fırlatmaz
        try {
          const { data: freeOpts } = await supabase
            .from(TABLES.SETTINGS)
            .select('*')
            .eq('id', 'free_options')
            .maybeSingle();

          if (freeOpts?.value) {
            const v = freeOpts.value;
            dispatch({
              type: 'SET_AD_REWARD',
              btc: parseFloat(v.ad_reward_btc) || 0,
              tp: parseInt(v.ad_reward_tp) || 0,
              dailyLimit: parseInt(v.ad_reward_daily_limit) || 10,
              duration: parseInt(v.ad_reward_duration) || 30,
              enabled: v.ad_reward_enabled !== false,
            });
          }
        } catch (_) {
          // free_options henüz oluşturulmamış, varsayılan değerler geçerli
        }

        // ── Admin'den Dinamik Mining Items ────────────────────────────────
        try {
          const { data: miningItems } = await supabase
            .from(TABLES.MINING_ITEMS)
            .select('*')
            .eq('available', true)
            .order('price', { ascending: true });
          if (miningItems) dispatch({ type: 'SET_DYNAMIC_MINING_ITEMS', items: miningItems });
        } catch (_) {}

        // ── Admin'den Aktif Game Events ───────────────────────────────────
        try {
          const { data: gameEvents } = await supabase
            .from(TABLES.GAME_EVENTS)
            .select('*')
            .eq('active', true);
          if (gameEvents) dispatch({ type: 'SET_ACTIVE_GAME_EVENTS', events: gameEvents });
        } catch (_) {}

        // ── Overclock Config ──────────────────────────────────────────────
        try {
          const { data: ocRow } = await supabase
            .from(TABLES.SETTINGS)
            .select('value')
            .eq('id', 'overclock_config')
            .maybeSingle();
          if (ocRow?.value) dispatch({ type: 'SET_OVERCLOCK_CONFIG', config: ocRow.value });
        } catch (_) {}

        // ── Withdraw Config ───────────────────────────────────────────────
        try {
          const { data: wdRow } = await supabase
            .from(TABLES.SETTINGS)
            .select('value')
            .eq('id', 'withdraw_config')
            .maybeSingle();
          if (wdRow?.value) dispatch({ type: 'SET_WITHDRAW_CONFIG', config: wdRow.value });
        } catch (_) {}
      } catch (e) {
        console.error('Global data error:', e);
      }
    };

    loadGlobal();
    fetchLeaderboard();

    // ── Kullanıcıya özel inbox bildirimleri ──────────────────────────────
    const loadInboxNotifications = async () => {
      if (!state.user?.uid) return;
      try {
        const { data } = await supabase
          .from(TABLES.NOTIFICATIONS)
          .select('*')
          .eq('target_id', state.user.uid)
          .order('created_at', { ascending: false })
          .limit(50);
        if (data) dispatch({ type: 'SET_INBOX_NOTIFICATIONS', notifications: data.map(n => ({ ...n, read: n.read ?? false })) });
      } catch (_) {}
    };
    loadInboxNotifications();

    // ── Global Realtime Subscriptions ──────────────────────────
    const globalSub = supabase.channel('global-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.SETTINGS }, (payload) => {
        if (payload.new) {
          const s = payload.new as any;

          // v1 → global settings
          if (s.id === 'v1') {
            dispatch({ type: 'SET_GLOBAL_SETTINGS', settings: s });
            dispatch({ type: 'SET_MAINTENANCE', isMaintenance: s.isMaintenance });
            if (s.announcement) dispatch({ type: 'SET_ANNOUNCEMENT', announcement: s.announcement });
            dispatch({ type: 'SET_GLOBAL_MULTIPLIER', multiplier: s.globalMultiplier || 1.0 });
          }

          // hashrate_settings → hashrate konfigürasyonu anında güncelle
          if (s.id === 'hashrate_settings' && s.value) {
            dispatch({ type: 'SET_GLOBAL_SETTINGS', settings: s.value });
            dispatch({ type: 'SET_GLOBAL_MULTIPLIER', multiplier: s.value.global_multiplier || 1.0 });
          }

          // google_ads_config → Google Ads ayarları anında güncelle
          if (s.id === 'google_ads_config' && s.value) {
            dispatch({ type: 'SET_GOOGLE_ADS_CONFIG', config: s.value });
          }

          // overclock_config → overclock ayarları anında güncelle
          if (s.id === 'overclock_config' && s.value) {
            dispatch({ type: 'SET_OVERCLOCK_CONFIG', config: s.value });
          }

          // withdraw_config → çekim kuralları anında güncelle
          if (s.id === 'withdraw_config' && s.value) {
            dispatch({ type: 'SET_WITHDRAW_CONFIG', config: s.value });
          }

          // free_options → reklam ödülleri anında güncelle
          if (s.id === 'free_options' && s.value) {
            const v = s.value;
            dispatch({
              type: 'SET_AD_REWARD',
              btc: parseFloat(v.ad_reward_btc) || 0,
              tp: parseInt(v.ad_reward_tp) || 0,
              dailyLimit: parseInt(v.ad_reward_daily_limit) || 10,
              duration: parseInt(v.ad_reward_duration) || 30,
              enabled: v.ad_reward_enabled !== false,
            });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.MARKETPLACE }, () => {
        loadGlobal(); // Refresh marketplace listings
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.GUILDS }, () => {
        loadGlobal(); // Refresh guilds
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLES.PROFILES }, () => {
        fetchLeaderboard();
      })
      // ── Game Events realtime (admin toggle/create) ────────────
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.GAME_EVENTS }, async () => {
        try {
          const { data } = await supabase.from(TABLES.GAME_EVENTS).select('*').eq('active', true);
          if (data) dispatch({ type: 'SET_ACTIVE_GAME_EVENTS', events: data });
        } catch (_) {}
      })
      // ── Mining Items realtime (admin CRUD) ────────────────────
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.MINING_ITEMS }, async () => {
        try {
          const { data } = await supabase.from(TABLES.MINING_ITEMS).select('*').eq('available', true).order('price', { ascending: true });
          if (data) dispatch({ type: 'SET_DYNAMIC_MINING_ITEMS', items: data });
        } catch (_) {}
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.LUCKY_WHEEL_REWARDS }, () => {
        fetchWheelRewards();
      })
      .subscribe();

    // ── User-specific Notifications Realtime ────────────────────
    let notifSub: any = null;
    if (state.user?.uid) {
      notifSub = supabase.channel(`notifications-${state.user.uid}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: TABLES.NOTIFICATIONS,
          filter: `target_id=eq.${state.user.uid}`
        }, (payload) => {
          if (payload.new) {
            const n = payload.new as any;
            // Mevcut bildirimlerin başına ekle (reducer'da state.inboxNotifications ile merge)
            dispatch({ type: 'PREPEND_INBOX_NOTIFICATION', notification: { ...n, read: false } });
          }
        })
        .subscribe();
    }

    return () => {
      unsubscribeAuth();
      globalSub.unsubscribe();
      if (notifSub) notifSub.unsubscribe();
    };
  }, []);

  // ── Periodic Balance Sync (Real-time update) ───────────────
  useEffect(() => {
    if (!state.user?.uid || state.isLoading) return;

    const syncInterval = setInterval(async () => {
      try {
        // Sync current balances to Supabase profile
        await supabase.from(TABLES.PROFILES).update({
          btcBalance: state.btcBalance,
          tycoonPoints: state.tycoonPoints,
          lastMiningTick: state.lastMiningTick,
          xp: state.xp,
          level: state.level,
          energyCells: state.energyCells,
          dailyEarningsBtc: state.dailyEarningsBtc,
          lastEarningsResetDate: state.lastEarningsResetDate,
          streak: state.streak,
          ownedContracts: state.ownedContracts,
          questProgress: state.questProgress,
          farmSettings: state.farmSettings,
          researchedNodes: state.researchedNodes,
          battlePass: state.battlePass,
          vip: state.vip,
          redeemedReferralCode: state.redeemedReferralCode,
          claimedGuildRewards: state.claimedGuildRewards,
          factory_data: state.factoryData,
          altcoin_balances: state.altcoinBalances,
          cosmetics: state.cosmetics,
          updated_at: new Date().toISOString()
        }).eq('id', state.user.uid);
        
        console.info('🔄 Veriler senkronize edildi (Periyodik)');
      } catch (error) {
        console.error('Sync error:', error);
      }
    }, 15000); // 15 seconds

    return () => clearInterval(syncInterval);
  }, [
    state.user?.uid, state.isLoading, 
    state.btcBalance, state.tycoonPoints, state.xp, state.level, state.energyCells,
    state.streak, state.ownedContracts, state.questProgress, state.farmSettings,
    state.researchedNodes, state.battlePass,
    state.factoryData, state.altcoinBalances, state.cosmetics
  ]);

  // User Data Subscriptions
  useEffect(() => {
    if (!state.user?.uid) return;
    
    const pSub = supabase.channel(`public:profiles:${state.user.uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.PROFILES, filter: `id=eq.${state.user.uid}` },
        payload => {
          // Realtime payload içinden de user/isLoading temizliyoruz
          const { user: _u, isLoading: _i, ...safePayload } = (payload.new || {}) as any;
          dispatch({ type: 'SET_GAME_STATE', state: safePayload });
        })
      .subscribe();

    const tSub = supabase.channel(`public:transactions:${state.user.uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.TRANSACTIONS, filter: `user_id=eq.${state.user.uid}` }, () => {
        fetchTransactions(state.user!.id);
      })
      .subscribe();

    return () => {
      pSub.unsubscribe();
      tSub.unsubscribe();
    };
  }, [state.user?.uid]);

  const btcToUsd = (btc: number) => `$${(btc * state.usdRate).toFixed(2)}`;
  const formatBtc = (btc: number) => btc.toFixed(10);
  const energyScale = energyToHashScale(state.energyCells, state.maxEnergyCells);

  // ── Çekim Limit Hesaplama ────────────────────────────────────────────────
  const calcWithdrawLimits = () => {
    const cfg = state.withdrawConfig;
    const today = new Date().toISOString().split('T')[0];
    const dailyUsed = state.lastWithdrawDate === today ? state.dailyWithdrawnBtc : 0;

    // Maksimum çekilebilir = toplam deposit × çarpan (örn: %25)
    const maxFromDeposit = state.totalLifetimeDeposit * cfg.maxMultiplier;
    // Bugün kalan günlük limit
    const dailyRemaining = cfg.dailyLimitBtc > 0
      ? Math.max(0, cfg.dailyLimitBtc - dailyUsed)
      : Infinity;
    // Fiilen çekilebilecek max
    const availableToWithdraw = Math.min(
      state.btcBalance,
      maxFromDeposit - state.totalLifetimeWithdrawn,
      dailyRemaining,
    );

    // Reklam şartı
    const adsNeeded = Math.max(0, cfg.adsRequired - state.adsWatchedForWithdraw);
    const adsOk = cfg.adsRequired === 0 || state.adsWatchedForWithdraw >= cfg.adsRequired;

    // Deposit şartı
    const depositOk = state.totalLifetimeDeposit >= cfg.depositRequiredBtc;

    return {
      maxFromDeposit,
      dailyUsed,
      dailyRemaining: dailyRemaining === Infinity ? null : dailyRemaining,
      availableToWithdraw: Math.max(0, availableToWithdraw),
      adsNeeded,
      adsOk,
      depositOk,
      minAmount: cfg.minAmountBtc,
      canWithdraw: availableToWithdraw >= cfg.minAmountBtc && adsOk && depositOk,
    };
  };

  // Overclock multiplier hesapla (context dışına da expose edilecek)
  const nowTs = Date.now();
  const isOverclockActiveNow = state.overclockActive && state.overclockEndsAt > nowTs;
  const isOverclockCooldown = !isOverclockActiveNow && nowTs < state.overclockCooldownUntil;
  const overclockMultiplier = isOverclockActiveNow
    ? (state.overclockConfig?.multiplier ?? 1.5)
    : isOverclockCooldown
      ? (state.overclockConfig?.penalty ?? 0.8)
      : 1.0;

  const currentBtcPerSecond = calcBtcPerSecond(
    state.totalHashRate, 
    state.activeMiningEvents, 
    state.prestigeMultiplier, 
    energyScale, 
    state.isFeverMode, 
    state.researchedNodes, 
    1.0, 
    state.globalMultiplier, 
    overclockMultiplier,
    state.usdRate,
    state.globalSettings?.miningDifficulty,
    state.globalSettings?.hashRateTiers
  );
  const earnedTodayBtc = currentBtcPerSecond * 86400;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const currentDailyEarned = state.lastEarningsResetDate === todayStr ? state.dailyEarningsBtc : 0;
  
  const isVipCapExempt = state.vip?.isActive && state.vip.expiresAt > Date.now();
  const dailyCapBtc = 1.0 / (state.usdRate || 91200);
  const dailyCapReached = !isVipCapExempt && currentDailyEarned >= dailyCapBtc;
  const dailyEarnedPct = Math.min(100, (currentDailyEarned / dailyCapBtc) * 100);

  // ── BUG-004 FIX: MINING_TICK — canlı madencilik döngüsü ──────────────────
  useEffect(() => {
    if (!state.user?.uid || state.isLoading) return;
    const id = setInterval(() => {
      dispatch({ type: 'MINING_TICK' });
    }, 5000);
    return () => clearInterval(id);
  }, [state.user?.uid, state.isLoading]);

  // Overclock tick — süre bittiyse kapat, Supabase'e kaydet
  useEffect(() => {
    if (!state.overclockActive) return;
    const id = setInterval(() => {
      dispatch({ type: 'OVERCLOCK_TICK' });
    }, 1000);
    return () => clearInterval(id);
  }, [state.overclockActive]);

  // Overclock state'ini Supabase'e yaz (persist)
  useEffect(() => {
    if (!state.user?.uid) return;
    supabase.from(TABLES.PROFILES).update({
      overclockActive: state.overclockActive,
      overclockEndsAt: state.overclockEndsAt,
      overclockCooldownUntil: state.overclockCooldownUntil,
    }).eq('id', state.user.uid).then(() => {});
  }, [state.overclockActive, state.overclockEndsAt]);

  // ─── Marketplace Functions ──────────────────────────────────────────────────
  const listContractOnMarket = async (contract: OwnedContract, price: number) => {
    if (!state.user) throw new Error("Auth required");
    const { error } = await supabase.from(TABLES.MARKETPLACE).insert({
      contractId: contract.id,
      contractName: contract.name,
      tier: contract.tier,
      hashRate: contract.hashRate,
      daysRemaining: Math.max(1, contract.durationDays - Math.floor((Date.now() - contract.purchasedAt) / 86400000)),
      sellerId: state.user.uid,
      sellerName: state.username || state.user.email?.split('@')[0],
      price: price,
      listedAt: Date.now()
    });

    if (error) throw error;

    const newOwned = state.ownedContracts.filter(c => c.id !== contract.id);
    await supabase.from(TABLES.PROFILES).update({ ownedContracts: newOwned }).eq('id', state.user.uid);
  };

  const buyContractFromMarket = async (listing: MarketListing) => {
    if (!state.user) throw new Error("Auth required");
    if (state.tycoonPoints < listing.price) throw new Error("Insufficient TP");

    const newTp = state.tycoonPoints - listing.price;
    const newOwned = [...state.ownedContracts, {
      id: listing.contractId,
      name: listing.contractName,
      tier: listing.tier,
      hashRate: listing.hashRate,
      durationDays: listing.daysRemaining,
      purchasedAt: Date.now()
    }];

    const { error: profileError } = await supabase.from(TABLES.PROFILES).update({
      tycoonPoints: newTp,
      ownedContracts: newOwned
    }).eq('id', state.user.uid);

    if (profileError) throw profileError;

    const { data: sellerProfile } = await supabase.from(TABLES.PROFILES).select('tycoonPoints').eq('id', listing.sellerId).single();
    if (sellerProfile) {
      await supabase.from(TABLES.PROFILES).update({
        tycoonPoints: (sellerProfile.tycoonPoints || 0) + listing.price
      }).eq('id', listing.sellerId);
    }

    // 2. Add Transactions for Buyer and Seller
    await supabase.from(TABLES.TRANSACTIONS).insert([
      {
        user_id: state.user.uid,
        amount: -listing.price,
        type: 'purchase',
        description: `${listing.contractName} Kontrat Alımı`,
        timestamp: new Date().toISOString()
      },
      {
        user_id: listing.sellerId,
        amount: listing.price,
        type: 'sale',
        description: `${listing.contractName} Kontrat Satışı`,
        timestamp: new Date().toISOString()
      }
    ]);

    await supabase.from(TABLES.MARKETPLACE).delete().eq('id', listing.id);
  };

  const cancelMarketListing = async (listingId: string) => {
    if (!state.user) throw new Error("Auth required");
    const listing = state.marketListings.find(l => l.id === listingId);
    if (!listing) return;

    const newOwned = [...state.ownedContracts, {
      id: listing.contractId,
      name: listing.contractName,
      tier: listing.tier,
      hashRate: listing.hashRate,
      durationDays: listing.daysRemaining,
      purchasedAt: Date.now()
    }];

    await supabase.from(TABLES.PROFILES).update({ ownedContracts: newOwned }).eq('id', state.user.uid);
    await supabase.from(TABLES.MARKETPLACE).delete().eq('id', listingId);
  };

  // ─── Guild Functions ────────────────────────────────────────────────────────
  const createGuildInFirestore = async (name: string, desc: string, badge: string, cost: number) => {
    if (!state.user) throw new Error("Auth required");
    if (state.tycoonPoints < cost) throw new Error("Insufficient TP");

    const { data: newGuild, error } = await supabase.from(TABLES.GUILDS).insert({
      name,
      description: desc,
      badge,
      ownerId: state.user.uid,
      members: 1,
      totalHash: state.totalHashRate,
      level: 1,
      xp: 0,
      xpToNextLevel: 1000
    }).select().single();

    if (error) throw error;

    await supabase.from(TABLES.PROFILES).update({
      tycoonPoints: state.tycoonPoints - cost,
      userGuildId: newGuild.id
    }).eq('id', state.user.uid);
  };

  const onWatchAd = async () => {
    if (!state.user) throw new Error("Auth required");
    const newEnergy = Math.min(state.maxEnergyCells, state.energyCells + 2);
    const newTp     = state.tycoonPoints + state.adRewardTp;

    // 1. Update Profile (Energy & TP)
    const { error } = await supabase.from(TABLES.PROFILES).update({
      energyCells: newEnergy,
      tycoonPoints: newTp
    }).eq('id', state.user.uid);

    if (error) throw error;

    // 2. Log to Transactions (Social Feed)
    await supabase.from(TABLES.TRANSACTIONS).insert({
      user_id: state.user.uid,
      amount: 0,
      type: 'mining',
      description: 'Reklam izleyerek +2 Enerji kazandı! 🔋',
      timestamp: new Date().toISOString()
    });

    dispatch({ type: 'WATCH_AD' });
  };

  const joinGuildInFirestore = async (guild: Guild) => {
    if (!state.user) throw new Error("Auth required");
    if (state.userGuildId) throw new Error("Already in a guild");

    await supabase.from(TABLES.PROFILES).update({ userGuildId: guild.id }).eq('id', state.user.uid);
    await supabase.from(TABLES.GUILDS).update({
      members: guild.members + 1,
      totalHash: guild.totalHash + state.totalHashRate
    }).eq('id', guild.id);
  };

  const leaveGuildInFirestore = async (guildId: string) => {
    if (!state.user) throw new Error("Auth required");
    const { data: guild } = await supabase.from(TABLES.GUILDS).select('*').eq('id', guildId).single();
    if (!guild) return;

    await supabase.from(TABLES.PROFILES).update({ userGuildId: null }).eq('id', state.user.uid);
    await supabase.from(TABLES.GUILDS).update({
      members: Math.max(0, guild.members - 1),
      totalHash: Math.max(0, guild.totalHash - state.totalHashRate)
    }).eq('id', guildId);
  };

  const donateToGuildInFirestore = async (amount: number) => {
    if (!state.user || !state.userGuildId) throw new Error("Join a guild first");
    if (state.tycoonPoints < amount) throw new Error("Insufficient TP");

    const { data: guild } = await supabase.from(TABLES.GUILDS).select('*').eq('id', state.userGuildId).single();
    if (!guild) return;

    const newXp = guild.xp + amount * 0.5;
    let newLevel = guild.level;
    let nextXp = guild.xpToNextLevel;

    if (newXp >= nextXp) {
      newLevel += 1;
      nextXp = Math.floor(nextXp * 1.5);
    }

    await supabase.from(TABLES.PROFILES).update({ tycoonPoints: state.tycoonPoints - amount }).eq('id', state.user.uid);
    await supabase.from(TABLES.GUILDS).update({
      xp: newXp,
      level: newLevel,
      xpToNextLevel: nextXp
    }).eq('id', state.userGuildId);
  };

  const claimGuildReward = async (goalId: string, btcValue: number) => {
    if (!state.user) throw new Error("Auth required");
    if (state.claimedGuildRewards.includes(goalId)) return;

    const newClaimed = [...state.claimedGuildRewards, goalId];
    dispatch({ type: 'CLAIM_GUILD_REWARD', goalId, rewardBtc: btcValue });

    // Veritabanına anlık yaz
    await supabase.from(TABLES.PROFILES).update({
      claimedGuildRewards: newClaimed,
      btcBalance: state.btcBalance + btcValue,
      updated_at: new Date().toISOString()
    }).eq('id', state.user.uid);

    // Transaction kaydı
    await supabase.from(TABLES.TRANSACTIONS).insert({
      user_id: state.user.uid,
      amount: btcValue,
      type: 'mining', // veya 'reward'
      description: `Lonca Hedefi Ödülü: ${goalId}`,
      timestamp: new Date().toISOString()
    });
  };

  // ─── Admin Helpers ────────────────────────────────────────────────────────
  const adminSetBtc = async (amount: number, userId?: string) => {
    const targetId = userId || state.user?.uid;
    if (!targetId) return;
    const { error } = await supabase.from(TABLES.PROFILES).update({ btcBalance: amount }).eq('id', targetId);
    if (error) throw error;
    if (!userId) dispatch({ type: 'ADMIN_SET_BTC', amount });
  };

  const adminSetTp = async (amount: number, userId?: string) => {
    const targetId = userId || state.user?.uid;
    if (!targetId) return;
    const { error } = await supabase.from(TABLES.PROFILES).update({ tycoonPoints: amount }).eq('id', targetId);
    if (error) throw error;
    if (!userId) dispatch({ type: 'ADMIN_SET_TP', amount });
  };

  const adminSetLevel = async (level: number, userId?: string) => {
    const targetId = userId || state.user?.uid;
    if (!targetId) return;
    const { error } = await supabase.from(TABLES.PROFILES).update({ level }).eq('id', targetId);
    if (error) throw error;
    if (!userId) dispatch({ type: 'ADMIN_SET_LEVEL', level });
  };

  const adminUpdateSettings = async (updates: any) => {
    const { error } = await supabase.from(TABLES.SETTINGS).update(updates).eq('id', 'v1');
    if (error) throw error;
  };

  const adminTriggerEvent = async (eventType: string) => {
    const { error } = await supabase.from(TABLES.SETTINGS).update({ 
      lastEventTrigger: eventType,
      lastEventAt: Date.now()
    }).eq('id', 'v1');
  };

  const claimStreakReward = async () => {
    if (!state.user) return;
    
    // 1. Reducer işlemi (state'i anında günceller)
    dispatch({ type: 'CLAIM_STREAK_REWARD' });
    
    // 2. Side effect: Ödülü hesapla (tekrar hesaplıyoruz çünkü newState henüz elimizde değil veya o anki state'i kullanabiliriz)
    const currentDayIndex = state.streak.count % 28;
    const rewards = [
      { type: 'tp',     value: 200 },
      { type: 'tp',     value: 400 },
      { type: 'energy', value: 8 },
      { type: 'tp',     value: 600 },
      { type: 'btc',    value: 0.000003 },
      { type: 'tp',     value: 1000 },
      { type: 'btc',    value: 0.00002 },
      { type: 'tp',     value: 300 },
      { type: 'energy', value: 12 },
      { type: 'tp',     value: 750 },
      { type: 'btc',    value: 0.000005 },
      { type: 'tp',     value: 1200 },
      { type: 'energy', value: 20 },
      { type: 'btc',    value: 0.00005 },
      { type: 'tp',     value: 500 },
      { type: 'btc',    value: 0.000008 },
      { type: 'energy', value: 15 },
      { type: 'tp',     value: 1500 },
      { type: 'btc',    value: 0.00001 },
      { type: 'tp',     value: 2000 },
      { type: 'btc',    value: 0.0001 },
      { type: 'tp',     value: 800 },
      { type: 'energy', value: 24 },
      { type: 'btc',    value: 0.000015 },
      { type: 'tp',     value: 2500 },
      { type: 'btc',    value: 0.00002 },
      { type: 'tp',     value: 3000 },
      { type: 'btc',    value: 0.0003 },
    ];
    const reward = rewards[currentDayIndex];
    
    const newStreak = {
      count: state.streak.count + 1,
      lastClaim: Date.now()
    };
    
    let newTp = state.tycoonPoints;
    let newBtc = state.btcBalance;
    let newEnergy = state.energyCells;
    
    if (reward.type === 'tp') newTp += reward.value;
    if (reward.type === 'btc') newBtc += reward.value;
    if (reward.type === 'energy') newEnergy = Math.min(state.maxEnergyCells, state.energyCells + reward.value);

    // 3. Veritabanına anında yaz (Sync bekleme)
    await supabase.from(TABLES.PROFILES).update({
      streak: newStreak,
      loginStreak: newStreak.count,
      tycoonPoints: newTp,
      btcBalance: newBtc,
      energyCells: newEnergy,
      updated_at: new Date().toISOString()
    }).eq('id', state.user.uid);
    
    console.info('🎁 Günlük ödül veritabanına kaydedildi:', newStreak.count);
  };

  const updateUserProfile = async (updates: Partial<{ username: string; email: string; phone: string; avatarUrl: string }>) => {
    if (!state.user) throw new Error("Auth required");
    const { error } = await supabase.from(TABLES.PROFILES).update(updates).eq('id', state.user.uid);
    if (error) throw error;
    dispatch({ type: 'UPDATE_PROFILE', updates });
  };

  const uploadAvatar = async (file: File) => {
    if (!state.user) throw new Error("Auth required");
    const fileExt = file.name.split('.').pop();
    const fileName = `${state.user.uid}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // ── Reklam → Hızlandırma ─────────────────────────────────────────────────
  const adBoostMining = (hoursEquivalent: number) => {
    dispatch({ type: 'AD_BOOST_MINING', hoursEquivalent });
    if (state.user?.uid) {
      const energyScaleFn = energyToHashScale(state.energyCells, state.maxEnergyCells);
      const btcPerSec = calcBtcPerSecond(state.totalHashRate, state.activeMiningEvents, state.prestigeMultiplier, energyScaleFn);
      const earned = btcPerSec * hoursEquivalent * 3600;
      supabase.from(TABLES.TRANSACTIONS).insert({
        user_id: state.user.uid,
        username: state.username,
        type: 'bonus',
        amount: earned,
        status: 'approved',
        note: `Reklam boost: ${hoursEquivalent}s madencilik hızlandırması`,
        created_at: new Date().toISOString(),
      }).then(() => {});
    }
  };

  // ── Overclock Aktivasyon ──────────────────────────────────────────────────
  const activateOverclock = (): { success: boolean; message: string } => {
    const cfg = state.overclockConfig;
    const now = Date.now();
    if (!cfg.enabled) return { success: false, message: 'Overclock şu an devre dışı.' };
    if (state.overclockActive) return { success: false, message: 'Overclock zaten aktif!' };
    if (now < state.overclockCooldownUntil) {
      const left = Math.ceil((state.overclockCooldownUntil - now) / 60000);
      return { success: false, message: `Cooldown: ${left} dakika kaldı.` };
    }
    if (state.tycoonPoints < cfg.costTp) {
      return { success: false, message: `Yetersiz TP. ${cfg.costTp} TP gerekli (${state.tycoonPoints} TP mevcut).` };
    }
    if (cfg.costBtc > 0 && state.btcBalance < cfg.costBtc) {
      return { success: false, message: `Yetersiz BTC. ${cfg.costBtc} BTC gerekli.` };
    }
    dispatch({ type: 'OVERCLOCK_ACTIVATE' });
    return { success: true, message: `Overclock aktif! ${cfg.durationMinutes} dakika boyunca +${Math.round((cfg.multiplier - 1) * 100)}% hashrate.` };
  };

  // ── Promo Code Redemption ─────────────────────────────────────────────────
  const redeemPromoCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!state.user?.uid) return { success: false, message: 'Giriş yapmalısın.' };
    try {
      const { data: promo, error } = await supabase
        .from(TABLES.PROMO_CODES)
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .maybeSingle();

      if (error || !promo) return { success: false, message: 'Geçersiz promo kodu.' };
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) return { success: false, message: 'Bu promo kodunun süresi dolmuş.' };
      if (promo.used_count >= promo.max_uses) return { success: false, message: 'Bu promo kodu kullanım limitine ulaştı.' };

      // Check if user already used this code
      const { data: alreadyUsed } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('id')
        .eq('user_id', state.user.uid)
        .eq('type', 'promo_code')
        .eq('note', code.toUpperCase().trim())
        .maybeSingle();

      if (alreadyUsed) return { success: false, message: 'Bu kodu daha önce kullandın.' };

      // Apply reward
      const rewardBtc = promo.reward_btc || 0;
      const rewardTp = promo.reward_tp || 0;

      await supabase.from(TABLES.TRANSACTIONS).insert({
        user_id: state.user.uid,
        username: state.username,
        type: 'promo_code',
        amount: rewardBtc,
        status: 'approved',
        note: code.toUpperCase().trim(),
        created_at: new Date().toISOString()
      });

      await supabase.from(TABLES.PROMO_CODES).update({ used_count: (promo.used_count || 0) + 1 }).eq('id', promo.id);
      await supabase.from(TABLES.PROFILES).update({
        btcBalance: state.btcBalance + rewardBtc,
        tycoonPoints: state.tycoonPoints + rewardTp
      }).eq('id', state.user.uid);

      dispatch({ type: 'REDEEM_PROMO_CODE', code, btc: rewardBtc, tp: rewardTp });
      return { success: true, message: `+${rewardBtc} BTC ve +${rewardTp} TP kazandın!` };
    } catch {
      return { success: false, message: 'Bir hata oluştu. Lütfen tekrar dene.' };
    }
  };

  return (
    <GameContext.Provider value={{
      state, dispatch, btcToUsd, formatBtc, earnedTodayBtc, earnedTodayUsd: btcToUsd(earnedTodayBtc),
      effectiveHashRate: state.totalHashRate * energyScale * overclockMultiplier, energyScale, currentBtcPerSecond, canPrestige: state.level >= 10, 
      isVipActive: isVipCapExempt, vipBtcBonus: isVipCapExempt ? (state.vip?.tier === 'gold' ? 1.5 : 1.2) : 1.0,
      dailyEarnedBtc: currentDailyEarned, dailyCapBtc, dailyEarnedPct, dailyCapReached, isVipCapExempt,
      listContractOnMarket, buyContractFromMarket, cancelMarketListing,
      createGuildInFirestore, joinGuildInFirestore, leaveGuildInFirestore, donateToGuildInFirestore, claimGuildReward,
      adminSetBtc, adminSetTp, adminSetLevel, adminUpdateSettings, adminTriggerEvent,
      updateUserProfile, uploadAvatar, claimStreakReward, redeemPromoCode,
      activateOverclock, adBoostMining,
      isOverclockActive: isOverclockActiveNow,
      isOverclockCooldown,
      overclockMultiplier,
      overclockSecondsLeft: isOverclockActiveNow ? Math.max(0, Math.ceil((state.overclockEndsAt - Date.now()) / 1000)) : 0,
      cooldownSecondsLeft: isOverclockCooldown ? Math.max(0, Math.ceil((state.overclockCooldownUntil - Date.now()) / 1000)) : 0,
      calcWithdrawLimits,
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
