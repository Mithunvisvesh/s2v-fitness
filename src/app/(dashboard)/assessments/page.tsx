import { Suspense } from "react"
import { getAssessmentsOverview } from "@/server/queries/assessments"
import { Skeleton } from "@/components/ui/skeleton"
import { MemberFilters } from "@/components/member/member-filters"
import { PaginationControls } from "@/components/member/pagination-controls"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { FileText, ClipboardList } from "lucide-react"

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

async function AssessmentsListContent({
  search,
  page,
}: {
  search: string
  page: number
}) {
  const result = await getAssessmentsOverview({ search, page })
  const hasFilters = !!search

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member Name</TableHead>
              <TableHead>Membership No</TableHead>
              <TableHead>Latest PAR-Q</TableHead>
              <TableHead>Postural Analysis</TableHead>
              <TableHead>Fitness Test</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {hasFilters ? "No matching members found." : "No active members found."}
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{member.fullName}</TableCell>
                  <TableCell>{member.membershipNo}</TableCell>
                  <TableCell>
                    {member.parqDate ? (
                      <div className="space-y-1">
                        <div className="text-sm">{formatDate(member.parqDate)}</div>
                        <Badge variant={member.parqClearanceRequired ? "destructive" : "success"}>
                          {member.parqClearanceRequired ? "Clearance Required" : "Cleared"}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="secondary">Not Screened</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {member.posturalDate ? (
                      <div className="space-y-1">
                        <div className="text-sm">{formatDate(member.posturalDate)}</div>
                        <Badge variant="success">Assessed</Badge>
                      </div>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {member.fitnessDate ? (
                      <div className="space-y-1">
                        <div className="text-sm">{formatDate(member.fitnessDate)}</div>
                        <Badge variant="success">Tested</Badge>
                      </div>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <Link href={`/members/${member.id}?tab=screening`}>
                          <FileText className="h-3.5 w-3.5" /> Screening
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <Link href={`/members/${member.id}?tab=assessments`}>
                          <ClipboardList className="h-3.5 w-3.5" /> Assessments
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
          basePath="/assessments"
          searchParams={{ q: search }}
        />
      </div>
    </>
  )
}

export default async function AssessmentsPage({ searchParams }: PageProps) {
  const { q, page } = await searchParams

  const searchQuery = q ?? ""
  const pageNumber = Math.max(1, parseInt(page ?? "1", 10))

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Physical Assessments & Screenings</h1>
          <p className="text-sm text-muted-foreground">
            Manage PAR-Q safety clearances, postural diagnostic alignments, and fitness tests.
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b">
          <MemberFilters />
        </div>
        <CardContent className="p-0">
          <Suspense key={searchQuery + pageNumber} fallback={<TableSkeleton />}>
            <AssessmentsListContent search={searchQuery} page={pageNumber} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
