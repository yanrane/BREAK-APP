import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { AppError } from '../lib/appError';
import type { RegisterInput, LoginInput, RefreshInput } from '@break/shared';

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
