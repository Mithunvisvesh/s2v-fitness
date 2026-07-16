import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function getPackagesList() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorised: Access denied.")
  }

  return prisma.package.findMany({
    orderBy: {
      name: "asc",
    },
  })
}

export async function getActivePackages() {
  const session = await auth()
  if (!session) {
    throw new Error("Unauthorised: Access denied.")
  }

  return prisma.package.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  })
}
