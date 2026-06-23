import React from "react"
import { notFound } from "next/navigation"
import {
  ClipboardList,
  Activity,
  Moon,
  Stethoscope,
  Ruler,
  StickyNote,
  FolderOpen,
  Dumbbell,
} from "lucide-react"

import { auth } from "@/lib/auth"
import { getMemberById } from "@/server/queries/members"
import { getMemberMeasurements } from "@/server/queries/measurements"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ProfileHeader } from "@/components/member/profile-header"
import { EmptyModuleTab } from "@/components/member/empty-module-tab"
import { MemberStatusBadge } from "@/components/member/status-badge"
import { MeasurementsTab } from "@/components/measurements/measurements-tab"
import { formatDate } from "@/lib/utils"
import { PACKAGE_OPTIONS, MARITAL_STATUS_OPTIONS, GENDER_OPTIONS } from "@/lib/constants"

interface PageProps {
  params: Promise<{ memberId: string }>
}

function InfoRow({ label, value, children }: { label: string; value?: React.ReactNode; children?: React.ReactNode }) {
  const content = children ?? value
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-4">
      <dt className="w-36 shrink-0 text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{content ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { memberId } = await params
  const [session, member, measurements] = await Promise.all([
    auth(),
    getMemberById(memberId),
    getMemberMeasurements(memberId),
  ])

  if (!member) notFound()

  const role = session?.user?.role ?? "TRAINER"
  const userId = session?.user?.id ?? ""
  const canManage = role === "ADMIN" || role === "COUNSELLOR" || role === "TRAINER"

  // Trainers can only view their assigned members
  if (role === "TRAINER" && member.trainerId !== userId) notFound()

  const canEdit = role === "ADMIN" || role === "COUNSELLOR"

  const genderLabel = GENDER_OPTIONS.find((g) => g.value === member.gender)?.label ?? member.gender
  const maritalLabel = member.maritalStatus
    ? (MARITAL_STATUS_OPTIONS.find((m) => m.value === member.maritalStatus)?.label ?? member.maritalStatus)
    : null
  const packageLabel = PACKAGE_OPTIONS.find((p) => p.value === member.package)?.label ?? member.package

  return (
    <div className="flex flex-col gap-6 p-6">
      <ProfileHeader member={member} canManage={canEdit} />

      <Tabs defaultValue="personal">
        <TabsList className="flex w-full flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="screening">Screening</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="menstrual">Menstrual</TabsTrigger>
          <TabsTrigger value="postural">Postural</TabsTrigger>
          <TabsTrigger value="fitness">Fitness Tests</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* ── 1. Personal ─────────────────────────────────────────────── */}
        <TabsContent value="personal" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Personal information</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <InfoRow label="Full name" value={member.fullName} />
                <InfoRow label="Membership no." value={member.membershipNo} />
                <InfoRow label="Receipt no." value={member.receiptNo} />
                <InfoRow label="Registration date" value={formatDate(member.date)} />
                <Separator />
                <InfoRow label="Gender" value={genderLabel} />
                <InfoRow label="Date of birth" value={formatDate(member.dateOfBirth)} />
                <InfoRow label="Age" value={member.age !== null ? `${member.age} years` : null} />
                <InfoRow label="Marital status" value={maritalLabel} />
                <Separator />
                <InfoRow label="Mobile" value={member.mobile} />
                <InfoRow label="Email" value={member.email} />
                <InfoRow label="Address" value={member.address} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 2. Membership ───────────────────────────────────────────── */}
        <TabsContent value="membership" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Membership details</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <InfoRow label="Package" value={packageLabel} />
                <InfoRow label="Duration" value={`${member.durationMonths} month${member.durationMonths === 1 ? "" : "s"}`} />
                <InfoRow label="Start date" value={formatDate(member.startDate)} />
                <InfoRow label="End date" value={formatDate(member.endDate)} />
                <InfoRow label="Status"><MemberStatusBadge status={member.status} /></InfoRow>
                <Separator />
                <InfoRow label="Counsellor" value={member.counsellor?.name} />
                <InfoRow label="Trainer" value={member.trainer?.name} />
                <Separator />
                <InfoRow label="Fitness goals">
                  <div className="flex flex-wrap gap-1.5">
                    {member.fitnessGoals.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      member.fitnessGoals.map((g) => (
                        <Badge key={g.id} variant="secondary">{g.goal}</Badge>
                      ))
                    )}
                  </div>
                </InfoRow>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 3–8. Modules not yet built ──────────────────────────────── */}
        <TabsContent value="screening" className="mt-4">
          <EmptyModuleTab icon={ClipboardList} title="Fitness screening not recorded"
            description="PAR-Q and fitness screening questions will appear here once filled in." />
        </TabsContent>
        <TabsContent value="lifestyle" className="mt-4">
          <EmptyModuleTab icon={Activity} title="Lifestyle profile not recorded"
            description="Occupation, activity levels, sleep, and habit information will appear here." />
        </TabsContent>
        <TabsContent value="medical" className="mt-4">
          <EmptyModuleTab icon={Stethoscope} title="Medical history not recorded"
            description="Health conditions, notes, and medical clearance details will appear here." />
        </TabsContent>
        <TabsContent value="menstrual" className="mt-4">
          <EmptyModuleTab icon={Moon} title="Menstrual history not recorded"
            description="This section applies to female members. Cycle history will appear here." />
        </TabsContent>
        <TabsContent value="postural" className="mt-4">
          <EmptyModuleTab icon={Ruler} title="Postural analysis not recorded"
            description="Neck, spine, scapula, and lower-limb postural observations will appear here." />
        </TabsContent>
        <TabsContent value="fitness" className="mt-4">
          <EmptyModuleTab icon={Dumbbell} title="Fitness tests not recorded"
            description="Cardio, muscular endurance, flexibility, and balance test results will appear here." />
        </TabsContent>

        {/* ── 9. Measurements (LIVE) ───────────────────────────────────── */}
        <TabsContent value="measurements" className="mt-4">
          <MeasurementsTab
            memberId={memberId}
            memberGender={member.gender}
            measurements={measurements}
            canManage={canManage}
          />
        </TabsContent>

        {/* ── 10–11. Remaining stubs ───────────────────────────────────── */}
        <TabsContent value="notes" className="mt-4">
          <EmptyModuleTab icon={StickyNote} title="No counselling notes yet"
            description="Session notes added by counsellors and trainers will appear here." />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <EmptyModuleTab icon={FolderOpen} title="No documents uploaded"
            description="Medical reports, diet plans, consent forms, and progress photos will appear here." />
        </TabsContent>
      </Tabs>
    </div>
  )
}
