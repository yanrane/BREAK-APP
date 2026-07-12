import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import type { LeaderboardEntry } from '../leaderboard/useLeaderboard';

interface DashboardUser {
  id: string;
  username: string;
  totalPoints: number;
  currentStreak: number;
  avatarUrl: string | null;
}

interface TodayMission {
  id: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
}

export interface DashboardData {
  user: DashboardUser;
  todayMissions: { total: number; completed: number };
  weeklyRank: number | null;
  topLeaderboard: LeaderboardEntry[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [meRes, missionsRes, leaderboardRes] = await Promise.all([
        api.get<{ success: true; data: { user: DashboardUser } }>('/me'),
        api.get<{ success: true; data: TodayMission[] }>('/missions/today'),
        api.get<{ success: true; data: LeaderboardEntry[] }>('/leaderboard?period=weekly&limit=50'),
      ]);

      const user = meRes.data.data.user;
      const missions = missionsRes.data.data;
      const leaderboard = leaderboardRes.data.data;

      const completed = missions.filter(
        (m) => m.status === 'VERIFIED' || m.status === 'COMPLETED',
      ).length;

      const userEntry = leaderboard.find((e) => e.userId === user.id);

      setData({
        user,
        todayMissions: { total: missions.length, completed },
        weeklyRank: userEntry?.rank ?? null,
        topLeaderboard: leaderboard.slice(0, 5),
      });
      setError(null);
    } catch {
      setError('Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
}
