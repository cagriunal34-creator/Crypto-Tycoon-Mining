import { BattlePassReward, GuildGoal } from '../types';

export const BP_REWARDS: BattlePassReward[] = [
  { id: 'bp_1', level: 1, type: 'btc', label: 'Hoş Geldin Paketi', emoji: '🎁', value: 0.00000005, isPremium: false },
  { id: 'bp_2', level: 2, type: 'tp', label: 'TycoonPoints', emoji: '🎯', value: 200, isPremium: false },
  { id: 'bp_3', level: 3, type: 'btc', label: 'Bronz Madenci Kabini', emoji: '📦', value: 0.00000025, isPremium: false },
  { id: 'bp_4', level: 4, type: 'tp', label: 'Bonus TP', emoji: '✨', value: 1000, isPremium: false },
  { id: 'bp_5', level: 5, type: 'btc', label: 'Gümüş Rig Kasası', emoji: '💼', value: 0.00000100, isPremium: true },
  { id: 'bp_6', level: 6, type: 'energy', label: 'Enerji Paketi (x5)', emoji: '🔋', value: 5, isPremium: false },
  { id: 'bp_7', level: 7, type: 'hashboost', label: 'Altın Rig Parçası', emoji: '⚡', value: 50, isPremium: true },
  { id: 'bp_8', level: 8, type: 'vip_day', label: '1 Günlük VIP', emoji: '👑', value: 1, isPremium: true }
];

export const GUILD_GOALS: GuildGoal[] = [
  { id: 'g_1', label: 'Başlangıç Gücü', description: 'Lonca toplam hashrate 1.0 TH/s ulaşmalı.', requirement: 1000, type: 'hashrate', reward: { type: 'tp', value: 5000 } },
  { id: 'g_2', label: 'Madenci Topluluğu', description: 'Lonca 5 üyeye ulaşmalı.', requirement: 5, type: 'members', reward: { type: 'btc', value: 0.00000500 } },
  { id: 'g_3', label: 'Elit Kadro', description: 'Lonca seviyesi 5 olmalı.', requirement: 5, type: 'level', reward: { type: 'btc', value: 0.00001000 } },
  { id: 'g_4', label: 'Endüstriyel Güç', description: 'Lonca toplam hashrate 10.0 TH/s ulaşmalı.', requirement: 10000, type: 'hashrate', reward: { type: 'btc', value: 0.00005000 } },
];
