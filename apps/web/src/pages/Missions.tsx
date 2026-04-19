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

  const completed = missions.filter((m) => m.status === 'VERIFIED' || m.status === 'COMPLETED').length;

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 border-b-2 border-ink pb-5">
        <div>
          <p className="text-label mb-1">Hari ini</p>
          <h1 className="text-4xl font-extrabold leading-none tracking-tight">
            Misi Harian
          </h1>
        </div>
        <div className="text-right">
          <p className="text-label mb-1">Progress</p>
          <p className="text-3xl font-extrabold leading-none">
            {completed}<span className="text-lg text-muted">/{missions.length}</span>
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 border-2 border-ink/20 bg-cream-2 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="border-2 border-coral p-6 shadow-hard-coral text-center">
          <p className="text-muted font-semibold mb-3">{error}</p>
          <button onClick={refetch} className="text-sm font-extrabold underline decoration-lime decoration-2">
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && missions.length === 0 && (
        <div className="border-2 border-ink p-10 shadow-hard text-center">
          <p className="text-4xl mb-4">📋</p>
          <p className="font-extrabold text-lg mb-1">Belum ada misi</p>
          <p className="text-sm text-muted font-medium">Misi dikirim setiap pukul 00:00 WIB.</p>
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
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted font-semibold">Reset setiap 00:00 WIB</p>
            <Link to="/missions/history" className="text-xs font-extrabold underline decoration-lime decoration-2">
              Riwayat →
            </Link>
          </div>
        </div>
      )}

      {submitError && (
        <div className="border-2 border-coral px-4 py-2 mt-4">
          <p className="text-coral text-sm font-semibold">{submitError}</p>
        </div>
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
