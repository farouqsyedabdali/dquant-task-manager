-- CreateTable
CREATE TABLE "TaskReminder" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskReminder_taskId_idx" ON "TaskReminder"("taskId");

-- CreateIndex
CREATE INDEX "TaskReminder_sentAt_idx" ON "TaskReminder"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaskReminder_taskId_userId_key" ON "TaskReminder"("taskId", "userId");

-- AddForeignKey
ALTER TABLE "TaskReminder" ADD CONSTRAINT "TaskReminder_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

