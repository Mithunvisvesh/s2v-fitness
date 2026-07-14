import Link from "next/link"
import { UserPlus } from "lucide-react"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MemberStatusBadge } from "@/components/member/status-badge"
import { MemberRowActions } from "@/components/member/member-row-actions"
import { formatDate, getInitials } from "@/lib/utils"
import { PACKAGE_OPTIONS } from "@/lib/constants"

interface MemberRow {
  id: string
  fullName: string
  membershipNo: string
  mobile: string
  gender: string
  package: string
  status: string
  endDate: Date
  archivedAt?: Date | null
  counsellor: { name: string } | null
  trainer: { name: string } | null
}

interface MembersTableProps {
  members: MemberRow[]
  variant?: "active" | "archived"
  canManage: boolean
  hasFilters: boolean
}

function packageLabel(value: string) {
  return PACKAGE_OPTIONS.find((p) => p.value === value)?.label ?? value
}

export function MembersTable({
  members,
  variant = "active",
  canManage,
  hasFilters,
}: MembersTableProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <UserPlus className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">
            {hasFilters ? "No members match your filters" : "No members yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? "Try a different search term or clear the filters."
              : "Register your first member to get started."}
          </p>
        </div>
        {!hasFilters && variant === "active" && canManage && (
          <Button asChild size="sm">
            <Link href="/members/new">Add member</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Mobile</TableHead>
          <TableHead>Package</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>{variant === "archived" ? "Archived since" : "Renews"}</TableHead>
          <TableHead>Counsellor</TableHead>
          <TableHead>Trainer</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <Link href={`/members/${member.id}`} className="flex items-center gap-2.5">
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium leading-tight">{member.fullName}</p>
                  <p className="text-xs text-muted-foreground">{member.membershipNo}</p>
                </div>
              </Link>
            </TableCell>
            <TableCell>{member.mobile}</TableCell>
            <TableCell>{packageLabel(member.package)}</TableCell>
            <TableCell>
              <MemberStatusBadge status={member.status} />
            </TableCell>
            <TableCell>
              {variant === "archived" && member.archivedAt
                ? formatDate(member.archivedAt)
                : formatDate(member.endDate)}
            </TableCell>
            <TableCell>{member.counsellor?.name ?? "—"}</TableCell>
            <TableCell>{member.trainer?.name ?? "—"}</TableCell>
            <TableCell className="text-right">
              <MemberRowActions
                memberId={member.id}
                memberName={member.fullName}
                variant={variant}
                canManage={canManage}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
