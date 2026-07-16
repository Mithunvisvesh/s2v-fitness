"use server"

import { prisma } from "@/lib/db"

import { auth } from "@/lib/auth"
import { staffSchema, changePasswordSchema, type StaffFormValues, type ChangePasswordFormValues } from "@/lib/validations/staff"
import { hash, compare } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

type ActionResult =
  | { success: true; staffId: string }
  | {
      success: false
      error: {
        fieldErrors: Record<string, string[] | undefined>
        formErrors: string[]
      }
    }

async function requireAdminSession() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("You don't have permission to perform this action.")
  }
  return session
}

function fieldError(field: string, message: string): ActionResult {
  return {
    success: false,
    error: { fieldErrors: { [field]: [message] }, formErrors: [] },
  }
}

export async function createStaff(data: StaffFormValues): Promise<ActionResult> {
  try {
    const session = await requireAdminSession()
    const parsed = staffSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: {
          fieldErrors: parsed.error.flatten().fieldErrors,
          formErrors: parsed.error.flatten().formErrors,
        },
      }
    }

    const { name, email, role, password } = parsed.data

    if (!password || password.trim().length < 8) {
      return fieldError("password", "Password is required and must be at least 8 characters.")
    }

    const trimmedEmail = email.toLowerCase().trim()

    // Uniqueness check
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: { id: true },
    })

    if (existing) {
      return fieldError("email", "A staff member with this email address already exists.")
    }

    const hashedPassword = await hash(password, 10)

    const newStaff = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name,
          email: trimmedEmail,
          password: hashedPassword,
          role,
          isActive: true,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_STAFF",
          entityType: "User",
          entityId: u.id,
          details: { email: u.email, role: u.role, name: u.name },
        },
      })

      return u
    })

    revalidatePath("/staff")
    return { success: true, staffId: newStaff.id }
  } catch (err: any) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [err.message || "An unexpected error occurred."],
      },
    }
  }
}

export async function updateStaff(
  id: string,
  data: StaffFormValues
): Promise<ActionResult> {
  try {
    const session = await requireAdminSession()
    const parsed = staffSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: {
          fieldErrors: parsed.error.flatten().fieldErrors,
          formErrors: parsed.error.flatten().formErrors,
        },
      }
    }

    const { name, email, role, password } = parsed.data
    const trimmedEmail = email.toLowerCase().trim()

    // Uniqueness check excluding self
    const existing = await prisma.user.findFirst({
      where: {
        email: trimmedEmail,
        NOT: { id },
      },
      select: { id: true },
    })

    if (existing) {
      return fieldError("email", "A staff member with this email address already exists.")
    }

    const updateData: Prisma.UserUpdateInput = {
      name,
      email: trimmedEmail,
      role,
    }

    if (password && password.trim().length >= 8) {
      updateData.password = await hash(password, 10)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: updateData,
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_STAFF",
          entityType: "User",
          entityId: u.id,
          details: { email: u.email, role: u.role, name: u.name },
        },
      })

      return u
    })

    revalidatePath("/staff")
    return { success: true, staffId: updated.id }
  } catch (err: any) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [err.message || "An unexpected error occurred."],
      },
    }
  }
}

export async function toggleStaffStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const session = await requireAdminSession()

    if (id === session.user.id) {
      return {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: ["You cannot deactivate your own account."],
        },
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: { isActive },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: isActive ? "ACTIVATE_STAFF" : "DEACTIVATE_STAFF",
          entityType: "User",
          entityId: u.id,
          details: { email: u.email, role: u.role, name: u.name, isActive },
        },
      })

      return u
    })

    revalidatePath("/staff")
    return { success: true, staffId: updated.id }
  } catch (err: any) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [err.message || "An unexpected error occurred."],
      },
    }
  }
}

export async function changeOwnPassword(data: ChangePasswordFormValues): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session) {
      throw new Error("You must be logged in to change your password.")
    }

    const parsed = changePasswordSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: {
          fieldErrors: parsed.error.flatten().fieldErrors,
          formErrors: parsed.error.flatten().formErrors,
        },
      }
    }

    const { currentPassword, newPassword } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      throw new Error("User account not found.")
    }

    const matches = await compare(currentPassword, user.password)
    if (!matches) {
      return {
        success: false,
        error: {
          fieldErrors: { currentPassword: ["Current password is incorrect"] },
          formErrors: [],
        },
      }
    }

    const hashedPassword = await hash(newPassword, 10)

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CHANGE_PASSWORD",
          entityType: "User",
          entityId: session.user.id,
          details: { email: u.email, name: u.name },
        },
      })

      return u
    })

    return { success: true, staffId: updated.id }
  } catch (err: any) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [err.message || "An unexpected error occurred."],
      },
    }
  }
}
