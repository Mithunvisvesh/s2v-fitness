"use client"

import { useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  measurementSchema,
  type MeasurementFormValues,
} from "@/lib/validations/measurement"
import { createMeasurement, updateMeasurement } from "@/server/actions/measurements"
import {
  calcBMI,
  calcWHR,
  getBMIStatus,
  getWHRStatus,
} from "@/lib/constants"
import { toDateInputValue } from "@/lib/utils"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MeasurementFormProps {
  memberId: string
  memberGender: string
  mode: "create" | "edit"
  measurementId?: string
  defaultValues?: Partial<MeasurementFormValues>
  onSuccess?: () => void
  onCancel?: () => void
}

// ── BMI / WHR live-preview badge ──────────────────────────────────────────────
const BMI_VARIANT = {
  Underweight: "warning",
  Healthy: "success",
  Overweight: "warning",
  Obese: "destructive",
} as const

const WHR_VARIANT = {
  Healthy: "success",
  "At Risk": "destructive",
} as const

function LiveBMI({ bmi }: { bmi: number | null }) {
  if (!bmi) return null
  const status = getBMIStatus(bmi)
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-mono font-medium">{bmi.toFixed(1)}</span>
      <Badge variant={BMI_VARIANT[status]}>{status}</Badge>
    </div>
  )
}

function LiveWHR({
  whr,
  gender,
}: {
  whr: number | null
  gender: string
}) {
  if (!whr) return null
  const status = getWHRStatus(whr, gender)
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-mono font-medium">{whr.toFixed(2)}</span>
      <Badge variant={WHR_VARIANT[status]}>{status}</Badge>
    </div>
  )
}

// ── Small numeric input with cm/kg unit label ─────────────────────────────────
function NumericField({
  label,
  unit,
  field,
  placeholder = "—",
}: {
  label: string
  unit?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any
  placeholder?: string
}) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="relative">
        <FormControl>
          <Input
            type="number"
            step="0.1"
            min="0"
            placeholder={placeholder}
            className={unit ? "pr-10" : ""}
            value={field.value ?? ""}
            onChange={(e) =>
              field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
            }
          />
        </FormControl>
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      <FormMessage />
    </FormItem>
  )
}


// ── Main form ─────────────────────────────────────────────────────────────────
export function MeasurementForm({
  memberId,
  memberGender,
  mode,
  measurementId,
  defaultValues,
  onSuccess,
  onCancel,
}: MeasurementFormProps) {
  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      measuredAt: new Date(),
      ...defaultValues,
    },
  })

  const weight = form.watch("weightKg")
  const height = form.watch("heightCm")
  const waist = form.watch("waistCirc")
  const hip = form.watch("hipCirc")

  const liveBMI = weight && height && height > 0 ? calcBMI(weight, height) : null
  const liveWHR = waist && hip && hip > 0 ? calcWHR(waist, hip) : null

  // Keep defaultValues in sync when switching edit targets
  useEffect(() => {
    if (defaultValues) {
      form.reset({ measuredAt: new Date(), ...defaultValues })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurementId])

  const onSubmit = useCallback(
    async (values: MeasurementFormValues) => {
      const result =
        mode === "create"
          ? await createMeasurement(memberId, values, memberGender)
          : await updateMeasurement(measurementId!, memberId, values, memberGender)

      if (!result.success) {
        Object.entries(result.error.fieldErrors).forEach(([f, msgs]) => {
          if (msgs?.[0])
            form.setError(f as keyof MeasurementFormValues, { message: msgs[0] })
        })
        toast.error("Fix the highlighted fields.")
        return
      }

      toast.success(mode === "create" ? "Measurement recorded." : "Measurement updated.")
      onSuccess?.()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, memberId, measurementId, memberGender]
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Body Composition</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Date */}
            <FormField
              control={form.control}
              name="measuredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of measurement</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={toDateInputValue(field.value)}
                      onChange={(e) =>
                        field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Height */}
            <FormField
              control={form.control}
              name="heightCm"
              render={({ field }) => (
                <NumericField label="Height" unit="cm" field={field} />
              )}
            />

            {/* Weight */}
            <FormField
              control={form.control}
              name="weightKg"
              render={({ field }) => (
                <NumericField label="Weight" unit="kg" field={field} />
              )}
            />

            {/* BMI — read-only, live calc */}
            <FormItem>
              <FormLabel>BMI</FormLabel>
              <div className="flex h-8 items-center rounded-lg border bg-muted/40 px-2.5">
                <LiveBMI bmi={liveBMI} />
                {!liveBMI && (
                  <span className="text-sm text-muted-foreground">
                    Enter height & weight
                  </span>
                )}
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="bodyFatPercent"
              render={({ field }) => (
                <NumericField label="Body fat %" unit="%" field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="visceralFat"
              render={({ field }) => (
                <NumericField label="Visceral fat" field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="bmr"
              render={({ field }) => (
                <NumericField label="BMR" unit="kcal" field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="biologicalAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biological age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      max="120"
                      placeholder="—"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Frame Measurements</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="shoulderWidth"
              render={({ field }) => (
                <NumericField
                  label="Upper body width (Bi-Acromial)"
                  unit="cm"
                  field={field}
                />
              )}
            />
            <FormField
              control={form.control}
              name="hipWidth"
              render={({ field }) => (
                <NumericField
                  label="Lower body width (Bi-Iliac)"
                  unit="cm"
                  field={field}
                />
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Body Circumference</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="neckCirc"
              render={({ field }) => (
                <NumericField label="Neck" unit="cm" field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="shoulderCirc"
              render={({ field }) => (
                <NumericField label="Shoulder (Bi-Acromial)" unit="cm" field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="chestNormal"
              render={({ field }) => (
                <NumericField label="Chest — normal" unit="cm" field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="chestExpansion"
              render={({ field }) => (
                <NumericField label="Chest — expansion" unit="cm" field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="armCirc"
              render={({ field }) => (
                <NumericField label="Arm" unit="cm" field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="forearmCirc"
              render={({ field }) => (
                <NumericField label="Forearm" unit="cm" field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="abdomenCirc"
              render={({ field }) => (
                <NumericField label="Abdominal" unit="cm" field={field} />
              )}
            />

            {/* Waist — shows live WHR when both waist + hip are entered */}
            <FormField
              control={form.control}
              name="waistCirc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waist</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="—"
                        className="pr-10"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      cm
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hip — shows live WHR when both waist + hip are entered */}
            <FormField
              control={form.control}
              name="hipCirc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hip</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="—"
                        className="pr-10"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      cm
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Waist/Hip Ratio — read-only, live */}
            <FormItem>
              <FormLabel>
                Waist/Hip Ratio
                <span className="ml-1 text-xs text-muted-foreground font-normal">
                  (M &lt;0.95 / F &lt;0.80)
                </span>
              </FormLabel>
              <div className="flex h-8 items-center rounded-lg border bg-muted/40 px-2.5">
                <LiveWHR whr={liveWHR} gender={memberGender} />
                {!liveWHR && (
                  <span className="text-sm text-muted-foreground">
                    Enter waist & hip
                  </span>
                )}
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="midThighCirc"
              render={({ field }) => (
                <NumericField label="Mid-Thigh" unit="cm" field={field} />
              )}
            />
            <FormField
              control={form.control}
              name="calfCirc"
              render={({ field }) => (
                <NumericField label="Calf" unit="cm" field={field} />
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 rounded-xl border bg-card px-4 py-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Saving..."
              : mode === "create"
              ? "Save measurement"
              : "Update measurement"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
