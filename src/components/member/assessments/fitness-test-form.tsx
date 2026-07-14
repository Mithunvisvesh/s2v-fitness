"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"
import {
  fitnessTestSchema,
  type FitnessTestFormValues,
} from "@/lib/validations/fitness-testing"
import { saveFitnessTest } from "@/server/actions/fitness-testing"
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
import { Textarea } from "@/components/ui/textarea"

interface FitnessTestFormProps {
  memberId: string
  defaultValues?: Partial<FitnessTestFormValues> | null
  onSuccess?: () => void
}

export function FitnessTestForm({ memberId, defaultValues, onSuccess }: FitnessTestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FitnessTestFormValues>({
    resolver: zodResolver(fitnessTestSchema),
    defaultValues: {
      testDate: defaultValues?.testDate ? new Date(defaultValues.testDate) : new Date(),
      cardioMachine: defaultValues?.cardioMachine ?? "",
      distance: defaultValues?.distance ?? undefined,
      durationMinutes: defaultValues?.durationMinutes ?? undefined,
      treadmillNotes: defaultValues?.treadmillNotes ?? "",
      wallPushUpsReps: defaultValues?.wallPushUpsReps ?? undefined,
      wallPushUpsDurationSec: defaultValues?.wallPushUpsDurationSec ?? undefined,
      squatsReps: defaultValues?.squatsReps ?? undefined,
      squatsDurationSec: defaultValues?.squatsDurationSec ?? undefined,
      crunchesReps: defaultValues?.crunchesReps ?? undefined,
      crunchesDurationSec: defaultValues?.crunchesDurationSec ?? undefined,
      sitAndReachCm: defaultValues?.sitAndReachCm ?? undefined,
      ironManHoldSec: defaultValues?.ironManHoldSec ?? undefined,
      pelvicBridgeSec: defaultValues?.pelvicBridgeSec ?? undefined,
      rProprioception: defaultValues?.rProprioception ?? "",
      rSingleLegStanding: defaultValues?.rSingleLegStanding ?? "",
      rStandingBalance: defaultValues?.rStandingBalance ?? "",
      lProprioception: defaultValues?.lProprioception ?? "",
      lSingleLegStanding: defaultValues?.lSingleLegStanding ?? "",
      lStandingBalance: defaultValues?.lStandingBalance ?? "",
    },
  })

  async function onSubmit(values: FitnessTestFormValues) {
    setIsSubmitting(true)
    try {
      const result = await saveFitnessTest(memberId, values)
      if (!result.success) {
        Object.entries(result.error.fieldErrors).forEach(([f, msgs]) => {
          if (msgs?.[0]) {
            form.setError(f as keyof FitnessTestFormValues, { message: msgs[0] })
          }
        })
        toast.error(result.error.formErrors[0] || "Fix the highlighted fields.")
        return
      }
      toast.success("Fitness test assessment saved successfully.")
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderNumberInput = (name: keyof FitnessTestFormValues, label: string, placeholder = "—") => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={placeholder}
              value={(field.value as string | number | undefined) ?? ""}
              onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const renderTextInput = (name: keyof FitnessTestFormValues, label: string, placeholder = "—") => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              value={(field.value as string | number | undefined) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Test Date */}
          <Card className="sm:col-span-2">
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="testDate"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>Test Date</FormLabel>
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
            </CardContent>
          </Card>

          {/* ── 1. Cardiovascular Endurance ── */}
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Cardiovascular Endurance Test</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {renderTextInput("cardioMachine", "Cardio Machine", "e.g. Treadmill, Elliptical")}
              {renderNumberInput("distance", "Distance (km)", "0.0")}
              {renderNumberInput("durationMinutes", "Duration (minutes)", "0")}
              <FormField
                control={form.control}
                name="treadmillNotes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2 lg:col-span-3">
                    <FormLabel>Treadmill / Cardio Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Speed, incline, or general notes..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── 2. Muscular Endurance ── */}
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Muscular Endurance Test</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="text-sm font-semibold">Wall Push-Ups</h4>
                {renderNumberInput("wallPushUpsReps", "Reps")}
                {renderNumberInput("wallPushUpsDurationSec", "Duration (sec)")}
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="text-sm font-semibold">Squats</h4>
                {renderNumberInput("squatsReps", "Reps")}
                {renderNumberInput("squatsDurationSec", "Duration (sec)")}
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="text-sm font-semibold">Crunches</h4>
                {renderNumberInput("crunchesReps", "Reps")}
                {renderNumberInput("crunchesDurationSec", "Duration (sec)")}
              </div>
            </CardContent>
          </Card>

          {/* ── 3. Flexibility & Core ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flexibility Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderNumberInput("sitAndReachCm", "Sit and Reach (cm)")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Core Endurance Test</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {renderNumberInput("ironManHoldSec", "Iron Man Hold (sec)")}
              {renderNumberInput("pelvicBridgeSec", "Pelvic Bridge Hold (sec)")}
            </CardContent>
          </Card>

          {/* ── 4. Balance ── */}
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Balance Test (Proprioception / Single Leg Standing)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {/* Right Side */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="text-sm font-semibold text-primary">Right Leg</h4>
                {renderTextInput("rProprioception", "Proprioception (eyes closed)")}
                {renderTextInput("rSingleLegStanding", "Single Leg Standing")}
                {renderTextInput("rStandingBalance", "Standing Balance")}
              </div>

              {/* Left Side */}
              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="text-sm font-semibold text-primary">Left Leg</h4>
                {renderTextInput("lProprioception", "Proprioception (eyes closed)")}
                {renderTextInput("lSingleLegStanding", "Single Leg Standing")}
                {renderTextInput("lStandingBalance", "Standing Balance")}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Fitness Test"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
