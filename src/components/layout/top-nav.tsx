import { auth } from "@/lib/auth"
import { GlobalSearch } from "@/components/search/global-search"
import { UserNav } from "./user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleSidebar } from "./toggle-sidebar"

export async function TopNav() {
  const session = await auth()

  return (
    <header className="flex items-center justify-between h-16 px-4 border-b bg-card">
      <div className="flex items-center gap-2">
        <ToggleSidebar />
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserNav user={session?.user} />
      </div>
    </header>
  )
}