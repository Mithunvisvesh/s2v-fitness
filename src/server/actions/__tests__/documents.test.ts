import { describe, it, expect, vi, beforeEach } from "vitest"
import { deleteDocument, getSignedDocumentUrl } from "../documents"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

vi.mock("@/lib/db", () => ({
  prisma: {
    member: {
      findUnique: vi.fn(),
    },
    document: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}))

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed-url.com" }, error: null }),
      })),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Documents Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("deleteDocument", () => {
    it("fails if user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await deleteDocument("doc-1")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.formErrors).toContain("You don't have permission to perform this action.")
      }
    })

    it("fails if user is a trainer", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "trainer-1", name: "Trainer One", email: "t1@test.com", role: "TRAINER" },
      } as any)

      const result = await deleteDocument("doc-1")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.formErrors).toContain("You don't have permission to perform this action.")
      }
    })

    it("succeeds if admin or counselor deletes document", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "admin-1", name: "Admin", email: "admin@test.com", role: "ADMIN" },
      } as any)

      vi.mocked(prisma.document.findUnique).mockResolvedValue({
        id: "doc-1",
        fileKey: "some-key",
        fileName: "test.pdf",
        fileUrl: "https://bucket.supabase.co/storage/v1/object/public/documents/test.pdf",
      } as any)

      vi.mocked(prisma.document.delete).mockResolvedValue({
        id: "doc-1",
      } as any)

      const result = await deleteDocument("doc-1")

      expect(result.success).toBe(true)
    })
  })

  describe("getSignedDocumentUrl", () => {
    it("fails if user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await getSignedDocumentUrl("doc-1", "member-1")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toContain("You must be logged in to perform this action.")
      }
    })

    it("fails if trainer does not own the member", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "trainer-1", name: "Trainer One", email: "t1@test.com", role: "TRAINER" },
      } as any)

      vi.mocked(prisma.member.findUnique).mockResolvedValue({
        id: "member-1",
        trainerId: "trainer-2",
      } as any)

      const result = await getSignedDocumentUrl("doc-1", "member-1")

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.message).toContain("You don't have permission to view records for this member.")
      }
    })

    it("succeeds if admin or counselor requests signed URL", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "admin-1", name: "Admin", email: "admin@test.com", role: "ADMIN" },
      } as any)

      vi.mocked(prisma.document.findFirst).mockResolvedValue({
        id: "doc-1",
        fileKey: "some-key",
        fileName: "test.pdf",
        fileUrl: "https://bucket.supabase.co/storage/v1/object/public/documents/test.pdf",
      } as any)

      const result = await getSignedDocumentUrl("doc-1", "member-1")

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.url).toBe("https://signed-url.com")
      }
    })
  })
})
