import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Prisma } from "@prisma/client"

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

export async function getMembersForReports(params: { search?: string; page?: number }) {
  const session = await auth()
  if (!session || !session.user) {
    redirect("/login")
  }

  const role = session.user.role
  const userId = session.user.id

  const page = Math.max(1, params.page ?? 1)
  const pageSize = 10

  const where: Prisma.MemberWhereInput = {
    status: { not: "ARCHIVED" }
  }

  if (role === "TRAINER") {
    where.trainerId = userId
  }

  if (params.search) {
    const q = params.search.trim()
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { membershipNo: { contains: q, mode: "insensitive" } },
      ]
    }
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        fullName: true,
        membershipNo: true,
        trainer: { select: { name: true } }
      }
    }),
    prisma.member.count({ where })
  ])

  return {
    members,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize)
  }
}
