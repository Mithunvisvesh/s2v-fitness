import { z } from "zod"

export const packageSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  durationMonths: z.coerce.number().int().min(1, "Duration must be at least 1 month").max(36, "Duration cannot exceed 36 months"),
  price: z.coerce.number().min(0, "Price cannot be negative").optional(),
  isActive: z.boolean().default(true),
})

export type PackageFormValues = z.infer<typeof packageSchema>
