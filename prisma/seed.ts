import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function monthsAgo(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d
}

function monthsFromNow(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() + n)
  return d
}

function dob(yearsOld: number) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - yearsOld)
  return d
}

async function main() {
  console.log("🌱 Seeding S2V Fitness database...")

  // ── Staff accounts ────────────────────────────────────────────────────────
  const adminPw = await hash("admin123", 10)
  const staffPw = await hash("staff123", 10)

  await prisma.user.upsert({
    where: { email: "admin@s2vfitness.com" },
    update: {},
    create: {
      email: "admin@s2vfitness.com",
      name: "Admin User",
      password: adminPw,
      role: "ADMIN",
    },
  })

  const counsellor = await prisma.user.upsert({
    where: { email: "counsellor@s2vfitness.com" },
    update: {},
    create: {
      email: "counsellor@s2vfitness.com",
      name: "Priya Sharma",
      password: staffPw,
      role: "COUNSELLOR",
    },
  })

  const trainer = await prisma.user.upsert({
    where: { email: "trainer@s2vfitness.com" },
    update: {},
    create: {
      email: "trainer@s2vfitness.com",
      name: "Arjun Menon",
      password: staffPw,
      role: "TRAINER",
    },
  })

  console.log("✅ Staff accounts created")

  // ── Helper to create a member cleanly ────────────────────────────────────
  async function createMember(data: {
    membershipNo: string
    fullName: string
    gender: "MALE" | "FEMALE" | "OTHER"
    dateOfBirth: Date
    mobile: string
    email?: string
    address?: string
    maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED"
    package: "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY"
    durationMonths: number
    startDate: Date
    endDate: Date
    status?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "ARCHIVED"
    archivedAt?: Date
    fitnessGoals: string[]
    counsellorId?: string
    trainerId?: string
  }) {
    const age = new Date().getFullYear() - data.dateOfBirth.getFullYear()
    const existing = await prisma.member.findUnique({ where: { membershipNo: data.membershipNo } })
    if (existing) return existing

    return prisma.member.create({
      data: {
        membershipNo: data.membershipNo,
        receiptNo: `RCP-${data.membershipNo}`,
        fullName: data.fullName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        age,
        mobile: data.mobile,
        email: data.email,
        address: data.address,
        maritalStatus: data.maritalStatus,
        package: data.package,
        durationMonths: data.durationMonths,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status ?? "ACTIVE",
        archivedAt: data.archivedAt,
        counsellorId: data.counsellorId,
        trainerId: data.trainerId,
        fitnessGoals: {
          create: data.fitnessGoals.map((goal) => ({ goal })),
        },
      },
    })
  }

  // ── Active members ────────────────────────────────────────────────────────
  await createMember({
    membershipNo: "S2V-0001",
    fullName: "Anjali Krishnan",
    gender: "FEMALE",
    dateOfBirth: dob(28),
    mobile: "9876543210",
    email: "anjali.k@email.com",
    address: "12 Anna Nagar, Chennai - 600 040",
    maritalStatus: "SINGLE",
    package: "QUARTERLY",
    durationMonths: 3,
    startDate: monthsAgo(1),
    endDate: monthsFromNow(2),
    fitnessGoals: ["Weight Loss", "General Fitness"],
    counsellorId: counsellor.id,
    trainerId: trainer.id,
  })

  await createMember({
    membershipNo: "S2V-0002",
    fullName: "Rajesh Kumar",
    gender: "MALE",
    dateOfBirth: dob(35),
    mobile: "9876543211",
    email: "rajesh.k@email.com",
    address: "45 T. Nagar, Chennai - 600 017",
    maritalStatus: "MARRIED",
    package: "YEARLY",
    durationMonths: 12,
    startDate: monthsAgo(2),
    endDate: monthsFromNow(10),
    fitnessGoals: ["General Fitness", "Shape Up"],
    counsellorId: counsellor.id,
    trainerId: trainer.id,
  })

  await createMember({
    membershipNo: "S2V-0003",
    fullName: "Meena Sundaram",
    gender: "FEMALE",
    dateOfBirth: dob(42),
    mobile: "9876543212",
    email: "meena.s@email.com",
    address: "78 Adyar, Chennai - 600 020",
    maritalStatus: "MARRIED",
    package: "HALF_YEARLY",
    durationMonths: 6,
    startDate: monthsAgo(1),
    endDate: monthsFromNow(5),
    fitnessGoals: ["Lifestyle and Health Management", "Weight Loss"],
    counsellorId: counsellor.id,
  })

  await createMember({
    membershipNo: "S2V-0004",
    fullName: "Vikram Rajan",
    gender: "MALE",
    dateOfBirth: dob(24),
    mobile: "9876543213",
    address: "22 Velachery, Chennai - 600 042",
    maritalStatus: "SINGLE",
    package: "MONTHLY",
    durationMonths: 1,
    startDate: daysAgo(10),
    endDate: monthsFromNow(1),
    fitnessGoals: ["Weight Gain", "Transformation"],
    trainerId: trainer.id,
  })

  await createMember({
    membershipNo: "S2V-0005",
    fullName: "Deepa Nair",
    gender: "FEMALE",
    dateOfBirth: dob(31),
    mobile: "9876543214",
    email: "deepa.n@email.com",
    address: "5 Besant Nagar, Chennai - 600 090",
    maritalStatus: "SINGLE",
    package: "QUARTERLY",
    durationMonths: 3,
    startDate: daysAgo(20),
    endDate: monthsFromNow(2),
    fitnessGoals: ["Shape Up", "General Fitness"],
    counsellorId: counsellor.id,
    trainerId: trainer.id,
  })

  // ── Expired members ───────────────────────────────────────────────────────
  await createMember({
    membershipNo: "S2V-0006",
    fullName: "Suresh Babu",
    gender: "MALE",
    dateOfBirth: dob(45),
    mobile: "9876543215",
    email: "suresh.b@email.com",
    maritalStatus: "MARRIED",
    package: "MONTHLY",
    durationMonths: 1,
    startDate: monthsAgo(3),
    endDate: monthsAgo(2),
    status: "EXPIRED",
    fitnessGoals: ["General Fitness"],
    counsellorId: counsellor.id,
  })

  await createMember({
    membershipNo: "S2V-0007",
    fullName: "Kavitha Raman",
    gender: "FEMALE",
    dateOfBirth: dob(27),
    mobile: "9876543216",
    package: "QUARTERLY",
    durationMonths: 3,
    startDate: monthsAgo(5),
    endDate: monthsAgo(2),
    status: "EXPIRED",
    fitnessGoals: ["Weight Loss", "Shape Up"],
    counsellorId: counsellor.id,
    trainerId: trainer.id,
  })

  // ── Archived member ───────────────────────────────────────────────────────
  await createMember({
    membershipNo: "S2V-0008",
    fullName: "Prasanna Venkat",
    gender: "MALE",
    dateOfBirth: dob(38),
    mobile: "9876543217",
    email: "prasanna.v@email.com",
    maritalStatus: "MARRIED",
    package: "HALF_YEARLY",
    durationMonths: 6,
    startDate: monthsAgo(12),
    endDate: monthsAgo(6),
    status: "ARCHIVED",
    archivedAt: monthsAgo(5),
    fitnessGoals: ["General Fitness"],
  })

  // ── New this month (for dashboard stats) ─────────────────────────────────
  await createMember({
    membershipNo: "S2V-0009",
    fullName: "Harini Murali",
    gender: "FEMALE",
    dateOfBirth: dob(22),
    mobile: "9876543218",
    email: "harini.m@email.com",
    address: "33 Porur, Chennai - 600 116",
    maritalStatus: "SINGLE",
    package: "MONTHLY",
    durationMonths: 1,
    startDate: daysAgo(3),
    endDate: monthsFromNow(1),
    fitnessGoals: ["Weight Loss", "Transformation"],
    counsellorId: counsellor.id,
    trainerId: trainer.id,
  })

  await createMember({
    membershipNo: "S2V-0010",
    fullName: "Sathish Prabhu",
    gender: "MALE",
    dateOfBirth: dob(29),
    mobile: "9876543219",
    address: "88 Tambaram, Chennai - 600 059",
    maritalStatus: "SINGLE",
    package: "QUARTERLY",
    durationMonths: 3,
    startDate: daysAgo(5),
    endDate: monthsFromNow(3),
    fitnessGoals: ["Transformation", "Weight Gain"],
    counsellorId: counsellor.id,
    trainerId: trainer.id,
  })

  console.log("✅ 10 members created")
  console.log("")
  console.log("─────────────────────────────────────────────")
  console.log("  Login credentials:")
  console.log("")
  console.log("  Admin       admin@s2vfitness.com  / admin123")
  console.log("  Counsellor  counsellor@s2vfitness.com / staff123")
  console.log("  Trainer     trainer@s2vfitness.com   / staff123")
  console.log("─────────────────────────────────────────────")
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
