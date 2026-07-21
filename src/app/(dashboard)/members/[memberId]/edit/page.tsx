import { notFound, redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getMemberById, getStaffOptions } from "@/server/queries/members"
import { getActivePackages } from "@/server/queries/package"
import { MemberForm } from "@/components/member/member-form"
import type { MemberFormValues } from "@/lib/validations/member"

interface PageProps {
  params: Promise<{ memberId: string }>
}

export const metadata = { title: "Edit Member — S2V Fitness" }

export default async function EditMemberPage({ params }: PageProps) {
  const { memberId } = await params
  const session = await auth()
  const role = session?.user?.role

  if (!role || (role !== "ADMIN" && role !== "COUNSELLOR" && role !== "OWNER")) {
    redirect(`/members/${memberId}`)
  }

  const [member, { counsellors, trainers }, packages] = await Promise.all([
    getMemberById(memberId),
    getStaffOptions(),
    getActivePackages(),
  ])

  if (!member || member.status === "ARCHIVED") notFound()

  // Map DB record → form default values, coercing Dates to strings for date inputs
  const defaultValues: Partial<MemberFormValues> = {
    fullName: member.fullName,
    membershipNo: member.membershipNo,
    receiptNo: member.receiptNo ?? "",
    registrationDate: member.date,
    gender: member.gender as MemberFormValues["gender"],
    dateOfBirth: member.dateOfBirth,
    mobile: member.mobile,
    email: member.email ?? "",
    address: member.address ?? "",
    maritalStatus: member.maritalStatus as MemberFormValues["maritalStatus"],
    package: member.package as MemberFormValues["package"],
    durationMonths: member.durationMonths,
    startDate: member.startDate,
    endDate: member.endDate,
    fitnessGoals: member.fitnessGoals.map((g) => g.goal) as MemberFormValues["fitnessGoals"],
    counsellorId: member.counsellorId ?? "",
    trainerId: member.trainerId ?? "",
    packageId: member.packageId ?? "",
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-0">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Edit member</h1>
        <p className="text-sm text-muted-foreground">
          Updating record for <strong>{member.fullName}</strong> · {member.membershipNo}
        </p>
      </div>
      <MemberForm
        mode="edit"
        memberId={memberId}
        defaultValues={defaultValues}
        counsellors={counsellors}
        trainers={trainers}
        packages={packages.map((p) => ({
          id: p.id,
          name: p.name,
          durationMonths: p.durationMonths,
          price: p.price ? Number(p.price) : null,
        }))}
        showCounsellorField={role === "ADMIN" || role === "OWNER"}
      />
    </div>
  )
}
