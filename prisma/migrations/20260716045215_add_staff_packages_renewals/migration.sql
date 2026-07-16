/*
  Warnings:

  - Added the required column `uploaderId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FitnessTest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PosturalAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PosturalAnalysis_memberId_key";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "uploaderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FitnessTest" ADD COLUMN     "assessorId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "LifestyleProfile" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MedicalCondition" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "packageId" TEXT;

-- AlterTable
ALTER TABLE "MenstrualHistory" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PARQ" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PosturalAnalysis" ADD COLUMN     "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "assessorId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "price" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipRenewal" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "previousEndDate" TIMESTAMP(3) NOT NULL,
    "newEndDate" TIMESTAMP(3) NOT NULL,
    "packageAtRenewal" TEXT NOT NULL,
    "renewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewedBy" TEXT NOT NULL,

    CONSTRAINT "MembershipRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembershipRenewal_memberId_idx" ON "MembershipRenewal"("memberId");

-- CreateIndex
CREATE INDEX "FitnessTest_memberId_idx" ON "FitnessTest"("memberId");

-- CreateIndex
CREATE INDEX "FitnessTest_testDate_idx" ON "FitnessTest"("testDate");

-- CreateIndex
CREATE INDEX "PosturalAnalysis_memberId_idx" ON "PosturalAnalysis"("memberId");

-- CreateIndex
CREATE INDEX "PosturalAnalysis_assessedAt_idx" ON "PosturalAnalysis"("assessedAt");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosturalAnalysis" ADD CONSTRAINT "PosturalAnalysis_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitnessTest" ADD CONSTRAINT "FitnessTest_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipRenewal" ADD CONSTRAINT "MembershipRenewal_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipRenewal" ADD CONSTRAINT "MembershipRenewal_renewedBy_fkey" FOREIGN KEY ("renewedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
