import { z } from "zod"

function positiveFloat(label: string) {
  return z
    .number({ error: `${label} must be a number` })
    .positive(`${label} must be greater than 0`)
    .optional()
}

export const measurementSchema = z.object({
  measuredAt: z.date({ error: "Measurement date is required" }),

  // Body composition
  heightCm: z
    .number({ error: "Height must be a number" })
    .min(50, "Height must be at least 50 cm")
    .max(250, "Height must be below 250 cm"),
  weightKg: z
    .number({ error: "Weight must be a number" })
    .min(10, "Weight must be at least 10 kg")
    .max(300, "Weight must be below 300 kg"),
  bodyFatPercent: positiveFloat("Body fat %"),
  visceralFat: positiveFloat("Visceral fat"),
  bmr: positiveFloat("BMR"),
  biologicalAge: z
    .number()
    .int("Biological age must be a whole number")
    .min(1)
    .max(120)
    .optional(),

  // Frame
  shoulderWidth: positiveFloat("Shoulder width"),
  hipWidth: positiveFloat("Hip width"),

  // Circumferences
  neckCirc: positiveFloat("Neck circumference"),
  shoulderCirc: positiveFloat("Shoulder circumference"),
  chestNormal: positiveFloat("Chest normal"),
  chestExpansion: positiveFloat("Chest expansion"),
  armCirc: positiveFloat("Arm circumference"),
  forearmCirc: positiveFloat("Forearm circumference"),
  abdomenCirc: positiveFloat("Abdomen circumference"),
  waistCirc: positiveFloat("Waist circumference"),
  hipCirc: positiveFloat("Hip circumference"),
  midThighCirc: positiveFloat("Mid-thigh circumference"),
  calfCirc: positiveFloat("Calf circumference"),
})

export type MeasurementFormValues = z.infer<typeof measurementSchema>
