"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PosturalForm } from "./postural-form"
import { FitnessTestForm } from "./fitness-test-form"
import { type PosturalAnalysis, type FitnessTest } from "@prisma/client"

interface AssessmentsTabProps {
  memberId: string
  latestPostural: PosturalAnalysis | null
  latestFitnessTest: FitnessTest | null
  onSuccess?: () => void
}

export function AssessmentsTab({
  memberId,
  latestPostural,
  latestFitnessTest,
  onSuccess,
}: AssessmentsTabProps) {
  // Map null values from database models to undefined for strict Zod compatibility
  const posturalFormValues = latestPostural
    ? {
        assessedAt: latestPostural.assessedAt,
        assessorId: latestPostural.assessorId ?? undefined,
        neckFlexion: latestPostural.neckFlexion ?? undefined,
        neckLateralFlexion: latestPostural.neckLateralFlexion ?? undefined,
        pokeChin: latestPostural.pokeChin ?? undefined,
        neckLateralRotation: latestPostural.neckLateralRotation ?? undefined,
        spineKyphosis: latestPostural.spineKyphosis ?? undefined,
        spineLordosis: latestPostural.spineLordosis ?? undefined,
        spineScoliosis: latestPostural.spineScoliosis ?? undefined,
        spineKyphoscoliosis: latestPostural.spineKyphoscoliosis ?? undefined,
        scapulaLeft: latestPostural.scapulaLeft ?? undefined,
        scapulaRight: latestPostural.scapulaRight ?? undefined,
        lphcAsymmetrical: latestPostural.lphcAsymmetrical ?? undefined,
        kneeLeft: latestPostural.kneeLeft ?? undefined,
        kneeRight: latestPostural.kneeRight ?? undefined,
        footLeft: latestPostural.footLeft ?? undefined,
        footRight: latestPostural.footRight ?? undefined,
        symmetryDeviation: latestPostural.symmetryDeviation ?? undefined,
        trainerNotes: latestPostural.trainerNotes ?? undefined,
      }
    : null

  const fitnessFormValues = latestFitnessTest
    ? {
        testDate: latestFitnessTest.testDate,
        assessorId: latestFitnessTest.assessorId ?? undefined,
        cardioMachine: latestFitnessTest.cardioMachine ?? undefined,
        distance: latestFitnessTest.distance ?? undefined,
        durationMinutes: latestFitnessTest.durationMinutes ?? undefined,
        treadmillNotes: latestFitnessTest.treadmillNotes ?? undefined,
        wallPushUpsReps: latestFitnessTest.wallPushUpsReps ?? undefined,
        wallPushUpsDurationSec: latestFitnessTest.wallPushUpsDurationSec ?? undefined,
        squatsReps: latestFitnessTest.squatsReps ?? undefined,
        squatsDurationSec: latestFitnessTest.squatsDurationSec ?? undefined,
        crunchesReps: latestFitnessTest.crunchesReps ?? undefined,
        crunchesDurationSec: latestFitnessTest.crunchesDurationSec ?? undefined,
        sitAndReachCm: latestFitnessTest.sitAndReachCm ?? undefined,
        ironManHoldSec: latestFitnessTest.ironManHoldSec ?? undefined,
        pelvicBridgeSec: latestFitnessTest.pelvicBridgeSec ?? undefined,
        rProprioception: latestFitnessTest.rProprioception ?? undefined,
        rSingleLegStanding: latestFitnessTest.rSingleLegStanding ?? undefined,
        rStandingBalance: latestFitnessTest.rStandingBalance ?? undefined,
        lProprioception: latestFitnessTest.lProprioception ?? undefined,
        lSingleLegStanding: latestFitnessTest.lSingleLegStanding ?? undefined,
        lStandingBalance: latestFitnessTest.lStandingBalance ?? undefined,
      }
    : null

  return (
    <Tabs defaultValue="postural" className="w-full">
      <div className="flex items-center justify-between border-b pb-2">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="postural">Postural Analysis</TabsTrigger>
          <TabsTrigger value="fitness-test">Fitness Testing</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="postural" className="mt-4 space-y-4">
        <PosturalForm
          memberId={memberId}
          defaultValues={posturalFormValues}
          onSuccess={onSuccess}
        />
      </TabsContent>

      <TabsContent value="fitness-test" className="mt-4 space-y-4">
        <FitnessTestForm
          memberId={memberId}
          defaultValues={fitnessFormValues}
          onSuccess={onSuccess}
        />
      </TabsContent>
    </Tabs>
  )
}
