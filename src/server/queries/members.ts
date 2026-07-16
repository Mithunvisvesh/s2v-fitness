import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"

export interface MemberListParams {
  search?: string
  status?: string
  package?: string
  page?: number
  pageSize?: number
}

export interface Viewer {
  id: string
  role: string
}

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

function buildWhere(
  params: MemberListParams,
  viewer: Viewer,
  options: { archivedOnly?: boolean } = {}
): Prisma.MemberWhereInput {
  const where: Prisma.MemberWhereInput = {}

  if (viewer.role === "TRAINER") {
    where.trainerId = viewer.id
  }

  if (options.archivedOnly) {
    where.status = "ARCHIVED"
  } else if (params.status) {
    where.status = params.status as Prisma.MemberWhereInput["status"]
  } else {
    where.status = { not: "ARCHIVED" }
  }

  if (params.package) {
    where.package = params.package as Prisma.MemberWhereInput["package"]
  }

  if (params.search) {
    const q = params.search.trim()
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { membershipNo: { contains: q, mode: "insensitive" } },
        { mobile: { contains: q } },
        { email: { contains: q, mode: "insensitive" } },
      ]
    }
  }

  return where
}

export async function getMembers(
  params: MemberListParams,
  viewer: Viewer,
  options: { archivedOnly?: boolean } = {}
) {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE))
  const where = buildWhere(params, viewer, options)

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        counsellor: { select: { id: true, name: true } },
        trainer: { select: { id: true, name: true } },
        fitnessGoals: true,
      },
    }),
    prisma.member.count({ where }),
  ])

  return {
    members,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  }
}
export async function getMemberById(id: string) {
  return prisma.member.findUnique({
    where: { id },
    include: {
      counsellor: { select: { id: true, name: true, email: true } },
      trainer: { select: { id: true, name: true, email: true } },
      fitnessGoals: true,
      packageRelation: true,
      renewals: {
        include: {
          renewedByUser: {
            select: { name: true },
          },
        },
        orderBy: {
          renewedAt: "desc",
        },
      },
    },
  })
}

export async function getStaffOptions() {
  const staff = await prisma.user.findMany({
    where: {
      role: { in: ["COUNSELLOR", "TRAINER"] },
      isActive: true,
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  })

  return {
    counsellors: staff.filter((s) => s.role === "COUNSELLOR"),
    trainers: staff.filter((s) => s.role === "TRAINER"),
  }
}

export async function getSuggestedMembershipNo() {
  const count = await prisma.member.count()
  return `S2V-${String(count + 1).padStart(4, "0")}`
}

export async function getArchivedMembers(params: MemberListParams = {}) {
  const session = await auth()
  if (!session) {
    throw new Error("Unauthorised: Access denied.")
  }
  const viewer = {
    id: session.user.id,
    role: session.user.role,
  }
  return getMembers(params, viewer, { archivedOnly: true })
}
