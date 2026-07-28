-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "requiresSummary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserMission" ADD COLUMN     "proofCheckMatch" BOOLEAN,
ADD COLUMN     "proofCheckReason" TEXT,
ADD COLUMN     "proofCheckScore" INTEGER,
ADD COLUMN     "summary" TEXT;
