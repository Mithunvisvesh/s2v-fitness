"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

const ALLOWED_ROLES = ["ADMIN", "COUNSELLOR"]

type ActionResult =
  | { success: true; documentId: string }
  | {
      success: false
      error: {
        fieldErrors: Record<string, string[] | undefined>
        formErrors: string[]
      }
    }

/**
 * Enforces staff upload/delete permissions:
 * Only ADMIN or COUNSELLOR roles are allowed.
 */
async function requireWriteAccess() {
  const session = await auth()
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    throw new Error("You don't have permission to perform this action.")
  }
  return session
}

/**
 * Uploads a document to Supabase storage and creates a record in the database.
 */
export async function uploadDocument(
  memberId: string,
  formData: FormData
): Promise<ActionResult> {
  let session
  try {
    session = await requireWriteAccess()
  } catch (err) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [err instanceof Error ? err.message : "Unauthorised"],
      },
    }
  }

  const file = formData.get("file") as File | null
  const category = (formData.get("category") as string) || "General"

  if (!file || file.size === 0) {
    return {
      success: false,
      error: {
        fieldErrors: { file: ["No file provided or file is empty."] },
        formErrors: [],
      },
    }
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    
    // Construct unique path inside bucket: memberId/timestamp_filename
    const relativePath = `${memberId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(relativePath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      })

    if (uploadError) {
      return {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: [`Supabase upload error: ${uploadError.message}`],
        },
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(relativePath)

    // Save metadata to DB
    const document = await prisma.document.create({
      data: {
        memberId,
        fileName: file.name,
        fileUrl: publicUrl,
        fileType: file.type || "application/octet-stream",
        category,
        uploaderId: session.user.id,
      },
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPLOAD_DOCUMENT",
        entityType: "Document",
        entityId: document.id,
        details: { fileName: file.name, category },
      },
    })

    revalidatePath(`/members/${memberId}`)
    return { success: true, documentId: document.id }
  } catch (err) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [err instanceof Error ? err.message : "An unexpected error occurred during upload."],
      },
    }
  }
}

/**
 * Deletes a document from Supabase storage and removes it from the database.
 */
export async function deleteDocument(
  documentId: string
): Promise<ActionResult> {
  let session
  try {
    session = await requireWriteAccess()
  } catch (err) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [err instanceof Error ? err.message : "Unauthorised"],
      },
    }
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: ["Document not found in database."],
        },
      }
    }

    // Extract relative path from public URL
    const pathParts = document.fileUrl.split("/documents/")
    const relativePath = pathParts[pathParts.length - 1]

    // Delete from Supabase
    const { error: deleteError } = await supabase.storage
      .from("documents")
      .remove([relativePath])

    if (deleteError) {
      return {
        success: false,
        error: {
          fieldErrors: {},
          formErrors: [`Supabase delete error: ${deleteError.message}`],
        },
      }
    }

    // Delete from DB
    await prisma.document.delete({
      where: { id: documentId },
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_DOCUMENT",
        entityType: "Document",
        entityId: documentId,
        details: { fileName: document.fileName },
      },
    })

    revalidatePath(`/members/${document.memberId}`)
    return { success: true, documentId }
  } catch (err) {
    return {
      success: false,
      error: {
        fieldErrors: {},
        formErrors: [err instanceof Error ? err.message : "An unexpected error occurred during deletion."],
      },
    }
  }
}
