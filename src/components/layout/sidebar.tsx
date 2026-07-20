"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BarChart3,
  PlusCircle,
  Archive,
  UserCheck,
  Tag,
  Activity,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebarStore } from "@/store/sidebar-store"

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname()
  const { collapsed } = useSidebarStore()

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/members", label: "Members", icon: Users },
    { href: "/assessments", label: "Assessments", icon: ClipboardCheck },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/archive", label: "Archive", icon: Archive },
  ]
  if (role === "ADMIN" || role === "OWNER") {
    items.push({ href: "/staff", label: "Staff", icon: UserCheck })
    items.push({ href: "/packages", label: "Packages", icon: Tag })
    items.push({ href: "/audit-log", label: "Audit Log", icon: Activity })
    items.push({ href: "/settings", label: "Settings", icon: Settings })
  }

  return (
    <aside
      className={cn(
        "flex flex-col bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b">
        {!collapsed && <span className="font-bold text-xl">S2V Fitness</span>}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname === item.href ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <item.icon className="h-5 w-5 mr-2 flex-shrink-0" />
              {!collapsed && item.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t">
        <Link href="/members/new">
          <Button className="w-full justify-start">
            <PlusCircle className="h-5 w-5 mr-2" />
            {!collapsed && "Add Member"}
          </Button>
        </Link>
      </div>
    </aside>
  )
}