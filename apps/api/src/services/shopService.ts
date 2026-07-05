import prisma from '../lib/prisma';
import { AppError } from '../lib/appError';
import { findShopItem } from '../lib/shopItems';
import { isStageAtLeast } from '../lib/progression';

/**
 * Beli item shop dengan coins. Streak Recovery langsung dikonsumsi
 * (mengembalikan streak yang terputus); item lain masuk ke ownedItems.
 */
export async function buyItem(userId: string, itemId: string) {
  const item = findShopItem(itemId);
  if (!item) {
    throw new AppError(404, 'ITEM_NOT_FOUND', 'Item tidak ditemukan');
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { pet: true },
  });

  if (!item.consumable && user.ownedItems.includes(item.id)) {
    throw new AppError(409, 'ITEM_ALREADY_OWNED', 'Item sudah dimiliki');
  }
  if (user.coins < item.price) {
    throw new AppError(400, 'INSUFFICIENT_COINS', 'Coins tidak cukup');
  }
  const petStage = user.pet?.stage ?? 'EGG';
  if (!isStageAtLeast(petStage, item.minStage)) {
    throw new AppError(403, 'STAGE_TOO_LOW', `Item ini terbuka saat pet mencapai stage ${item.minStage}`);
  }

  if (item.id === 'streak-recovery') {
    if (user.lastBrokenStreak <= 0) {
      throw new AppError(400, 'NO_BROKEN_STREAK', 'Tidak ada streak yang bisa dipulihkan');
    }
    const recovered = user.lastBrokenStreak + user.currentStreak;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { decrement: item.price },
        currentStreak: recovered,
        longestStreak: Math.max(user.longestStreak, recovered),
        lastBrokenStreak: 0,
      },
    });
    return { item, coins: updated.coins, currentStreak: updated.currentStreak };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      coins: { decrement: item.price },
      ownedItems: { push: item.id },
    },
  });
  return { item, coins: updated.coins, ownedItems: updated.ownedItems };
}
