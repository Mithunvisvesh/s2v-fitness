"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  counsellingNoteSchema,
  type CounsellingNoteFormValues,
} from "@/lib/validations/counselling-consent"
import { saveCounsellingNote } from "@/server/actions/counselling-consent"
import { formatDate } from "@/lib/utils"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface CounsellingNoteWithAuthor {
  id: string
  noteType: string
  description: string
  createdAt: Date
  author: {
    name: string | null
    role: string
  }
}

interface CounsellingTabProps {
  memberId: string
  role: string
  notes: CounsellingNoteWithAuthor[]
  onSuccess?: () => void
}

export function CounsellingTab({ memberId, role, notes, onSuccess }: CounsellingTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canWrite = role === "ADMIN" || role === "COUNSELLOR" || role === "OWNER"
  const form = useForm<CounsellingNoteFormValues>({
    resolver: zodResolver(counsellingNoteSchema),
    defaultValues: {
      noteType: "Fitness Counselling",
      description: "",
    },
  })

  async function onSubmit(values: CounsellingNoteFormValues) {
    setIsSubmitting(true)
    try {
      const result = await saveCounsellingNote(memberId, values)
      if (!result.success) {
        Object.entries(result.error.fieldErrors).forEach(([f, msgs]) => {
          if (msgs?.[0]) {
            form.setError(f as keyof CounsellingNoteFormValues, { message: msgs[0] })
          }
        })
        toast.error(result.error.formErrors[0] || "Fix the highlighted fields.")
        return
      }
      toast.success("Counselling note saved successfully.")
      form.reset({
        noteType: "Fitness Counselling",
        description: "",
      })
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Note Creation Form (Counsellors & Admins only) */}
      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Counselling Note</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="noteType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select note category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Fitness Counselling">Fitness Counselling</SelectItem>
                            <SelectItem value="Training Note">Training Note</SelectItem>
                            <SelectItem value="Diet Consultation">Diet Consultation</SelectItem>
                            <SelectItem value="General Feedback">General Feedback</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Details / Observations</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Summarize the session goals, trainer guidance, and member performance observations..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Add Note"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              You are viewing the counselling notes feed in Read-Only mode. Only Admins and Counsellors can add new notes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chronological Notes Feed */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Past Sessions Log ({notes.length})
        </h3>
        <Separator />

        {notes.length === 0 ? (
          <p className="text-center py-6 text-sm text-muted-foreground">
            No counselling notes recorded for this member yet.
          </p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 px-6 py-4 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{note.noteType}</Badge>
                    <span className="text-xs text-muted-foreground">
                      by <strong className="text-foreground">{note.author.name || "Unknown Staff"}</strong> ({note.author.role.toLowerCase()})
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(note.createdAt)}
                  </span>
                </CardHeader>
                <CardContent className="px-6 py-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {note.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
