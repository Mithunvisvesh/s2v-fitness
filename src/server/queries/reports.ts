import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Enforces staff access rights for Report generation:
 * - ADMIN, COUNSELLOR & TRAINER: allowed.
 * - TRAINER: Restricted to member records assigned to them.
 */
async function requireReportAccess(memberId: string) {
  const session = await auth()
  if (!session) {
    throw new Error("Unauthorised: Access denied.")
  }

  const { role, id: userId } = session.user

  const ALLOWED_ROLES = ["ADMIN", "COUNSELLOR", "TRAINER"]
  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("Access Denied: Unauthorised role.")
  }

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

/**
 * Aggregates a member's core profile, latest measurements, parq status, and fitness test stats.
 */
export async function getMemberReportData(memberId: string) {
  await requireReportAccess(memberId)

  const [member, latestMeasurement, latestParq, latestFitnessTest] = await Promise.all([
    prisma.member.findUnique({
      where: { id: memberId },
      include: {
        counsellor: { select: { name: true } },
        trainer: { select: { name: true } },
      },
    }),
    prisma.measurement.findFirst({
      where: { memberId },
      orderBy: { measuredAt: "desc" },
    }),
    prisma.pARQ.findFirst({
      where: { memberId },
      orderBy: { assessedAt: "desc" },
    }),
    prisma.fitnessTest.findFirst({
      where: { memberId },
      orderBy: { testDate: "desc" },
    }),
  ])

  if (!member) {
    throw new Error("Member not found.")
  }

  return {
    member,
    latestMeasurement,
    latestParq,
    latestFitnessTest,
  }
}
export type MemberReportData = Awaited<ReturnType<typeof getMemberReportData>>
