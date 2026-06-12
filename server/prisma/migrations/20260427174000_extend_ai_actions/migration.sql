ALTER TABLE "AIAction" ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'CHAT';
ALTER TABLE "AIAction" ADD COLUMN "sourceMetadata" JSONB;
ALTER TABLE "AIAction" ADD COLUMN "beforeState" JSONB;
ALTER TABLE "AIAction" ADD COLUMN "undoData" JSONB;
ALTER TABLE "AIAction" ADD COLUMN "undoneAt" TIMESTAMP(3);

CREATE INDEX "AIAction_sourceType_createdAt_idx" ON "AIAction"("sourceType", "createdAt");
