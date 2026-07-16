import { z } from "zod"

export const renewalSchema = z
  .object({
    packageId: z.string().min(1, "Select a package"),
    startDate: z.date({ error: "Start date is required" }),
    endDate: z.date({ error: "End date is required" }),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  })

export type RenewalFormValues = z.infer<typeof renewalSchema>
