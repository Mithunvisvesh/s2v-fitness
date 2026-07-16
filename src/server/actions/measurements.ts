"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { measurementSchema, type MeasurementFormValues } from "@/lib/validations/measurement"
import { calcBMI, calcWHR, getWHRStatus } from "@/lib/constants"
import { revalidatePath } from "next/cache"

const ALLOWED_ROLES = ["ADMIN", "COUNSELLOR", "TRAINER"]

type ActionResult =
  | { success: true; measurementId: string }
  | { success: false; error: { fieldErrors: Record<string, string[] | undefined>; formErrors: string[] } }

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

async function checkMutateAuth(memberId: string): Promise<MutateAuthResult> {
  const session = (await auth()) as CustomSession | null
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
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

function revalidateMember(memberId: string) {
  revalidatePath(`/members/${memberId}`)
}

function buildData(d: MeasurementFormValues, memberGender: string) {
  const bmi = calcBMI(d.weightKg, d.heightCm)
  const waistHipRatio =
    d.waistCirc && d.hipCirc ? calcWHR(d.waistCirc, d.hipCirc) : undefined
  const ratioIndicator =
    waistHipRatio !== undefined
      ? getWHRStatus(waistHipRatio, memberGender)
      : undefined
  return {
    measuredAt: d.measuredAt,
    heightCm: d.heightCm,
    weightKg: d.weightKg,
    bmi,
    bodyFatPercent: d.bodyFatPercent ?? null,
    visceralFat: d.visceralFat ?? null,
    bmr: d.bmr ?? null,
    biologicalAge: d.biologicalAge ?? null,
    shoulderWidth: d.shoulderWidth ?? null,
    hipWidth: d.hipWidth ?? null,
    neckCirc: d.neckCirc ?? null,
    shoulderCirc: d.shoulderCirc ?? null,
    chestNormal: d.chestNormal ?? null,
    chestExpansion: d.chestExpansion ?? null,
    armCirc: d.armCirc ?? null,
    forearmCirc: d.forearmCirc ?? null,
    abdomenCirc: d.abdomenCirc ?? null,
    waistCirc: d.waistCirc ?? null,
    hipCirc: d.hipCirc ?? null,
    midThighCirc: d.midThighCirc ?? null,
    calfCirc: d.calfCirc ?? null,
    waistHipRatio: waistHipRatio ?? null,
    ratioIndicator: ratioIndicator ?? null,
  }
}
export async function createMeasurement(
  memberId: string,
  values: MeasurementFormValues,
  memberGender: string
): Promise<ActionResult> {
  const authCheck = await checkMutateAuth(memberId)
  if (!authCheck.success) {
    return authCheck.actionResult
  }
  const session = authCheck.session

  const parsed = measurementSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const measurement = await prisma.$transaction(async (tx) => {
    const meas = await tx.measurement.create({
      data: { memberId, ...buildData(parsed.data, memberGender) },
    })

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_MEASUREMENT",
        entityType: "Measurement",
        entityId: meas.id,
      },
    })

    return meas
  })

  revalidateMember(memberId)
  return { success: true, measurementId: measurement.id }
}

export async function updateMeasurement(
  measurementId: string,
  memberId: string,
  values: MeasurementFormValues,
  memberGender: string
): Promise<ActionResult> {
  const authCheck = await checkMutateAuth(memberId)
  if (!authCheck.success) {
    return authCheck.actionResult
  }
  const session = authCheck.session

  const parsed = measurementSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  await prisma.$transaction(async (tx) => {
    await tx.measurement.update({
      where: { id: measurementId },
      data: buildData(parsed.data, memberGender),
    })

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_MEASUREMENT",
        entityType: "Measurement",
        entityId: measurementId,
      },
    })
  })

  revalidateMember(memberId)
  return { success: true, measurementId }
}

export async function deleteMeasurement(
  measurementId: string,
  memberId: string
): Promise<ActionResult> {
  const authCheck = await checkMutateAuth(memberId)
  if (!authCheck.success) {
    return authCheck.actionResult
  }
  const session = authCheck.session

  await prisma.$transaction(async (tx) => {
    await tx.measurement.delete({ where: { id: measurementId } })

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_MEASUREMENT",
        entityType: "Measurement",
        entityId: measurementId,
      },
    })
  })

  revalidateMember(memberId)
  return { success: true, measurementId }
}
