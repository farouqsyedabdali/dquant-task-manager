/*
  Warnings:

  - You are about to drop the column `assignedToId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Task` table. All the data in the column will be lost.
  - Added the required column `assigneeId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assignerId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_createdById_fkey";

-- Add new columns first (nullable)
ALTER TABLE "Task" ADD COLUMN "assigneeId" INTEGER;
ALTER TABLE "Task" ADD COLUMN "assignerId" INTEGER;
ALTER TABLE "Task" ADD COLUMN "parentTaskId" INTEGER;

-- Migrate existing data
UPDATE "Task" SET 
  "assignerId" = "createdById",
  "assigneeId" = COALESCE("assignedToId", "createdById")
WHERE "assignerId" IS NULL;

-- Make columns NOT NULL
ALTER TABLE "Task" ALTER COLUMN "assigneeId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "assignerId" SET NOT NULL;

-- Drop old columns
ALTER TABLE "Task" DROP COLUMN "assignedToId";
ALTER TABLE "Task" DROP COLUMN "createdById";

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignerId_fkey" FOREIGN KEY ("assignerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
