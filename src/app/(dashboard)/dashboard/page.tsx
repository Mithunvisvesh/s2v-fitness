import Link from "next/link"
import { Users, UserPlus, AlertTriangle, ArrowRight } from "lucide-react"
import {
  getDashboardMetrics,
  getRegistrationTrends,
  getPackageDistribution,
  getRecentMembers,
} from "@/server/queries/dashboard"
import { RegistrationChart } from "@/components/dashboard/registration-chart"
import { PackageChart } from "@/components/dashboard/package-chart"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MemberStatusBadge } from "@/components/member/status-badge"
import { formatDate } from "@/lib/utils"

export default async function DashboardPage() {

  // Fetch all dashboard data parallelly
  const [metrics, trends, packageDistribution, recentMembers] = await Promise.all([
    getDashboardMetrics(),
    getRegistrationTrends(),
    getPackageDistribution(),
    getRecentMembers(),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Real-time metrics and registrations log overview.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Total Active Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Active Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalActive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently registered active members
            </p>
          </CardContent>
        </Card>

        {/* Card 2: New This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New This Month
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Member registrations added this calendar month
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Medical Clearance Pending */}
        <Card className={metrics.medicalClearancePending > 0 ? "border-destructive/30 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Medical Clearances Required
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 ${metrics.medicalClearancePending > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.medicalClearancePending > 0 ? "text-destructive" : ""}`}>
              {metrics.medicalClearancePending}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Members with flagged PAR-Q assessments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Sections */}
      <div className="grid gap-4 md:grid-cols-7">
        <RegistrationChart data={trends} />
        <PackageChart data={packageDistribution} />
      </div>

      {/* Recent Activity Section */}
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Recent Registrations</CardTitle>
            <CardDescription>
              The most recently registered gym members.
            </CardDescription>
          </div>
          <Link href="/members">
            <Button variant="ghost" size="sm" className="text-xs font-semibold gap-1">
              View All Members <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentMembers.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">
              No recent members found.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-3 font-medium">Member</th>
                      <th className="py-3 font-medium">Membership No.</th>
                      <th className="py-3 font-medium">Registration Date</th>
                      <th className="py-3 font-medium">Package</th>
                      <th className="py-3 font-medium">Trainer</th>
                      <th className="py-3 font-medium">Status</th>
                      <th className="py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMembers.map((member) => (
                      <tr key={member.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 font-semibold">{member.fullName}</td>
                        <td className="py-3 text-muted-foreground">{member.membershipNo}</td>
                        <td className="py-3">{formatDate(member.date)}</td>
                        <td className="py-3 capitalize text-xs font-medium">{member.package.toLowerCase().replace("_", " ")}</td>
                        <td className="py-3 text-muted-foreground">{member.trainer?.name || "Unassigned"}</td>
                        <td className="py-3">
                          <MemberStatusBadge status={member.status} />
                        </td>
                        <td className="py-3 text-right">
                          <Link href={`/members/${member.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                              View Profile
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}