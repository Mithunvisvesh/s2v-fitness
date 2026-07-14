"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"
import {
  menstrualHistorySchema,
  type MenstrualHistoryFormValues,
} from "@/lib/validations/fitness-screening"
import { saveMenstrualHistory } from "@/server/actions/fitness-screening"
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
import { Textarea } from "@/components/ui/textarea"

interface MenstrualFormProps {
  memberId: string
  defaultValues?: Partial<MenstrualHistoryFormValues> | null
  onSuccess?: () => void
}

export function MenstrualForm({ memberId, defaultValues, onSuccess }: MenstrualFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MenstrualHistoryFormValues>({
    resolver: zodResolver(menstrualHistorySchema),
    defaultValues: {
      assessedAt: defaultValues?.assessedAt ? new Date(defaultValues.assessedAt) : new Date(),
      lastCycleDate: defaultValues?.lastCycleDate ? new Date(defaultValues.lastCycleDate) : undefined,
      ageAtMenstruationOnset: defaultValues?.ageAtMenstruationOnset ?? undefined,
      averageCycleLength: defaultValues?.averageCycleLength ?? undefined,
      irregularCycles: defaultValues?.irregularCycles ?? false,
      spotting: defaultValues?.spotting ?? false,
      missedCycles: defaultValues?.missedCycles ?? false,
      painfulMenstruation: defaultValues?.painfulMenstruation ?? false,
      notes: defaultValues?.notes ?? "",
    },
  })

  async function onSubmit(values: MenstrualHistoryFormValues) {
    setIsSubmitting(true)
    try {
      const result = await saveMenstrualHistory(memberId, values)
      if (!result.success) {
        Object.entries(result.error.fieldErrors).forEach(([f, msgs]) => {
          if (msgs?.[0]) {
            form.setError(f as keyof MenstrualHistoryFormValues, { message: msgs[0] })
          }
        })
        toast.error(result.error.formErrors[0] || "Fix the highlighted fields.")
        return
      }
      toast.success("Menstrual history saved successfully.")
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
            <CardTitle className="text-base">Menstrual History (Female Members Only)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Assessment Date */}
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

              {/* Last Cycle Date */}
              <FormField
                control={form.control}
                name="lastCycleDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Last Menstrual Period</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? toDateInputValue(field.value) : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Onset Age */}
              <FormField
                control={form.control}
                name="ageAtMenstruationOnset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age at Menstruation Onset (years)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 12"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cycle Length */}
              <FormField
                control={form.control}
                name="averageCycleLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Cycle Length (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 28"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="text-sm font-semibold">Cycle Symptoms / Health Markers</h4>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Irregular Cycles */}
                <FormField
                  control={form.control}
                  name="irregularCycles"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">History of irregular cycles</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Spotting */}
                <FormField
                  control={form.control}
                  name="spotting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">Intermenstrual spotting / bleeding</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Missed Cycles */}
                <FormField
                  control={form.control}
                  name="missedCycles"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">Missed cycles / Amenorrhea</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Painful Menstruation */}
                <FormField
                  control={form.control}
                  name="painfulMenstruation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">Painful menstruation / Dysmenorrhea</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any other details here..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Menstrual History"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
