import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getStaffOptions, getSuggestedMembershipNo } from "@/server/queries/members"
import { getActivePackages } from "@/server/queries/package"
import { RegistrationWizard } from "@/components/member/registration-wizard"

export const metadata = { title: "Register Member — S2V Fitness" }

export default async function NewMemberPage() {
  const session = await auth()
  const role = session?.user?.role

  if (!role || (role !== "ADMIN" && role !== "COUNSELLOR" && role !== "OWNER")) {
    redirect("/members")
  }

  const [{ counsellors, trainers }, suggestedNo, packages] = await Promise.all([
    getStaffOptions(),
    getSuggestedMembershipNo(),
    getActivePackages(),
  ])

  return (
    <div className="flex flex-col gap-6 px-6 pt-6 pb-0">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Register member</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details below to create a new membership record.
        </p>
      </div>
      <RegistrationWizard
        counsellors={counsellors}
        trainers={trainers}
        packages={packages.map((p) => ({
          id: p.id,
          name: p.name,
          durationMonths: p.durationMonths,
          price: p.price ? Number(p.price) : null,
        }))}
        showCounsellorField={role === "ADMIN" || role === "OWNER"}
        defaultValues={{ membershipNo: suggestedNo }}
        role={role}
      />
    </div>
  )
}
