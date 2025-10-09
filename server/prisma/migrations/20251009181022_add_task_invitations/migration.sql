-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TASK_INVITATION_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_INVITATION_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_INVITATION_DECLINED';

-- CreateTable
CREATE TABLE "TaskInvitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "taskId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientUserId" INTEGER,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "TaskInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskInvitation_token_key" ON "TaskInvitation"("token");

-- CreateIndex
CREATE INDEX "TaskInvitation_token_idx" ON "TaskInvitation"("token");

-- CreateIndex
CREATE INDEX "TaskInvitation_recipientEmail_idx" ON "TaskInvitation"("recipientEmail");

-- AddForeignKey
ALTER TABLE "TaskInvitation" ADD CONSTRAINT "TaskInvitation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInvitation" ADD CONSTRAINT "TaskInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInvitation" ADD CONSTRAINT "TaskInvitation_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
