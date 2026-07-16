"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { renewalSchema, type RenewalFormValues } from "@/lib/validations/renewal"
import { revalidatePath } from "next/cache"

type ActionResult =
  | { success: true; memberId: string }
  | {
      success: false
      error: {
        fieldErrors: Record<string, string[] | undefined>
        formErrors: string[]
      }
    }

const STAFF_ROLES = ["ADMIN", "COUNSELLOR"]

async function requireStaffSession() {
  const session = await auth()
  if (!session || !STAFF_ROLES.includes(session.user.role)) {
    throw new Error("You don't have permission to perform this action.")
  }
  return session
}

export async function renewMembership(
  memberId: string,
  values: RenewalFormValues
): Promise<ActionResult> {
  try {
    const session = await requireStaffSession()
    const parsed = renewalSchema.safeParse(values)
    if (!parsed.success) {
      return {
        success: false,
        error: {
          fieldErrors: parsed.error.flatten().fieldErrors,
          formErrors: parsed.error.flatten().formErrors,
        },
      }
    }

    const { packageId, startDate, endDate } = parsed.data

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current member details
      const member = await tx.member.findUnique({
        where: { id: memberId },
        select: { endDate: true },
      })

      if (!member) {
        throw new Error("Member not found.")
      }

      // 2. Fetch package details
      const pkg = await tx.package.findUnique({
        where: { id: packageId },
      })

      if (!pkg) {
        throw new Error("Selected package not found.")
      }

      // 3. Map duration to standard package enum for database non-null constraint
      let enumVal: "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY" = "MONTHLY"
      if (pkg.durationMonths === 3) enumVal = "QUARTERLY"
      else if (pkg.durationMonths === 6) enumVal = "HALF_YEARLY"
      else if (pkg.durationMonths === 12) enumVal = "YEARLY"

      const newStatus = endDate < new Date() ? "EXPIRED" : "ACTIVE"

      // 4. Update member details
      await tx.member.update({
        where: { id: memberId },
        data: {
          startDate,
          endDate,
          packageId,
          package: enumVal,
          durationMonths: pkg.durationMonths,
          status: newStatus,
        },
      })

      // 5. Create membership renewal record
      const renewal = await tx.membershipRenewal.create({
        data: {
          memberId,
          previousEndDate: member.endDate,
          newEndDate: endDate,
          packageAtRenewal: pkg.name,
          renewedBy: session.user.id,
        },
      })

      // 6. Log the action
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "RENEW_MEMBERSHIP",
          entityType: "Member",
          entityId: memberId,
          details: {
            package: pkg.name,
            startDate,
            endDate,
            renewalId: renewal.id,
          },
        },
      })

      return { success: true as const, memberId }
    })

    revalidatePath("/members")
    revalidatePath(`/members/${memberId}`)
    return result
  } catch (err: any) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [err.message || "An unexpected error occurred during membership renewal."],
      },
    }
  }
}
