-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('PERSONAL', 'PROFESSIONAL');

-- AlterTable
ALTER TABLE "ProjectTemplate" ADD COLUMN     "category" "TemplateCategory" NOT NULL DEFAULT 'PROFESSIONAL',
ADD COLUMN     "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "ProjectTemplate_category_isSystemTemplate_idx" ON "ProjectTemplate"("category", "isSystemTemplate");

-- CreateIndex
CREATE INDEX "ProjectTemplate_tags_idx" ON "ProjectTemplate" USING GIN ("tags");

