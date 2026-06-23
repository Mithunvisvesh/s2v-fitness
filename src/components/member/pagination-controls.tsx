import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PaginationControlsProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  basePath: string
  searchParams: Record<string, string | undefined>
}

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  query.set("page", String(page))
  return `${basePath}?${query.toString()}`
}

export function PaginationControls({
  page,
  pageCount,
  total,
  pageSize,
  basePath,
  searchParams,
}: PaginationControlsProps) {
  if (total === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildHref(basePath, searchParams, page - 1)}>Previous</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        <span className="px-1 text-sm text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        {page < pageCount ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildHref(basePath, searchParams, page + 1)}>Next</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  )
}
