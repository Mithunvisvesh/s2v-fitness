import { Suspense } from "react"
import Link from "next/link"
import { UserPlus } from "lucide-react"

import { auth } from "@/lib/auth"
import { getMembers } from "@/server/queries/members"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MembersTable } from "@/components/member/members-table"
import { MemberFilters } from "@/components/member/member-filters"
import { PaginationControls } from "@/components/member/pagination-controls"

interface PageProps {
  searchParams: Promise<{
    q?: string
    status?: string
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

async function MemberListContent({
  search,
  status,
  pkg,
  page,
  role,
  userId,
}: {
  search: string
  status: string
  pkg: string
  page: number
  role: string
  userId: string
}) {
  const result = await getMembers(
    { search, status, package: pkg, page },
    { id: userId, role }
  )

  const canManage = role === "ADMIN" || role === "COUNSELLOR" || role === "OWNER"
  const hasFilters = !!(search || status || pkg)

  return (
    <>
      <MembersTable
        members={result.members}
        canManage={canManage}
        hasFilters={hasFilters}
      />
      <PaginationControls
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        pageSize={result.pageSize}
        basePath="/members"
        searchParams={{ q: search || undefined, status: status || undefined, package: pkg || undefined }}
      />
    </>
  )
}

export default async function MembersPage({ searchParams }: PageProps) {
  const session = await auth()
  const role = session?.user?.role ?? "TRAINER"
  const userId = session?.user?.id ?? ""
  const canManage = role === "ADMIN" || role === "COUNSELLOR" || role === "OWNER"

  const params = await searchParams
  const search = params.q ?? ""
  const status = params.status ?? ""
  const pkg = params.package ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1", 10))

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Members</h1>
          <p className="text-sm text-muted-foreground">
            Search, filter, and manage member records.
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/members/new">
              <UserPlus /> Add member
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b p-4">
          <MemberFilters />
        </div>
        <Suspense key={`${search}-${status}-${pkg}-${page}`} fallback={<TableSkeleton />}>
          <MemberListContent
            search={search}
            status={status}
            pkg={pkg}
            page={page}
            role={role}
            userId={userId}
          />
        </Suspense>
      </div>
    </div>
  )
}
