import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { AppError } from '../lib/appError';
import prisma from '../lib/prisma';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authorization token required'));
  }

  const token = authHeader.slice(7);
  try {
    const { userId } = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        totalPoints: true,
        currentStreak: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    if (!user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'User not found'));
    }
    req.user = user;
    next();
  } catch {
    next(new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
}
