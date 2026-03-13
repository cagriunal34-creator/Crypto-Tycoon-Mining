export type Screen = 'panel' | 'contracts' | 'wallet' | 'referral' | 'settings' | 'inbox' | 'quests' | 'farm' | 'wheel' | 'battlepass' | 'marketplace' | 'vip' | 'infrastructure' | 'shop' | 'research' | 'guild' | 'stats' | 'tournament' | 'cosmetics' | 'factory' | 'altcoin';

export type LightingColor = 'emerald' | 'blue' | 'purple' | 'orange' | 'red';
export type RigTier = 'Basic' | 'Pro' | 'Ultra';

export interface RigStatus {
  id: number;
  isBroken: boolean;
  efficiency: number;
  fanSpeed: number;
  condition: number; // 0-100
  heat: number;      // 0-100
  serialNumber: string;
}

export interface FarmSettings {
  lighting: LightingColor;
  coolingLevel: number;
  powerSupplyLevel: number;
  activeRigs: number;
  rigTier: RigTier;
  rigStatuses: RigStatus[];
  baseElectricityCost: number; // TP per minute
}

export interface OwnedContract {
  id: string;
  name: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Flash' | 'Diamond';
  hashRate: number;
  purchasedAt: number;
  durationDays: number;
  condition: number; // 0-100

  // ── Kazanç Tavanı Sistemi ──────────────────────────────────────
  purchasePriceUsd: number;      // Satın alım fiyatı ($ cinsinden)
  maxEarningsBtc: number;        // Bu cihazın ömür boyu kazanabileceği max BTC
  totalEarnedBtc: number;        // Şimdiye kadar bu cihazdan kazanılan BTC
  dailyBtcTarget: number;        // Hedef günlük BTC (UI gösterimi için)
  lastMaintenance: number;
}

export interface Transaction {
  id: string;
  type: 'mining' | 'transfer_in' | 'transfer_out' | 'purchase' | 'bonus' | 'prestige' | 'offline' | 'withdraw';
  amount: number;
  tpAmount?: number;
  label: string;
  date: number;
  status: 'completed' | 'pending';
}

export interface QuestProgress {
  adsWatched: number;
  contractsPurchased: number;
  referralsDone: number;
  loginStreak: number;
  contractsCompleted: number;
  claimedQuestIds: string[];
}

export interface Guild {
  id: string;
  name: string;
  description: string;
  members: number;
  member_count?: number; // Supabase
  totalHash: number;
  rank: number;
  badge: string;
  ownerId?: string;
  owner_id?: string; // Supabase
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface GuildGoal {
  id: string;
  label: string;
  description: string;
  requirement: number;
  type: 'hashrate' | 'members' | 'level';
  reward: {
    type: 'tp' | 'btc';
    value: number;
  };
}

export type MiningEventType = 'flash_pool' | 'hash_storm' | 'energy_surge' | 'block_halving' | 'WHEEL_BOOST' | 'wheel_speed';

export interface MiningEvent {
  id: string;
  type: MiningEventType;
  label: string;
  description: string;
  emoji: string;
  multiplier: number;
  hashBoost: number;
  endsAt: number;
  energyRestore?: number;
}

export interface BattlePassReward {
  id: string;
  level: number;
  type: 'tp' | 'btc' | 'hashboost' | 'energy' | 'vip_day' | 'cosmetic';
  label: string;
  emoji: string;
  value: number;
  isPremium: boolean;
}

export interface BattlePassState {
  season: number;
  currentLevel: number;
  currentXP: number;
  xpPerLevel: number;
  isPremium: boolean;
  claimedRewardIds: string[];
  endsAt: number;
}

export interface MarketListing {
  id: string;
  contractId: string;
  contractName: string;
  item_name?: string; // Supabase
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Flash';
  item_type?: string; // Supabase
  hashRate: number;
  hashrate?: number;  // Supabase
  daysRemaining: number;
  sellerName: string;
  sellerId?: string;
  seller_id?: string; // Supabase
  price: number;
  listedAt: number;
  isOwn?: boolean;
}

export interface VIPState {
  isActive: boolean;
  tier: 'none' | 'silver' | 'gold';
  expiresAt: number;
  perks: string[];
}

export interface PrestigeRecord {
  level: number;
  achievedAt: number;
  multiplierGained: number;
  btcRetained: number;
}

export interface MiningStats {
  btcBalance: number;
  tycoonPoints: number;
  currentHashRate: number;
  energyLevel: number;
}

export interface Contract {
  id: string;
  name: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Flash';
  hashRate: number;
  price: number;
  duration: number;
  bonus?: number;
  isPopular?: boolean;
  isLimited?: boolean;
  endsIn?: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  referrals: number;
  reward: number;
  isCurrentUser?: boolean;
  avatar: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  username: string;
  amount: number;
  address: string;
  status: 'pending' | 'approved' | 'rejected' | 'on_hold';
  createdAt: number;
  updatedAt: number;
}

// ── Kozmetik Sistem ───────────────────────────────────────────────────────────
export type CosmeticCategory = 'frame' | 'effect' | 'badge' | 'background';
export type CosmeticRarity   = 'common' | 'rare' | 'epic' | 'legendary';

export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  category: CosmeticCategory;
  rarity: CosmeticRarity;
  emoji: string;
  previewColor: string;
  price: number; // TP cinsinden
  btcPrice?: number; // BTC alternatif
  isLimited?: boolean;
  isNew?: boolean;
}

export interface CosmeticsState {
  owned: string[];       // owned item ids
  equipped: {
    frame?: string;
    effect?: string;
    badge?: string;
    background?: string;
  };
}

// ── Fabrika Sistemi ───────────────────────────────────────────────────────────
export type SlotState = 'idle' | 'producing' | 'ready';

export interface FactorySlot {
  id: number;
  state: SlotState;
  recipeId: string | null;
  startedAt: number;
  finishesAt: number;
  locked: boolean;
  unlockCost: number;
}

export interface FactoryData {
  slots: FactorySlot[];
  resources: Record<string, number>; // resourceId → amount
  unlockedRecipes: string[];
}

// ── Altcoin Sistemi ───────────────────────────────────────────────────────────
export type AltcoinBalances = Record<string, number>; // coinId → amount

