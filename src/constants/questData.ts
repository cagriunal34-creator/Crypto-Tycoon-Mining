import { PlayCircle } from 'lucide-react';

export interface QuestDef {
  id: string;
  title: string;
  description: string;
  reward: { tp?: number; speedBoost?: number; hashRate?: number; unit: string };
  target: number;
  getProgress: (state: any) => number;
  icon: any;
  category?: string;
}

export const BASE_QUESTS: QuestDef[] = [
  {
    id: 'q_ads',
    title: 'Reklam İzle',
    description: 'Bugün 3 reklam izleyerek enerji topla.',
    reward: { tp: 50, unit: 'TP' },
    target: 3,
    getProgress: s => s.questProgress?.adsWatched || 0,
    icon: PlayCircle,
  },
  // ... other base quests from QuestsScreen.tsx can be moved here
];

export const generateHashrateQuests = (): QuestDef[] => {
  const quests: QuestDef[] = [];
  for (let i = 1; i <= 1000; i++) {
    quests.push({
      id: `h_quest_${i}`,
      title: `Hash Gücü Seviye ${i}`,
      description: `Toplamda ${i} reklam izleyerek madencilik gücünü artır.`,
      reward: { hashRate: 1, unit: 'GH/s' },
      target: i,
      getProgress: s => s.questProgress?.adsWatched || 0,
      icon: PlayCircle,
      category: 'hashrate'
    });
  }
  return quests;
};

export const ALL_QUESTS = [...BASE_QUESTS, ...generateHashrateQuests()];
