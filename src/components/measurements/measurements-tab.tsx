"use client"

import { useState } from "react"
import { PlusCircle, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { MeasurementForm } from "@/components/measurements/measurement-form"
import { MeasurementHistoryTable } from "@/components/measurements/measurement-history-table"
import { ProgressCharts } from "@/components/measurements/progress-charts"
import { formatDate } from "@/lib/utils"
import { getBMIStatus, getWHRStatus } from "@/lib/constants"

const BMI_VARIANT = {
  Underweight: "warning",
  Healthy: "success",
  Overweight: "warning",
  Obese: "destructive",
} as const

interface Measurement {
  id: string
  measuredAt: Date
  heightCm: number | null
  weightKg: number | null
  bmi: number | null
  bodyFatPercent: number | null
  visceralFat: number | null
  bmr: number | null
  biologicalAge: number | null
  shoulderWidth: number | null
  hipWidth: number | null
  neckCirc: number | null
  shoulderCirc: number | null
  chestNormal: number | null
  chestExpansion: number | null
  armCirc: number | null
  forearmCirc: number | null
  abdomenCirc: number | null
  waistCirc: number | null
  hipCirc: number | null
  midThighCirc: number | null
  calfCirc: number | null
  waistHipRatio: number | null
  ratioIndicator: string | null
}

interface MeasurementsTabProps {
  memberId: string
  memberGender: string
  measurements: Measurement[]
  canManage: boolean
}

function StatBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  )
}

export function MeasurementsTab({
  memberId,
  memberGender,
  measurements,
  canManage,
}: MeasurementsTabProps) {
  const latest = measurements[0] ?? null
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const editTarget = editId ? measurements.find((m) => m.id === editId) : null

  function handleEdit(id: string) {
    setEditId(id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleFormSuccess() {
    setShowForm(false)
    setEditId(null)
  }

  function handleCancel() {
    setShowForm(false)
    setEditId(null)
  }

  const bmiStatus = latest?.bmi ? getBMIStatus(latest.bmi) : null
  const whrStatus =
    latest?.waistHipRatio ? getWHRStatus(latest.waistHipRatio, memberGender) : null

  return (
    <div className="space-y-6">
      {/* ── Add / Edit toggle ────────────────────────────────────────── */}
      {canManage && (
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            {showForm
              ? editId
                ? "Edit measurement"
                : "New measurement"
              : "Measurements"}
          </h2>
          <Button
            variant={showForm ? "outline" : "default"}
            size="sm"
            onClick={() => {
              if (showForm) {
                handleCancel()
              } else {
                setEditId(null)
                setShowForm(true)
              }
            }}
          >
            {showForm ? (
              <>
                <ChevronUp /> Hide form
              </>
            ) : (
              <>
                <PlusCircle /> Add measurement
              </>
            )}
          </Button>
        </div>
      )}

      {/* ── Form ────────────────────────────────────────────────────── */}
      {showForm && canManage && (
        <MeasurementForm
          memberId={memberId}
          memberGender={memberGender}
          mode={editId ? "edit" : "create"}
          measurementId={editId ?? undefined}
          defaultValues={
            editTarget
              ? {
                  measuredAt: new Date(editTarget.measuredAt),
                  heightCm: editTarget.heightCm ?? undefined,
                  weightKg: editTarget.weightKg ?? undefined,
                  bodyFatPercent: editTarget.bodyFatPercent ?? undefined,
                  visceralFat: editTarget.visceralFat ?? undefined,
                  bmr: editTarget.bmr ?? undefined,
                  biologicalAge: editTarget.biologicalAge ?? undefined,
                  shoulderWidth: editTarget.shoulderWidth ?? undefined,
                  hipWidth: editTarget.hipWidth ?? undefined,
                  neckCirc: editTarget.neckCirc ?? undefined,
                  shoulderCirc: editTarget.shoulderCirc ?? undefined,
                  chestNormal: editTarget.chestNormal ?? undefined,
                  chestExpansion: editTarget.chestExpansion ?? undefined,
                  armCirc: editTarget.armCirc ?? undefined,
                  forearmCirc: editTarget.forearmCirc ?? undefined,
                  abdomenCirc: editTarget.abdomenCirc ?? undefined,
                  waistCirc: editTarget.waistCirc ?? undefined,
                  hipCirc: editTarget.hipCirc ?? undefined,
                  midThighCirc: editTarget.midThighCirc ?? undefined,
                  calfCirc: editTarget.calfCirc ?? undefined,
                }
              : undefined
          }
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      )}

      {/* ── Latest summary card ──────────────────────────────────────── */}
      {latest && !showForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Latest — {formatDate(latest.measuredAt)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBlock
                label="Weight"
                value={latest.weightKg ? `${latest.weightKg} kg` : null}
              />
              <StatBlock
                label="BMI"
                value={
                  latest.bmi ? (
                    <span className="flex items-center gap-1.5">
                      {latest.bmi.toFixed(1)}
                      {bmiStatus && (
                        <Badge variant={BMI_VARIANT[bmiStatus]}>{bmiStatus}</Badge>
                      )}
                    </span>
                  ) : null
                }
              />
              <StatBlock
                label="Body Fat %"
                value={latest.bodyFatPercent ? `${latest.bodyFatPercent}%` : null}
              />
              <StatBlock
                label="BMR"
                value={latest.bmr ? `${latest.bmr} kcal` : null}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBlock
                label="Waist"
                value={latest.waistCirc ? `${latest.waistCirc} cm` : null}
              />
              <StatBlock
                label="Hip"
                value={latest.hipCirc ? `${latest.hipCirc} cm` : null}
              />
              <StatBlock
                label="WHR"
                value={
                  latest.waistHipRatio ? (
                    <span className="flex items-center gap-1.5">
                      {latest.waistHipRatio.toFixed(2)}
                      {whrStatus && (
                        <Badge
                          variant={whrStatus === "Healthy" ? "success" : "destructive"}
                        >
                          {whrStatus}
                        </Badge>
                      )}
                    </span>
                  ) : null
                }
              />
              <StatBlock
                label="Biological age"
                value={latest.biologicalAge ?? null}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── History table ────────────────────────────────────────────── */}
      {!showForm && (
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">History</h3>
          </div>
          <MeasurementHistoryTable
            measurements={measurements}
            memberId={memberId}
            memberGender={memberGender}
            canManage={canManage}
            onEdit={handleEdit}
          />
        </div>
      )}

      {/* ── Progress charts ──────────────────────────────────────────── */}
      {!showForm && measurements.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Progress</h3>
          <ProgressCharts
            measurements={measurements}
            memberGender={memberGender}
          />
        </div>
      )}
    </div>
  )
}
