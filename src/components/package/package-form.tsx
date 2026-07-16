"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { packageSchema, type PackageFormValues } from "@/lib/validations/package"
import { createPackage, updatePackage } from "@/server/actions/package"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

interface PackageFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pkg?: {
    id: string
    name: string
    durationMonths: number
    price: number | null
    isActive: boolean
  } | null
}

export function PackageForm({ open, onOpenChange, pkg }: PackageFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const isEdit = !!pkg

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: {
      name: "",
      durationMonths: 1,
      price: undefined,
      isActive: true,
    },
  })

  React.useEffect(() => {
    if (open) {
      if (pkg) {
        form.reset({
          name: pkg.name,
          durationMonths: pkg.durationMonths,
          price: pkg.price ?? undefined,
          isActive: pkg.isActive,
        })
      } else {
        form.reset({
          name: "",
          durationMonths: 1,
          price: undefined,
          isActive: true,
        })
      }
    }
  }, [open, pkg, form])

  function onSubmit(values: PackageFormValues) {
    startTransition(async () => {
      let result
      if (isEdit && pkg) {
        result = await updatePackage(pkg.id, values)
      } else {
        result = await createPackage(values)
      }

      if (result.success) {
        toast.success(
          isEdit
            ? "Package configuration updated successfully."
            : "Package configuration created successfully."
        )
        onOpenChange(false)
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
          toast.error("Failed to save package configurations.")
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Package" : "Create New Package"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 3 Months Transformation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (Months)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="36" placeholder="3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (INR)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="10000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Package"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
