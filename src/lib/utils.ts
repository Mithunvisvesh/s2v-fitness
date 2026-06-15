import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(dob: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0
  return parseFloat((weightKg / ((heightCm / 100) ** 2)).toFixed(1))
}

export function calculateWaistHipRatio(waist: number, hip: number): number | null {
  if (!waist || !hip) return null
  return parseFloat((waist / hip).toFixed(2))
}

export function getRatioIndicator(ratio: number | null, gender: "MALE" | "FEMALE"): string {
  if (!ratio) return "—"
  if (gender === "MALE") return ratio < 0.95 ? "Healthy" : "Needs Attention"
  return ratio < 0.8 ? "Healthy" : "Needs Attention"
}