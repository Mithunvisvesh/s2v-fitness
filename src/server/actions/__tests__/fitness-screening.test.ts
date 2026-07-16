import { describe, it, expect, vi, beforeEach } from "vitest"
import { savePARQ } from "../fitness-screening"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

vi.mock("@/lib/db", () => ({
  prisma: {
    member: {
      findUnique: vi.fn(),
    },
    pARQ: {
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

describe("Fitness Screening Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fails if user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const result = await savePARQ("member-1", {
      assessedAt: new Date(),
      q1_heartTrouble: false,
      q2_chestPain: false,
      q3_dizzinessFainting: false,
      q4_highBloodPressure: false,
      q5_boneJointProblems: false,
      q6_otherReasons: false,
      q7_over45Unaccustomed: false,
      notes: "Healthy",
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

    const result = await savePARQ("member-1", {
      assessedAt: new Date(),
      q1_heartTrouble: false,
      q2_chestPain: false,
      q3_dizzinessFainting: false,
      q4_highBloodPressure: false,
      q5_boneJointProblems: false,
      q6_otherReasons: false,
      q7_over45Unaccustomed: false,
      notes: "Healthy",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.formErrors).toContain("You don't have permission to modify records for this member.")
    }
  })

  it("succeeds if admin or counselor submits PARQ", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "counselor-1", name: "Counselor", email: "c1@test.com", role: "COUNSELLOR" },
    } as any)

    vi.mocked(prisma.member.findUnique).mockResolvedValue({
      id: "member-1",
      trainerId: "trainer-2",
    } as any)

    vi.mocked(prisma.pARQ.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.pARQ.create).mockResolvedValue({
      id: "parq-1",
    } as any)

    const result = await savePARQ("member-1", {
      assessedAt: new Date(),
      q1_heartTrouble: false,
      q2_chestPain: false,
      q3_dizzinessFainting: false,
      q4_highBloodPressure: false,
      q5_boneJointProblems: false,
      q6_otherReasons: false,
      q7_over45Unaccustomed: false,
      notes: "Healthy",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.id).toBe("parq-1")
    }
  })
})
