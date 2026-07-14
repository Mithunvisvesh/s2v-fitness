import Link from "next/link"
import { Pencil } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MemberStatusBadge } from "@/components/member/status-badge"
import { MemberRowActions } from "@/components/member/member-row-actions"
import { formatDate, getInitials } from "@/lib/utils"
import { PACKAGE_OPTIONS } from "@/lib/constants"

interface ProfileHeaderProps {
  member: {
    id: string
    fullName: string
    membershipNo: string
    gender: string
    age: number | null
    mobile: string
    email: string | null
    package: string
    status: string
    endDate: Date
  }
  canManage: boolean
  children?: React.ReactNode
}

export function ProfileHeader({ member, canManage, children }: ProfileHeaderProps) {
  const packageLabel = PACKAGE_OPTIONS.find((p) => p.value === member.package)?.label ?? member.package
  const isOverdue = member.status === "ACTIVE" && member.endDate < new Date()

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <Avatar size="lg">
          <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-lg font-semibold">{member.fullName}</h1>
            <MemberStatusBadge status={member.status} />
            {isOverdue && <Badge variant="warning">Renewal due</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {member.membershipNo} · {member.gender}
            {member.age !== null ? ` · ${member.age} yrs` : ""} · {packageLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            {member.mobile}
            {member.email ? ` · ${member.email}` : ""} · Renews {formatDate(member.endDate)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {canManage && (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/members/${member.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <MemberRowActions
              memberId={member.id}
              memberName={member.fullName}
              variant={member.status === "ARCHIVED" ? "archived" : "active"}
              canManage={canManage}
            />
          </>
        )}
      </div>
    </div>
  )
}
