import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Enforces role-based read access rules:
 * - ADMIN & COUNSELLOR: Access to all screening modules.
 * - TRAINER: Access to PAR-Q, Lifestyle, and Medical Conditions (Read-Only) for assigned members only.
 * - TRAINER: NO ACCESS to Menstrual History.
 */
async function requireScreeningAccess(
  memberId: string,
  module: "PARQ" | "LIFESTYLE" | "MEDICAL" | "MENSTRUAL"
) {
  const session = await auth()
  if (!session) {
    throw new Error("Unauthorised: Access denied.")
  }

  const { role, id: userId } = session.user

  // Check module-specific rules for TRAINER
  if (role === "TRAINER") {
    if (module === "MENSTRUAL") {
      throw new Error("Access Denied: Trainers do not have access to menstrual history.")
    }

    // Trainers can only view screening data for members assigned to them
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { trainerId: true },
    })

    if (!member) {
      throw new Error("Member not found.")
    }

    if (member.trainerId !== userId) {
      throw new Error("Access Denied: You are not assigned to this member.")
    }
  }

  return session
}

export async function getLatestPARQ(memberId: string) {
  await requireScreeningAccess(memberId, "PARQ")
  return prisma.pARQ.findFirst({
    where: { memberId },
    orderBy: { assessedAt: "desc" },
  })
}

export async function getPARQHistory(memberId: string) {
  await requireScreeningAccess(memberId, "PARQ")
  return prisma.pARQ.findMany({
    where: { memberId },
    orderBy: { assessedAt: "desc" },
  })
}

export async function getLatestLifestyleProfile(memberId: string) {
  await requireScreeningAccess(memberId, "LIFESTYLE")
  return prisma.lifestyleProfile.findFirst({
    where: { memberId },
    orderBy: { assessedAt: "desc" },
  })
}

export async function getLifestyleHistory(memberId: string) {
  await requireScreeningAccess(memberId, "LIFESTYLE")
  return prisma.lifestyleProfile.findMany({
    where: { memberId },
    orderBy: { assessedAt: "desc" },
  })
}

export async function getLatestMedicalConditions(memberId: string) {
  await requireScreeningAccess(memberId, "MEDICAL")
  const latestRecord = await prisma.medicalCondition.findFirst({
    where: { memberId },
    orderBy: { assessedAt: "desc" },
    select: { assessedAt: true },
  })

  if (!latestRecord) return []

  return prisma.medicalCondition.findMany({
    where: {
      memberId,
      assessedAt: latestRecord.assessedAt,
    },
    orderBy: { conditionName: "asc" },
  })
}

export async function getMedicalHistory(memberId: string) {
  await requireScreeningAccess(memberId, "MEDICAL")
  return prisma.medicalCondition.findMany({
    where: { memberId },
    orderBy: [
      { assessedAt: "desc" },
      { conditionName: "asc" },
    ],
  })
}

export async function getLatestMenstrualHistory(memberId: string) {
  await requireScreeningAccess(memberId, "MENSTRUAL")
  return prisma.menstrualHistory.findFirst({
    where: { memberId },
    orderBy: { assessedAt: "desc" },
  })
}

export async function getMenstrualHistory(memberId: string) {
  await requireScreeningAccess(memberId, "MENSTRUAL")
  return prisma.menstrualHistory.findMany({
    where: { memberId },
    orderBy: { assessedAt: "desc" },
  })
}
