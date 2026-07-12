import { AppError } from './appError';

export type ProofTypeValue = 'PHOTO' | 'TIMER' | 'PHOTO_AND_TIMER';
export type MissionStatusValue =
  | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';

export function needsPhoto(proofType: ProofTypeValue): boolean {
  return proofType !== 'TIMER';
}

export function needsTimer(proofType: ProofTypeValue): boolean {
  return proofType !== 'PHOTO';
}

/** Sisa detik sebelum misi boleh diselesaikan; 0 kalau sudah lewat. */
export function remainingSeconds(startedAt: Date, durationMinutes: number, now: Date): number {
  const elapsedMs = now.getTime() - startedAt.getTime();
  return Math.max(0, Math.ceil((durationMinutes * 60 * 1000 - elapsedMs) / 1000));
}

interface CompletableArgs {
  status: MissionStatusValue;
  proofType: ProofTypeValue;
  durationMinutes: number | null;
  startedAt: Date | null;
  hasProof: boolean;
  now: Date;
}

/**
 * Validasi anti-curang sebelum complete. Semua waktu dari jam server —
 * client tidak pernah dipercaya. Throw AppError kalau ada syarat yang gagal.
 */
export function assertCompletable(args: CompletableArgs): void {
  const { status, proofType, durationMinutes, startedAt, hasProof, now } = args;

  if (status === 'ASSIGNED') {
    throw new AppError(400, 'MISSION_NOT_STARTED', 'Tekan Start Mission dulu sebelum menyelesaikan misi');
  }
  if (status !== 'IN_PROGRESS') {
    throw new AppError(409, 'MISSION_ALREADY_COMPLETED', 'Misi sudah diselesaikan');
  }
  if (!startedAt) {
    // ponytail: IN_PROGRESS tanpa startedAt seharusnya mustahil; guard untuk data korup
    throw new AppError(400, 'MISSION_NOT_STARTED', 'Sesi misi tidak valid, mulai ulang misinya');
  }
  if (needsTimer(proofType) && durationMinutes) {
    const remaining = remainingSeconds(startedAt, durationMinutes, now);
    if (remaining > 0) {
      throw new AppError(400, 'TIMER_NOT_ELAPSED', `Timer belum selesai, sisa ${remaining} detik`);
    }
  }
  if (needsPhoto(proofType) && !hasProof) {
    throw new AppError(400, 'PROOF_REQUIRED', 'File bukti wajib diunggah');
  }
}
