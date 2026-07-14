import { z } from "zod"

/**
 * Zod validation schema for Postural Analysis records.
 * Customised for Page 3 of S2V physical assessment forms.
 */
export const posturalAnalysisSchema = z.object({
  assessedAt: z.date({
    error: "Assessment date is required",
  }),
  assessorId: z.string().cuid().optional(),

  // Neck observations
  neckFlexion: z.string().trim().max(100).optional().or(z.literal("")),
  neckLateralFlexion: z.string().trim().max(100).optional().or(z.literal("")),
  pokeChin: z.string().trim().max(100).optional().or(z.literal("")),
  neckLateralRotation: z.string().trim().max(100).optional().or(z.literal("")),

  // Spine observations
  spineKyphosis: z.string().trim().max(100).optional().or(z.literal("")),
  spineLordosis: z.string().trim().max(100).optional().or(z.literal("")),
  spineScoliosis: z.string().trim().max(100).optional().or(z.literal("")),
  spineKyphoscoliosis: z.string().trim().max(100).optional().or(z.literal("")),

  // Scapula (Normal, Protracted, Elevated, Winging)
  scapulaLeft: z.string().trim().max(100).optional().or(z.literal("")),
  scapulaRight: z.string().trim().max(100).optional().or(z.literal("")),

  // Lumbo pelvic hip complex (LPHC)
  lphcAsymmetrical: z.boolean().optional(),

  // Knee observations (Genuvalgum, Genuvarum)
  kneeLeft: z.string().trim().max(100).optional().or(z.literal("")),
  kneeRight: z.string().trim().max(100).optional().or(z.literal("")),

  // Foot observations (Flat foot, Normal, Inversion, Eversion)
  footLeft: z.string().trim().max(100).optional().or(z.literal("")),
  footRight: z.string().trim().max(100).optional().or(z.literal("")),

  // Symmetry & general notes
  symmetryDeviation: z.string().trim().max(500).optional().or(z.literal("")),
  trainerNotes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type PosturalAnalysisFormValues = z.infer<typeof posturalAnalysisSchema>

/**
 * Zod validation schema for Fitness Testing records.
 * Supports nullable/optional entries as tests might not be completed in full.
 */
export const fitnessTestSchema = z.object({
  testDate: z.date({
    error: "Test date is required",
  }),
  assessorId: z.string().cuid().optional(),

  // Cardiovascular endurance
  cardioMachine: z.string().trim().max(100).optional().or(z.literal("")),
  distance: z.number().min(0, "Distance cannot be negative").optional(),
  durationMinutes: z.number().int("Duration must be a whole number").min(0, "Duration cannot be negative").optional(),
  treadmillNotes: z.string().trim().max(1000).optional().or(z.literal("")),

  // Muscular endurance reps & durations
  wallPushUpsReps: z.number().int("Reps must be a whole number").min(0, "Reps cannot be negative").optional(),
  wallPushUpsDurationSec: z.number().int("Duration must be a whole number").min(0, "Duration cannot be negative").optional(),
  squatsReps: z.number().int("Reps must be a whole number").min(0, "Reps cannot be negative").optional(),
  squatsDurationSec: z.number().int("Duration must be a whole number").min(0, "Duration cannot be negative").optional(),
  crunchesReps: z.number().int("Reps must be a whole number").min(0, "Reps cannot be negative").optional(),
  crunchesDurationSec: z.number().int("Duration must be a whole number").min(0, "Duration cannot be negative").optional(),

  // Flexibility
  sitAndReachCm: z.number().min(0, "Sit and reach cannot be negative").optional(),

  // Core endurance
  ironManHoldSec: z.number().int("Duration must be a whole number").min(0, "Duration cannot be negative").optional(),
  pelvicBridgeSec: z.number().int("Duration must be a whole number").min(0, "Duration cannot be negative").optional(),

  // Balance (Right & Left)
  rProprioception: z.string().trim().max(100).optional().or(z.literal("")),
  rSingleLegStanding: z.string().trim().max(100).optional().or(z.literal("")),
  rStandingBalance: z.string().trim().max(100).optional().or(z.literal("")),
  lProprioception: z.string().trim().max(100).optional().or(z.literal("")),
  lSingleLegStanding: z.string().trim().max(100).optional().or(z.literal("")),
  lStandingBalance: z.string().trim().max(100).optional().or(z.literal("")),
})

export type FitnessTestFormValues = z.infer<typeof fitnessTestSchema>
