"use client"

import * as React from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StaffTable } from "@/components/staff/staff-table"
import { StaffForm } from "@/components/staff/staff-form"

interface UserRow {
  id: string
  name: string
  email: string
  role: "ADMIN" | "COUNSELLOR" | "TRAINER"
  isActive: boolean
}

interface StaffTableWrapperProps {
  initialUsers: UserRow[]
  currentUserId?: string
}

export function StaffTableWrapper({ initialUsers, currentUserId }: StaffTableWrapperProps) {
  const [formOpen, setFormOpen] = React.useState(false)
  const [selectedStaff, setSelectedStaff] = React.useState<UserRow | null>(null)

  function handleEdit(user: UserRow) {
    setSelectedStaff(user)
    setFormOpen(true)
  }

  function handleAdd() {
    setSelectedStaff(null)
    setFormOpen(true)
  }

  return (
    <div>
      <div className="flex justify-end p-4 border-b">
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>
      <div className="overflow-x-auto">
        <StaffTable users={initialUsers} onEdit={handleEdit} currentUserId={currentUserId} />
      </div>
      <StaffForm open={formOpen} onOpenChange={setFormOpen} staff={selectedStaff} />
    </div>
  )
}
