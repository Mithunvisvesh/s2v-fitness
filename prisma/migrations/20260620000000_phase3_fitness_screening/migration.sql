-- Phase 3: Fitness Screening Module
-- Converts PARQ, LifestyleProfile, MenstrualHistory from single-record to
-- historical (many-per-member), upgrades MedicalCondition to a typed enum,
-- and adds assessor tracking to all four models.

-- ── 1. New enum ───────────────────────────────────────────────────────────────
CREATE TYPE "MedicalConditionName" AS ENUM (
  'CHRONIC_ILLNESS',
  'RECENT_SURGERY',
  'PREGNANCY',
  'BREASTFEEDING',
  'BREATHING_LUNG',
  'MUSCULOSKELETAL_INJURY',
  'ARTHRITIS',
  'DIABETES',
  'THYROID',
  'OBESITY',
  'HIGH_CHOLESTEROL',
  'FAMILY_HEART_HISTORY',
  'HERNIA',
  'FREQUENT_HEADACHES',
  'FREQUENT_RESPIRATORY',
  'DEPRESSION_BIPOLAR_SAD',
  'CIRCULATORY',
  'DIGESTIVE',
  'OTHER'
);

-- ── 2. PARQ ───────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS "PARQ_memberId_key";

ALTER TABLE "PARQ"
  ADD COLUMN IF NOT EXISTS "assessedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "assessorId"               TEXT,
  ADD COLUMN IF NOT EXISTS "notes"                    TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Rename flag column if the old name still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PARQ' AND column_name = 'requiresMedicalClearance'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PARQ' AND column_name = 'medicalClearanceRequired'
  ) THEN
    ALTER TABLE "PARQ" RENAME COLUMN "requiresMedicalClearance" TO "medicalClearanceRequired";
  END IF;
END $$;

ALTER TABLE "PARQ"
  ALTER COLUMN "q1_heartTrouble"          SET DEFAULT false,
  ALTER COLUMN "q2_chestPain"             SET DEFAULT false,
  ALTER COLUMN "q3_dizzinessFainting"     SET DEFAULT false,
  ALTER COLUMN "q4_highBloodPressure"     SET DEFAULT false,
  ALTER COLUMN "q5_boneJointProblems"     SET DEFAULT false,
  ALTER COLUMN "q6_otherReasons"          SET DEFAULT false,
  ALTER COLUMN "q7_over45Unaccustomed"    SET DEFAULT false,
  ALTER COLUMN "medicalClearanceRequired" SET DEFAULT false;

ALTER TABLE "PARQ"
  ADD CONSTRAINT "PARQ_assessorId_fkey"
  FOREIGN KEY ("assessorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS "PARQ_memberId_idx"   ON "PARQ"("memberId");
CREATE INDEX IF NOT EXISTS "PARQ_assessedAt_idx" ON "PARQ"("assessedAt");

-- ── 3. LifestyleProfile ───────────────────────────────────────────────────────
DROP INDEX IF EXISTS "LifestyleProfile_memberId_key";

ALTER TABLE "LifestyleProfile"
  ADD COLUMN IF NOT EXISTS "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "assessorId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "LifestyleProfile"
  ADD CONSTRAINT "LifestyleProfile_assessorId_fkey"
  FOREIGN KEY ("assessorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS "LifestyleProfile_memberId_idx"   ON "LifestyleProfile"("memberId");
CREATE INDEX IF NOT EXISTS "LifestyleProfile_assessedAt_idx" ON "LifestyleProfile"("assessedAt");

-- ── 4. MedicalCondition ───────────────────────────────────────────────────────
ALTER TABLE "MedicalCondition"
  ADD COLUMN IF NOT EXISTS "conditionName_new" "MedicalConditionName";

UPDATE "MedicalCondition"
SET "conditionName_new" = CASE "conditionName"
  WHEN 'Chronic Illness'       THEN 'CHRONIC_ILLNESS'::"MedicalConditionName"
  WHEN 'Recent Surgery'        THEN 'RECENT_SURGERY'::"MedicalConditionName"
  WHEN 'Pregnancy'             THEN 'PREGNANCY'::"MedicalConditionName"
  WHEN 'Breastfeeding'         THEN 'BREASTFEEDING'::"MedicalConditionName"
  WHEN 'Asthma'                THEN 'BREATHING_LUNG'::"MedicalConditionName"
  WHEN 'COPD'                  THEN 'BREATHING_LUNG'::"MedicalConditionName"
  WHEN 'Emphysema'             THEN 'BREATHING_LUNG'::"MedicalConditionName"
  WHEN 'Arthritis'             THEN 'ARTHRITIS'::"MedicalConditionName"
  WHEN 'Diabetes'              THEN 'DIABETES'::"MedicalConditionName"
  WHEN 'Thyroid'               THEN 'THYROID'::"MedicalConditionName"
  WHEN 'Obesity'               THEN 'OBESITY'::"MedicalConditionName"
  WHEN 'High Cholesterol'      THEN 'HIGH_CHOLESTEROL'::"MedicalConditionName"
  WHEN 'Hernia'                THEN 'HERNIA'::"MedicalConditionName"
  WHEN 'Depression'            THEN 'DEPRESSION_BIPOLAR_SAD'::"MedicalConditionName"
  WHEN 'Circulatory Disorders' THEN 'CIRCULATORY'::"MedicalConditionName"
  WHEN 'Digestive Disorders'   THEN 'DIGESTIVE'::"MedicalConditionName"
  ELSE 'OTHER'::"MedicalConditionName"
END;

ALTER TABLE "MedicalCondition" DROP COLUMN "conditionName";
ALTER TABLE "MedicalCondition" RENAME COLUMN "conditionName_new" TO "conditionName";
ALTER TABLE "MedicalCondition" ALTER COLUMN "conditionName" SET NOT NULL;

ALTER TABLE "MedicalCondition"
  ADD COLUMN IF NOT EXISTS "customName"  TEXT,
  ADD COLUMN IF NOT EXISTS "assessedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "assessorId"  TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "MedicalCondition"
  ADD CONSTRAINT "MedicalCondition_assessorId_fkey"
  FOREIGN KEY ("assessorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

CREATE UNIQUE INDEX IF NOT EXISTS "MedicalCondition_memberId_conditionName_assessedAt_key"
  ON "MedicalCondition"("memberId", "conditionName", "assessedAt");
CREATE INDEX IF NOT EXISTS "MedicalCondition_memberId_idx" ON "MedicalCondition"("memberId");

-- ── 5. MenstrualHistory ───────────────────────────────────────────────────────
DROP INDEX IF EXISTS "MenstrualHistory_memberId_key";

ALTER TABLE "MenstrualHistory"
  ADD COLUMN IF NOT EXISTS "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "assessorId" TEXT,
  ADD COLUMN IF NOT EXISTS "notes"      TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "MenstrualHistory"
  ADD CONSTRAINT "MenstrualHistory_assessorId_fkey"
  FOREIGN KEY ("assessorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS "MenstrualHistory_memberId_idx"   ON "MenstrualHistory"("memberId");
CREATE INDEX IF NOT EXISTS "MenstrualHistory_assessedAt_idx" ON "MenstrualHistory"("assessedAt");