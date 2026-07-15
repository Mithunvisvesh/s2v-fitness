import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Prisma } from "@prisma/client"

export interface AssessmentsOverviewParams {
  search?: string
  page?: number
  pageSize?: number
}

export async function getAssessmentsOverview(params: AssessmentsOverviewParams) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const role = session.user.role
  const userId = session.user.id

  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.max(1, params.pageSize ?? 10)

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
        package: true,
        parQAssessments: {
          orderBy: { assessedAt: "desc" },
          take: 1,
          select: {
            assessedAt: true,
            medicalClearanceRequired: true,
          }
        },
        posturalAnalyses: {
          orderBy: { assessedAt: "desc" },
          take: 1,
          select: {
            assessedAt: true
          }
        },
        fitnessTests: {
          orderBy: { testDate: "desc" },
          take: 1,
          select: {
            testDate: true
          }
        }
      }
    }),
    prisma.member.count({ where })
  ])

  const formatted = members.map((member) => {
    const parq = member.parQAssessments[0] ?? null
    const postural = member.posturalAnalyses[0] ?? null
    const fitness = member.fitnessTests[0] ?? null

    return {
      id: member.id,
      fullName: member.fullName,
      membershipNo: member.membershipNo,
      package: member.package,
      parqDate: parq?.assessedAt ?? null,
      parqClearanceRequired: parq?.medicalClearanceRequired ?? false,
      posturalDate: postural?.assessedAt ?? null,
      fitnessDate: fitness?.testDate ?? null,
    }
  })

  return {
    data: formatted,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  }
}
