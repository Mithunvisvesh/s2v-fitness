import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

interface GetAuditLogsParams {
  page?: number
  limit?: number
  search?: string
}

export async function getAuditLogs({ page = 1, limit = 20, search }: GetAuditLogsParams = {}) {
  const session = await auth()
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    throw new Error("Unauthorised: Access denied.")
  }

  const offset = (page - 1) * limit

  // Optional search conditions
  const where: any = {}
  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { entityType: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  }
}
