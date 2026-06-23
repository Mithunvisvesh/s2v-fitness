import { z } from "zod"
import { FITNESS_GOALS } from "@/lib/constants"

export const memberSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required"),
    membershipNo: z.string().trim().min(1, "Membership number is required"),
    receiptNo: z.string().trim().optional(),
    registrationDate: z.date().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], { error: "Select a gender" }),
    dateOfBirth: z.date({ error: "Date of birth is required" }),
    mobile: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
    email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
    address: z.string().trim().optional(),
    maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional(),
    package: z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"], {
      error: "Select a package",
    }),
    durationMonths: z.number().min(1, "Duration is required").max(36),
    startDate: z.date({ error: "Start date is required" }),
    endDate: z.date({ error: "End date is required" }),
    fitnessGoals: z
      .array(z.enum(FITNESS_GOALS))
      .min(1, "Select at least one fitness goal"),
    counsellorId: z.string().optional(),
    trainerId: z.string().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  })

export type MemberFormValues = z.infer<typeof memberSchema>
