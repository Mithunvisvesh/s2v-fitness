import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "muted" | "destructive" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  EXPIRED: { label: "Expired", variant: "warning" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  ARCHIVED: { label: "Archived", variant: "muted" },
}

export function MemberStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "muted" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
