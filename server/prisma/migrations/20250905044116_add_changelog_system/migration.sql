-- CreateEnum
CREATE TYPE "ChangelogAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PRIORITY_CHANGE', 'ASSIGNMENT_CHANGE', 'COMMENT_ADD', 'COMMENT_UPDATE', 'COMMENT_DELETE', 'USER_ADD', 'USER_UPDATE', 'USER_DELETE', 'LOGIN', 'LOGOUT');

-- CreateEnum
CREATE TYPE "ChangelogEntityType" AS ENUM ('TASK', 'COMMENT', 'USER', 'COMPANY', 'SYSTEM');

-- CreateTable
CREATE TABLE "Changelog" (
    "id" SERIAL NOT NULL,
    "action" "ChangelogAction" NOT NULL,
    "entityType" "ChangelogEntityType" NOT NULL,
    "entityId" INTEGER,
    "entityName" TEXT,
    "description" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Changelog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Changelog_companyId_createdAt_idx" ON "Changelog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Changelog_entityType_entityId_idx" ON "Changelog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Changelog" ADD CONSTRAINT "Changelog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Changelog" ADD CONSTRAINT "Changelog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
