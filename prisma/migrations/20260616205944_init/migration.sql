-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COUNSELLOR', 'TRAINER');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PhysicalActivityLevel" AS ENUM ('MILD', 'MODERATE', 'HEAVY');

-- CreateEnum
CREATE TYPE "StressLevel" AS ENUM ('MILD', 'MODERATE', 'HEAVY');

-- CreateEnum
CREATE TYPE "SleepQuality" AS ENUM ('SOUND', 'DISTURBED', 'FAIR', 'BAD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TRAINER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "membershipNo" TEXT NOT NULL,
    "receiptNo" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "age" INTEGER,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "maritalStatus" "MaritalStatus",
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "package" "PackageType" NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "counsellorId" TEXT,
    "trainerId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitnessGoal" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,

    CONSTRAINT "FitnessGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PARQ" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "q1_heartTrouble" BOOLEAN NOT NULL,
    "q2_chestPain" BOOLEAN NOT NULL,
    "q3_dizzinessFainting" BOOLEAN NOT NULL,
    "q4_highBloodPressure" BOOLEAN NOT NULL,
    "q5_boneJointProblems" BOOLEAN NOT NULL,
    "q6_otherReasons" BOOLEAN NOT NULL,
    "q7_over45Unaccustomed" BOOLEAN NOT NULL,
    "requiresMedicalClearance" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PARQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifestyleProfile" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "occupation" TEXT,
    "physicalActivityLevel" "PhysicalActivityLevel",
    "workStress" "StressLevel",
    "personalStress" "StressLevel",
    "travelFrequency" TEXT,
    "avgSleepHours" DOUBLE PRECISION,
    "sleepQuality" "SleepQuality",
    "sleepTiming" TEXT,
    "afternoonNap" BOOLEAN,
    "napDuration" TEXT,
    "smoking" BOOLEAN,
    "smokingFrequency" TEXT,
    "alcohol" BOOLEAN,
    "alcoholFrequency" TEXT,
    "tobacco" BOOLEAN,
    "tobaccoFrequency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifestyleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCondition" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "conditionName" TEXT NOT NULL,
    "details" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenstrualHistory" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "lastCycleDate" TIMESTAMP(3),
    "ageAtMenstruationOnset" INTEGER,
    "averageCycleLength" INTEGER,
    "irregularCycles" BOOLEAN,
    "spotting" BOOLEAN,
    "missedCycles" BOOLEAN,
    "painfulMenstruation" BOOLEAN,

    CONSTRAINT "MenstrualHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosturalAnalysis" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "neckFlexion" TEXT,
    "neckLateralFlexion" TEXT,
    "pokeChin" TEXT,
    "neckLateralRotation" TEXT,
    "spineKyphosis" TEXT,
    "spineLordosis" TEXT,
    "spineScoliosis" TEXT,
    "spineKyphoscoliosis" TEXT,
    "scapulaLeft" TEXT,
    "scapulaRight" TEXT,
    "lphcAsymmetrical" BOOLEAN,
    "kneeLeft" TEXT,
    "kneeRight" TEXT,
    "footLeft" TEXT,
    "footRight" TEXT,
    "symmetryDeviation" TEXT,
    "trainerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosturalAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitnessTest" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardioMachine" TEXT,
    "distance" DOUBLE PRECISION,
    "durationMinutes" INTEGER,
    "treadmillNotes" TEXT,
    "wallPushUpsReps" INTEGER,
    "wallPushUpsDurationSec" INTEGER,
    "squatsReps" INTEGER,
    "squatsDurationSec" INTEGER,
    "crunchesReps" INTEGER,
    "crunchesDurationSec" INTEGER,
    "sitAndReachCm" DOUBLE PRECISION,
    "ironManHoldSec" INTEGER,
    "pelvicBridgeSec" INTEGER,
    "rProprioception" TEXT,
    "rSingleLegStanding" TEXT,
    "rStandingBalance" TEXT,
    "lProprioception" TEXT,
    "lSingleLegStanding" TEXT,
    "lStandingBalance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitnessTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "bodyFatPercent" DOUBLE PRECISION,
    "visceralFat" DOUBLE PRECISION,
    "bmr" DOUBLE PRECISION,
    "biologicalAge" INTEGER,
    "shoulderWidth" DOUBLE PRECISION,
    "hipWidth" DOUBLE PRECISION,
    "neckCirc" DOUBLE PRECISION,
    "shoulderCirc" DOUBLE PRECISION,
    "chestNormal" DOUBLE PRECISION,
    "chestExpansion" DOUBLE PRECISION,
    "armCirc" DOUBLE PRECISION,
    "forearmCirc" DOUBLE PRECISION,
    "abdomenCirc" DOUBLE PRECISION,
    "waistCirc" DOUBLE PRECISION,
    "hipCirc" DOUBLE PRECISION,
    "midThighCirc" DOUBLE PRECISION,
    "calfCirc" DOUBLE PRECISION,
    "waistHipRatio" DOUBLE PRECISION,
    "ratioIndicator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounsellingNote" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "noteType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounsellingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "category" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "emergencyContactName" TEXT,
    "emergencyMobile" TEXT,
    "relationship" TEXT,
    "consentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "digitalSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_membershipNo_key" ON "Member"("membershipNo");

-- CreateIndex
CREATE UNIQUE INDEX "FitnessGoal_memberId_goal_key" ON "FitnessGoal"("memberId", "goal");

-- CreateIndex
CREATE UNIQUE INDEX "PARQ_memberId_key" ON "PARQ"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "LifestyleProfile_memberId_key" ON "LifestyleProfile"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MenstrualHistory_memberId_key" ON "MenstrualHistory"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "PosturalAnalysis_memberId_key" ON "PosturalAnalysis"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_memberId_key" ON "Consent"("memberId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_counsellorId_fkey" FOREIGN KEY ("counsellorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitnessGoal" ADD CONSTRAINT "FitnessGoal_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PARQ" ADD CONSTRAINT "PARQ_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifestyleProfile" ADD CONSTRAINT "LifestyleProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCondition" ADD CONSTRAINT "MedicalCondition_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenstrualHistory" ADD CONSTRAINT "MenstrualHistory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosturalAnalysis" ADD CONSTRAINT "PosturalAnalysis_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitnessTest" ADD CONSTRAINT "FitnessTest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingNote" ADD CONSTRAINT "CounsellingNote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounsellingNote" ADD CONSTRAINT "CounsellingNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
