// Shared types — Zod schemas dan inferred types ditambahkan di Prompt 2+

export type MissionCategory = 'PHYSICAL' | 'MENTAL' | 'SOCIAL' | 'CREATIVE';
export type MissionStatus = 'ASSIGNED' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
export type GameType = 'REACTION' | 'FAST_CLICK' | 'PATTERN_MATCH';

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
