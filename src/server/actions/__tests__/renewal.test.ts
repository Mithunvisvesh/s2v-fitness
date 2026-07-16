import { describe, it, expect, vi, beforeEach } from "vitest"
import { renewMembership } from "../renewal"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

vi.mock("@/lib/db", () => ({
  prisma: {
    member: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    package: {
      findUnique: vi.fn(),
    },
    membershipRenewal: {
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

describe("Membership Renewal Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fails if user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const result = await renewMembership("member-1", {
      packageId: "package-1",
      startDate: new Date(),
      endDate: new Date(),
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.formErrors).toContain("You don't have permission to perform this action.")
    }
  })

  it("fails if user role is TRAINER", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "trainer-1", name: "Trainer", email: "trainer@test.com", role: "TRAINER" },
    } as any)

    const result = await renewMembership("member-1", {
      packageId: "package-1",
      startDate: new Date(),
      endDate: new Date(),
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.formErrors).toContain("You don't have permission to perform this action.")
    }
  })

  it("succeeds if user is ADMIN or COUNSELLOR", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin-1", name: "Admin", email: "admin@test.com", role: "ADMIN" },
    } as any)

    vi.mocked(prisma.member.findUnique).mockResolvedValue({
      id: "member-1",
      endDate: new Date("2026-07-01"),
    } as any)

    vi.mocked(prisma.package.findUnique).mockResolvedValue({
      id: "package-1",
      name: "Yearly Transformation",
      durationMonths: 12,
    } as any)

    vi.mocked(prisma.membershipRenewal.create).mockResolvedValue({
      id: "renewal-1",
    } as any)

    const result = await renewMembership("member-1", {
      packageId: "package-1",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2027-07-01"),
    })

    expect(result.success).toBe(true)
  })
})
