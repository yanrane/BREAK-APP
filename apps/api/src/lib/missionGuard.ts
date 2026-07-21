import { AppError } from './appError';

export type ProofTypeValue = 'PHOTO' | 'TIMER' | 'PHOTO_AND_TIMER' | 'GPS';
export type MissionStatusValue =
  | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';

export function needsPhoto(proofType: ProofTypeValue): boolean {
  return proofType === 'PHOTO' || proofType === 'PHOTO_AND_TIMER';
}

export function needsTimer(proofType: ProofTypeValue): boolean {
  return proofType === 'TIMER' || proofType === 'PHOTO_AND_TIMER';
}

/** Jendela jam mulai misi (jam lokal user): buka 04:00, tutup 19:00. */
export const MISSION_START_OPEN_HOUR = 4;
export const MISSION_START_CLOSE_HOUR = 19;

/** Jam lokal (0–23) pada timezone IANA; fallback WIB kalau timezone tidak valid. */
export function localHour(now: Date, timeZone?: string): number {
  const hourIn = (tz: string) =>
    parseInt(
      new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(now),
      10,
    );
  try {
    return hourIn(timeZone || 'Asia/Jakarta');
  } catch {
    return hourIn('Asia/Jakarta');
  }
}

/**
 * Misi baru hanya boleh dimulai pukul 04:00–19:00 waktu lokal user.
 * Hanya untuk start baru — resume sesi IN_PROGRESS tidak melewati guard ini.
 */
export function assertStartWindowOpen(now: Date, timeZone?: string): void {
  const hour = localHour(now, timeZone);
  if (hour < MISSION_START_OPEN_HOUR) {
    throw new AppError(
      403,
      'MISSION_START_NOT_OPEN',
      'Misi belum dibuka. Kamu bisa mulai misi pukul 04:00–19:00.',
    );
  }
  if (hour >= MISSION_START_CLOSE_HOUR) {
    throw new AppError(
      403,
      'MISSION_START_CLOSED',
      'Pendaftaran misi hari ini sudah ditutup. Kamu bisa mulai lagi besok pukul 04:00.',
    );
  }
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
