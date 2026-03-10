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
import { supabase, TABLES } from '../lib/supabase';

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
  isMaintenance: boolean;
  announcement: string;
  globalSettings: any;
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

  transactions: [],

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
  offlineEarningsShown: false,

  // Phase 3: Mining Empire
  activeContracts: [],
  availableJobs: [],
  researchedNodes: [],
  lastAdWatchTime: 0,
  adRewardBtc: 0,
  adRewardTp: 0,
  adCooldown: 0,
  interstitialAdInterval: 0,
  lastInterstitialAdAt: 0,
  user: null,
  isLoading: true,
  globalMultiplier: 1.0,
  isMaintenance: false,
  announcement: '',
  globalSettings: {},
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
  | { type: 'SET_GUILDS'; guilds: Guild[] }
  | { type: 'SET_GLOBAL_MULTIPLIER'; multiplier: number }
  | { type: 'SET_MAINTENANCE'; isMaintenance: boolean }
  | { type: 'SET_GLOBAL_SETTINGS'; settings: any }
  | { type: 'SET_ANNOUNCEMENT'; announcement: string }
  | { type: 'SET_USD_RATE'; rate: number }
  | { type: 'REMOVE_BTC'; amount: number; label: string; txId: string }
  | { type: 'ADD_TP'; amount: number }
  | { type: 'REMOVE_ENERGY_CELLS'; amount: number }
  | { type: 'DISMISS_OFFLINE_EARNINGS' }
  | { type: 'SET_TRANSACTIONS'; transactions: Transaction[] }
  | { type: 'BP_CLAIM_REWARD'; rewardId: string }
  | { type: 'BP_BUY_PREMIUM' }
  | { type: 'ADMIN_RESET_GAME' };

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
      const newEnergy = state.isInfiniteEnergy ? state.energyCells : Math.max(0, state.energyCells - (elapsed * 0.005));
      const energyScale = energyToHashScale(newEnergy, state.maxEnergyCells);
      const activeEvents = state.activeMiningEvents.filter(ev => ev.endsAt > now);
      const isVipActiveNow = state.vip?.isActive && state.vip.expiresAt > now;
      const vipBtcBonus = isVipActiveNow ? (state.vip.tier === 'gold' ? 1.5 : 1.2) : 1.0;
      const farmHashRate = state.farmSettings.rigStatuses.filter((_, i) => i < state.farmSettings.activeRigs).reduce((acc, rig) => acc + (rig.isBroken ? 0 : Math.floor(rig.efficiency * 1.2)), 0);
      const totalHashRateWithFarm = state.totalHashRate + farmHashRate;
      const btcPerSecond = calcBtcPerSecond(totalHashRateWithFarm, activeEvents, state.prestigeMultiplier, energyScale, state.isFeverMode, state.researchedNodes, vipBtcBonus, state.globalMultiplier);
      return { ...state, btcBalance: state.btcBalance + (btcPerSecond * elapsed), energyCells: newEnergy, lastMiningTick: now };
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
    case 'SET_GAME_STATE': return { ...state, ...action.state, isLoading: false };
    case 'ADD_TP': return { ...state, tycoonPoints: state.tycoonPoints + action.amount };
    case 'REMOVE_ENERGY_CELLS': return { ...state, energyCells: Math.max(0, state.energyCells - action.amount) };
    case 'DISMISS_OFFLINE_EARNINGS': return { ...state, offlineEarningsShown: true, pendingOfflineEarnings: 0 };
    case 'RESET_INTERSTITIAL_TIMER': return { ...state, lastInterstitialAdAt: Date.now() };
    case 'SET_GLOBAL_SETTINGS': return { ...state, globalSettings: action.settings };
    case 'SET_MAINTENANCE': return { ...state, isMaintenance: action.isMaintenance };
    case 'SET_GUILDS': return { ...state, guilds: action.guilds };
    case 'SET_MARKETPLACE': return { ...state, marketListings: action.listings };
    case 'SET_USD_RATE': return { ...state, usdRate: action.rate };
    case 'SET_TRANSACTIONS': return { ...state, transactions: action.transactions };
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
  listContractOnMarket: (contract: OwnedContract, price: number) => Promise<void>;
  buyContractFromMarket: (listing: MarketListing) => Promise<void>;
  cancelMarketListing: (listingId: string) => Promise<void>;
  createGuildInFirestore: (name: string, desc: string, badge: string, cost: number) => Promise<void>;
  joinGuildInFirestore: (guild: Guild) => Promise<void>;
  leaveGuildInFirestore: (guildId: string) => Promise<void>;
  donateToGuildInFirestore: (amount: number) => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  const fetchTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase.from(TABLES.TRANSACTIONS)
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(20);
      if (!error && data) {
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
      console.error("Trans fetch error:", e);
    }
  };

  const fetchProfile = async (uid: string, email?: string) => {
    try {
      console.info("🔍 Fetching profile for:", uid);
      const { data: profile, error } = await supabase.from(TABLES.PROFILES).select('*').eq('id', uid).single();
      
      if (profile && !error) {
        console.info("✅ Profile found:", profile.username);
        dispatch({ type: 'SET_GAME_STATE', state: { ...profile, isLoading: false } as any });
      } else {
        // Profil yoksa yeni oluştur - Çakışmaları önlemek için username'e random ekle
        const baseUsername = email?.split('@')[0] || 'Madenci';
        const finalUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
        
        console.info("✨ Creating new profile:", finalUsername);
        const { data: newProfile, error: upsertError } = await supabase.from(TABLES.PROFILES).upsert({
          id: uid,
          username: finalUsername
        }).select().single();
        
        if (upsertError) console.error("❌ Upsert failed:", upsertError.message);
        
        dispatch({ 
          type: 'SET_GAME_STATE', 
          state: { ...(newProfile || {}), isLoading: false } as any 
        });
      }
    } catch (err) {
      console.error("❌ fetchProfile fatal error:", err);
      dispatch({ type: 'SET_GAME_STATE', state: { isLoading: false } as any });
    }
  };

  const handleUserSession = async (session: any) => {
    const user = session?.user ?? null;
    console.info("👤 handleUserSession - User:", user?.email || "No Session");
    
    dispatch({ type: 'SET_AUTH_USER', user });

    if (user) {
      // Parallelize profile and transactions
      await Promise.all([
        fetchProfile(user.id, user.email),
        fetchTransactions(user.id)
      ]);
    }
    
    // Always finalize loader here (unless handled by individual fetches - but better here for global consistency)
    dispatch({ type: 'SET_GAME_STATE', state: { isLoading: false } as any });
  };

  // Main Init & Auth Effect
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // Security Net
      const loadingTimeout = setTimeout(() => {
        if (isMounted) {
          console.warn("⏰ Global Loading Timeout - Releasing UI");
          dispatch({ type: 'SET_GAME_STATE', state: { isLoading: false } as any });
        }
      }, 10000);

      try {
        // ✅ URL'de auth parametresi var mı kontrol et (Implicit/PKCE)
        const hasAuthInUrl = 
          window.location.hash.includes('access_token') || 
          window.location.hash.includes('error') ||
          window.location.search.includes('code=');

        if (hasAuthInUrl) {
          console.info("⏳ Auth parametresi bulundu, Supabase işlemesi bekleniyor...");
          return; // getSession() çağırma - Race condition önlemi
        }

        console.info("🔑 Checking initial Supabase session...");
        const { data: { session } } = await supabase.auth.getSession();

        // 1. Fetch Global Data (Parallel)
        const [
          { data: settings },
          { data: marketData },
          { data: guilds }
        ] = await Promise.all([
          supabase.from(TABLES.SETTINGS).select('*').eq('id', 'v1').single(),
          supabase.from(TABLES.MARKETPLACE).select('*').order('created_at', { ascending: false }),
          supabase.from(TABLES.GUILDS).select('*').order('rank', { ascending: true })
        ]);

        // 3. Process Data
        if (settings) {
          dispatch({ type: 'SET_GLOBAL_SETTINGS', settings });
          dispatch({ type: 'SET_MAINTENANCE', isMaintenance: settings.isMaintenance });
        }

        if (marketData) {
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
            isOwn: currentSession?.user?.id === l.seller_id
          }));
          dispatch({ type: 'SET_MARKETPLACE', listings: mappedMarket });
        }
        if (guilds) dispatch({ type: 'SET_GUILDS', guilds });

        // 3. Process Session
        if (isMounted) await handleUserSession(currentSession);

      } catch (e) {
        console.error("❌ Init failed:", e);
        if (isMounted) dispatch({ type: 'SET_GAME_STATE', state: { isLoading: false } as any });
      } finally {
        clearTimeout(loadingTimeout);
      }
    };

    // 2. Setup Auth Listener (Set this BEFORE init so we don't miss events)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.info("🔔 Auth Event Detected:", event);
      if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
        await handleUserSession(session);
      }
    });

    init();

    const settingsSub = supabase.channel('public:settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.SETTINGS, filter: 'id=eq.v1' }, (payload) => {
        const data = payload.new as any;
        dispatch({ type: 'SET_MAINTENANCE', isMaintenance: data.isMaintenance });
      }).subscribe();

    return () => {
      isMounted = false;
      authSub.unsubscribe();
      settingsSub.unsubscribe();
    };
  }, []);

  // User Data Subscriptions
  useEffect(() => {
    if (!state.user?.id) return;
    
    const pSub = supabase.channel(`public:profiles:${state.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.PROFILES, filter: `id=eq.${state.user.id}` },
        payload => dispatch({ type: 'SET_GAME_STATE', state: payload.new as any }))
      .subscribe();

    const tSub = supabase.channel(`public:transactions:${state.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.TRANSACTIONS, filter: `user_id=eq.${state.user.id}` }, () => {
        fetchTransactions(state.user!.id);
      })
      .subscribe();

    return () => {
      pSub.unsubscribe();
      tSub.unsubscribe();
    };
  }, [state.user?.id]);

  const btcToUsd = (btc: number) => `$${(btc * state.usdRate).toFixed(2)}`;
  const formatBtc = (btc: number) => btc.toFixed(10);
  const energyScale = energyToHashScale(state.energyCells, state.maxEnergyCells);
  const currentBtcPerSecond = calcBtcPerSecond(state.totalHashRate, state.activeMiningEvents, state.prestigeMultiplier, energyScale, state.isFeverMode, state.researchedNodes);
  const earnedTodayBtc = currentBtcPerSecond * 86400;

  // ─── Marketplace Functions ──────────────────────────────────────────────────
  const listContractOnMarket = async (contract: OwnedContract, price: number) => {
    if (!state.user) throw new Error("Auth required");
    const { error } = await supabase.from(TABLES.MARKETPLACE).insert({
      contractId: contract.id,
      contractName: contract.name,
      tier: contract.tier,
      hashRate: contract.hashRate,
      daysRemaining: Math.max(1, contract.durationDays - Math.floor((Date.now() - contract.purchasedAt) / 86400000)),
      sellerId: state.user.id,
      sellerName: state.username || state.user.email?.split('@')[0],
      price: price,
      listedAt: Date.now()
    });

    if (error) throw error;

    const newOwned = state.ownedContracts.filter(c => c.id !== contract.id);
    await supabase.from(TABLES.PROFILES).update({ ownedContracts: newOwned }).eq('id', state.user.id);
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
    }).eq('id', state.user.id);

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
        user_id: state.user.id,
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

    await supabase.from(TABLES.PROFILES).update({ ownedContracts: newOwned }).eq('id', state.user.id);
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
      ownerId: state.user.id,
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
    }).eq('id', state.user.id);
  };

  const joinGuildInFirestore = async (guild: Guild) => {
    if (!state.user) throw new Error("Auth required");
    if (state.userGuildId) throw new Error("Already in a guild");

    await supabase.from(TABLES.PROFILES).update({ userGuildId: guild.id }).eq('id', state.user.id);
    await supabase.from(TABLES.GUILDS).update({
      members: guild.members + 1,
      totalHash: guild.totalHash + state.totalHashRate
    }).eq('id', guild.id);
  };

  const leaveGuildInFirestore = async (guildId: string) => {
    if (!state.user) throw new Error("Auth required");
    const { data: guild } = await supabase.from(TABLES.GUILDS).select('*').eq('id', guildId).single();
    if (!guild) return;

    await supabase.from(TABLES.PROFILES).update({ userGuildId: null }).eq('id', state.user.id);
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

    await supabase.from(TABLES.PROFILES).update({ tycoonPoints: state.tycoonPoints - amount }).eq('id', state.user.id);
    await supabase.from(TABLES.GUILDS).update({
      xp: newXp,
      level: newLevel,
      xpToNextLevel: nextXp
    }).eq('id', state.userGuildId);
  };

  return (
    <GameContext.Provider value={{
      state, dispatch, btcToUsd, formatBtc, earnedTodayBtc, earnedTodayUsd: btcToUsd(earnedTodayBtc),
      effectiveHashRate: state.totalHashRate * energyScale, energyScale, currentBtcPerSecond, canPrestige: state.level >= 10, isVipActive: false, vipBtcBonus: 1.0,
      listContractOnMarket, buyContractFromMarket, cancelMarketListing,
      createGuildInFirestore, joinGuildInFirestore, leaveGuildInFirestore, donateToGuildInFirestore
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
