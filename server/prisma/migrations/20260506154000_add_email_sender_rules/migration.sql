-- CreateTable
CREATE TABLE "EmailSenderRule" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "provider" "ConnectedProvider" NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "alwaysSkip" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSenderRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSenderRule_userId_provider_senderEmail_key" ON "EmailSenderRule"("userId", "provider", "senderEmail");

-- CreateIndex
CREATE INDEX "EmailSenderRule_userId_provider_alwaysSkip_idx" ON "EmailSenderRule"("userId", "provider", "alwaysSkip");

-- CreateIndex
CREATE INDEX "EmailSenderRule_companyId_provider_idx" ON "EmailSenderRule"("companyId", "provider");

-- AddForeignKey
ALTER TABLE "EmailSenderRule" ADD CONSTRAINT "EmailSenderRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSenderRule" ADD CONSTRAINT "EmailSenderRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
