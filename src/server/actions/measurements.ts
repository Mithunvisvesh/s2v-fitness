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

async function requireSession() {
  const session = await auth()
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    throw new Error("Unauthorised")
  }
  return session
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
  const session = await requireSession()

  const parsed = measurementSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const measurement = await prisma.measurement.create({
    data: { memberId, ...buildData(parsed.data, memberGender) },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE_MEASUREMENT",
      entityType: "Measurement",
      entityId: measurement.id,
    },
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
  const session = await requireSession()

  const parsed = measurementSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  await prisma.measurement.update({
    where: { id: measurementId },
    data: buildData(parsed.data, memberGender),
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE_MEASUREMENT",
      entityType: "Measurement",
      entityId: measurementId,
    },
  })

  revalidateMember(memberId)
  return { success: true, measurementId }
}

export async function deleteMeasurement(
  measurementId: string,
  memberId: string
): Promise<{ success: boolean }> {
  const session = await requireSession()

  await prisma.measurement.delete({ where: { id: measurementId } })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE_MEASUREMENT",
      entityType: "Measurement",
      entityId: measurementId,
    },
  })

  revalidateMember(memberId)
  return { success: true }
}
