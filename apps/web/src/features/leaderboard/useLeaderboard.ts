import { useState, useEffect } from 'react';
import api from '../../lib/api';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  points: number;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

export function useLeaderboard(period: LeaderboardPeriod, limit = 50) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<{ success: true; data: LeaderboardEntry[] }>(
        `/leaderboard?period=${period}&limit=${limit}`,
      )
      .then((res) => {
        if (!cancelled) {
          setEntries(res.data.data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Gagal memuat leaderboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, limit]);

  return { entries, loading, error };
}
