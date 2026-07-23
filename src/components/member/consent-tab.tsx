"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  consentSchema,
  type ConsentFormValues,
} from "@/lib/validations/counselling-consent"
import { saveConsent, deleteConsent, logSigningEvent } from "@/server/actions/counselling-consent"
import { toDateInputValue, formatDate } from "@/lib/utils"
import { SignaturePad } from "@/components/member/signature-pad"
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
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ShieldAlert, CheckCircle, Download, Trash2 } from "lucide-react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { MemberConsentPdf } from "@/components/reports/member-consent-pdf"

interface ConsentTabProps {
  memberId: string
  role: string
  consent: {
    id: string
    emergencyContactName: string | null
    emergencyMobile: string | null
    relationship: string | null
    consentDate: Date
    digitalSignature: string | null
  } | null
  memberName?: string
  membershipNo?: string
  onSuccess?: () => void
}

export function ConsentTab({ memberId, role, consent, memberName = "", membershipNo = "", onSuccess }: ConsentTabProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const form = useForm<ConsentFormValues>({
    resolver: zodResolver(consentSchema),
    defaultValues: {
      emergencyContactName: consent?.emergencyContactName ?? "",
      emergencyMobile: consent?.emergencyMobile ?? "",
      relationship: consent?.relationship ?? "",
      consentDate: consent?.consentDate ? new Date(consent.consentDate) : new Date(),
      acknowledged: !!consent,
      digitalSignature: consent?.digitalSignature ?? "",
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [signingStartedLogged, setSigningStartedLogged] = useState(false)
  const isTrainer = role === "TRAINER"

  async function handleClearAndResign() {
    if (!confirm("This will clear the current signature and consent record. You will need to fill the form and sign again. Proceed?")) {
      return
    }
    setIsClearing(true)
    try {
      const result = await deleteConsent(memberId)
      if (!result.success) {
        toast.error("Failed to clear consent.")
        return
      }
      toast.success("Consent record cleared. You can now re-sign.")
      form.reset({
        emergencyContactName: "",
        emergencyMobile: "",
        relationship: "",
        consentDate: new Date(),
        acknowledged: false,
        digitalSignature: "",
      })
      setSigningStartedLogged(false)
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsClearing(false)
    }
  }

  async function handleStartDrawing() {
    if (signingStartedLogged || consent) return
    setSigningStartedLogged(true)
    try {
      await logSigningEvent(memberId, "START_SIGNING")
    } catch {
      // Ignored: non-critical logging failure
    }
  }

  async function handleClearSignature() {
    setSigningStartedLogged(false)
    try {
      await logSigningEvent(memberId, "CLEAR_SIGNING")
    } catch {
      // Ignored
    }
  }

  async function onSubmit(values: ConsentFormValues) {
    setIsSubmitting(true)
    try {
      // Log that the signature was accepted
      await logSigningEvent(memberId, "ACCEPT_SIGNING")

      const result = await saveConsent(memberId, values)
      if (!result.success) {
        Object.entries(result.error.fieldErrors).forEach(([f, msgs]) => {
          if (msgs?.[0]) {
            form.setError(f as keyof ConsentFormValues, { message: msgs[0] })
          }
        })
        toast.error(result.error.formErrors[0] || "Fix the highlighted fields.")
        return
      }
      toast.success("Consent form details saved successfully.")
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Trainers are blocked from the Consent Form entirely
  if (isTrainer) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="flex flex-row items-center space-x-3 space-y-0">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          <div>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription className="text-destructive/80">
              Trainers are not authorized to view or manage member consent details.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {consent ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-base text-primary">Member Consent Active</CardTitle>
                <CardDescription>
                  A signed digital consent record is active for this member.
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {isMounted && (role === "OWNER" || role === "ADMIN") && (
                <PDFDownloadLink
                  document={<MemberConsentPdf memberName={memberName} membershipNo={membershipNo} consent={consent} />}
                  fileName={`Consent_${membershipNo}_${memberName.replace(/[^a-zA-Z0-9.-]/g, "_")}.pdf`}
                  style={{ textDecoration: "none" }}
                >
                  {({ loading }) => (
                    <Button variant="outline" size="sm" disabled={loading} className="gap-2">
                      <Download className="h-4 w-4" />
                      {loading ? "Generating PDF..." : "Download Consent PDF"}
                    </Button>
                  )}
                </PDFDownloadLink>
              )}
              {isMounted && (role === "OWNER" || role === "ADMIN") && (
                <Button variant="destructive" size="sm" disabled={isClearing} onClick={handleClearAndResign} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {isClearing ? "Clearing..." : "Clear & Re-sign"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Signed Date:</strong> {formatDate(consent.consentDate)}</p>
            <p><strong>Emergency Contact:</strong> {consent.emergencyContactName}</p>
            <p><strong>Mobile:</strong> {consent.emergencyMobile}</p>
            <p><strong>Relationship:</strong> {consent.relationship}</p>
            <p><strong>Acknowledgement:</strong> Accepted via electronic checkbox signature.</p>
            {consent.digitalSignature && consent.digitalSignature.startsWith("data:image/") && (
              <div className="mt-4 pt-4 border-t">
                <p className="font-semibold text-xs text-muted-foreground mb-2">Member Digital Signature</p>
                <div className="border rounded bg-white p-2 w-fit">
                  <img
                    src={consent.digitalSignature}
                    alt="Member Digital Signature"
                    className="max-h-20 max-w-[200px] object-contain"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="flex flex-row items-center space-x-3 space-y-0 pb-4">
            <ShieldAlert className="h-6 w-6 text-warning" />
            <div>
              <CardTitle className="text-base text-warning">Consent Pending</CardTitle>
              <CardDescription>
                This member has no digital consent record on file.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {!consent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Record Member Consent & Waiver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Emergency Contact Name */}
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name of emergency contact" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Emergency Contact Mobile */}
                  <FormField
                    control={form.control}
                    name="emergencyMobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Mobile</FormLabel>
                        <FormControl>
                          <Input placeholder="Mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Relationship */}
                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship to Member</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Spouse, Parent, Friend" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Consent Date */}
                  <FormField
                    control={form.control}
                    name="consentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signature / Signing Date</FormLabel>
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
                <FormField
                  control={form.control}
                  name="digitalSignature"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Member Signature (Draw below)</FormLabel>
                      <FormControl>
                        <SignaturePad
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                          onStartDrawing={handleStartDrawing}
                          onClear={handleClearSignature}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Acknowledgement Checkbox */}
                <FormField
                  control={form.control}
                  name="acknowledged"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer font-normal text-muted-foreground leading-normal">
                          I hereby acknowledge that the member has signed the hardcopy health questionnaire and release waiver, and they confirm the emergency details listed above are correct.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Confirm & Save Consent"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
