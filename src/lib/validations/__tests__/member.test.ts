import { describe, it, expect } from "vitest"
import { memberSchema } from "../member"

describe("Member Validation Schema", () => {
  const validData = {
    fullName: "John Doe",
    membershipNo: "S2V-0001",
    receiptNo: "REC-123",
    registrationDate: new Date(),
    gender: "MALE",
    dateOfBirth: new Date("1995-05-15"),
    mobile: "9876543210",
    email: "john@example.com",
    address: "123 Main St",
    maritalStatus: "SINGLE",
    package: "MONTHLY",
    durationMonths: 1,
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-08-01"),
    fitnessGoals: ["Weight Loss"],
    counsellorId: "user-1",
    trainerId: "user-2",
  }

  it("passes with valid data", () => {
    const result = memberSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("fails if fullName is too short", () => {
    const result = memberSchema.safeParse({
      ...validData,
      fullName: "J",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.fullName).toBeDefined()
    }
  })

  it("fails if mobile is not exactly 10 digits", () => {
    const result1 = memberSchema.safeParse({
      ...validData,
      mobile: "987654321", // 9 digits
    })
    const result2 = memberSchema.safeParse({
      ...validData,
      mobile: "98765432109", // 11 digits
    })
    const result3 = memberSchema.safeParse({
      ...validData,
      mobile: "abcdefghij", // letters
    })
    expect(result1.success).toBe(false)
    expect(result2.success).toBe(false)
    expect(result3.success).toBe(false)
  })

  it("fails if endDate is not after startDate", () => {
    const result = memberSchema.safeParse({
      ...validData,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-07-01"),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.endDate).toBeDefined()
    }
  })

  it("fails if fitnessGoals list is empty", () => {
    const result = memberSchema.safeParse({
      ...validData,
      fitnessGoals: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.fitnessGoals).toBeDefined()
    }
  })
})
