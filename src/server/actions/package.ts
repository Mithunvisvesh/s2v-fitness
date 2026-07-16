"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { packageSchema, type PackageFormValues } from "@/lib/validations/package"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

type ActionResult =
  | { success: true; packageId: string }
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

export async function createPackage(data: PackageFormValues): Promise<ActionResult> {
  try {
    const session = await requireAdminSession()
    const parsed = packageSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: {
          fieldErrors: parsed.error.flatten().fieldErrors,
          formErrors: parsed.error.flatten().formErrors,
        },
      }
    }

    const { name, durationMonths, price, isActive } = parsed.data

    const newPackage = await prisma.$transaction(async (tx) => {
      const p = await tx.package.create({
        data: {
          name,
          durationMonths,
          price: price !== undefined ? new Prisma.Decimal(price) : null,
          isActive,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_PACKAGE",
          entityType: "Package",
          entityId: p.id,
          details: { name: p.name, durationMonths: p.durationMonths, price: price },
        },
      })

      return p
    })

    revalidatePath("/packages")
    return { success: true, packageId: newPackage.id }
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

export async function updatePackage(
  id: string,
  data: PackageFormValues
): Promise<ActionResult> {
  try {
    const session = await requireAdminSession()
    const parsed = packageSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        error: {
          fieldErrors: parsed.error.flatten().fieldErrors,
          formErrors: parsed.error.flatten().formErrors,
        },
      }
    }

    const { name, durationMonths, price, isActive } = parsed.data

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.package.update({
        where: { id },
        data: {
          name,
          durationMonths,
          price: price !== undefined ? new Prisma.Decimal(price) : null,
          isActive,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE_PACKAGE",
          entityType: "Package",
          entityId: p.id,
          details: { name: p.name, durationMonths: p.durationMonths, price: price },
        },
      })

      return p
    })

    revalidatePath("/packages")
    return { success: true, packageId: updated.id }
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

export async function togglePackageStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const session = await requireAdminSession()

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.package.update({
        where: { id },
        data: { isActive },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: isActive ? "ACTIVATE_PACKAGE" : "DEACTIVATE_PACKAGE",
          entityType: "Package",
          entityId: p.id,
          details: { name: p.name, isActive },
        },
      })

      return p
    })

    revalidatePath("/packages")
    return { success: true, packageId: updated.id }
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
