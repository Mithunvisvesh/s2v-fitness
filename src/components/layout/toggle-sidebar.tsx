"use client"
import { Button } from "@/components/ui/button"
import { PanelLeft } from "lucide-react"
import { useSidebarStore } from "@/store/sidebar-store"

export function ToggleSidebar() {
  const toggle = useSidebarStore((s) => s.toggle)
  return (
    <Button variant="ghost" size="icon" onClick={toggle}>
      <PanelLeft className="h-5 w-5" />
    </Button>
  )
}