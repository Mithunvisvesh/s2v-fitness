import { z } from "zod"
import { FITNESS_GOALS } from "@/lib/constants"

export const memberSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  membershipNo: z.string().min(1, "Membership number required"),
  receiptNo: z.string().optional(),
  date: z.coerce.date(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.coerce.date().refine(
  (date) => !isNaN(date.getTime()),
  "Date of birth required"
),
  mobile: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional(),
  package: z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]),
  durationMonths: z.coerce.number().min(1).max(24),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  fitnessGoals: z.array(z.enum(FITNESS_GOALS)).min(1, "Select at least one goal"),
  counsellorId: z.string().optional(),
  trainerId: z.string().optional(),
})