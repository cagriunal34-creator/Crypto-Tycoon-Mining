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
import { BP_REWARDS } from '../constants/gameData';
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
    claimedQuestIds: [],
  },

  level: 1,
  xp: 0,
  xpToNextLevel: 500,
  loginStreak: 1,
  lastLoginDate: new Date().toISOString().split('T')[0],

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
  offlineEarningsShown: false,

  // Phase 3: Mining Empire
  activeContracts: [],
  availableJobs: [],
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
  | { type: 'UPDATE_PROFILE'; updates: Partial<{ username: string; email: string; phone: string; avatarUrl: string }> };

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
  globalMult: number = 1.0
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
  const base = totalHash * 1e-9 * 0.5;
  let researchMult = 1.0;
  if (researchedNodes?.includes('mining-1')) researchMult += 0.1;
  if (researchedNodes?.includes('mining-2')) researchMult += 0.5;

  const finalMult = eventMult * prestigeMultiplier * energyScale * researchMult * (vipMult || 1.0) * (globalMult || 1.0);
  return base * finalMult;
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
      const activeEvents = state.activeMiningEvents.filter(ev => ev.endsAt > now);

      const today = new Date().toISOString().split('T')[0];
      let currentDailyEarnings = state.lastEarningsResetDate === today ? state.dailyEarningsBtc : 0;
      
      const isVipActiveNow = state.vip?.isActive && state.vip.expiresAt > now;
      const vipBtcBonus = isVipActiveNow ? (state.vip.tier === 'gold' ? 1.5 : 1.2) : 1.0;
      const farmHashRate = state.farmSettings.rigStatuses.filter((_, i) => i < state.farmSettings.activeRigs).reduce((acc, rig) => acc + (rig.isBroken ? 0 : Math.floor(rig.efficiency * 1.2)), 0);
      const totalHashRateWithFarm = state.totalHashRate + farmHashRate;
      const btcPerSecond = calcBtcPerSecond(totalHashRateWithFarm, activeEvents, state.prestigeMultiplier, energyScale, state.isFeverMode, state.researchedNodes, vipBtcBonus, state.globalMultiplier);
      
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
      const activeEvents = state.activeMiningEvents.filter(ev => ev.endsAt > now);
      if (now - state.lastEventCheckAt > 300000 && Math.random() < 0.3) {
        return { ...state, activeMiningEvents: [...activeEvents, generateEvent(Math.random() * 3600000 + 1800000)], lastEventCheckAt: now };
      }
      return { ...state, activeMiningEvents: activeEvents };
    }
    case 'SET_AUTH_USER': return { ...state, user: action.user };
    case 'SET_GAME_STATE': {
      const { user: _u, isLoading: _l, ...safeState } = action.state as any;
      return {
        ...state,
        ...safeState,
        user: state.user,
        isLoading: (action.state as any).isLoading ?? state.isLoading,
      };
    }
    case 'ADD_TP': return { ...state, tycoonPoints: state.tycoonPoints + action.amount };
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
    case 'VIP_ACTIVATE': return {
      ...state,
      tycoonPoints: state.tycoonPoints - action.cost,
      vip: {
        isActive: true,
        tier: action.tier,
        expiresAt: Date.now() + action.days * 86400000,
        perks: VIP_PERKS[action.tier] || []
      }
    };
    case 'UPDATE_FARM': return {
      ...state,
      farmSettings: { ...state.farmSettings, ...action.settings }
    };
    case 'PURCHASE_CONTRACT': return {
      ...state,
      btcBalance: state.btcBalance - action.cost,
      ownedContracts: [...state.ownedContracts, action.contract]
    };
    case 'CALC_OFFLINE_EARNINGS': {
      // Very simple offline calc for now
      const energyScale = energyToHashScale(state.energyCells, state.maxEnergyCells);
      const btcPerSec = calcBtcPerSecond(state.totalHashRate, state.activeMiningEvents, state.prestigeMultiplier, energyScale);
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
      // Speed boost is handled differently in this app (usually by globalMultiplier or event)
      // For now we just return state for other types
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
    case 'CLAIM_STREAK_REWARD': {
      const today = new Date().toISOString().split('T')[0];
      const lastClaimDate = state.streak.lastClaim ? new Date(state.streak.lastClaim).toISOString().split('T')[0] : null;
      if (lastClaimDate === today) return state;

      const currentDayIndex = state.streak.count % 7;
      const reward = [
        { type: 'tp', value: 100 },
        { type: 'tp', value: 250 },
        { type: 'btc', value: 0.000001 },
        { type: 'tp', value: 500 },
        { type: 'energy', value: 5 },
        { type: 'tp', value: 1000 },
        { type: 'btc', value: 0.00001 },
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
  // Admin Helpers
  adminSetBtc: (amount: number, userId?: string) => Promise<void>;
  adminSetTp: (amount: number, userId?: string) => Promise<void>;
  adminSetLevel: (level: number, userId?: string) => Promise<void>;
  adminUpdateSettings: (updates: any) => Promise<void>;
  adminTriggerEvent: (eventType: string) => Promise<void>;
  updateUserProfile: (updates: Partial<{ username: string; email: string; phone: string; avatarUrl: string }>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
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
        const { id, user: _u, isLoading: _l, ...rest } = profile as any;
        const gameData = { ...rest, userId: id };
        
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
      } catch (e) {
        console.error('Global data error:', e);
      }
    };

    loadGlobal();
    fetchLeaderboard();

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

          // google_ads_config → Google Ads ayarları anında güncelle
          if (s.id === 'google_ads_config' && s.value) {
            dispatch({ type: 'SET_GOOGLE_ADS_CONFIG', config: s.value });
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
        // Debounced or occasional fetch would be better, but for real-time requirement:
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      unsubscribeAuth();
      globalSub.unsubscribe();
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
          redeemedReferralCode: state.redeemedReferralCode,
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
    state.researchedNodes, state.battlePass
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
  const currentBtcPerSecond = calcBtcPerSecond(state.totalHashRate, state.activeMiningEvents, state.prestigeMultiplier, energyScale, state.isFeverMode, state.researchedNodes);
  const earnedTodayBtc = currentBtcPerSecond * 86400;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const currentDailyEarned = state.lastEarningsResetDate === todayStr ? state.dailyEarningsBtc : 0;
  
  const isVipCapExempt = state.vip?.isActive && state.vip.expiresAt > Date.now();
  const dailyCapBtc = 1.0 / (state.usdRate || 91200);
  const dailyCapReached = !isVipCapExempt && currentDailyEarned >= dailyCapBtc;
  const dailyEarnedPct = Math.min(100, (currentDailyEarned / dailyCapBtc) * 100);

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

  return (
    <GameContext.Provider value={{
      state, dispatch, btcToUsd, formatBtc, earnedTodayBtc, earnedTodayUsd: btcToUsd(earnedTodayBtc),
      effectiveHashRate: state.totalHashRate * energyScale, energyScale, currentBtcPerSecond, canPrestige: state.level >= 10, 
      isVipActive: isVipCapExempt, vipBtcBonus: isVipCapExempt ? (state.vip?.tier === 'gold' ? 1.5 : 1.2) : 1.0,
      dailyEarnedBtc: currentDailyEarned, dailyCapBtc, dailyEarnedPct, dailyCapReached, isVipCapExempt,
      listContractOnMarket, buyContractFromMarket, cancelMarketListing,
      createGuildInFirestore, joinGuildInFirestore, leaveGuildInFirestore, donateToGuildInFirestore,
      adminSetBtc, adminSetTp, adminSetLevel, adminUpdateSettings, adminTriggerEvent,
      updateUserProfile, uploadAvatar
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
