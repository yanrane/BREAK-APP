-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('PHOTO', 'TIMER', 'PHOTO_AND_TIMER');

-- AlterEnum
ALTER TYPE "MissionStatus" ADD VALUE 'IN_PROGRESS' BEFORE 'COMPLETED';

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "proofType" "ProofType" NOT NULL DEFAULT 'PHOTO';

-- AlterTable
ALTER TABLE "UserMission" ADD COLUMN     "proofHash" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "UserMission_proofHash_key" ON "UserMission"("proofHash");
