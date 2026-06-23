"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { MEMBER_STATUS_OPTIONS, PACKAGE_OPTIONS } from "@/lib/constants"

interface MemberFiltersProps {
  showStatusFilter?: boolean
}

export function MemberFilters({ showStatusFilter = true }: MemberFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get("q") ?? "")

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // Debounce the search box so we're not navigating on every keystroke.
  useEffect(() => {
    const current = searchParams.get("q") ?? ""
    if (search === current) return
    const timeout = setTimeout(() => updateParam("q", search || null), 350)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, mobile, email"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {showStatusFilter && (
        <Select
          value={searchParams.get("status") ?? "ALL"}
          onValueChange={(value) => updateParam("status", value === "ALL" ? null : value)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {MEMBER_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Select
        value={searchParams.get("package") ?? "ALL"}
        onValueChange={(value) => updateParam("package", value === "ALL" ? null : value)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Package" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All packages</SelectItem>
          {PACKAGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
