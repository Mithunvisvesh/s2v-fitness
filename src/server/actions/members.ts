"use server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { memberSchema } from "@/lib/validations/member"
import { revalidatePath } from "next/cache"
import { calculateAge } from "@/lib/utils"

export async function createMember(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role === "TRAINER") throw new Error("Unauthorized")

  const raw = Object.fromEntries(formData)
  const parsed = memberSchema.safeParse(raw)
  if (!parsed.success) return { success: false, error: parsed.error.flatten() }

  const { fitnessGoals, ...data } = parsed.data
  const dob = new Date(data.dateOfBirth)
  const age = calculateAge(dob)

  const member = await prisma.member.create({
    data: {
      ...data,
      age,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      dateOfBirth: dob,
      fitnessGoals: {
        create: fitnessGoals.map((goal: string) => ({ goal }))
      },
      counsellorId: session.user.role === "COUNSELLOR" ? session.user.id : data.counsellorId,
    }
  })

  revalidatePath("/members")
  return { success: true, memberId: member.id }
}