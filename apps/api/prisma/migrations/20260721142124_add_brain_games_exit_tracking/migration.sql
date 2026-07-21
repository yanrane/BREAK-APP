-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GameType" ADD VALUE 'SUDOKU';
ALTER TYPE "GameType" ADD VALUE 'MEMORY';
ALTER TYPE "GameType" ADD VALUE 'MATH_SPRINT';
ALTER TYPE "GameType" ADD VALUE 'QUIZ';

-- AlterTable
ALTER TABLE "UserMission" ADD COLUMN     "exitAttempts" INTEGER NOT NULL DEFAULT 0;
