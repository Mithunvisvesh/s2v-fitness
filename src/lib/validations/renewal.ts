import { z } from "zod"

export const renewalSchema = z
  .object({
    packageId: z.string().min(1, "Select a package"),
    startDate: z.date({ error: "Start date is required" }),
    endDate: z.date({ error: "End date is required" }),
    amountPaid: z.string()
      .optional()
      .or(z.literal(""))
      .or(z.null())
      .refine((val) => !val || !isNaN(Number(val)), { message: "Amount must be a valid number" }),
    paymentMethod: z.string().optional().or(z.literal("")).or(z.null()),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  })

export type RenewalFormValues = z.infer<typeof renewalSchema>
