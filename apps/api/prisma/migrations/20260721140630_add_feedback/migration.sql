-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('BUG_REPORT', 'SUGGESTION', 'COMPLAINT', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED');

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
