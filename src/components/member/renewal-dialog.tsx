"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { renewalSchema, type RenewalFormValues } from "@/lib/validations/renewal"
import { renewMembership } from "@/server/actions/renewal"
import { toDateInputValue } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RefreshCw } from "lucide-react"

interface RenewalDialogProps {
  memberId: string
  currentEndDate: Date
  packages: { id: string; name: string; durationMonths: number; price: any }[]
}

export function RenewalDialog({ memberId, currentEndDate, packages }: RenewalDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  // Default start date to current end date, or today if current end date is in the past
  const defaultStartDate = React.useMemo(() => {
    const today = new Date()
    const currentEnd = new Date(currentEndDate)
    return currentEnd > today ? currentEnd : today
  }, [currentEndDate])

  const form = useForm<RenewalFormValues>({
    resolver: zodResolver(renewalSchema) as any,
    defaultValues: {
      packageId: "",
      startDate: defaultStartDate,
      endDate: undefined as any,
    },
  })

  const startDate = form.watch("startDate")
  const packageId = form.watch("packageId")

  // Auto-calculate end date when start date or selected package changes
  React.useEffect(() => {
    if (!startDate || !packageId) return
    const pkg = packages.find((p) => p.id === packageId)
    if (!pkg) return

    const start = new Date(startDate)
    if (Number.isNaN(start.getTime())) return

    const end = new Date(start)
    end.setMonth(end.getMonth() + pkg.durationMonths)
    form.setValue("endDate", end, { shouldValidate: true })
  }, [startDate, packageId, packages, form])

  function onSubmit(values: RenewalFormValues) {
    startTransition(async () => {
      const result = await renewMembership(memberId, values)
      if (result.success) {
        toast.success("Membership renewed successfully.")
        setOpen(false)
        form.reset()
      } else {
        if (result.error.fieldErrors) {
          Object.entries(result.error.fieldErrors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              form.setError(field as any, { message: messages[0] })
            }
          })
        }
        if (result.error.formErrors && result.error.formErrors.length > 0) {
          toast.error(result.error.formErrors[0])
        } else {
          toast.error("Failed to renew membership.")
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Renew Membership
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renew Membership</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Package</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
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
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      readOnly
                      value={toDateInputValue(field.value)}
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Renewing..." : "Process Renewal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
