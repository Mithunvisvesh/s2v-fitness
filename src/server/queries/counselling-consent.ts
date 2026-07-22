import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * Enforces staff access rights for Counselling Notes:
 * - ADMIN, COUNSELLOR & TRAINER: Read-access.
 * - TRAINER: Restricted to member records assigned to them.
 */
async function requireNotesAccess(memberId: string) {
  const session = await auth()
  if (!session) {
    throw new Error("Unauthorised: Access denied.")
  }

  const { role, id: userId } = session.user

  const ALLOWED_ROLES = ["OWNER", "ADMIN", "COUNSELLOR", "TRAINER"]
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
 * Enforces staff access rights for Consent Records:
 * - ADMIN & COUNSELLOR: Allowed access.
 * - TRAINER: Strictly blocked from viewing consent (administrative only).
 */
async function requireConsentAccess() {
  const session = await auth()
  if (!session) {
    throw new Error("Unauthorised: Access denied.")
  }

  const { role } = session.user

  const ALLOWED_ROLES = ["OWNER", "ADMIN", "COUNSELLOR"]
  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("Access Denied: You do not have permission to view consent forms.")
  }

  return session
}

export async function getCounsellingNotes(memberId: string) {
  await requireNotesAccess(memberId)
  return prisma.counsellingNote.findMany({
    where: { memberId },
    include: {
      author: {
        select: { name: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getMemberConsent(memberId: string) {
  await requireConsentAccess()
  return prisma.consent.findUnique({
    where: { memberId },
  })
}
