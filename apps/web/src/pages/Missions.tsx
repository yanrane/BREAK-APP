import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTodayMissions } from '../features/missions/useMissions';
import MissionCard from '../features/missions/MissionCard';
import ProofUploadModal from '../features/missions/ProofUploadModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') ?? '';

export default function Missions() {
  const { missions, loading, error, completeMission, refetch } = useTodayMissions();
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedUserMission = missions.find((m) => m.id === selectedMissionId);

  const handleComplete = (userMissionId: string) => {
    setSelectedMissionId(userMissionId);
    setSubmitError(null);
  };

  const handleModalClose = () => {
    setSelectedMissionId(null);
    setSubmitError(null);
  };

  const handleProofSubmit = async (file: File) => {
    if (!selectedMissionId) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await completeMission(selectedMissionId, file);
      setSelectedMissionId(null);
    } catch {
      setSubmitError('Gagal mengirim bukti. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Misi Hari Ini</h1>
        <Link
          to="/missions/history"
          className="text-sm text-brand-600 hover:underline"
        >
          Riwayat
        </Link>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-8 space-y-3">
          <p className="text-gray-500">{error}</p>
          <button
            onClick={refetch}
            className="text-sm text-brand-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && missions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">
            Misi hari ini belum tersedia. Cek lagi besok pagi!
          </p>
        </div>
      )}

      {!loading && !error && missions.length > 0 && (
        <div className="space-y-4">
          {missions.map((um) => (
            <MissionCard
              key={um.id}
              userMission={um}
              apiBaseUrl={API_BASE}
              onComplete={handleComplete}
            />
          ))}
          <p className="text-center text-xs text-gray-400 mt-6">
            Misi direset setiap pukul 00:00 WIB
          </p>
        </div>
      )}

      {submitError && (
        <p className="text-red-500 text-sm text-center mt-4">{submitError}</p>
      )}

      <ProofUploadModal
        isOpen={!!selectedMissionId}
        missionTitle={selectedUserMission?.mission.title ?? ''}
        isSubmitting={isSubmitting}
        onClose={handleModalClose}
        onSubmit={handleProofSubmit}
      />
    </div>
  );
}
