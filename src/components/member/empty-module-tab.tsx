import type { LucideIcon } from "lucide-react"

interface EmptyModuleTabProps {
  icon: LucideIcon
  title: string
  description: string
}

export function EmptyModuleTab({ icon: Icon, title, description }: EmptyModuleTabProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="max-w-sm space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
