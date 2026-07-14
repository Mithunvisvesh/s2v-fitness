"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"
import {
  lifestyleProfileSchema,
  type LifestyleProfileFormValues,
} from "@/lib/validations/fitness-screening"
import { saveLifestyleProfile } from "@/server/actions/fitness-screening"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LifestyleFormProps {
  memberId: string
  defaultValues?: Partial<LifestyleProfileFormValues> | null
  onSuccess?: () => void
}

export function LifestyleForm({ memberId, defaultValues, onSuccess }: LifestyleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LifestyleProfileFormValues>({
    resolver: zodResolver(lifestyleProfileSchema),
    defaultValues: {
      assessedAt: defaultValues?.assessedAt ? new Date(defaultValues.assessedAt) : new Date(),
      occupation: defaultValues?.occupation ?? "",
      physicalActivityLevel: defaultValues?.physicalActivityLevel,
      workStress: defaultValues?.workStress,
      personalStress: defaultValues?.personalStress,
      travelFrequency: defaultValues?.travelFrequency ?? "",
      avgSleepHours: defaultValues?.avgSleepHours ?? undefined,
      sleepQuality: defaultValues?.sleepQuality,
      sleepTiming: defaultValues?.sleepTiming ?? "",
      afternoonNap: defaultValues?.afternoonNap ?? false,
      napDuration: defaultValues?.napDuration ?? "",
      smoking: defaultValues?.smoking ?? false,
      smokingFrequency: defaultValues?.smokingFrequency ?? "",
      alcohol: defaultValues?.alcohol ?? false,
      alcoholFrequency: defaultValues?.alcoholFrequency ?? "",
      tobacco: defaultValues?.tobacco ?? false,
      tobaccoFrequency: defaultValues?.tobaccoFrequency ?? "",
    },
  })

  // Watch disclosures
  const afternoonNap = form.watch("afternoonNap")
  const smoking = form.watch("smoking")
  const alcohol = form.watch("alcohol")
  const tobacco = form.watch("tobacco")

  async function onSubmit(values: LifestyleProfileFormValues) {
    setIsSubmitting(true)

    // Ensure we clean values that shouldn't be populated because parent was unchecked
    const cleanedValues = { ...values }
    if (!cleanedValues.afternoonNap) cleanedValues.napDuration = undefined
    if (!cleanedValues.smoking) cleanedValues.smokingFrequency = undefined
    if (!cleanedValues.alcohol) cleanedValues.alcoholFrequency = undefined
    if (!cleanedValues.tobacco) cleanedValues.tobaccoFrequency = undefined

    try {
      const result = await saveLifestyleProfile(memberId, cleanedValues)
      if (!result.success) {
        Object.entries(result.error.fieldErrors).forEach(([f, msgs]) => {
          if (msgs?.[0]) {
            form.setError(f as keyof LifestyleProfileFormValues, { message: msgs[0] })
          }
        })
        toast.error(result.error.formErrors[0] || "Fix the highlighted fields.")
        return
      }
      toast.success("Lifestyle profile saved successfully.")
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
            <CardTitle className="text-base">Lifestyle Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Date */}
              <FormField
                control={form.control}
                name="assessedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={toDateInputValue(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Occupation */}
              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Software Engineer" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Activity Level */}
              <FormField
                control={form.control}
                name="physicalActivityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Activity Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MILD">Mild (Sedentary/Desk Job)</SelectItem>
                        <SelectItem value="MODERATE">Moderate (Active/Moderate Exercises)</SelectItem>
                        <SelectItem value="HEAVY">Heavy (Manual Labor/Athletic Training)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Work Stress */}
              <FormField
                control={form.control}
                name="workStress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Stress Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stress level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MILD">Mild</SelectItem>
                        <SelectItem value="MODERATE">Moderate</SelectItem>
                        <SelectItem value="HEAVY">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personal Stress */}
              <FormField
                control={form.control}
                name="personalStress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Stress Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stress level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MILD">Mild</SelectItem>
                        <SelectItem value="MODERATE">Moderate</SelectItem>
                        <SelectItem value="HEAVY">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Travel Frequency */}
              <FormField
                control={form.control}
                name="travelFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Travel Frequency</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Twice a month / Occasional" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sleep Hours */}
              <FormField
                control={form.control}
                name="avgSleepHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Sleep (Hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Hours per night"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Sleep Quality */}
              <FormField
                control={form.control}
                name="sleepQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sleep Quality</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sleep quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SOUND">Sound</SelectItem>
                        <SelectItem value="DISTURBED">Disturbed</SelectItem>
                        <SelectItem value="FAIR">Fair</SelectItem>
                        <SelectItem value="BAD">Bad</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sleep Timings */}
              <FormField
                control={form.control}
                name="sleepTiming"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sleep Timings</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 11 PM - 7 AM" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Afternoon Nap */}
            <div className="space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="afternoonNap"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (!checked) form.setValue("napDuration", "")
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Takes Afternoon Nap?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {afternoonNap && (
                <FormField
                  control={form.control}
                  name="napDuration"
                  render={({ field }) => (
                    <FormItem className="max-w-sm pl-7">
                      <FormLabel>Nap Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 30 minutes" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Smoking */}
            <div className="space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="smoking"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (!checked) form.setValue("smokingFrequency", "")
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Do you smoke?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {smoking && (
                <FormField
                  control={form.control}
                  name="smokingFrequency"
                  render={({ field }) => (
                    <FormItem className="max-w-sm pl-7">
                      <FormLabel>Smoking Frequency</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 5 cigarettes/day" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Alcohol */}
            <div className="space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="alcohol"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (!checked) form.setValue("alcoholFrequency", "")
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Do you consume alcohol?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {alcohol && (
                <FormField
                  control={form.control}
                  name="alcoholFrequency"
                  render={({ field }) => (
                    <FormItem className="max-w-sm pl-7">
                      <FormLabel>Alcohol Frequency / Intake</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Twice a week / 1 pint" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Tobacco */}
            <div className="space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="tobacco"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (!checked) form.setValue("tobaccoFrequency", "")
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Do you chew tobacco?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {tobacco && (
                <FormField
                  control={form.control}
                  name="tobaccoFrequency"
                  render={({ field }) => (
                    <FormItem className="max-w-sm pl-7">
                      <FormLabel>Tobacco Chewing Frequency</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Daily / 2 packets" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Lifestyle Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
