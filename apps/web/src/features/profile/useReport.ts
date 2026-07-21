import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

export type PetStage = 'EGG' | 'BABY' | 'TEEN' | 'ADULT';
export type PetRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: 'UTILITY' | 'EMOTE' | 'OUTFIT' | 'COSMETIC';
  minStage: PetStage;
  consumable: boolean;
}

export interface ReportData {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    gender: 'MALE' | 'FEMALE' | null;
    joinedAt: string;
    totalPoints: number;
    exp: number;
    coins: number;
    currentStreak: number;
    longestStreak: number;
    lastBrokenStreak: number;
    onboardedAt: string | null;
  };
  globalRank: number;
  missionsCompleted: number;
  pet: {
    id: string;
    name: string;
    stage: PetStage;
    rarity: PetRarity;
    exp: number;
    lastRewardLevel: number;
    hatchedAt: string | null;
    unlockedFeatures: string[];
    nextStageExp: number | null;
  } | null;
  ownedItems: ShopItem[];
  activeEvent: { id: string; title: string; expMultiplier: number; endsAt: string } | null;
}

export function useReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: true; data: ReportData }>('/me/report');
      setData(res.data.data);
      setError(null);
    } catch {
      setError('Gagal memuat data profil');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
}

/** Emoji pet berdasarkan stage & gender user. */
export function petEmoji(stage: PetStage, gender: 'MALE' | 'FEMALE' | null): string {
  const male = { EGG: '🥚', BABY: '🐣', TEEN: '🐥', ADULT: '🦅' };
  const female = { EGG: '🥚', BABY: '🐤', TEEN: '🐦', ADULT: '🕊️' };
  return (gender === 'FEMALE' ? female : male)[stage];
}

export const RARITY_STYLES: Record<PetRarity, string> = {
  COMMON: 'bg-gray-100 text-gray-700',
  RARE: 'bg-blue-100 text-blue-700',
  EPIC: 'bg-purple-100 text-purple-700',
  LEGENDARY: 'bg-amber-100 text-amber-700',
};

export const STAGE_LABELS: Record<PetStage, string> = {
  EGG: 'Telur',
  BABY: 'Baby',
  TEEN: 'Remaja',
  ADULT: 'Dewasa',
};
