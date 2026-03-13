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

export const SEASON_2_REWARDS: BattlePassReward[] = [
  // Lvl 1-10
  { id:'s2_1',  level:1,  type:'tp',       label:'Başlangıç Paketi',    emoji:'🎁', value:300,         isPremium:false },
  { id:'s2_2',  level:2,  type:'btc',      label:'Küçük Madeni',        emoji:'₿',  value:0.000001,    isPremium:false },
  { id:'s2_3',  level:3,  type:'energy',   label:'Enerji Şişesi',       emoji:'⚡', value:5,           isPremium:false },
  { id:'s2_4',  level:4,  type:'tp',       label:'TP Ödülü',            emoji:'🎯', value:500,         isPremium:true  },
  { id:'s2_5',  level:5,  type:'hashboost',label:'Hız Çipı',            emoji:'🔧', value:25,          isPremium:false },
  { id:'s2_6',  level:6,  type:'btc',      label:'Bronz Kazanç',        emoji:'🥉', value:0.000003,    isPremium:true  },
  { id:'s2_7',  level:7,  type:'tp',       label:'Bonus TP',            emoji:'✨', value:750,         isPremium:false },
  { id:'s2_8',  level:8,  type:'energy',   label:'Enerji Hücresi',      emoji:'🔋', value:8,           isPremium:true  },
  { id:'s2_9',  level:9,  type:'btc',      label:'Madenci Katkısı',     emoji:'⛏️', value:0.000005,    isPremium:false },
  { id:'s2_10', level:10, type:'vip_day',  label:'VIP Hafta Sonu',      emoji:'👑', value:2,           isPremium:true  },
  // Lvl 11-20
  { id:'s2_11', level:11, type:'tp',       label:'Orta Seviye TP',      emoji:'💎', value:1000,        isPremium:false },
  { id:'s2_12', level:12, type:'hashboost',label:'Güçlü Çip',           emoji:'⚡', value:50,          isPremium:false },
  { id:'s2_13', level:13, type:'btc',      label:'Gümüş Madeni',        emoji:'🥈', value:0.000008,    isPremium:true  },
  { id:'s2_14', level:14, type:'energy',   label:'Mega Enerji',         emoji:'🔋', value:12,          isPremium:false },
  { id:'s2_15', level:15, type:'tp',       label:'Sezon Ödülü I',       emoji:'🌟', value:2000,        isPremium:true  },
  { id:'s2_16', level:16, type:'btc',      label:'BTC Paketi',          emoji:'₿',  value:0.000012,    isPremium:false },
  { id:'s2_17', level:17, type:'hashboost',label:'Turbo Çip',           emoji:'🚀', value:100,         isPremium:true  },
  { id:'s2_18', level:18, type:'tp',       label:'Elite TP',            emoji:'💫', value:1500,        isPremium:false },
  { id:'s2_19', level:19, type:'btc',      label:'Madenci Kasası',      emoji:'💰', value:0.000018,    isPremium:true  },
  { id:'s2_20', level:20, type:'vip_day',  label:'VIP Haftası',         emoji:'👑', value:7,           isPremium:true  },
  // Lvl 21-30
  { id:'s2_21', level:21, type:'tp',       label:'Üst Seviye TP',       emoji:'🎯', value:2500,        isPremium:false },
  { id:'s2_22', level:22, type:'btc',      label:'Altın Madeni',        emoji:'🥇', value:0.000025,    isPremium:false },
  { id:'s2_23', level:23, type:'hashboost',label:'Çift Hız',            emoji:'⚡', value:150,         isPremium:true  },
  { id:'s2_24', level:24, type:'energy',   label:'Enerji Kaseti',       emoji:'🔋', value:20,          isPremium:false },
  { id:'s2_25', level:25, type:'tp',       label:'Sezon Ödülü II',      emoji:'🌠', value:4000,        isPremium:true  },
  { id:'s2_26', level:26, type:'btc',      label:'Kripto Hazinesi',     emoji:'💎', value:0.000035,    isPremium:false },
  { id:'s2_27', level:27, type:'hashboost',label:'İleri Çip',           emoji:'🔧', value:200,         isPremium:true  },
  { id:'s2_28', level:28, type:'tp',       label:'Dev TP',              emoji:'✨', value:3000,        isPremium:false },
  { id:'s2_29', level:29, type:'btc',      label:'Büyük Madeni',        emoji:'₿',  value:0.00005,     isPremium:true  },
  { id:'s2_30', level:30, type:'vip_day',  label:'VIP Ay',              emoji:'👑', value:14,          isPremium:true  },
  // Lvl 31-40
  { id:'s2_31', level:31, type:'tp',       label:'Elit TP Paketi',      emoji:'💫', value:5000,        isPremium:false },
  { id:'s2_32', level:32, type:'btc',      label:'Platin Madeni',       emoji:'🥈', value:0.00007,     isPremium:false },
  { id:'s2_33', level:33, type:'hashboost',label:'Süper Çip',           emoji:'🚀', value:300,         isPremium:true  },
  { id:'s2_34', level:34, type:'energy',   label:'Mega Batarya',        emoji:'⚡', value:30,          isPremium:false },
  { id:'s2_35', level:35, type:'tp',       label:'Sezon Ödülü III',     emoji:'🌟', value:7500,        isPremium:true  },
  { id:'s2_36', level:36, type:'btc',      label:'Efsane Madeni',       emoji:'₿',  value:0.0001,      isPremium:false },
  { id:'s2_37', level:37, type:'hashboost',label:'Hiper Çip',           emoji:'⚡', value:500,         isPremium:true  },
  { id:'s2_38', level:38, type:'tp',       label:'Üst Elit TP',         emoji:'💎', value:6000,        isPremium:false },
  { id:'s2_39', level:39, type:'btc',      label:'Elmas Madeni',        emoji:'💎', value:0.00015,     isPremium:true  },
  { id:'s2_40', level:40, type:'vip_day',  label:'VIP Sezonu',          emoji:'👑', value:30,          isPremium:true  },
  // Lvl 41-50 (son bölüm — büyük ödüller)
  { id:'s2_41', level:41, type:'tp',       label:'Titan TP',            emoji:'🔥', value:10000,       isPremium:false },
  { id:'s2_42', level:42, type:'btc',      label:'Titan Madeni',        emoji:'₿',  value:0.0002,      isPremium:false },
  { id:'s2_43', level:43, type:'hashboost',label:'Titan Çip',           emoji:'⚡', value:750,         isPremium:true  },
  { id:'s2_44', level:44, type:'energy',   label:'Titan Batarya',       emoji:'🔋', value:50,          isPremium:false },
  { id:'s2_45', level:45, type:'tp',       label:'Sezon Grand Ödül',    emoji:'🌟', value:15000,       isPremium:true  },
  { id:'s2_46', level:46, type:'btc',      label:'Efsane Hazine',       emoji:'💰', value:0.0003,      isPremium:false },
  { id:'s2_47', level:47, type:'hashboost',label:'Efsane Çip',          emoji:'🚀', value:1000,        isPremium:true  },
  { id:'s2_48', level:48, type:'tp',       label:'Efsane TP',           emoji:'💫', value:20000,       isPremium:false },
  { id:'s2_49', level:49, type:'btc',      label:'Son Hazine',          emoji:'₿',  value:0.0005,      isPremium:true  },
  { id:'s2_50', level:50, type:'vip_day',  label:'🏆 SEZON ŞAMPIYONU',  emoji:'🏆', value:60,          isPremium:true  },
];

export const GUILD_GOALS: GuildGoal[] = [
  { id: 'g_1', label: 'Başlangıç Gücü', description: 'Lonca toplam hashrate 1.0 TH/s ulaşmalı.', requirement: 1000, type: 'hashrate', reward: { type: 'tp', value: 5000 } },
  { id: 'g_2', label: 'Madenci Topluluğu', description: 'Lonca 5 üyeye ulaşmalı.', requirement: 5, type: 'members', reward: { type: 'btc', value: 0.00000500 } },
  { id: 'g_3', label: 'Elit Kadro', description: 'Lonca seviyesi 5 olmalı.', requirement: 5, type: 'level', reward: { type: 'btc', value: 0.00001000 } },
  { id: 'g_4', label: 'Endüstriyel Güç', description: 'Lonca toplam hashrate 10.0 TH/s ulaşmalı.', requirement: 10000, type: 'hashrate', reward: { type: 'btc', value: 0.00005000 } },
];
