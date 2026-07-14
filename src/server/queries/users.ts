import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Fetches all active users whose role is TRAINER.
 * Returns only id and name for dropdown population.
 */
export async function getTrainers() {
  const session = await auth()
  if (!session) {
    throw new Error("Unauthorised: Access denied.")
  }

  return prisma.user.findMany({
    where: {
      role: "TRAINER",
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  })
}
