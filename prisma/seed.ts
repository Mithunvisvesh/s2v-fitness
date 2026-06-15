import { PrismaClient, Role, PackageType } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@s2v.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@s2v.com",
      password: await hash("Admin123!", 12),
      role: Role.ADMIN,
    },
  })

  // Create packages (if package table existed; here we use enum)
  // Create a sample member
  const member = await prisma.member.create({
    data: {
      membershipNo: "S2V-001",
      fullName: "Jane Doe",
      gender: "FEMALE",
      dateOfBirth: new Date("1990-05-15"),
      mobile: "9876543210",
      email: "jane@example.com",
      package: PackageType.MONTHLY,
      durationMonths: 1,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-07-01"),
      fitnessGoals: {
        create: [{ goal: "Weight Loss" }, { goal: "General Fitness" }]
      }
    }
  })
  console.log("Seed completed")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())