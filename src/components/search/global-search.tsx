"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/members?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <input
        type="text"
        placeholder="Search members..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </form>
  )
}