export const FITNESS_GOALS = [
  "Weight Loss",
  "Weight Gain",
  "General Fitness",
  "Shape Up",
  "Lifestyle and Health Management",
  "Transformation"
] as const

export const PACKAGE_OPTIONS = [
  { label: "Monthly", value: "MONTHLY" },
  { label: "Quarterly", value: "QUARTERLY" },
  { label: "Half Yearly", value: "HALF_YEARLY" },
  { label: "Yearly", value: "YEARLY" }
] as const

export const PACKAGE_DURATION_MONTHS: Record<string, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  YEARLY: 12,
}

export const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
] as const

export const MARITAL_STATUS_OPTIONS = [
  { label: "Single", value: "SINGLE" },
  { label: "Married", value: "MARRIED" },
  { label: "Divorced", value: "DIVORCED" },
  { label: "Widowed", value: "WIDOWED" },
] as const

export const MEMBER_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const

export const MEMBER_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  ARCHIVED: "ARCHIVED"
} as const

export const MEDICAL_CONDITIONS = [
  "Chronic Illness",
  "Cancer",
  "Multiple Sclerosis",
  "Epilepsy",
  "Fibromyalgia",
  "Recent Surgery",
  "Pregnancy",
  "Breastfeeding",
  "Asthma",
  "COPD",
  "Emphysema",
  "Joint Injuries",
  "Ligament Injuries",
  "Tendon Injuries",
  "Neck Disorders",
  "Back Disorders",
  "Arthritis",
  "Rheumatoid Arthritis",
  "Osteoporosis",
  "Diabetes",
  "Thyroid Disorders",
  "Obesity",
  "High Cholesterol",
  "Family Heart History",
  "Hernia",
  "Frequent Headaches",
  "Frequent Respiratory Infections",
  "Depression",
  "Bipolar Disorder",
  "SAD",
  "Circulatory Disorders",
  "Digestive Disorders"
] as const

// ── Measurement helpers ───────────────────────────────────────────────────────

export function calcBMI(weightKg: number, heightCm: number): number {
  const h = heightCm / 100
  return Math.round((weightKg / (h * h)) * 10) / 10
}

export function calcWHR(waistCirc: number, hipCirc: number): number {
  return Math.round((waistCirc / hipCirc) * 100) / 100
}

export type BMIStatus = "Underweight" | "Healthy" | "Overweight" | "Obese"
export type WHRStatus = "Healthy" | "At Risk"

export function getBMIStatus(bmi: number): BMIStatus {
  if (bmi < 18.5) return "Underweight"
  if (bmi < 25) return "Healthy"
  if (bmi < 30) return "Overweight"
  return "Obese"
}

export function getWHRStatus(whr: number, gender: string): WHRStatus {
  if (gender === "FEMALE") return whr < 0.8 ? "Healthy" : "At Risk"
  return whr < 0.95 ? "Healthy" : "At Risk"
}
