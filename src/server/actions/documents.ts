"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

const ALLOWED_ROLES = ["OWNER", "ADMIN", "COUNSELLOR"]
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"]

type ActionResult =
  | { success: true; documentId: string }
  | {
      success: false
      error: {
        fieldErrors: Record<string, string[] | undefined>
        formErrors: string[]
      }
    }

async function requireWriteAccess() {
  const session = await auth()
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    throw new Error("You don't have permission to perform this action.")
  }
  return session
}

async function checkReadAccess(memberId: string) {
  const session = await auth()
  if (!session) {
    throw new Error("You must be logged in to perform this action.")
  }

  const { role, id: userId } = session.user
  const ALL_STAFF_ROLES = ["OWNER", "ADMIN", "COUNSELLOR", "TRAINER"]
  if (!ALL_STAFF_ROLES.includes(role)) {
    throw new Error("You don't have permission to perform this action.")
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
      throw new Error("You don't have permission to view records for this member.")
    }
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
  const category = formData.get("category") as string | null

  if (!file) {
    return {
      success: false,
      error: {
        fieldErrors: { file: ["Please select a file to upload."] },
        formErrors: [],
      },
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: {
        fieldErrors: { file: ["File size exceeds the 10MB limit."] },
        formErrors: [],
      },
    }
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: {
        fieldErrors: { file: ["Unsupported file type. Only PDF, JPEG, PNG, and WEBP are allowed."] },
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

    // Save metadata to DB and Log action atomically
    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          memberId,
          fileName: file.name,
          fileUrl: publicUrl,
          fileType: file.type || "application/octet-stream",
          category,
          uploaderId: session.user.id,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPLOAD_DOCUMENT",
          entityType: "Document",
          entityId: doc.id,
          details: { fileName: file.name, category },
        },
      })

      return doc
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

    // Delete from DB and Audit Log atomically
    await prisma.$transaction(async (tx) => {
      await tx.document.delete({
        where: { id: documentId },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE_DOCUMENT",
          entityType: "Document",
          entityId: documentId,
          details: { fileName: document.fileName },
        },
      })
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

/**
 * Generates a signed URL for secure download/viewing of a document.
 */
export async function getSignedDocumentUrl(
  documentId: string,
  memberId: string
): Promise<{ success: true; url: string } | { success: false; message: string }> {
  try {
    await checkReadAccess(memberId)

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        memberId,
      },
    })

    if (!document) {
      return { success: false, message: "Document not found." }
    }

    // Extract relative path from stored URL
    const pathParts = document.fileUrl.split("/documents/")
    const relativePath = pathParts[pathParts.length - 1]

    // Create signed URL valid for 1 hour (3600 seconds)
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(relativePath, 3600)

    if (error || !data?.signedUrl) {
      return { success: false, message: error?.message || "Failed to create signed URL." }
    }

    return { success: true, url: data.signedUrl }
  } catch (err: any) {
    return { success: false, message: err.message || "An unexpected error occurred." }
  }
}
