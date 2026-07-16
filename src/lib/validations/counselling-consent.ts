import { z } from "zod"

/**
 * Zod validation schema for Counselling Notes.
 * Acts as an append-only log entry.
 */
export const counsellingNoteSchema = z.object({
  noteType: z.string().trim().min(1, "Note type is required").max(100),
  description: z.string().trim().min(5, "Notes must be at least 5 characters long").max(5000),
})

export type CounsellingNoteFormValues = z.infer<typeof counsellingNoteSchema>

/**
 * Zod validation schema for Consent Form.
 * Tracks emergency details and member acknowledgement.
 */
export const consentSchema = z.object({
  emergencyContactName: z.string().trim().min(1, "Emergency contact name is required").max(100),
  emergencyMobile: z.string().trim().min(10, "Mobile number must be at least 10 digits").max(20),
  relationship: z.string().trim().min(1, "Relationship to member is required").max(50),
  consentDate: z.date({
    error: "Consent date is required",
  }),
  acknowledged: z.boolean().refine((val) => val === true, {
    message: "You must check the box to acknowledge and accept consent terms.",
  }),
  digitalSignature: z.string().optional().or(z.literal("")),
})

export type ConsentFormValues = z.infer<typeof consentSchema>
