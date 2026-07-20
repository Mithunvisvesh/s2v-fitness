import React from "react"
import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 p-6 text-center animate-in fade-in duration-300">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Loading...</p>
    </div>
  )
}
