-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "isPersonal" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "passwordHash" DROP NOT NULL;
