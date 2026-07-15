import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await hash("Admin@123!", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@s2vfitness.com" },
    update: {
      password: hashedPassword,
      name: "System Admin",
      role: "ADMIN"
    },
    create: {
      email: "admin@s2vfitness.com",
      password: hashedPassword,
      name: "System Admin",
      role: "ADMIN"
    }
  })

  console.log("Admin user seeded successfully:", admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
