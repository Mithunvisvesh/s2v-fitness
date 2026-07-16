import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getAuditLogs } from "@/server/queries/audit-log"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export const metadata = { title: "System Audit Logs — S2V Fitness" }

export default async function AuditLogPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    notFound()
  }

  const { page: pageStr, search } = await searchParams
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10))

  const { logs, totalCount, totalPages } = await getAuditLogs({
    page: currentPage,
    limit: 20,
    search: search || undefined,
  })

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="font-heading text-2xl font-semibold">System Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Track all write operations, mutations, and actions across the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Log Events</CardTitle>
              <CardDescription>
                A total of {totalCount} log entries found.
              </CardDescription>
            </div>
            <form method="GET" className="flex items-center gap-2 max-w-sm w-full">
              <Input
                name="search"
                defaultValue={search || ""}
                placeholder="Search logs..."
                className="h-9"
              />
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const formattedDetails = log.details
                      ? JSON.stringify(log.details)
                      : "N/A"

                    return (
                      <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{log.user.name}</span>
                            <span className="text-xs text-muted-foreground">{log.user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{log.user.role}</TableCell>
                        <TableCell className="font-semibold text-xs text-primary">{log.action}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs font-mono">
                            <span className="font-medium">{log.entityType}</span>
                            <span className="text-muted-foreground text-[10px]">{log.entityId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs font-mono text-muted-foreground" title={formattedDetails}>
                          {formattedDetails}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={{
                    pathname: "/audit-log",
                    query: {
                      ...(search ? { search } : {}),
                      page: currentPage - 1,
                    },
                  }}
                  passHref
                >
                  <Button variant="outline" size="sm" disabled={currentPage <= 1}>
                    Previous
                  </Button>
                </Link>
                <Link
                  href={{
                    pathname: "/audit-log",
                    query: {
                      ...(search ? { search } : {}),
                      page: currentPage + 1,
                    },
                  }}
                  passHref
                >
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
                    Next
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
