import { prisma } from "@/lib/db"

export async function getMemberMeasurements(memberId: string) {
  return prisma.measurement.findMany({
    where: { memberId },
    orderBy: { measuredAt: "desc" },
  })
}

export async function getLatestMeasurement(memberId: string) {
  return prisma.measurement.findFirst({
    where: { memberId },
    orderBy: { measuredAt: "desc" },
  })
}

export async function getMeasurementById(id: string) {
  return prisma.measurement.findUnique({ where: { id } })
}
