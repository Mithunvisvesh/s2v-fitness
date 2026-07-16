import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getPackagesList } from "@/server/queries/package"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PackagesTableWrapper } from "@/components/package/packages-table-wrapper"

export default async function PackagesPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    notFound()
  }

  const packages = await getPackagesList()

  // Safely mapping database Decimal type to number
  const mappedPackages = packages.map((p) => ({
    id: p.id,
    name: p.name,
    durationMonths: p.durationMonths,
    price: p.price ? Number(p.price) : null,
    isActive: p.isActive,
  }))

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Package Management</h1>
          <p className="text-sm text-muted-foreground">
            Configure, pricing, and duration configurations for gym memberships.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle>Configured Packages</CardTitle>
            <CardDescription>
              A total of {mappedPackages.length} membership packages configured.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <PackagesTableWrapper initialPackages={mappedPackages} />
        </CardContent>
      </Card>
    </div>
  )
}
