import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getStaffList } from "@/server/queries/users"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StaffTableWrapper } from "@/components/staff/staff-table-wrapper"

export default async function StaffPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    notFound()
  }

  const staff = await getStaffList()

  // Safely mapping database role string types
  const mappedStaff = staff.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role as "ADMIN" | "COUNSELLOR" | "TRAINER",
    isActive: s.isActive,
  }))

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Onboard, manage, and configure system access for trainers, counsellors, and administrators.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle>Staff Accounts</CardTitle>
            <CardDescription>
              A total of {mappedStaff.length} staff accounts registered.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <StaffTableWrapper initialUsers={mappedStaff} currentUserId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
