CREATE TABLE "AIAction" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "sourceText" TEXT,
    "input" JSONB NOT NULL,
    "resolvedInput" JSONB,
    "preview" JSONB,
    "result" JSONB,
    "error" TEXT,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "AIAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIAction_companyId_createdAt_idx" ON "AIAction"("companyId", "createdAt");
CREATE INDEX "AIAction_userId_createdAt_idx" ON "AIAction"("userId", "createdAt");
CREATE INDEX "AIAction_status_createdAt_idx" ON "AIAction"("status", "createdAt");
CREATE INDEX "AIAction_actionType_createdAt_idx" ON "AIAction"("actionType", "createdAt");

ALTER TABLE "AIAction" ADD CONSTRAINT "AIAction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAction" ADD CONSTRAINT "AIAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
