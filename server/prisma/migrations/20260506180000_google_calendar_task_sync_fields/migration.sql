-- AlterTable
ALTER TABLE "ConnectedAccount" ADD COLUMN "tialzGoogleCalendarId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "googleCalendarEventId" TEXT;
ALTER TABLE "Task" ADD COLUMN "googleCalendarSyncedUserId" INTEGER;
