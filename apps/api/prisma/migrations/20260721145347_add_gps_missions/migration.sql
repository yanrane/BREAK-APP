-- AlterEnum
ALTER TYPE "ProofType" ADD VALUE 'GPS';

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "distanceMeters" INTEGER;

-- AlterTable
ALTER TABLE "UserMission" ADD COLUMN     "gpsDistanceM" INTEGER;
