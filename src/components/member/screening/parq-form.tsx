"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"
import {
  parqSchema,
  type ParqFormValues,
} from "@/lib/validations/fitness-screening"
import { savePARQ } from "@/server/actions/fitness-screening"
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

interface ParqFormProps {
  memberId: string
  defaultValues?: Partial<ParqFormValues> | null
  onSuccess?: () => void
}

export function ParqForm({ memberId, defaultValues, onSuccess }: ParqFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ParqFormValues>({
    resolver: zodResolver(parqSchema),
    defaultValues: {
      assessedAt: defaultValues?.assessedAt ? new Date(defaultValues.assessedAt) : new Date(),
      q1_heartTrouble: defaultValues?.q1_heartTrouble ?? false,
      q2_chestPain: defaultValues?.q2_chestPain ?? false,
      q3_dizzinessFainting: defaultValues?.q3_dizzinessFainting ?? false,
      q4_highBloodPressure: defaultValues?.q4_highBloodPressure ?? false,
      q5_boneJointProblems: defaultValues?.q5_boneJointProblems ?? false,
      q6_otherReasons: defaultValues?.q6_otherReasons ?? false,
      q7_over45Unaccustomed: defaultValues?.q7_over45Unaccustomed ?? false,
      notes: defaultValues?.notes ?? "",
    },
  })

  // Watch questions to display live clearance warning
  const q1 = form.watch("q1_heartTrouble")
  const q2 = form.watch("q2_chestPain")
  const q3 = form.watch("q3_dizzinessFainting")
  const q4 = form.watch("q4_highBloodPressure")
  const q5 = form.watch("q5_boneJointProblems")
  const q6 = form.watch("q6_otherReasons")
  const q7 = form.watch("q7_over45Unaccustomed")
  const requiresClearance = q1 || q2 || q3 || q4 || q5 || q6 || q7

  async function onSubmit(values: ParqFormValues) {
    setIsSubmitting(true)
    try {
      const result = await savePARQ(memberId, values)
      if (!result.success) {
        Object.entries(result.error.fieldErrors).forEach(([f, msgs]) => {
          if (msgs?.[0]) {
            form.setError(f as keyof ParqFormValues, { message: msgs[0] })
          }
        })
        toast.error(result.error.formErrors[0] || "Fix the highlighted fields.")
        return
      }
      toast.success("PAR-Q assessment saved successfully.")
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderRadioField = (name: keyof ParqFormValues, label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <FormLabel className="text-sm font-medium leading-normal sm:max-w-[70%]">
            {label}
          </FormLabel>
          <FormControl>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  checked={field.value === true}
                  onChange={() => field.onChange(true)}
                  className="size-4 rounded-full border-input text-primary focus:ring-primary"
                />
                Yes
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  checked={field.value === false}
                  onChange={() => field.onChange(false)}
                  className="size-4 rounded-full border-input text-primary focus:ring-primary"
                />
                No
              </label>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Physical Activity Readiness Questionnaire (PAR-Q)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiresClearance && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 font-medium">
                ⚠️ Medical Clearance Required: Please advise the member to consult a physician prior to commencing physical activity.
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
                        value={toDateInputValue(field.value)}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              {renderRadioField("q1_heartTrouble", "1. Have you ever had any heart trouble?")}
              {renderRadioField("q2_chestPain", "2. Have you ever had pains in your heart or chest?")}
              {renderRadioField("q3_dizzinessFainting", "3. Have you ever felt faint or had spells of dizziness?")}
              {renderRadioField("q4_highBloodPressure", "4. Have you ever had high blood pressure?")}
              {renderRadioField("q5_boneJointProblems", "5. Do you have a bone or joint problem, arthritis, back pain, etc. that could be made worse by exercise?")}
              {renderRadioField("q6_otherReasons", "6. Is there a good reason not mentioned here why you think you should not follow an exercise program?")}
              {renderRadioField("q7_over45Unaccustomed", "7. Are you over age 45 or not accustomed to vigorous exercise?")}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / Observations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional comments here..."
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
                {isSubmitting ? "Saving..." : "Save PAR-Q"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
