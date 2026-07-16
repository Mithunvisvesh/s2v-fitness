"use client"

import * as React from "react"
import { MoreHorizontal, Edit, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"
import { togglePackageStatus } from "@/server/actions/package"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PackageRow {
  id: string
  name: string
  durationMonths: number
  price: number | null
  isActive: boolean
}

interface PackagesTableProps {
  packages: PackageRow[]
  onEdit: (pkg: PackageRow) => void
}

export function PackagesTable({ packages, onEdit }: PackagesTableProps) {
  const [isPending, startTransition] = React.useTransition()

  function handleToggleStatus(id: string, currentStatus: boolean) {
    const newStatus = !currentStatus
    startTransition(async () => {
      const result = await togglePackageStatus(id, newStatus)
      if (result.success) {
        toast.success(
          newStatus
            ? "Package activated successfully."
            : "Package deactivated successfully."
        )
      } else {
        if (result.error.formErrors && result.error.formErrors.length > 0) {
          toast.error(result.error.formErrors[0])
        } else {
          toast.error("Failed to update package status.")
        }
      }
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Package Name</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Price (INR)</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {packages.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              No packages configured.
            </TableCell>
          </TableRow>
        ) : (
          packages.map((p) => {
            return (
              <TableRow key={p.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  {p.durationMonths} {p.durationMonths === 1 ? "Month" : "Months"}
                </TableCell>
                <TableCell>
                  {p.price !== null ? `₹${p.price.toLocaleString("en-IN")}` : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge variant={p.isActive ? "default" : "outline"} className={p.isActive ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent" : "text-muted-foreground"}>
                    {p.isActive ? "Active" : "Deactivated"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(p)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(p.id, p.isActive)}
                        disabled={isPending}
                        className={p.isActive ? "text-destructive focus:text-destructive" : ""}
                      >
                        {p.isActive ? (
                          <>
                            <ToggleLeft className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
