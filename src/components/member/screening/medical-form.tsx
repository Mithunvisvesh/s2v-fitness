"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"
import {
  medicalConditionsSchema,
  type MedicalConditionsFormValues,
  type SingleMedicalConditionValues,
  type MedicalConditionName,
} from "@/lib/validations/fitness-screening"
import { saveMedicalConditions } from "@/server/actions/fitness-screening"
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface MedicalFormProps {
  memberId: string
  defaultValues?: MedicalConditionsFormValues | { assessedAt: Date; conditions: SingleMedicalConditionValues[] } | null
  onSuccess?: () => void
  readOnly?: boolean
}

export const MEDICAL_CONDITION_LABELS: Record<string, string> = {
  CHRONIC_ILLNESS: "Any chronic illness or condition (cancer, MS, epilepsy, fibromyalgia)",
  RECENT_SURGERY: "Recent surgery (in past 24 months)",
  PREGNANCY: "Pregnancy (now or within last 12 months)",
  BREASTFEEDING: "Breast feeding (now or within last 12 months)",
  BREATHING_LUNG: "History of breathing / lung conditions (asthma, COPD, emphysema)",
  MUSCULOSKELETAL_INJURY: "Muscle, ligament, tendon, joint injury or disorder still affecting you",
  ARTHRITIS: "Arthritis, Rheumatoid arthritis, osteoporosis",
  DIABETES: "Diabetes (type I or II)",
  THYROID: "Thyroid condition or hypo / hyperglycemia",
  OBESITY: "Obesity (more than 20 percent over ideal weight)",
  HIGH_CHOLESTEROL: "Increased blood cholesterol",
  FAMILY_HEART_HISTORY: "History of heart problems or other condition in immediate family",
  HERNIA: "Hernia or any condition that may be aggravated by lifting weights",
  FREQUENT_HEADACHES: "Frequent headaches (migraine, cluster, stress / tension)",
  FREQUENT_RESPIRATORY: "Frequent colds, flu, upper respiratory infection, strep throat",
  DEPRESSION_BIPOLAR_SAD: "Depression, Bipolar, SAD",
  CIRCULATORY: "Circulatory problems / conditions",
  DIGESTIVE: "Stomach, intestinal, digestive problems / conditions",
  OTHER: "Other condition not listed here",
}

export function MedicalForm({ memberId, defaultValues, onSuccess, readOnly = false }: MedicalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MedicalConditionsFormValues>({
    resolver: zodResolver(medicalConditionsSchema),
    defaultValues: {
      assessedAt: defaultValues?.assessedAt ? new Date(defaultValues.assessedAt) : new Date(),
      conditions: defaultValues?.conditions ? defaultValues.conditions.map(c => ({
        conditionName: c.conditionName,
        customName: c.customName ?? "",
        details: c.details ?? "",
        notes: c.notes ?? "",
      })) : [],
    },
  })

  const conditions = form.watch("conditions") || []

  const isChecked = (name: MedicalConditionName) => conditions.some((c) => c.conditionName === name)

  const toggleCondition = (name: MedicalConditionName) => {
    if (readOnly) return
    const current = form.getValues("conditions") || []
    const index = current.findIndex((c) => c.conditionName === name)
    if (index > -1) {
      form.setValue(
        "conditions",
        current.filter((c) => c.conditionName !== name)
      )
    } else {
      form.setValue("conditions", [
        ...current,
        { conditionName: name, customName: "", details: "", notes: "" },
      ])
    }
  }

  async function onSubmit(values: MedicalConditionsFormValues) {
    if (readOnly) return
    setIsSubmitting(true)
    try {
      const result = await saveMedicalConditions(memberId, values)
      if (!result.success) {
        Object.entries(result.error.fieldErrors).forEach(([f, msgs]) => {
          if (msgs?.[0]) {
            form.setError(f as keyof MedicalConditionsFormValues, { message: msgs[0] })
          }
        })
        toast.error(result.error.formErrors[0] || "Fix the highlighted fields.")
        return
      }
      toast.success("Medical conditions checklist saved successfully.")
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medical History & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {readOnly && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm rounded-lg p-3 font-medium">
                ℹ️ View Only: You have read-only access to this medical log.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="assessedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={readOnly}
                        value={toDateInputValue(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Do you now, or have you had any treatment/diagnosis for the below?</h3>
              {form.formState.errors.conditions && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.conditions.message}
                </p>
              )}

              <div className="space-y-3">
                {Object.entries(MEDICAL_CONDITION_LABELS).map(([key, label]) => {
                  const condName = key as MedicalConditionName
                  const checked = isChecked(condName)
                  const condIndex = conditions.findIndex((c) => c.conditionName === condName)

                  return (
                    <div key={key} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`medical-cond-${key}`}
                          checked={checked}
                          disabled={readOnly}
                          onCheckedChange={() => toggleCondition(condName)}
                        />
                        <label
                          htmlFor={`medical-cond-${key}`}
                          className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {label}
                        </label>
                      </div>

                      {checked && condIndex > -1 && (
                        <div className="pl-7 grid gap-3 sm:grid-cols-2">
                          {key === "OTHER" && (
                            <FormField
                              control={form.control}
                              name={`conditions.${condIndex}.customName`}
                              render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                  <FormLabel>Condition Name *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Specify condition name"
                                      disabled={readOnly}
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <FormField
                            control={form.control}
                            name={`conditions.${condIndex}.details`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Details / Explanation</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Please explain in detail"
                                    disabled={readOnly}
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`conditions.${condIndex}.notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Additional assessment notes"
                                    disabled={readOnly}
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {!readOnly && (
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Medical Log"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
