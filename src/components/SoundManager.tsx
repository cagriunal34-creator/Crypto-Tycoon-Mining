/**
 * SoundManager — Merkezi Ses Efekti Yöneticisi
 *
 * App.tsx içine tek kez eklenir.
 * State değişimlerini izleyerek ilgili sesleri çalar:
 *   - Level up → sfxLevelUp
 *   - BTC kazanımı (büyük artış) → sfxBtcEarned
 *   - Enerji doldu → sfxEnergyFull
 *   - Streak claim → sfxReward
 *   - VIP aktif → sfxPurchase + sfxTournament
 *   - Kontrat bitti → sfxContractDone
 */
import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import {
  sfxLevelUp, sfxBtcEarned, sfxEnergyFull,
  sfxReward, sfxPurchase, sfxContractDone,
  sfxTournament, isSoundEnabled
} from '../hooks/useSoundEffects';

function safe(fn: () => void) {
  if (!isSoundEnabled()) return;
  try { fn(); } catch { /* AudioContext hatası */ }
}

export default function SoundManager() {
  const { state } = useGame();

  const prevLevel      = useRef(state.level);
  const prevBtc        = useRef(state.btcBalance);
  const prevEnergy     = useRef(state.energyCells);
  const prevStreakClaim = useRef(state.streak?.lastClaim ?? 0);
  const prevVip        = useRef(state.vip?.isActive ?? false);
  const prevContracts  = useRef(state.activeContracts?.length ?? 0);
  const initialized    = useRef(false);

  useEffect(() => {
    // İlk render'da referans değerlerini ayarla, ses çalma
    if (!initialized.current) {
      initialized.current = true;
      prevLevel.current       = state.level;
      prevBtc.current         = state.btcBalance;
      prevEnergy.current      = state.energyCells;
      prevStreakClaim.current  = state.streak?.lastClaim ?? 0;
      prevVip.current         = state.vip?.isActive ?? false;
      prevContracts.current   = state.activeContracts?.length ?? 0;
      return;
    }

    // ── Level up ─────────────────────────────────────────────────
    if (state.level > prevLevel.current) {
      safe(sfxLevelUp);
      prevLevel.current = state.level;
    }

    // ── BTC büyük artış (10× BTC/saniye üzerinde) ────────────────
    const btcDiff = state.btcBalance - prevBtc.current;
    if (btcDiff > 0.000001 && btcDiff > prevBtc.current * 0.0001) {
      safe(sfxBtcEarned);
    }
    prevBtc.current = state.btcBalance;

    // ── Enerji maksimuma ulaştı ───────────────────────────────────
    if (
      state.energyCells >= state.maxEnergyCells &&
      prevEnergy.current < state.maxEnergyCells
    ) {
      safe(sfxEnergyFull);
    }
    prevEnergy.current = state.energyCells;

    // ── Günlük ödül alındı (lastClaim değişti) ───────────────────
    const newClaim = state.streak?.lastClaim ?? 0;
    if (newClaim > prevStreakClaim.current) {
      safe(sfxReward);
      prevStreakClaim.current = newClaim;
    }

    // ── VIP aktif oldu ────────────────────────────────────────────
    if (state.vip?.isActive && !prevVip.current) {
      safe(sfxPurchase);
      setTimeout(() => safe(sfxTournament), 400);
      prevVip.current = true;
    } else if (!state.vip?.isActive) {
      prevVip.current = false;
    }

    // ── Aktif kontrat sayısı azaldı (kontrat bitti) ──────────────
    const contractCount = state.activeContracts?.length ?? 0;
    if (contractCount < prevContracts.current) {
      safe(sfxContractDone);
    }
    prevContracts.current = contractCount;

  }, [
    state.level,
    state.btcBalance,
    state.energyCells,
    state.maxEnergyCells,
    state.streak?.lastClaim,
    state.vip?.isActive,
    state.activeContracts?.length,
  ]);

  return null; // Görsel çıktı yok
}
