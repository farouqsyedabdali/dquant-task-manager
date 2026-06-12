-- CreateEnum
CREATE TYPE "TaskRecurrence" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "recurrence" "TaskRecurrence" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Task" ADD COLUMN "recurrenceSeriesId" INTEGER;
ALTER TABLE "Task" ADD COLUMN "recurrenceAnchorDate" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "recurrenceEndsAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Task_recurrenceSeriesId_idx" ON "Task"("recurrenceSeriesId");
