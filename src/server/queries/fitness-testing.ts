import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Enforces trainer-member assignments for data queries.
 * - ADMIN & COUNSELLOR: Access to all member records.
 * - TRAINER: Restricted to viewing records only for members explicitly assigned to them.
 */
async function requireTestingAccess(memberId: string) {
  const session = await auth()
  if (!session) {
    throw new Error("Unauthorised: Access denied.")
  }

  const { role, id: userId } = session.user

  if (role === "TRAINER") {
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

export async function getLatestPosturalAnalysis(memberId: string) {
  await requireTestingAccess(memberId)
  return prisma.posturalAnalysis.findFirst({
    where: { memberId },
    orderBy: { assessedAt: "desc" },
  })
}

export async function getPosturalAnalysisHistory(memberId: string) {
  await requireTestingAccess(memberId)
  return prisma.posturalAnalysis.findMany({
    where: { memberId },
    orderBy: { assessedAt: "desc" },
  })
}

export async function getLatestFitnessTest(memberId: string) {
  await requireTestingAccess(memberId)
  return prisma.fitnessTest.findFirst({
    where: { memberId },
    orderBy: { testDate: "desc" },
  })
}

export async function getFitnessTestHistory(memberId: string) {
  await requireTestingAccess(memberId)
  return prisma.fitnessTest.findMany({
    where: { memberId },
    orderBy: { testDate: "desc" },
  })
}
