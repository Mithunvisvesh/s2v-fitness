import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMeasurement } from "../measurements"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

vi.mock("@/lib/db", () => ({
  prisma: {
    member: {
      findUnique: vi.fn(),
    },
    measurement: {
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

describe("Measurements Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fails if user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const result = await createMeasurement("member-1", {
      measuredAt: new Date(),
      heightCm: 180,
      weightKg: 75,
    }, "MALE")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.formErrors).toContain("You must be logged in to perform this action.")
    }
  })

  it("fails validation if inputs are invalid", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", name: "Trainer", email: "trainer@test.com", role: "TRAINER" },
    } as any)

    vi.mocked(prisma.member.findUnique).mockResolvedValue({
      id: "member-1",
      trainerId: "user-1",
      gender: "MALE",
    } as any)

    const result = await createMeasurement("member-1", {
      measuredAt: new Date(),
      heightCm: -50, // invalid height
      weightKg: 75,
    }, "MALE")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.fieldErrors.heightCm).toBeDefined()
    }
  })

  it("fails if trainer does not own the member", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "trainer-1", name: "Trainer One", email: "t1@test.com", role: "TRAINER" },
    } as any)

    // Member has a different trainer
    vi.mocked(prisma.member.findUnique).mockResolvedValue({
      id: "member-1",
      trainerId: "trainer-2",
      gender: "MALE",
    } as any)

    const result = await createMeasurement("member-1", {
      measuredAt: new Date(),
      heightCm: 180,
      weightKg: 75,
    }, "MALE")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.formErrors).toContain("You don't have permission to modify records for this member.")
    }
  })

  it("succeeds if admin or authorized staff writes measurement", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin-1", name: "Admin", email: "admin@test.com", role: "ADMIN" },
    } as any)

    vi.mocked(prisma.member.findUnique).mockResolvedValue({
      id: "member-1",
      trainerId: "trainer-2",
      gender: "MALE",
    } as any)

    vi.mocked(prisma.measurement.create).mockResolvedValue({
      id: "meas-1",
    } as any)

    const result = await createMeasurement("member-1", {
      measuredAt: new Date(),
      heightCm: 180,
      weightKg: 75,
    }, "MALE")

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.measurementId).toBe("meas-1")
    }
  })
})
