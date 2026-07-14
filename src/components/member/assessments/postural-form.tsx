"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useState } from "react"
import {
  posturalAnalysisSchema,
  type PosturalAnalysisFormValues,
} from "@/lib/validations/fitness-testing"
import { savePosturalAnalysis } from "@/server/actions/fitness-testing"
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
import { Textarea } from "@/components/ui/textarea"

interface PosturalFormProps {
  memberId: string
  defaultValues?: Partial<PosturalAnalysisFormValues> | null
  onSuccess?: () => void
}

export function PosturalForm({ memberId, defaultValues, onSuccess }: PosturalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PosturalAnalysisFormValues>({
    resolver: zodResolver(posturalAnalysisSchema),
    defaultValues: {
      assessedAt: defaultValues?.assessedAt ? new Date(defaultValues.assessedAt) : new Date(),
      neckFlexion: defaultValues?.neckFlexion ?? "",
      neckLateralFlexion: defaultValues?.neckLateralFlexion ?? "",
      pokeChin: defaultValues?.pokeChin ?? "",
      neckLateralRotation: defaultValues?.neckLateralRotation ?? "",
      spineKyphosis: defaultValues?.spineKyphosis ?? "",
      spineLordosis: defaultValues?.spineLordosis ?? "",
      spineScoliosis: defaultValues?.spineScoliosis ?? "",
      spineKyphoscoliosis: defaultValues?.spineKyphoscoliosis ?? "",
      scapulaLeft: defaultValues?.scapulaLeft ?? "",
      scapulaRight: defaultValues?.scapulaRight ?? "",
      lphcAsymmetrical: defaultValues?.lphcAsymmetrical ?? false,
      kneeLeft: defaultValues?.kneeLeft ?? "",
      kneeRight: defaultValues?.kneeRight ?? "",
      footLeft: defaultValues?.footLeft ?? "",
      footRight: defaultValues?.footRight ?? "",
      symmetryDeviation: defaultValues?.symmetryDeviation ?? "",
      trainerNotes: defaultValues?.trainerNotes ?? "",
    },
  })

  async function onSubmit(values: PosturalAnalysisFormValues) {
    setIsSubmitting(true)
    try {
      const result = await savePosturalAnalysis(memberId, values)
      if (!result.success) {
        Object.entries(result.error.fieldErrors).forEach(([f, msgs]) => {
          if (msgs?.[0]) {
            form.setError(f as keyof PosturalAnalysisFormValues, { message: msgs[0] })
          }
        })
        toast.error(result.error.formErrors[0] || "Fix the highlighted fields.")
        return
      }
      toast.success("Postural analysis assessment saved successfully.")
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
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Assessment Date */}
          <Card className="sm:col-span-2">
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="assessedAt"
                render={({ field }) => (
                  <FormItem className="max-w-sm">
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
            </CardContent>
          </Card>

          {/* ── 1. Neck ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Neck</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="neckFlexion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flexion</FormLabel>
                    <FormControl>
                      <Input placeholder="Flexion notes" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neckLateralFlexion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lateral Flexion</FormLabel>
                    <FormControl>
                      <Input placeholder="Lateral flexion notes" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pokeChin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poke Chin</FormLabel>
                    <FormControl>
                      <Input placeholder="Poke chin notes" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neckLateralRotation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lateral Rotation</FormLabel>
                    <FormControl>
                      <Input placeholder="Lateral rotation notes" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── 2. Spine ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="spineKyphosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kyphosis</FormLabel>
                    <FormControl>
                      <Input placeholder="Kyphosis notes" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="spineLordosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lordosis</FormLabel>
                    <FormControl>
                      <Input placeholder="Lordosis notes" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="spineScoliosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scoliosis</FormLabel>
                    <FormControl>
                      <Input placeholder="Scoliosis notes" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="spineKyphoscoliosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kyphoscoliosis</FormLabel>
                    <FormControl>
                      <Input placeholder="Kyphoscoliosis notes" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── 3. Scapula ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scapula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="scapulaLeft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Left Scapula</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select left scapula position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Protracted">Protracted</SelectItem>
                        <SelectItem value="Elevated">Elevated</SelectItem>
                        <SelectItem value="Winging">Winging</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scapulaRight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Right Scapula</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select right scapula position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Protracted">Protracted</SelectItem>
                        <SelectItem value="Elevated">Elevated</SelectItem>
                        <SelectItem value="Winging">Winging</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── 4. Lumbo Pelvic Hip Complex ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lumbo Pelvic Hip Complex (LPHC)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="lphcAsymmetrical"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">Asymmetrical weight shifting?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── 5. Knee ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Knee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="kneeLeft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Left Knee Alignment</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select left knee alignment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Genuvalgum">Genu Valgum (Knock Knees)</SelectItem>
                        <SelectItem value="Genuvarum">Genu Varum (Bow Legs)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kneeRight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Right Knee Alignment</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select right knee alignment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Genuvalgum">Genu Valgum (Knock Knees)</SelectItem>
                        <SelectItem value="Genuvarum">Genu Varum (Bow Legs)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── 6. Foot ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Foot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="footLeft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Left Foot Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select left foot position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Flat foot">Flat Foot</SelectItem>
                        <SelectItem value="Inversion">Inversion</SelectItem>
                        <SelectItem value="Eversion">Eversion</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="footRight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Right Foot Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select right foot position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Flat foot">Flat Foot</SelectItem>
                        <SelectItem value="Inversion">Inversion</SelectItem>
                        <SelectItem value="Eversion">Eversion</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── 7. Symmetry & Deviation ── */}
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Symmetry & Deviations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="symmetryDeviation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight Distribution Deviation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Asymmetry deviates to Left" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trainerNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Trainer Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Postural observations and assessment notes..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Postural Analysis"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
