import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Prisma } from "@prisma/client"

interface CustomSession {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

/**
 * Helper to fetch session user info.
 */
async function getSessionUser() {
  const session = (await auth()) as CustomSession | null
  if (!session) {
    throw new Error("Unauthorised: Access denied.")
  }
  return session.user
}

/**
 * Calculates high-level KPI dashboard metrics.
 * - Total Active Members (archivedAt == null, status == ACTIVE)
 * - New Registrations this Month
 * - Members requiring medical clearance (medicalClearanceRequired == true on their latest PAR-Q)
 */
export async function getDashboardMetrics() {
  const user = await getSessionUser()
  const { role, id: userId } = user

  const trainerFilter = role === "TRAINER" ? { trainerId: userId } : {}

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const [totalActive, newThisMonth, pendingResult] = await Promise.all([
    // 1. Total Active
    prisma.member.count({
      where: {
        archivedAt: null,
        status: "ACTIVE",
        ...trainerFilter,
      },
    }),
    // 2. New This Month
    prisma.member.count({
      where: {
        archivedAt: null,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        ...trainerFilter,
      },
    }),
    // 3. Raw SQL to fetch and count members requiring medical clearance
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count
      FROM (
        SELECT DISTINCT ON ("memberId") "memberId", "medicalClearanceRequired"
        FROM "PARQ"
        ORDER BY "memberId", "assessedAt" DESC
      ) p
      JOIN "Member" m ON m.id = p."memberId"
      WHERE m."archivedAt" IS NULL
        AND p."medicalClearanceRequired" = true
        ${role === "TRAINER" ? Prisma.sql`AND m."trainerId" = ${userId}` : Prisma.empty}
    `
  ])

  const medicalClearancePending = pendingResult[0]?.count ?? 0

  return {
    totalActive,
    newThisMonth,
    medicalClearancePending,
  }
}

/**
 * Groups member registrations by month for the last 6 months.
 * Formatted for Recharts.
 */
export async function getRegistrationTrends() {
  const user = await getSessionUser()
  const { role, id: userId } = user

  const trainerFilter = role === "TRAINER" ? { trainerId: userId } : {}

  // Calculate starting point: 6 months ago (inclusive of current month)
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const members = await prisma.member.findMany({
    where: {
      archivedAt: null,
      date: { gte: startDate },
      ...trainerFilter,
    },
    select: {
      date: true,
    },
  })

  // Initialize the last 6 months buckets
  const trendsMap = new Map<string, number>()
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    trendsMap.set(key, 0)
  }

  // Aggregate counts
  members.forEach((m) => {
    const dateObj = new Date(m.date)
    const key = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`
    if (trendsMap.has(key)) {
      trendsMap.set(key, trendsMap.get(key)! + 1)
    }
  })

  // Format for Recharts
  return Array.from(trendsMap.entries()).map(([month, count]) => ({
    month,
    registrations: count,
  }))
}

/**
 * Counts package type distribution.
 * Formatted for Recharts.
 */
export async function getPackageDistribution() {
  const user = await getSessionUser()
  const { role, id: userId } = user

  const trainerFilter = role === "TRAINER" ? { trainerId: userId } : {}

  const distribution = await prisma.member.groupBy({
    by: ["package"],
    where: {
      archivedAt: null,
      ...trainerFilter,
    },
    _count: {
      id: true,
    },
  })

  const labelMap: Record<string, string> = {
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    HALF_YEARLY: "Half Yearly",
    YEARLY: "Yearly",
  }

  return distribution.map((item) => ({
    name: labelMap[item.package] || item.package,
    value: item._count.id,
  }))
}

/**
 * Fetches the 5 most recently added members.
 */
export async function getRecentMembers() {
  const user = await getSessionUser()
  const { role, id: userId } = user

  const trainerFilter = role === "TRAINER" ? { trainerId: userId } : {}

  return prisma.member.findMany({
    where: {
      archivedAt: null,
      ...trainerFilter,
    },
    select: {
      id: true,
      fullName: true,
      membershipNo: true,
      status: true,
      date: true,
      package: true,
      trainer: {
        select: { name: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  })
}
