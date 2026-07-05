-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "PetStage" AS ENUM ('EGG', 'BABY', 'TEEN', 'ADULT');

-- CreateEnum
CREATE TYPE "PetRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "exp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "lastBrokenStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastMissionDate" TIMESTAMP(3),
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "onboardedAt" TIMESTAMP(3),
ADD COLUMN     "ownedItems" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Egg',
    "stage" "PetStage" NOT NULL DEFAULT 'EGG',
    "rarity" "PetRarity" NOT NULL DEFAULT 'COMMON',
    "exp" INTEGER NOT NULL DEFAULT 0,
    "hatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "expMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pet_userId_key" ON "Pet"("userId");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
