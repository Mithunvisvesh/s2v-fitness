"use client"

import * as React from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PackagesTable } from "@/components/package/packages-table"
import { PackageForm } from "@/components/package/package-form"

interface PackageRow {
  id: string
  name: string
  durationMonths: number
  price: number | null
  isActive: boolean
}

interface PackagesTableWrapperProps {
  initialPackages: PackageRow[]
}

export function PackagesTableWrapper({ initialPackages }: PackagesTableWrapperProps) {
  const [formOpen, setFormOpen] = React.useState(false)
  const [selectedPackage, setSelectedPackage] = React.useState<PackageRow | null>(null)

  function handleEdit(pkg: PackageRow) {
    setSelectedPackage(pkg)
    setFormOpen(true)
  }

  function handleAdd() {
    setSelectedPackage(null)
    setFormOpen(true)
  }

  return (
    <div>
      <div className="flex justify-end p-4 border-b">
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Package
        </Button>
      </div>
      <div className="overflow-x-auto">
        <PackagesTable packages={initialPackages} onEdit={handleEdit} />
      </div>
      <PackageForm open={formOpen} onOpenChange={setFormOpen} pkg={selectedPackage} />
    </div>
  )
}
