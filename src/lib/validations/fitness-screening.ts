/**
 * src/lib/validations/fitness-screening.ts
 *
 * Zod v4 validation schemas for Phase 3 — Fitness Screening modules:
 *   1. parqSchema              — PAR-Q assessment
 *   2. lifestyleProfileSchema  — Lifestyle profile
 *   3. medicalConditionsSchema — Medical conditions checklist
 *   4. menstrualHistorySchema  — Menstrual history
 */

import { z } from "zod"

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const assessmentDateSchema = z.date({
  error: "Assessment date is required",
})

const notesSchema = z
  .string()
  .max(2000, "Notes must be 2 000 characters or fewer")
  .optional()

const assessorIdSchema = z.string().cuid().optional()

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — PAR-Q
// ─────────────────────────────────────────────────────────────────────────────

export const parqSchema = z.object({
  assessedAt: assessmentDateSchema,
  assessorId: assessorIdSchema,

  q1_heartTrouble:       z.boolean({ error: "Question 1 requires a Yes/No answer" }),
  q2_chestPain:          z.boolean({ error: "Question 2 requires a Yes/No answer" }),
  q3_dizzinessFainting:  z.boolean({ error: "Question 3 requires a Yes/No answer" }),
  q4_highBloodPressure:  z.boolean({ error: "Question 4 requires a Yes/No answer" }),
  q5_boneJointProblems:  z.boolean({ error: "Question 5 requires a Yes/No answer" }),
  q6_otherReasons:       z.boolean({ error: "Question 6 requires a Yes/No answer" }),
  q7_over45Unaccustomed: z.boolean({ error: "Question 7 requires a Yes/No answer" }),

  notes: notesSchema,
})

export type ParqFormValues = z.infer<typeof parqSchema>

/**
 * Derives the medicalClearanceRequired flag from validated form values.
 * Call this server-side before writing to the database.
 */
export function deriveMedicalClearanceRequired(data: ParqFormValues): boolean {
  return (
    data.q1_heartTrouble ||
    data.q2_chestPain ||
    data.q3_dizzinessFainting ||
    data.q4_highBloodPressure ||
    data.q5_boneJointProblems ||
    data.q6_otherReasons ||
    data.q7_over45Unaccustomed
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — LIFESTYLE PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export const physicalActivityLevelEnum = z.enum(["MILD", "MODERATE", "HEAVY"], {
  error: "Select a valid activity level",
})

export const stressLevelEnum = z.enum(["MILD", "MODERATE", "HEAVY"], {
  error: "Select a valid stress level",
})

export const sleepQualityEnum = z.enum(["SOUND", "DISTURBED", "FAIR", "BAD"], {
  error: "Select a valid sleep quality",
})

export const lifestyleProfileSchema = z
  .object({
    assessedAt: assessmentDateSchema,
    assessorId: assessorIdSchema,

    occupation: z
      .string()
      .trim()
      .max(200, "Occupation must be 200 characters or fewer")
      .optional(),

    physicalActivityLevel: physicalActivityLevelEnum.optional(),
    workStress:            stressLevelEnum.optional(),
    personalStress:        stressLevelEnum.optional(),

    travelFrequency: z
      .string()
      .trim()
      .max(100, "Travel frequency must be 100 characters or fewer")
      .optional(),

    avgSleepHours: z
      .number()
      .min(0,  "Sleep hours cannot be negative")
      .max(24, "Sleep hours cannot exceed 24")
      .optional(),

    sleepQuality: sleepQualityEnum.optional(),

    sleepTiming: z
      .string()
      .trim()
      .max(100, "Sleep timing must be 100 characters or fewer")
      .optional(),

    afternoonNap: z.boolean().optional(),
    napDuration: z
      .string()
      .trim()
      .max(50, "Nap duration must be 50 characters or fewer")
      .optional(),

    smoking: z.boolean().optional(),
    smokingFrequency: z
      .string()
      .trim()
      .max(100, "Smoking frequency must be 100 characters or fewer")
      .optional(),

    alcohol: z.boolean().optional(),
    alcoholFrequency: z
      .string()
      .trim()
      .max(100, "Alcohol frequency must be 100 characters or fewer")
      .optional(),

    tobacco: z.boolean().optional(),
    tobaccoFrequency: z
      .string()
      .trim()
      .max(100, "Tobacco frequency must be 100 characters or fewer")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.smoking === false && data.smokingFrequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["smokingFrequency"],
        message: "Remove frequency — smoking is marked as No.",
      })
    }
    if (data.alcohol === false && data.alcoholFrequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["alcoholFrequency"],
        message: "Remove frequency — alcohol is marked as No.",
      })
    }
    if (data.tobacco === false && data.tobaccoFrequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tobaccoFrequency"],
        message: "Remove frequency — tobacco is marked as No.",
      })
    }
    if (data.afternoonNap === false && data.napDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["napDuration"],
        message: "Remove duration — afternoon nap is marked as No.",
      })
    }
  })

export type LifestyleProfileFormValues = z.infer<typeof lifestyleProfileSchema>

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — MEDICAL CONDITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const medicalConditionNameEnum = z.enum(
  [
    "CHRONIC_ILLNESS",
    "RECENT_SURGERY",
    "PREGNANCY",
    "BREASTFEEDING",
    "BREATHING_LUNG",
    "MUSCULOSKELETAL_INJURY",
    "ARTHRITIS",
    "DIABETES",
    "THYROID",
    "OBESITY",
    "HIGH_CHOLESTEROL",
    "FAMILY_HEART_HISTORY",
    "HERNIA",
    "FREQUENT_HEADACHES",
    "FREQUENT_RESPIRATORY",
    "DEPRESSION_BIPOLAR_SAD",
    "CIRCULATORY",
    "DIGESTIVE",
    "OTHER",
  ] as const,
  { error: "Select a valid condition" }
)

export type MedicalConditionName = z.infer<typeof medicalConditionNameEnum>

export const singleMedicalConditionSchema = z
  .object({
    conditionName: medicalConditionNameEnum,
    customName: z
      .string()
      .trim()
      .max(200, "Condition name must be 200 characters or fewer")
      .optional(),
    details: z
      .string()
      .trim()
      .max(2000, "Details must be 2 000 characters or fewer")
      .optional(),
    notes: notesSchema,
  })
  .superRefine((data, ctx) => {
    if (data.conditionName === "OTHER" && !data.customName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customName"],
        message: "Please specify the condition name when selecting Other.",
      })
    }
  })

export type SingleMedicalConditionValues = z.infer<typeof singleMedicalConditionSchema>

export const medicalConditionsSchema = z.object({
  assessedAt: assessmentDateSchema,
  assessorId: assessorIdSchema,

  conditions: z
    .array(singleMedicalConditionSchema)
    .min(1, "Select at least one condition to record a medical assessment."),
})

export type MedicalConditionsFormValues = z.infer<typeof medicalConditionsSchema>

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — MENSTRUAL HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export const menstrualHistorySchema = z
  .object({
    assessedAt: assessmentDateSchema,
    assessorId: assessorIdSchema,

    lastCycleDate: z.date().optional(),

    ageAtMenstruationOnset: z
      .number()
      .int("Age must be a whole number")
      .min(8,  "Age at onset must be at least 8")
      .max(20, "Age at onset must be 20 or under")
      .optional(),

    averageCycleLength: z
      .number()
      .int("Cycle length must be a whole number")
      .min(10, "Cycle length must be at least 10 days")
      .max(90, "Cycle length must be 90 days or fewer")
      .optional(),

    irregularCycles:     z.boolean().optional(),
    spotting:            z.boolean().optional(),
    missedCycles:        z.boolean().optional(),
    painfulMenstruation: z.boolean().optional(),

    notes: notesSchema,
  })
  .superRefine((data, ctx) => {
    if (data.lastCycleDate && data.lastCycleDate > new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lastCycleDate"],
        message: "Date of last menstrual period cannot be in the future.",
      })
    }
  })

export type MenstrualHistoryFormValues = z.infer<typeof menstrualHistorySchema>