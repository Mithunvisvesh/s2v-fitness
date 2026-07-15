import { Suspense } from "react"
import { getMembersForReports, getMemberReportData } from "@/server/queries/reports"
import { Skeleton } from "@/components/ui/skeleton"
import { MemberFilters } from "@/components/member/member-filters"
import { PaginationControls } from "@/components/member/pagination-controls"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportDownloadButton } from "@/components/member/report-download-button"

interface PageProps {
  searchParams: Promise<{
    q?: string
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

async function ReportsListContent({
  search,
  page,
}: {
  search: string
  page: number
}) {
  const result = await getMembersForReports({ search, page })
  const hasFilters = !!search

  // Fetch report data for all listed members in parallel
  const reportsData = await Promise.all(
    result.members.map(async (m) => {
      const data = await getMemberReportData(m.id)
      return { memberId: m.id, data }
    })
  )

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member Name</TableHead>
              <TableHead>Membership No</TableHead>
              <TableHead>Assigned Trainer</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {hasFilters ? "No matching members found." : "No active members found."}
                </TableCell>
              </TableRow>
            ) : (
              result.members.map((m) => {
                const report = reportsData.find((r) => r.memberId === m.id)?.data
                return (
                  <TableRow key={m.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{report?.member.fullName}</TableCell>
                    <TableCell>{report?.member.membershipNo}</TableCell>
                    <TableCell>{report?.member.trainer?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        {report && <ReportDownloadButton data={report} />}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className="p-4 border-t">
        <PaginationControls
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={result.pageSize}
          basePath="/reports"
          searchParams={{ q: search }}
        />
      </div>
    </>
  )
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const { q, page } = await searchParams

  const searchQuery = q ?? ""
  const pageNumber = Math.max(1, parseInt(page ?? "1", 10))

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Reports & PDF Exports</h1>
          <p className="text-sm text-muted-foreground">
            Generate and export consolidated, professional physical assessment and health clearance reports.
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b">
          <MemberFilters />
        </div>
        <CardContent className="p-0">
          <Suspense key={searchQuery + pageNumber} fallback={<TableSkeleton />}>
            <ReportsListContent search={searchQuery} page={pageNumber} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
