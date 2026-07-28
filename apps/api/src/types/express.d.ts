import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, 'id' | 'email' | 'username' | 'totalPoints' | 'currentStreak' | 'avatarUrl' | 'createdAt'>;
      proofPath?: string;
      proofHash?: string;
      /** Buffer & MIME asli foto, dipakai recognition setelah respons dikirim. */
      proofBuffer?: Buffer;
      proofMime?: 'image/jpeg' | 'image/png' | 'image/webp';
    }
  }
}
