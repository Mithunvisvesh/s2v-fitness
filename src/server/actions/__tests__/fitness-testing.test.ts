import { describe, it, expect, vi, beforeEach } from "vitest"
import { saveFitnessTest } from "../fitness-testing"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

vi.mock("@/lib/db", () => ({
  prisma: {
    member: {
      findUnique: vi.fn(),
    },
    fitnessTest: {
      findFirst: vi.fn(),
      create: vi.fn(),
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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Fitness Testing Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fails if user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const result = await saveFitnessTest("member-1", {
      testDate: new Date(),
      cardioMachine: "Treadmill",
      durationMinutes: 15,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.formErrors).toContain("You must be logged in to perform this action.")
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

    const result = await saveFitnessTest("member-1", {
      testDate: new Date(),
      cardioMachine: "Treadmill",
      durationMinutes: 15,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.formErrors).toContain("You don't have permission to modify records for this member.")
    }
  })

  it("succeeds if admin or counselor submits fitness test", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin-1", name: "Admin", email: "admin@test.com", role: "ADMIN" },
    } as any)

    vi.mocked(prisma.member.findUnique).mockResolvedValue({
      id: "member-1",
      trainerId: "trainer-2",
    } as any)

    vi.mocked(prisma.fitnessTest.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.fitnessTest.create).mockResolvedValue({
      id: "test-1",
    } as any)

    const result = await saveFitnessTest("member-1", {
      testDate: new Date(),
      cardioMachine: "Treadmill",
      durationMinutes: 15,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.id).toBe("test-1")
    }
  })
})
