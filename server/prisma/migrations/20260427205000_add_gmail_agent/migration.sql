-- CreateEnum
CREATE TYPE "ConnectedProvider" AS ENUM ('GOOGLE_GMAIL');

-- CreateEnum
CREATE TYPE "ConnectedAccountStatus" AS ENUM ('ACTIVE', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "EmailIngestionStatus" AS ENUM ('RECEIVED', 'SKIPPED', 'TASK_CREATED', 'NEEDS_REVIEW', 'ERROR');

-- CreateTable
CREATE TABLE "ConnectedAccount" (
    "id" SERIAL NOT NULL,
    "provider" "ConnectedProvider" NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ConnectedAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "lastHistoryId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailIngestion" (
    "id" SERIAL NOT NULL,
    "provider" "ConnectedProvider" NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "threadId" TEXT,
    "senderEmail" TEXT,
    "senderName" TEXT,
    "subject" TEXT,
    "snippet" TEXT,
    "receivedAt" TIMESTAMP(3),
    "classification" TEXT,
    "confidence" DOUBLE PRECISION,
    "reason" TEXT,
    "status" "EmailIngestionStatus" NOT NULL DEFAULT 'RECEIVED',
    "extractedActions" JSONB,
    "createdTaskIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "error" TEXT,
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "connectedAccountId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "EmailIngestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedAccount_provider_userId_email_key" ON "ConnectedAccount"("provider", "userId", "email");

-- CreateIndex
CREATE INDEX "ConnectedAccount_provider_status_syncEnabled_idx" ON "ConnectedAccount"("provider", "status", "syncEnabled");

-- CreateIndex
CREATE INDEX "ConnectedAccount_userId_provider_idx" ON "ConnectedAccount"("userId", "provider");

-- CreateIndex
CREATE INDEX "ConnectedAccount_companyId_idx" ON "ConnectedAccount"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailIngestion_provider_providerMessageId_userId_key" ON "EmailIngestion"("provider", "providerMessageId", "userId");

-- CreateIndex
CREATE INDEX "EmailIngestion_userId_createdAt_idx" ON "EmailIngestion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailIngestion_companyId_createdAt_idx" ON "EmailIngestion"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailIngestion_status_createdAt_idx" ON "EmailIngestion"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailIngestion_connectedAccountId_createdAt_idx" ON "EmailIngestion"("connectedAccountId", "createdAt");

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailIngestion" ADD CONSTRAINT "EmailIngestion_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailIngestion" ADD CONSTRAINT "EmailIngestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailIngestion" ADD CONSTRAINT "EmailIngestion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
