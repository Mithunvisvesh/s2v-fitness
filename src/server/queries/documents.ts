import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Enforces staff access rights for Documents:
 * - ADMIN, COUNSELLOR & TRAINER: Read-access.
 * - TRAINER: Restricted to member records assigned to them.
 */
async function requireDocumentAccess(memberId: string) {
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
 * Fetches all documents for a member, sorted newest first.
 * Includes the uploader details.
 */
export async function getMemberDocuments(memberId: string) {
  await requireDocumentAccess(memberId)

  return prisma.document.findMany({
    where: {
      memberId,
    },
    orderBy: {
      uploadedAt: "desc",
    },
    include: {
      uploader: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  })
}
