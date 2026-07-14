"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { memberSchema, type MemberFormValues } from "@/lib/validations/member"
import { revalidatePath } from "next/cache"
import { calculateAge } from "@/lib/utils"
import { Prisma } from "@prisma/client"

const STAFF_ROLES = ["ADMIN", "COUNSELLOR"]

type ActionResult =
  | { success: true; memberId: string }
  | {
      success: false
      error: {
        fieldErrors: Record<string, string[] | undefined>
        formErrors: string[]
      }
    }

async function requireStaffSession() {
  const session = await auth()
  if (!session || !STAFF_ROLES.includes(session.user.role)) {
    throw new Error("You don't have permission to perform this action.")
  }
  return session
}

/** Build a single-field error payload matching the shape member-form.tsx expects. */
function fieldError(field: string, message: string): ActionResult {
  return {
    success: false,
    error: { fieldErrors: { [field]: [message] }, formErrors: [] },
  }
}

/**
 * Translate a Prisma P2002 unique-constraint violation into a user-facing
 * field error.  Returns null when the error is not a P2002.
 */
function handleP2002(err: unknown): ActionResult | null {
  if (
    !(err instanceof Prisma.PrismaClientKnownRequestError) ||
    err.code !== "P2002"
  ) {
    return null
  }

  // meta.target is the array of column names that triggered the constraint.
  const targets = (err.meta?.target as string[] | undefined) ?? []

  if (targets.includes("mobile")) {
    return fieldError("mobile", "A member with this phone number already exists.")
  }
  if (targets.includes("email")) {
    return fieldError("email", "A member with this email address already exists.")
  }
  if (targets.includes("membershipNo")) {
    return fieldError(
      "membershipNo",
      "A member with this membership number already exists."
    )
  }

  // Unknown unique field — surface a generic form-level message.
  return {
    success: false,
    error: {
      fieldErrors: {},
      formErrors: ["A record with one of these values already exists. Please check your input."],
    },
  }
}

/**
 * Pre-flight uniqueness check via SELECT — catches conflicts before the write
 * and gives a cleaner UX than relying solely on the constraint catch.
 * Pass `excludeId` when editing so the member being saved is excluded.
 */
async function checkUniqueness(
  data: { membershipNo: string; mobile: string; email?: string | null },
  excludeId?: string
): Promise<ActionResult | null> {
  const notSelf = excludeId ? { NOT: { id: excludeId } } : {}

  const [byNo, byMobile, byEmail] = await Promise.all([
    prisma.member.findFirst({
      where: { membershipNo: data.membershipNo, ...notSelf },
      select: { id: true },
    }),
    prisma.member.findFirst({
      where: { mobile: data.mobile, ...notSelf },
      select: { id: true },
    }),
    data.email
      ? prisma.member.findFirst({
          where: { email: data.email, ...notSelf },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])

  if (byNo) {
    return fieldError(
      "membershipNo",
      `Membership number "${data.membershipNo}" is already in use.`
    )
  }
  if (byMobile) {
    return fieldError("mobile", "A member with this phone number already exists.")
  }
  if (byEmail) {
    return fieldError("email", "A member with this email address already exists.")
  }

  return null
}

export async function createMember(values: MemberFormValues): Promise<ActionResult> {
  const session = await requireStaffSession()

  const parsed = memberSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const { fitnessGoals, registrationDate, counsellorId, trainerId, ...rest } = parsed.data

  // Pre-flight check (fast, avoids a write round-trip for the common case)
  const preflight = await checkUniqueness({
    membershipNo: rest.membershipNo,
    mobile: rest.mobile,
    email: rest.email || null,
  })
  if (preflight) return preflight

  try {
    const member = await prisma.member.create({
      data: {
        ...rest,
        email: rest.email || null,
        date: registrationDate ?? new Date(),
        age: calculateAge(rest.dateOfBirth),
        fitnessGoals: { create: fitnessGoals.map((goal) => ({ goal })) },
        counsellorId:
          session.user.role === "COUNSELLOR"
            ? session.user.id
            : counsellorId || null,
        trainerId: trainerId || null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_MEMBER",
        entityType: "Member",
        entityId: member.id,
      },
    })

    revalidatePath("/members")
    return { success: true, memberId: member.id }
  } catch (err) {
    // Safety net: another request may have inserted between pre-flight and write
    const constraintError = handleP2002(err)
    if (constraintError) return constraintError
    throw err // re-throw unexpected errors so Next.js error boundaries catch them
  }
}

export async function updateMember(
  memberId: string,
  values: MemberFormValues
): Promise<ActionResult> {
  const session = await requireStaffSession()

  const parsed = memberSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() }
  }

  const { fitnessGoals, registrationDate, counsellorId, trainerId, ...rest } = parsed.data

  // Pre-flight check — exclude the member being edited
  const preflight = await checkUniqueness(
    {
      membershipNo: rest.membershipNo,
      mobile: rest.mobile,
      email: rest.email || null,
    },
    memberId
  )
  if (preflight) return preflight

  try {
    await prisma.member.update({
      where: { id: memberId },
      data: {
        ...rest,
        email: rest.email || null,
        ...(registrationDate ? { date: registrationDate } : {}),
        age: calculateAge(rest.dateOfBirth),
        counsellorId: counsellorId || null,
        trainerId: trainerId || null,
        fitnessGoals: {
          deleteMany: {},
          create: fitnessGoals.map((goal) => ({ goal })),
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_MEMBER",
        entityType: "Member",
        entityId: memberId,
      },
    })

    revalidatePath("/members")
    revalidatePath(`/members/${memberId}`)
    return { success: true, memberId }
  } catch (err) {
    const constraintError = handleP2002(err)
    if (constraintError) return constraintError
    throw err
  }
}

export async function archiveMember(memberId: string) {
  const session = await requireStaffSession()

  await prisma.member.update({
    where: { id: memberId },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ARCHIVE_MEMBER",
      entityType: "Member",
      entityId: memberId,
    },
  })

  revalidatePath("/members")
  revalidatePath("/archive")
  revalidatePath(`/members/${memberId}`)
}

export async function restoreMember(memberId: string) {
  const session = await requireStaffSession()

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { endDate: true },
  })
  const restoredStatus =
    member && member.endDate < new Date() ? "EXPIRED" : "ACTIVE"

  await prisma.member.update({
    where: { id: memberId },
    data: { status: restoredStatus, archivedAt: null },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "RESTORE_MEMBER",
      entityType: "Member",
      entityId: memberId,
    },
  })

  revalidatePath("/members")
  revalidatePath("/archive")
  revalidatePath(`/members/${memberId}`)
}

export async function assignTrainer(
  memberId: string,
  trainerId: string | null
): Promise<ActionResult> {
  const session = await requireStaffSession()

  try {
    await prisma.member.update({
      where: { id: memberId },
      data: { trainerId: trainerId || null },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_MEMBER_TRAINER",
        entityType: "Member",
        entityId: memberId,
        details: { trainerId },
      },
    })

    revalidatePath("/members")
    revalidatePath(`/members/${memberId}`)
    return { success: true, memberId }
  } catch (err) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [err instanceof Error ? err.message : "An unexpected error occurred."],
      },
    }
  }
}
