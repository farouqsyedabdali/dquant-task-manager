-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invitationExpires" TIMESTAMP(3),
ADD COLUMN     "invitationSentAt" TIMESTAMP(3),
ADD COLUMN     "invitationToken" TEXT;
