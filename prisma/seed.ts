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

  // Seed default membership packages matching legacy types
  const defaultPackages = [
    { name: "Monthly", durationMonths: 1, price: null },
    { name: "Quarterly", durationMonths: 3, price: null },
    { name: "Half-Yearly", durationMonths: 6, price: null },
    { name: "Yearly", durationMonths: 12, price: null },
  ]

  for (const pkg of defaultPackages) {
    const createdPkg = await prisma.package.upsert({
      where: { name: pkg.name },
      update: {
        durationMonths: pkg.durationMonths,
        price: pkg.price,
      },
      create: {
        name: pkg.name,
        durationMonths: pkg.durationMonths,
        price: pkg.price,
      },
    })
    console.log(`Package seeded successfully: ${createdPkg.name}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
