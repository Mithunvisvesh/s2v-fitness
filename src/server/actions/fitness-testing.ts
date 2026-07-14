"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import {
  posturalAnalysisSchema,
  fitnessTestSchema,
  type PosturalAnalysisFormValues,
  type FitnessTestFormValues,
} from "@/lib/validations/fitness-testing"

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
          formErrors: ["A record with this date already exists."],
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
 * - ADMIN, COUNSELLOR & TRAINER: Allowed to write.
 * - TRAINER: Restricted to write only for explicitly assigned members.
 */
async function checkMutateAuth(
  memberId: string
): Promise<MutateAuthResult> {
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

  const { role, id: userId } = session.user

  const ALLOWED_ROLES = ["ADMIN", "COUNSELLOR", "TRAINER"]
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

  if (role === "TRAINER") {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { trainerId: true },
    })
    if (!member) {
      return {
        success: false,
        actionResult: {
          success: false,
          error: {
            fieldErrors: {},
            formErrors: ["Member not found."],
          },
        },
      }
    }
    if (member.trainerId !== userId) {
      return {
        success: false,
        actionResult: {
          success: false,
          error: {
            fieldErrors: {},
            formErrors: ["You don't have permission to modify records for this member."],
          },
        },
      }
    }
  }

  return { success: true, session }
}

/**
 * Saves a Postural Analysis record. Creates a new record or updates an existing one for the same date.
 */
export async function savePosturalAnalysis(
  memberId: string,
  values: PosturalAnalysisFormValues
): Promise<ActionResult> {
  const authCheck = await checkMutateAuth(memberId)
  if (!authCheck.success) return authCheck.actionResult
  const { session } = authCheck

  const parsed = posturalAnalysisSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const data = parsed.data

  try {
    const existing = await prisma.posturalAnalysis.findFirst({
      where: {
        memberId,
        assessedAt: data.assessedAt,
      },
      select: { id: true },
    })

    let posturalId: string

    const dbData = {
      assessorId: session.user.id,
      neckFlexion: data.neckFlexion ?? null,
      neckLateralFlexion: data.neckLateralFlexion ?? null,
      pokeChin: data.pokeChin ?? null,
      neckLateralRotation: data.neckLateralRotation ?? null,
      spineKyphosis: data.spineKyphosis ?? null,
      spineLordosis: data.spineLordosis ?? null,
      spineScoliosis: data.spineScoliosis ?? null,
      spineKyphoscoliosis: data.spineKyphoscoliosis ?? null,
      scapulaLeft: data.scapulaLeft ?? null,
      scapulaRight: data.scapulaRight ?? null,
      lphcAsymmetrical: data.lphcAsymmetrical ?? null,
      kneeLeft: data.kneeLeft ?? null,
      kneeRight: data.kneeRight ?? null,
      footLeft: data.footLeft ?? null,
      footRight: data.footRight ?? null,
      symmetryDeviation: data.symmetryDeviation ?? null,
      trainerNotes: data.trainerNotes ?? null,
    }

    if (existing) {
      const updated = await prisma.posturalAnalysis.update({
        where: { id: existing.id },
        data: dbData,
      })
      posturalId = updated.id

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_POSTURAL",
          entityType: "PosturalAnalysis",
          entityId: posturalId,
          details: { assessedAt: data.assessedAt },
        },
      })
    } else {
      const created = await prisma.posturalAnalysis.create({
        data: {
          memberId,
          assessedAt: data.assessedAt,
          ...dbData,
        },
      })
      posturalId = created.id

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_POSTURAL",
          entityType: "PosturalAnalysis",
          entityId: posturalId,
          details: { assessedAt: data.assessedAt },
        },
      })
    }

    revalidatePath(`/members/${memberId}`)
    return { success: true, id: posturalId }
  } catch (err) {
    return handlePrismaError(err)
  }
}

/**
 * Saves a Fitness Test record. Creates a new record or updates an existing one for the same date.
 */
export async function saveFitnessTest(
  memberId: string,
  values: FitnessTestFormValues
): Promise<ActionResult> {
  const authCheck = await checkMutateAuth(memberId)
  if (!authCheck.success) return authCheck.actionResult
  const { session } = authCheck

  const parsed = fitnessTestSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const data = parsed.data

  try {
    const existing = await prisma.fitnessTest.findFirst({
      where: {
        memberId,
        testDate: data.testDate,
      },
      select: { id: true },
    })

    let testId: string

    const dbData = {
      assessorId: session.user.id,
      cardioMachine: data.cardioMachine ?? null,
      distance: data.distance ?? null,
      durationMinutes: data.durationMinutes ?? null,
      treadmillNotes: data.treadmillNotes ?? null,
      wallPushUpsReps: data.wallPushUpsReps ?? null,
      wallPushUpsDurationSec: data.wallPushUpsDurationSec ?? null,
      squatsReps: data.squatsReps ?? null,
      squatsDurationSec: data.squatsDurationSec ?? null,
      crunchesReps: data.crunchesReps ?? null,
      crunchesDurationSec: data.crunchesDurationSec ?? null,
      sitAndReachCm: data.sitAndReachCm ?? null,
      ironManHoldSec: data.ironManHoldSec ?? null,
      pelvicBridgeSec: data.pelvicBridgeSec ?? null,
      rProprioception: data.rProprioception ?? null,
      rSingleLegStanding: data.rSingleLegStanding ?? null,
      rStandingBalance: data.rStandingBalance ?? null,
      lProprioception: data.lProprioception ?? null,
      lSingleLegStanding: data.lSingleLegStanding ?? null,
      lStandingBalance: data.lStandingBalance ?? null,
    }

    if (existing) {
      const updated = await prisma.fitnessTest.update({
        where: { id: existing.id },
        data: dbData,
      })
      testId = updated.id

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_FITNESSTEST",
          entityType: "FitnessTest",
          entityId: testId,
          details: { testDate: data.testDate },
        },
      })
    } else {
      const created = await prisma.fitnessTest.create({
        data: {
          memberId,
          testDate: data.testDate,
          ...dbData,
        },
      })
      testId = created.id

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_FITNESSTEST",
          entityType: "FitnessTest",
          entityId: testId,
          details: { testDate: data.testDate },
        },
      })
    }

    revalidatePath(`/members/${memberId}`)
    return { success: true, id: testId }
  } catch (err) {
    return handlePrismaError(err)
  }
}
