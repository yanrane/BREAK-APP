import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

export interface Mission {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: 'PHYSICAL' | 'MENTAL' | 'SOCIAL' | 'CREATIVE';
  points: number;
  requiresProof: boolean;
  proofType: 'PHOTO' | 'TIMER' | 'PHOTO_AND_TIMER' | 'GPS';
  durationMinutes: number | null;
  distanceMeters: number | null;
}

export interface GpsPoint {
  lat: number;
  lng: number;
  t: number;
  acc?: number;
}

export interface UserMission {
  id: string;
  missionId: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
  proofUrl: string | null;
  gpsDistanceM: number | null;
  pointsEarned: number;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  mission: Mission;
}

export interface MissionHistoryResult {
  items: UserMission[];
  total: number;
  page: number;
  limit: number;
}

export function useTodayMissions() {
  const [missions, setMissions] = useState<UserMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: true; data: UserMission[] }>('/missions/today');
      setMissions(res.data.data);
      setError(null);
    } catch {
      setError('Gagal memuat misi hari ini');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const startMission = async (userMissionId: string) => {
    const res = await api.post<{ success: true; data: { userMission: UserMission; serverNow: string } }>(
      `/missions/${userMissionId}/start`,
      // Timezone IANA device untuk validasi jendela jam mulai di server
      { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    );
    const { userMission, serverNow } = res.data.data;
    setMissions((prev) => prev.map((m) => (m.id === userMissionId ? userMission : m)));
    return { userMission, serverNow };
  };

  const cancelMission = async (userMissionId: string) => {
    const res = await api.post<{ success: true; data: UserMission }>(
      `/missions/${userMissionId}/cancel`,
    );
    setMissions((prev) => prev.map((m) => (m.id === userMissionId ? res.data.data : m)));
    return res.data.data;
  };

  const completeMission = async (userMissionId: string, proofFile?: File): Promise<UserMission> => {
    let res;
    if (proofFile) {
      const formData = new FormData();
      formData.append('proof', proofFile);
      res = await api.post<{ success: true; data: UserMission }>(
        `/missions/${userMissionId}/complete`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
    } else {
      res = await api.post<{ success: true; data: UserMission }>(
        `/missions/${userMissionId}/complete`,
      );
    }
    setMissions((prev) =>
      prev.map((m) => (m.id === userMissionId ? res.data.data : m)),
    );
    return res.data.data;
  };

  const completeGpsMission = async (userMissionId: string, points: GpsPoint[]): Promise<UserMission> => {
    const res = await api.post<{ success: true; data: UserMission }>(
      `/missions/${userMissionId}/complete-gps`,
      { points },
    );
    setMissions((prev) => prev.map((m) => (m.id === userMissionId ? res.data.data : m)));
    return res.data.data;
  };

  return {
    missions,
    loading,
    error,
    startMission,
    cancelMission,
    completeMission,
    completeGpsMission,
    refetch: fetchMissions,
  };
}

export function useMissionHistory(page: number, limit = 20) {
  const [result, setResult] = useState<MissionHistoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<{ success: true; data: MissionHistoryResult }>(
        `/missions/history?page=${page}&limit=${limit}`,
      )
      .then((res) => {
        if (!cancelled) {
          setResult(res.data.data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Gagal memuat riwayat misi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, limit]);

  return { result, loading, error };
}
