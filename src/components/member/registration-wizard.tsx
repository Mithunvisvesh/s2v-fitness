"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MemberForm } from "./member-form"
import { ScreeningTab } from "./screening/screening-tab"
import { AssessmentsTab } from "./assessments/assessments-tab"
import { MeasurementsTab } from "@/components/measurements/measurements-tab"
import { ConsentTab } from "./consent-tab"
import { useRouter } from "next/navigation"
import { type MemberFormValues } from "@/lib/validations/member"
import { CheckCircle2, ChevronRight, UserPlus } from "lucide-react"

interface RegistrationWizardProps {
  counsellors: any[]
  trainers: any[]
  packages: any[]
  showCounsellorField?: boolean
  defaultValues?: Partial<MemberFormValues>
  role: string
}

export function RegistrationWizard({
  counsellors,
  trainers,
  packages,
  showCounsellorField = true,
  defaultValues,
  role,
}: RegistrationWizardProps) {
  const router = useRouter()
  const [memberId, setMemberId] = useState<string | null>(null)
  const [memberGender, setMemberGender] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("account")

  const steps = [
    { id: "account", label: "Account & Package" },
    { id: "screening", label: "Health Screening" },
    { id: "assessments", label: "Assessments" },
    { id: "measurements", label: "Measurements" },
    { id: "consent", label: "Consent Form" },
  ]

  const handleAccountSuccess = (newMemberId: string, gender: string) => {
    setMemberId(newMemberId)
    setMemberGender(gender)
    setActiveTab("screening")
  }

  const handleNext = () => {
    const currentIndex = steps.findIndex((step) => step.id === activeTab)
    if (currentIndex < steps.length - 1) {
      setActiveTab(steps[currentIndex + 1].id)
    }
  }

  const handlePrev = () => {
    const currentIndex = steps.findIndex((step) => step.id === activeTab)
    if (currentIndex > 0) {
      setActiveTab(steps[currentIndex - 1].id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stepper Header */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <nav className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Registration Progress</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {steps.map((step, idx) => {
              const isActive = activeTab === step.id
              const isCompleted = memberId !== null && (
                idx < steps.findIndex((s) => s.id === activeTab) || 
                (step.id === "account" && memberId)
              )
              
              return (
                <div key={step.id} className="flex items-center gap-2">
                  {idx > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
                  <span
                    className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
                      isActive 
                        ? "text-primary font-semibold" 
                        : isCompleted 
                        ? "text-emerald-500" 
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] border ${
                        isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                      }`}>
                        {idx + 1}
                      </span>
                    )}
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main Stepper Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => {
        // Prevent switching to post-account tabs if member is not created yet
        if (!memberId && val !== "account") return
        setActiveTab(val)
      }} className="w-full">
        <TabsList className="hidden">
          {steps.map((step) => (
            <TabsTrigger key={step.id} value={step.id} disabled={!memberId && step.id !== "account"}>
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Step 1: Account Setup */}
        <TabsContent value="account" className="mt-0">
          <MemberForm
            mode="create"
            counsellors={counsellors}
            trainers={trainers}
            packages={packages}
            showCounsellorField={showCounsellorField}
            defaultValues={defaultValues}
            onSuccess={handleAccountSuccess}
          />
        </TabsContent>

        {/* Step 2: Health Screening */}
        {memberId && (
          <TabsContent value="screening" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <ScreeningTab
                  memberId={memberId}
                  memberGender={memberGender || "MALE"}
                  role={role}
                  latestParq={null}
                  latestLifestyle={null}
                  latestMedical={null}
                  latestMenstrual={null}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Step 3: Assessments */}
        {memberId && (
          <TabsContent value="assessments" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <AssessmentsTab
                  memberId={memberId}
                  latestPostural={null}
                  latestFitnessTest={null}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Step 4: Measurements */}
        {memberId && (
          <TabsContent value="measurements" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <MeasurementsTab
                  memberId={memberId}
                  memberGender={memberGender || "MALE"}
                  measurements={[]}
                  canManage={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Step 5: Consent Form */}
        {memberId && (
          <TabsContent value="consent" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <ConsentTab
                  memberId={memberId}
                  role={role}
                  consent={null}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Persistent Navigation Footer once Member Account is created */}
      {memberId && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card px-6 py-4 shadow-sm">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-emerald-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Account Registered Successfully
            </p>
            <p className="text-xs text-muted-foreground">
              Member ID: <span className="font-mono text-foreground font-semibold">{memberId}</span>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={activeTab === "account"}
            >
              Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={activeTab === "consent"}
            >
              Next Step
            </Button>

            <Button
              variant="default"
              onClick={() => router.push(`/members/${memberId}`)}
              className="bg-primary text-primary-foreground hover:bg-primary/95"
            >
              Finish & View Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
