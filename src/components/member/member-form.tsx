"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { memberSchema, type MemberFormValues } from "@/lib/validations/member"
import { createMember, updateMember } from "@/server/actions/members"
import {
  FITNESS_GOALS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PACKAGE_OPTIONS,
  PACKAGE_DURATION_MONTHS,
} from "@/lib/constants"
import { calculateAge, toDateInputValue } from "@/lib/utils"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface StaffOption {
  id: string
  name: string
}
interface MemberFormProps {
  mode: "create" | "edit"
  memberId?: string
  defaultValues?: Partial<MemberFormValues>
  counsellors: StaffOption[]
  trainers: StaffOption[]
  showCounsellorField?: boolean
  packages: { id: string; name: string; durationMonths: number; price: any }[]
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h3 className="font-heading text-sm font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

export function MemberForm({
  mode,
  memberId,
  defaultValues,
  counsellors,
  trainers,
  showCounsellorField = true,
  packages,
}: MemberFormProps) {
  const router = useRouter()

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      fullName: "",
      membershipNo: "",
      receiptNo: "",
      registrationDate: new Date(),
      gender: undefined,
      dateOfBirth: undefined,
      mobile: "",
      email: "",
      address: "",
      maritalStatus: undefined,
      package: undefined,
      durationMonths: 1,
      startDate: new Date(),
      endDate: undefined,
      fitnessGoals: [],
      counsellorId: "",
      trainerId: "",
      packageId: "",
      ...defaultValues,
    },
  })
  const dateOfBirth = form.watch("dateOfBirth")
  const computedAge = dateOfBirth ? calculateAge(new Date(dateOfBirth)) : null

  const selectedPackage = form.watch("package")
  const startDate = form.watch("startDate")
  const durationMonths = form.watch("durationMonths")

  // Auto-fill duration when the package changes.
  useEffect(() => {
    if (!selectedPackage) return
    const months = PACKAGE_DURATION_MONTHS[selectedPackage]
    if (months) form.setValue("durationMonths", months, { shouldValidate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPackage])

  // Auto-compute the end date from start date + duration, unless the user has overridden it.
  useEffect(() => {
    if (!startDate || !durationMonths) return
    const start = new Date(startDate)
    if (Number.isNaN(start.getTime())) return
    const end = new Date(start)
    end.setMonth(end.getMonth() + Number(durationMonths))
    form.setValue("endDate", end, { shouldValidate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, durationMonths])

  async function onSubmit(values: MemberFormValues) {
    const result =
      mode === "create" ? await createMember(values) : await updateMember(memberId!, values)

    if (!result.success) {
      const fieldErrors = result.error.fieldErrors
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        if (messages?.[0]) {
          form.setError(field as keyof MemberFormValues, { message: messages[0] })
        }
      })
      toast.error("Please fix the highlighted fields.")
      return
    }

    toast.success(mode === "create" ? "Member registered." : "Member updated.")
    router.push(`/members/${result.memberId}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>Who the member is and how to reach them.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="membershipNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Membership number</FormLabel>
                  <FormControl>
                    <Input placeholder="S2V-0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receiptNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt number</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={toDateInputValue(field.value)}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of birth</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={toDateInputValue(field.value)}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    {computedAge !== null ? `Age: ${computedAge} years` : "Age is calculated automatically"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile number</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maritalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marital status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MARITAL_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membership details</CardTitle>
            <CardDescription>
              Package and duration. The end date fills in automatically and can be adjusted.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={(val) => {
                      field.onChange(val)
                      const pkg = packages.find((p) => p.id === val)
                      if (pkg) {
                        form.setValue("durationMonths", pkg.durationMonths, { shouldValidate: true })

                        // Map duration to standard package enum
                        let enumVal: "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY" = "MONTHLY"
                        if (pkg.durationMonths === 3) enumVal = "QUARTERLY"
                        else if (pkg.durationMonths === 6) enumVal = "HALF_YEARLY"
                        else if (pkg.durationMonths === 12) enumVal = "YEARLY"

                        form.setValue("package", enumVal, { shouldValidate: true })
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select package" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.durationMonths} months {pkg.price !== null ? `· ₹${Number(pkg.price)}` : ""})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (months)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={36} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={toDateInputValue(field.value)}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={toDateInputValue(field.value)}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showCounsellorField && (
              <FormField
                control={form.control}
                name="counsellorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Counsellor</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Assign a counsellor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {counsellors.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Defaults to you if left blank.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="trainerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trainer</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Assign a trainer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {trainers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <Separator />
          <CardContent>
            <FormField
              control={form.control}
              name="fitnessGoals"
              render={({ field }) => (
                <FormItem>
                  <SectionHeading
                    title="Fitness goals"
                    description="Select everything that applies."
                  />
                  <div className="grid gap-2.5 pt-2 sm:grid-cols-2">
                    {FITNESS_GOALS.map((goal) => {
                      const checked = field.value?.includes(goal)
                      return (
                        <label
                          key={goal}
                          className="group flex items-center gap-2.5 rounded-lg border border-input px-3 py-2 text-sm has-data-checked:border-primary"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              const next = new Set(field.value ?? [])
                              if (value) next.add(goal)
                              else next.delete(goal)
                              field.onChange(Array.from(next))
                            }}
                          />
                          {goal}
                        </label>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 rounded-xl border bg-card px-4 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Saving..."
              : mode === "create"
              ? "Register member"
              : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
