import React from "react"
import { notFound } from "next/navigation"

import { auth } from "@/lib/auth"
import { getMemberById } from "@/server/queries/members"
import { getMemberMeasurements } from "@/server/queries/measurements"
import { ScreeningTab } from "@/components/member/screening/screening-tab"
import {
  getLatestPARQ,
  getLatestLifestyleProfile,
  getLatestMedicalConditions,
  getLatestMenstrualHistory,
} from "@/server/queries/fitness-screening"
import {
  getLatestPosturalAnalysis,
  getLatestFitnessTest,
} from "@/server/queries/fitness-testing"
import { AssessmentsTab } from "@/components/member/assessments/assessments-tab"
import { CounsellingTab } from "@/components/member/counselling-tab"
import { ConsentTab } from "@/components/member/consent-tab"
import {
  getCounsellingNotes,
  getMemberConsent,
} from "@/server/queries/counselling-consent"
import { getTrainers } from "@/server/queries/users"
import { TrainerAssignmentCard } from "@/components/member/trainer-assignment-card"
import { getMemberDocuments } from "@/server/queries/documents"
import { DocumentsTab } from "@/components/member/documents-tab"
import { getMemberReportData } from "@/server/queries/reports"
import { ReportDownloadButton } from "@/components/member/report-download-button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ProfileHeader } from "@/components/member/profile-header"
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
  const [session, member] = await Promise.all([
    auth(),
    getMemberById(memberId),
  ])

  if (!member) notFound()

  const role = session?.user?.role ?? "TRAINER"
  const userId = session?.user?.id ?? ""
  const canManage = role === "ADMIN" || role === "COUNSELLOR" || role === "TRAINER"

  // Trainers can only view their assigned members
  if (role === "TRAINER" && member.trainerId !== userId) notFound()

  const canEdit = role === "ADMIN" || role === "COUNSELLOR"

  const showMenstrual = member.gender === "FEMALE" && role !== "TRAINER"
  const showConsent = role !== "TRAINER"

  const [
    measurements,
    latestParq,
    latestLifestyle,
    latestMedical,
    latestMenstrual,
    latestPostural,
    latestFitnessTest,
    counsellingNotes,
    consent,
    trainers,
    documents,
    reportData,
  ] = await Promise.all([
    getMemberMeasurements(memberId),
    getLatestPARQ(memberId),
    getLatestLifestyleProfile(memberId),
    getLatestMedicalConditions(memberId),
    showMenstrual ? getLatestMenstrualHistory(memberId) : Promise.resolve(null),
    getLatestPosturalAnalysis(memberId),
    getLatestFitnessTest(memberId),
    getCounsellingNotes(memberId),
    showConsent ? getMemberConsent(memberId) : Promise.resolve(null),
    getTrainers(),
    getMemberDocuments(memberId),
    getMemberReportData(memberId),
  ])

  const genderLabel = GENDER_OPTIONS.find((g) => g.value === member.gender)?.label ?? member.gender
  const maritalLabel = member.maritalStatus
    ? (MARITAL_STATUS_OPTIONS.find((m) => m.value === member.maritalStatus)?.label ?? member.maritalStatus)
    : null
  const packageLabel = PACKAGE_OPTIONS.find((p) => p.value === member.package)?.label ?? member.package

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <ProfileHeader member={member} canManage={canEdit}>
            <ReportDownloadButton data={reportData} />
          </ProfileHeader>
        </div>
        <div>
          <TrainerAssignmentCard
            memberId={memberId}
            currentTrainerId={member.trainerId}
            trainers={trainers}
            role={role}
          />
        </div>
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="flex w-full flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="screening">Screening</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          {role !== "TRAINER" && <TabsTrigger value="consent">Consent</TabsTrigger>}
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

        {/* ── 3. Screening ────────────────────────────────────────────── */}
        <TabsContent value="screening" className="mt-4">
          <ScreeningTab
            memberId={memberId}
            memberGender={member.gender}
            role={role}
            latestParq={latestParq}
            latestLifestyle={latestLifestyle}
            latestMedical={latestMedical}
            latestMenstrual={latestMenstrual}
          />
        </TabsContent>
        <TabsContent value="assessments" className="mt-4">
          <AssessmentsTab
            memberId={memberId}
            latestPostural={latestPostural}
            latestFitnessTest={latestFitnessTest}
          />
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
          <CounsellingTab
            memberId={memberId}
            role={role}
            notes={counsellingNotes}
          />
        </TabsContent>
        {role !== "TRAINER" && (
          <TabsContent value="consent" className="mt-4">
            <ConsentTab
              memberId={memberId}
              role={role}
              consent={consent}
            />
          </TabsContent>
        )}
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab
            memberId={memberId}
            documents={documents}
            role={role}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
