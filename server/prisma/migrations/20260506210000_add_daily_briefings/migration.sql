-- CreateEnum
CREATE TYPE "BriefingKind" AS ENUM ('MORNING', 'EVENING');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MORNING_BRIEFING';
ALTER TYPE "NotificationType" ADD VALUE 'EVENING_BRIEFING';

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "taskId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "briefingMorningEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "briefingEveningEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "briefingMorningTime" TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE "User" ADD COLUMN "briefingEveningTime" TEXT NOT NULL DEFAULT '18:00';
ALTER TABLE "User" ADD COLUMN "briefingTimezone" TEXT;

-- CreateTable
CREATE TABLE "BriefingLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "kind" "BriefingKind" NOT NULL,
    "localDate" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BriefingLog_userId_kind_localDate_key" ON "BriefingLog"("userId", "kind", "localDate");

-- CreateIndex
CREATE INDEX "BriefingLog_companyId_idx" ON "BriefingLog"("companyId");

-- AddForeignKey
ALTER TABLE "BriefingLog" ADD CONSTRAINT "BriefingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefingLog" ADD CONSTRAINT "BriefingLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
