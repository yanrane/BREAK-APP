import { createHash, randomBytes } from 'crypto';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { AppError } from '../lib/appError';
import { sendResetEmail } from '../lib/mailer';
import type { RegisterInput, LoginInput, RefreshInput } from '../lib/schemas';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  currentStreak: number;
  createdAt: Date;
}

export async function register(input: RegisterInput): Promise<{ tokens: AuthTokens; user: UserPublic }> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });
  if (existing) {
    const field = existing.email === input.email ? 'email' : 'username';
    throw new AppError(409, 'USER_EXISTS', `${field === 'email' ? 'Email' : 'Username'} sudah digunakan`);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, username: input.username, passwordHash },
    select: { id: true, email: true, username: true, avatarUrl: true, totalPoints: true, currentStreak: true, createdAt: true },
  });

  const tokens = await createTokenPair(user.id);
  return { tokens, user };
}

export async function login(input: LoginInput): Promise<{ tokens: AuthTokens; user: UserPublic }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
  }

  const tokens = await createTokenPair(user.id);
  const { passwordHash: _, ...userPublic } = user;
  return { tokens, user: userPublic };
}

export async function refresh(input: RefreshInput): Promise<{ accessToken: string }> {
  let userId: string;
  try {
    ({ userId } = verifyRefreshToken(input.refreshToken));
  } catch {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token tidak valid atau sudah expired');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: input.refreshToken } });
  if (!stored || stored.userId !== userId || stored.expiresAt < new Date()) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token tidak valid atau sudah expired');
  }

  const accessToken = signAccessToken(userId);
  return { accessToken };
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 jam

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Buat token reset password dan kirim link via email.
 * Selalu "sukses" ke caller agar tidak membocorkan email mana yang terdaftar.
 * Return token mentah untuk keperluan test — route TIDAK boleh mengeksposnya.
 */
export async function forgotPassword(email: string): Promise<{ token: string | null }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { token: null };

  const token = randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:5173').split(',')[0];
  await sendResetEmail(email, `${frontendUrl}/reset-password?token=${token}`);
  return { token };
}

/**
 * Set password baru dari token reset. Token sekali pakai, expired 1 jam.
 * Semua refresh token user dicabut agar sesi lama tidak bisa dipakai lagi.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError(400, 'INVALID_RESET_TOKEN', 'Link reset tidak valid atau sudah kedaluwarsa');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
  ]);
}

async function createTokenPair(userId: string): Promise<AuthTokens> {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId, token: refreshToken, expiresAt },
  });

  return { accessToken, refreshToken };
}
