"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import {
  parqSchema,
  lifestyleProfileSchema,
  medicalConditionsSchema,
  menstrualHistorySchema,
  deriveMedicalClearanceRequired,
  type ParqFormValues,
  type LifestyleProfileFormValues,
  type MedicalConditionsFormValues,
  type MenstrualHistoryFormValues,
} from "@/lib/validations/fitness-screening"

export type ActionResult =
  | { success: true; id: string }
  | {
      success: false
      error: {
        fieldErrors: Record<string, string[] | undefined>
        formErrors: string[]
      }
    }

/**
 * Custom error handler for Prisma requests.
 * Formats P2002 (Unique Constraint) and P2025 (Record Not Found) into clean ActionResults.
 */
function handlePrismaError(err: unknown): ActionResult {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: ["A record with this date/details already exists."],
        },
      }
    }
    if (err.code === "P2025") {
      return {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: ["The requested record was not found."],
        },
      }
    }
  }

  return {
    success: false,
    error: {
      fieldErrors: {},
      formErrors: [err instanceof Error ? err.message : "An unexpected database error occurred."],
    },
  }
}

interface CustomSession {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

type MutateAuthResult =
  | { success: true; session: CustomSession }
  | { success: false; actionResult: ActionResult }

/**
 * Enforces staff session and roles permissions:
 * - ADMIN & COUNSELLOR: Allowed to write to all modules.
 * - TRAINER: Allowed to write only to PAR-Q and Lifestyle, and only for their assigned members.
 */
async function checkMutateAuth(
  memberId: string,
  allowedRoles: string[]
): Promise<MutateAuthResult> {
  const session = (await auth()) as CustomSession | null
  if (!session) {
    return {
      success: false,
      actionResult: {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: ["You must be logged in to perform this action."],
        },
      },
    }
  }

  const { role, id: userId } = session.user

  if (!allowedRoles.includes(role)) {
    return {
      success: false,
      actionResult: {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: ["You do not have permission to perform this action."],
        },
      },
    }
  }

  if (role === "TRAINER") {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { trainerId: true },
    })
    if (!member) {
      return {
        success: false,
        actionResult: {
          success: false,
          error: {
            fieldErrors: {},
            formErrors: ["Member not found."],
          },
        },
      }
    }
    if (member.trainerId !== userId) {
      return {
        success: false,
        actionResult: {
          success: false,
          error: {
            fieldErrors: {},
            formErrors: ["You don't have permission to modify records for this member."],
          },
        },
      }
    }
  }

  return { success: true, session }
}

/**
 * Saves a PAR-Q assessment. Creates a new record or updates an existing one for the same date.
 */
export async function savePARQ(
  memberId: string,
  values: ParqFormValues
): Promise<ActionResult> {
  const authCheck = await checkMutateAuth(memberId, ["ADMIN", "COUNSELLOR", "TRAINER"])
  if (!authCheck.success) return authCheck.actionResult
  const { session } = authCheck

  const parsed = parqSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const medicalClearanceRequired = deriveMedicalClearanceRequired(parsed.data)

  try {
    const existing = await prisma.pARQ.findFirst({
      where: {
        memberId,
        assessedAt: parsed.data.assessedAt,
      },
      select: { id: true },
    })

    let parqId: string

    const dbData = {
      assessorId: session.user.id,
      q1_heartTrouble: parsed.data.q1_heartTrouble,
      q2_chestPain: parsed.data.q2_chestPain,
      q3_dizzinessFainting: parsed.data.q3_dizzinessFainting,
      q4_highBloodPressure: parsed.data.q4_highBloodPressure,
      q5_boneJointProblems: parsed.data.q5_boneJointProblems,
      q6_otherReasons: parsed.data.q6_otherReasons,
      q7_over45Unaccustomed: parsed.data.q7_over45Unaccustomed,
      medicalClearanceRequired,
      notes: parsed.data.notes ?? null,
    }

    if (existing) {
      const updated = await prisma.pARQ.update({
        where: { id: existing.id },
        data: dbData,
      })
      parqId = updated.id

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_PARQ",
          entityType: "PARQ",
          entityId: parqId,
          details: { assessedAt: parsed.data.assessedAt },
        },
      })
    } else {
      const created = await prisma.pARQ.create({
        data: {
          memberId,
          assessedAt: parsed.data.assessedAt,
          ...dbData,
        },
      })
      parqId = created.id

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_PARQ",
          entityType: "PARQ",
          entityId: parqId,
          details: { assessedAt: parsed.data.assessedAt },
        },
      })
    }

    revalidatePath(`/members/${memberId}`)
    return { success: true, id: parqId }
  } catch (err) {
    return handlePrismaError(err)
  }
}

/**
 * Saves a Lifestyle profile. Creates a new record or updates an existing one for the same date.
 */
export async function saveLifestyleProfile(
  memberId: string,
  values: LifestyleProfileFormValues
): Promise<ActionResult> {
  const authCheck = await checkMutateAuth(memberId, ["ADMIN", "COUNSELLOR", "TRAINER"])
  if (!authCheck.success) return authCheck.actionResult
  const { session } = authCheck

  const parsed = lifestyleProfileSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const data = parsed.data

  try {
    const existing = await prisma.lifestyleProfile.findFirst({
      where: {
        memberId,
        assessedAt: data.assessedAt,
      },
      select: { id: true },
    })

    let profileId: string

    const dbData = {
      assessorId: session.user.id,
      occupation: data.occupation ?? null,
      physicalActivityLevel: data.physicalActivityLevel ?? null,
      workStress: data.workStress ?? null,
      personalStress: data.personalStress ?? null,
      travelFrequency: data.travelFrequency ?? null,
      avgSleepHours: data.avgSleepHours ?? null,
      sleepQuality: data.sleepQuality ?? null,
      sleepTiming: data.sleepTiming ?? null,
      afternoonNap: data.afternoonNap ?? null,
      napDuration: data.napDuration ?? null,
      smoking: data.smoking ?? null,
      smokingFrequency: data.smokingFrequency ?? null,
      alcohol: data.alcohol ?? null,
      alcoholFrequency: data.alcoholFrequency ?? null,
      tobacco: data.tobacco ?? null,
      tobaccoFrequency: data.tobaccoFrequency ?? null,
    }

    if (existing) {
      const updated = await prisma.lifestyleProfile.update({
        where: { id: existing.id },
        data: dbData,
      })
      profileId = updated.id

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_LIFESTYLE",
          entityType: "LifestyleProfile",
          entityId: profileId,
          details: { assessedAt: data.assessedAt },
        },
      })
    } else {
      const created = await prisma.lifestyleProfile.create({
        data: {
          memberId,
          assessedAt: data.assessedAt,
          ...dbData,
        },
      })
      profileId = created.id

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_LIFESTYLE",
          entityType: "LifestyleProfile",
          entityId: profileId,
          details: { assessedAt: data.assessedAt },
        },
      })
    }

    revalidatePath(`/members/${memberId}`)
    return { success: true, id: profileId }
  } catch (err) {
    return handlePrismaError(err)
  }
}

/**
 * Saves a list of Medical Conditions. Deletes previous records for that date and recreates them.
 */
export async function saveMedicalConditions(
  memberId: string,
  values: MedicalConditionsFormValues
): Promise<ActionResult> {
  const authCheck = await checkMutateAuth(memberId, ["ADMIN", "COUNSELLOR"])
  if (!authCheck.success) return authCheck.actionResult
  const { session } = authCheck

  const parsed = medicalConditionsSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const { assessedAt, conditions } = parsed.data

  // Remove duplicate conditionName entries from the input defensively to prevent DB constraints violations
  const uniqueConditions = conditions.filter(
    (cond, index, self) =>
      self.findIndex((c) => c.conditionName === cond.conditionName) === index
  )

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing medical condition rows for this member and date
      await tx.medicalCondition.deleteMany({
        where: {
          memberId,
          assessedAt,
        },
      })

      // 2. Bulk insert new conditions
      if (uniqueConditions.length > 0) {
        await tx.medicalCondition.createMany({
          data: uniqueConditions.map((cond) => ({
            memberId,
            assessedAt,
            assessorId: session.user.id,
            conditionName: cond.conditionName,
            customName: cond.customName ?? null,
            details: cond.details ?? null,
            notes: cond.notes ?? null,
          })),
        })
      }

      // 3. Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "SAVE_MEDICAL_CONDITIONS",
          entityType: "MedicalCondition",
          entityId: memberId,
          details: { assessedAt, count: uniqueConditions.length },
        },
      })
    })

    revalidatePath(`/members/${memberId}`)
    return { success: true, id: memberId }
  } catch (err) {
    return handlePrismaError(err)
  }
}

/**
 * Saves a Menstrual History record. Creates a new record or updates an existing one for the same date.
 * Strictly checks that the member gender is FEMALE before performing any database changes.
 */
export async function saveMenstrualHistory(
  memberId: string,
  values: MenstrualHistoryFormValues
): Promise<ActionResult> {
  const authCheck = await checkMutateAuth(memberId, ["ADMIN", "COUNSELLOR"])
  if (!authCheck.success) return authCheck.actionResult
  const { session } = authCheck

  // Fetch member gender to enforce rules
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { gender: true },
  })

  if (!member) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: ["Member not found."],
      },
    }
  }

  if (member.gender !== "FEMALE") {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: ["Menstrual history can only be recorded for female members."],
      },
    }
  }

  const parsed = menstrualHistorySchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const data = parsed.data

  try {
    const existing = await prisma.menstrualHistory.findFirst({
      where: {
        memberId,
        assessedAt: data.assessedAt,
      },
      select: { id: true },
    })

    let menstrualId: string

    const dbData = {
      assessorId: session.user.id,
      lastCycleDate: data.lastCycleDate ?? null,
      ageAtMenstruationOnset: data.ageAtMenstruationOnset ?? null,
      averageCycleLength: data.averageCycleLength ?? null,
      irregularCycles: data.irregularCycles ?? null,
      spotting: data.spotting ?? null,
      missedCycles: data.missedCycles ?? null,
      painfulMenstruation: data.painfulMenstruation ?? null,
      notes: data.notes ?? null,
    }

    if (existing) {
      const updated = await prisma.menstrualHistory.update({
        where: { id: existing.id },
        data: dbData,
      })
      menstrualId = updated.id

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_MENSTRUAL",
          entityType: "MenstrualHistory",
          entityId: menstrualId,
          details: { assessedAt: data.assessedAt },
        },
      })
    } else {
      const created = await prisma.menstrualHistory.create({
        data: {
          memberId,
          assessedAt: data.assessedAt,
          ...dbData,
        },
      })
      menstrualId = created.id

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_MENSTRUAL",
          entityType: "MenstrualHistory",
          entityId: menstrualId,
          details: { assessedAt: data.assessedAt },
        },
      })
    }

    revalidatePath(`/members/${memberId}`)
    return { success: true, id: menstrualId }
  } catch (err) {
    return handlePrismaError(err)
  }
}
