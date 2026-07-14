"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ParqForm } from "./parq-form"
import { LifestyleForm } from "./lifestyle-form"
import { MedicalForm } from "./medical-form"
import { MenstrualForm } from "./menstrual-form"
import { AlertCircle } from "lucide-react"

import { type PARQ, type LifestyleProfile, type MedicalCondition, type MenstrualHistory } from "@prisma/client"

interface ScreeningTabProps {
  memberId: string
  memberGender: string
  role: string
  latestParq: PARQ | null
  latestLifestyle: LifestyleProfile | null
  latestMedical: MedicalCondition[] | null
  latestMenstrual: MenstrualHistory | null
  onSuccess?: () => void
}

export function ScreeningTab({
  memberId,
  memberGender,
  role,
  latestParq,
  latestLifestyle,
  latestMedical,
  latestMenstrual,
  onSuccess,
}: ScreeningTabProps) {
  const showMenstrual = memberGender === "FEMALE" && role !== "TRAINER"
  const showMedicalReadOnly = role === "TRAINER"
  const hasMedicalClearanceRequired = latestParq?.medicalClearanceRequired === true

  // Map null fields from database models to undefined for strict Zod compatibility
  const parqFormValues = latestParq
    ? {
        assessedAt: latestParq.assessedAt,
        assessorId: latestParq.assessorId ?? undefined,
        q1_heartTrouble: latestParq.q1_heartTrouble,
        q2_chestPain: latestParq.q2_chestPain,
        q3_dizzinessFainting: latestParq.q3_dizzinessFainting,
        q4_highBloodPressure: latestParq.q4_highBloodPressure,
        q5_boneJointProblems: latestParq.q5_boneJointProblems,
        q6_otherReasons: latestParq.q6_otherReasons,
        q7_over45Unaccustomed: latestParq.q7_over45Unaccustomed,
        notes: latestParq.notes ?? undefined,
      }
    : null

  const lifestyleFormValues = latestLifestyle
    ? {
        assessedAt: latestLifestyle.assessedAt,
        assessorId: latestLifestyle.assessorId ?? undefined,
        occupation: latestLifestyle.occupation ?? undefined,
        physicalActivityLevel: latestLifestyle.physicalActivityLevel ?? undefined,
        workStress: latestLifestyle.workStress ?? undefined,
        personalStress: latestLifestyle.personalStress ?? undefined,
        travelFrequency: latestLifestyle.travelFrequency ?? undefined,
        avgSleepHours: latestLifestyle.avgSleepHours ?? undefined,
        sleepQuality: latestLifestyle.sleepQuality ?? undefined,
        sleepTiming: latestLifestyle.sleepTiming ?? undefined,
        afternoonNap: latestLifestyle.afternoonNap ?? undefined,
        napDuration: latestLifestyle.napDuration ?? undefined,
        smoking: latestLifestyle.smoking ?? undefined,
        smokingFrequency: latestLifestyle.smokingFrequency ?? undefined,
        alcohol: latestLifestyle.alcohol ?? undefined,
        alcoholFrequency: latestLifestyle.alcoholFrequency ?? undefined,
        tobacco: latestLifestyle.tobacco ?? undefined,
        tobaccoFrequency: latestLifestyle.tobaccoFrequency ?? undefined,
      }
    : null

  const medicalFormValues =
    latestMedical && latestMedical.length > 0
      ? {
          assessedAt: new Date(latestMedical[0].assessedAt),
          assessorId: latestMedical[0].assessorId ?? undefined,
          conditions: latestMedical.map((m) => ({
            conditionName: m.conditionName,
            customName: m.customName ?? undefined,
            details: m.details ?? undefined,
            notes: m.notes ?? undefined,
          })),
        }
      : null

  const menstrualFormValues = latestMenstrual
    ? {
        assessedAt: latestMenstrual.assessedAt,
        assessorId: latestMenstrual.assessorId ?? undefined,
        lastCycleDate: latestMenstrual.lastCycleDate ?? undefined,
        ageAtMenstruationOnset: latestMenstrual.ageAtMenstruationOnset ?? undefined,
        averageCycleLength: latestMenstrual.averageCycleLength ?? undefined,
        irregularCycles: latestMenstrual.irregularCycles ?? undefined,
        spotting: latestMenstrual.spotting ?? undefined,
        missedCycles: latestMenstrual.missedCycles ?? undefined,
        painfulMenstruation: latestMenstrual.painfulMenstruation ?? undefined,
        notes: latestMenstrual.notes ?? undefined,
      }
    : null

  return (
    <div className="space-y-6">
      {/* ── 1. Medical Clearance Required Warning Banner ─────────────────── */}
      {hasMedicalClearanceRequired && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          <div className="text-sm font-medium">
            ⚠️ Medical Clearance Required: The most recent PAR-Q assessment indicates that physician clearance is required before commencing training.
          </div>
        </div>
      )}

      {/* ── 2. Secondary Sub-Tabs for Screening Modules ───────────────────── */}
      <Tabs defaultValue="parq">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex md:grid-cols-none gap-1 p-1 h-auto bg-muted">
          <TabsTrigger value="parq">PAR-Q</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
          <TabsTrigger value="medical">Medical Conditions</TabsTrigger>
          {showMenstrual && <TabsTrigger value="menstrual">Menstrual History</TabsTrigger>}
        </TabsList>

        {/* PAR-Q Content */}
        <TabsContent value="parq" className="mt-4">
          <ParqForm
            memberId={memberId}
            defaultValues={parqFormValues}
            onSuccess={onSuccess}
          />
        </TabsContent>

        {/* Lifestyle Content */}
        <TabsContent value="lifestyle" className="mt-4">
          <LifestyleForm
            memberId={memberId}
            defaultValues={lifestyleFormValues}
            onSuccess={onSuccess}
          />
        </TabsContent>

        {/* Medical Content */}
        <TabsContent value="medical" className="mt-4">
          <MedicalForm
            memberId={memberId}
            defaultValues={medicalFormValues}
            onSuccess={onSuccess}
            readOnly={showMedicalReadOnly}
          />
        </TabsContent>

        {/* Menstrual Content */}
        {showMenstrual && (
          <TabsContent value="menstrual" className="mt-4">
            <MenstrualForm
              memberId={memberId}
              defaultValues={menstrualFormValues}
              onSuccess={onSuccess}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
