import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { getArchivedMembers } from "@/server/queries/members"
import { Skeleton } from "@/components/ui/skeleton"
import { MembersTable } from "@/components/member/members-table"
import { MemberFilters } from "@/components/member/member-filters"
import { PaginationControls } from "@/components/member/pagination-controls"
import { Card, CardContent } from "@/components/ui/card"

interface PageProps {
  searchParams: Promise<{
    q?: string
    package?: string
    page?: string
  }>
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

async function ArchiveListContent({
  search,
  pkg,
  page,
  canManage,
}: {
  search: string
  pkg: string
  page: number
  canManage: boolean
}) {
  const result = await getArchivedMembers({ search, package: pkg, page })
  const hasFilters = !!(search || pkg)

  return (
    <>
      <MembersTable
        members={result.members}
        variant="archived"
        canManage={canManage}
        hasFilters={hasFilters}
      />
      <PaginationControls
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        pageSize={result.pageSize}
        basePath="/archive"
        searchParams={{ q: search || undefined, package: pkg || undefined }}
      />
    </>
  )
}

export default async function ArchivePage({ searchParams }: PageProps) {
  const session = await auth()
  const role = session?.user?.role ?? "TRAINER"
  const canManage = role === "ADMIN" || role === "COUNSELLOR"

  const params = await searchParams
  const search = params.q ?? ""
  const pkg = params.package ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1", 10))

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Archived Members</h1>
          <p className="text-sm text-muted-foreground">
            View and restore soft-deleted member records.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4">
            <MemberFilters showStatusFilter={false} />
          </div>
          <Suspense key={`${search}-${pkg}-${page}`} fallback={<TableSkeleton />}>
            <ArchiveListContent search={search} pkg={pkg} page={page} canManage={canManage} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
