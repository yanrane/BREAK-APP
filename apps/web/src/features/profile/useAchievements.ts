import { useEffect, useState } from 'react';
import api from '../../lib/api';

export interface Achievement {
  code: string;
  emoji: string;
  title: string;
  description: string;
  coins: number;
  unlockedAt: string | null;
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: true; data: Achievement[] }>('/achievements')
      .then((res) => setAchievements(res.data.data))
      .catch(() => setAchievements([]))
      .finally(() => setLoading(false));
  }, []);

  return { achievements, loading };
}
