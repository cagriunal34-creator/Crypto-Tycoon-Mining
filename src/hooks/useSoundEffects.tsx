import { useState, useEffect } from 'react';

// Seslerin aktif olup olmadığını tutan global state (veya localStorage)
export const isSoundEnabled = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('ct_sound_enabled') !== 'false';
};

export const setSoundEnabled = (enabled: boolean) => {
  localStorage.setItem('ct_sound_enabled', enabled.toString());
};

// Ses efektleri tanımları (örnek olarak Howler.js veya yerleşik Audio Context kullanılabilir)
// Burada yerleşik Audio Context ile basit bir ses sistemi simüle ediyoruz
const playSfx = (url: string) => {
  if (!isSoundEnabled()) return;
  const audio = new Audio(url);
  audio.play().catch(() => { /* Kullanıcı etkileşimi gerekebilir */ });
};

export const sfxLevelUp = () => playSfx('/sounds/level_up.mp3');
export const sfxBtcEarned = () => playSfx('/sounds/btc_earned.mp3');
export const sfxEnergyFull = () => playSfx('/sounds/energy_full.mp3');
export const sfxReward = () => playSfx('/sounds/reward.mp3');
export const sfxPurchase = () => playSfx('/sounds/purchase.mp3');
export const sfxContractDone = () => playSfx('/sounds/contract_done.mp3');
export const sfxTournament = () => playSfx('/sounds/tournament.mp3');
export const sfxClick = () => playSfx('/sounds/click.mp3');
export const sfxMine = () => playSfx('/sounds/mine.mp3');

export function useSoundEffects() {
  const play = (type: 'levelUp' | 'btcEarned' | 'energyFull' | 'reward' | 'purchase' | 'contractDone' | 'tournament' | 'click' | 'mine') => {
    switch (type) {
      case 'levelUp': sfxLevelUp(); break;
      case 'btcEarned': sfxBtcEarned(); break;
      case 'energyFull': sfxEnergyFull(); break;
      case 'reward': sfxReward(); break;
      case 'purchase': sfxPurchase(); break;
      case 'contractDone': sfxContractDone(); break;
      case 'tournament': sfxTournament(); break;
      case 'click': sfxClick(); break;
      case 'mine': sfxMine(); break;
    }
  };

  return { play };
}
