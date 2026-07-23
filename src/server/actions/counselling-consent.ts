"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import {
  counsellingNoteSchema,
  consentSchema,
  type CounsellingNoteFormValues,
  type ConsentFormValues,
} from "@/lib/validations/counselling-consent"

export type ActionResult =
  | { success: true; id: string }
  | {
      success: false
      error: {
        fieldErrors: Record<string, string[] | undefined>
        formErrors: string[]
      }
    }

/**
 * Formats known Prisma database errors into clean ActionResults.
 */
function handlePrismaError(err: unknown): ActionResult {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: ["A record with this data already exists."],
        },
      }
    }
    if (err.code === "P2025") {
      return {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: ["The requested record was not found."],
        },
      }
    }
  }

  return {
    success: false,
    error: {
      fieldErrors: {},
      formErrors: [err instanceof Error ? err.message : "An unexpected database error occurred."],
    },
  }
}

interface CustomSession {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

type MutateAuthResult =
  | { success: true; session: CustomSession }
  | { success: false; actionResult: ActionResult }

/**
 * Enforces staff session and roles permissions:
 * - Only ADMIN & COUNSELLOR roles are allowed to write/modify notes and consent.
 * - TRAINERS are blocked.
 */
async function checkAdminCounsellorAuth(): Promise<MutateAuthResult> {
  const session = (await auth()) as CustomSession | null
  if (!session) {
    return {
      success: false,
      actionResult: {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: ["You must be logged in to perform this action."],
        },
      },
    }
  }

  const { role } = session.user

  const ALLOWED_ROLES = ["OWNER", "ADMIN", "COUNSELLOR"]
  if (!ALLOWED_ROLES.includes(role)) {
    return {
      success: false,
      actionResult: {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: ["You do not have permission to perform this action."],
        },
      },
    }
  }

  return { success: true, session }
}

/**
 * Saves a Counselling Note. Since notes are append-only logs, this always inserts a new row.
 */
export async function saveCounsellingNote(
  memberId: string,
  values: CounsellingNoteFormValues
): Promise<ActionResult> {
  const authCheck = await checkAdminCounsellorAuth()
  if (!authCheck.success) return authCheck.actionResult
  const { session } = authCheck

  const parsed = counsellingNoteSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const { noteType, description } = parsed.data

  try {
    const created = await prisma.counsellingNote.create({
      data: {
        memberId,
        authorId: session.user.id,
        noteType,
        description,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_COUNSELLINGNOTE",
        entityType: "CounsellingNote",
        entityId: created.id,
        details: { noteType },
      },
    })

    revalidatePath(`/members/${memberId}`)
    return { success: true, id: created.id }
  } catch (err) {
    return handlePrismaError(err)
  }
}
export async function saveConsent(
  memberId: string,
  values: ConsentFormValues
): Promise<ActionResult> {
  const authCheck = await checkAdminCounsellorAuth()
  if (!authCheck.success) return authCheck.actionResult
  const { session } = authCheck

  const parsed = consentSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const data = parsed.data

  try {
    const dbData = {
      emergencyContactName: data.emergencyContactName,
      emergencyMobile: data.emergencyMobile,
      relationship: data.relationship,
      consentDate: data.consentDate,
      digitalSignature: data.digitalSignature || "ACCEPTED_BY_MEMBER",
    }

    const existing = await prisma.consent.findUnique({
      where: { memberId },
      select: { id: true },
    })

    const consentId = await prisma.$transaction(async (tx) => {
      let cId: string

      if (existing) {
        const updated = await tx.consent.update({
          where: { id: existing.id },
          data: dbData,
        })
        cId = updated.id

        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: "COMPLETE_CONSENT",
            entityType: "Consent",
            entityId: cId,
            details: { consentDate: data.consentDate, event: "DOCUMENT_UPDATED" },
          },
        })
      } else {
        const created = await tx.consent.create({
          data: {
            memberId,
            ...dbData,
          },
        })
        cId = created.id

        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: "COMPLETE_CONSENT",
            entityType: "Consent",
            entityId: cId,
            details: { consentDate: data.consentDate, event: "DOCUMENT_COMPLETED" },
          },
        })
      }

      return cId
    })

    revalidatePath(`/members/${memberId}`)
    return { success: true, id: consentId }
  } catch (err) {
    return handlePrismaError(err)
  }
}

export async function logSigningEvent(
  memberId: string,
  event: "START_SIGNING" | "CLEAR_SIGNING" | "ACCEPT_SIGNING" | "COMPLETE_CONSENT"
): Promise<ActionResult> {
  const authCheck = await checkAdminCounsellorAuth()
  if (!authCheck.success) return authCheck.actionResult
  const { session } = authCheck

  try {
    const log = await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: event,
        entityType: "Consent",
        entityId: memberId,
        details: { timestamp: new Date().toISOString() },
      },
    })
    return { success: true, id: log.id }
  } catch (err) {
    return handlePrismaError(err)
  }
}

export async function deleteConsent(memberId: string): Promise<ActionResult> {
  const authCheck = await checkAdminCounsellorAuth()
  if (!authCheck.success) return authCheck.actionResult
  const { session } = authCheck

  try {
    const existing = await prisma.consent.findUnique({
      where: { memberId },
      select: { id: true },
    })

    if (!existing) {
      return { success: true, id: "" }
    }

    await prisma.$transaction(async (tx) => {
      await tx.consent.delete({
        where: { id: existing.id },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CLEAR_SIGNING",
          entityType: "Consent",
          entityId: memberId,
          details: { event: "CONSENT_DELETED_BY_STAFF" },
        },
      })
    })

    revalidatePath(`/members/${memberId}`)
    return { success: true, id: "" }
  } catch (err) {
    return handlePrismaError(err)
  }
}
