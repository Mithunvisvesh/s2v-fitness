"use client"

import * as React from "react"
import { MoreHorizontal, Edit, UserX, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { toggleStaffStatus } from "@/server/actions/staff"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

interface UserRow {
  id: string
  name: string
  email: string
  role: "ADMIN" | "COUNSELLOR" | "TRAINER"
  isActive: boolean
}

interface StaffTableProps {
  users: UserRow[]
  onEdit: (user: UserRow) => void
  currentUserId?: string
}

export function StaffTable({ users, onEdit, currentUserId }: StaffTableProps) {
  const [isPending, startTransition] = React.useTransition()

  function handleToggleStatus(id: string, currentStatus: boolean) {
    const newStatus = !currentStatus
    startTransition(async () => {
      const result = await toggleStaffStatus(id, newStatus)
      if (result.success) {
        toast.success(
          newStatus
            ? "Staff member activated successfully."
            : "Staff member deactivated successfully."
        )
      } else {
        if (result.error.formErrors && result.error.formErrors.length > 0) {
          toast.error(result.error.formErrors[0])
        } else {
          toast.error("Failed to update staff status.")
        }
      }
    })
  }

  function roleBadgeVariant(role: string) {
    switch (role) {
      case "ADMIN":
        return "destructive"
      case "COUNSELLOR":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Staff Member</TableHead>
          <TableHead>System Role</TableHead>
          <TableHead>Account Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
              No staff members found.
            </TableCell>
          </TableRow>
        ) : (
          users.map((u) => {
            const isSelf = u.id === currentUserId
            return (
              <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium leading-tight">{u.name} {isSelf && <span className="text-xs text-muted-foreground">(You)</span>}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant(u.role)} className="capitalize">
                    {u.role.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? "default" : "outline"} className={u.isActive ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent" : "text-muted-foreground"}>
                    {u.isActive ? "Active" : "Deactivated"}
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
                      <DropdownMenuItem onClick={() => onEdit(u)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit details
                      </DropdownMenuItem>
                      {!isSelf && (
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                          disabled={isPending}
                          className={u.isActive ? "text-destructive focus:text-destructive" : ""}
                        >
                          {u.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate account
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate account
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
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
