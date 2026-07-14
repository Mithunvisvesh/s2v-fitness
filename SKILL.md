# S2V Fitness Management System — Developer's Persistent Brain & Skill Guide

## Project Overview
The **S2V Fitness Management System** is a digitisation portal for a physical gym. Its goal is to replace complex physical paper gym forms (Measurements, PAR-Q, Lifestyle, Medical, Menstrual, Postural Analysis, etc.) with a reliable, role-based digital dashboard. The primary priorities of this system are:
1. **Backend Correctness and Data Integrity**: Database schemas and validation logic serve as the ultimate source of truth.
2. **Server-Driven Business Rules**: Calculations (e.g., BMI, Waist-Hip Ratio, Medical Clearance Flags) must be computed on the server.
3. **Streamlined Data-Entry UX**: An optimized interface that enables gym staff to transition from paper workflows quickly, efficiently, and with minimal error.

---

## Architecture & Tech Stack
* **Framework**: Next.js 16.2 (App Router)
* **Frontend Library**: React 19.2
* **Language**: TypeScript 5.x
* **Styling**: Tailwind CSS v4 + `tw-animate-css`
* **UI Components**: shadcn/ui (Radix Primitives)
* **Database & ORM**: Prisma 6.19 + PostgreSQL
* **Authentication**: NextAuth v5 (Beta 31, Credentials-based with custom JWT/Session roles)
* **Form Validation**: React Hook Form + `@hookform/resolvers` + Zod v4

---

## Folder Structure & Important Modules
```
s2v-fitness/
├── prisma/
│   ├── schema.prisma             # Data models for Users, Members, Screening modules, etc.
│   └── seed.ts                   # Seed script containing roles, users, and member stubs
├── src/
│   ├── app/
│   │   ├── (auth)/               # Login and public routes
│   │   ├── (dashboard)/          # Dashboard routes wrapped with sidebar layout
│   │   │   ├── members/          # Member directory and profiles
│   │   │   │   ├── [memberId]/   # Member Detail view, edit, measurements, and screening tabs
│   │   │   │   └── new/          # Member creation page
│   │   │   └── archive/          # Archive lists
│   │   ├── api/                  # API endpoints (e.g. NextAuth auth handler)
│   │   └── globals.css           # Core styling and font configurations
│   ├── components/
│   │   ├── member/               # Member-specific sub-components (status badge, headers, etc.)
│   │   ├── measurements/         # Measurement history, forms, and charts
│   │   └── ui/                   # Shared UI primitives (dialogs, cards, input, etc.)
│   ├── lib/
│   │   ├── auth.ts               # NextAuth setup and authorize callback logic
│   │   ├── constants.ts          # Core static configurations (enums, calculation helpers)
│   │   ├── db.ts                 # Instantiated Prisma Client
│   │   ├── utils.ts              # Formatters and CSS merge helpers
│   │   └── validations/          # Core Zod Schemas
│   │       ├── member.ts         # Member schema (CRUD validation)
│   │       ├── measurement.ts    # Measurement schema (Circumferences & Body Composition)
│   │       └── fitness-screening.ts # Screening validation (PAR-Q, Lifestyle, Medical, Menstrual)
│   └── server/
│       ├── actions/              # Server Actions for transactional operations (CRUD)
│       │   ├── members.ts        # Member insert/update server actions
│       │   ├── measurements.ts   # Measurement insert/update/delete server actions
│       │   └── fitness-screening.ts # [Phase 3B Target] Screening modules server actions
│       └── queries/              # Raw data getters (Read-only, optimal performance)
│           ├── members.ts        # Member profile & directory queries
│           ├── measurements.ts   # Measurement data queries
│           └── fitness-screening.ts # [Phase 3B Target] Screening queries
```

---

## Existing Workflows & Implementations

### Phase 1: Member Management (Completed)
* **Authentication**: Credentials authentication. User accounts have defined roles (`ADMIN`, `COUNSELLOR`, `TRAINER`). 
* **Authorization**: Trainers can only view members assigned to them (enforced via `trainerId` matching in query limits and page boundaries). Administrators and Counsellors can view and edit all members.
* **Member CRUD**: Fast pre-flight uniqueness checks for `mobile`, `email`, and `membershipNo` before hitting database writes. Includes unique index constraints.
* **Archiving**: Soft deletes. Members are marked as `ARCHIVED` with an `archivedAt` timestamp, maintaining references without fully deleting data.

### Phase 2: Measurements (Completed)
* **Measurements Form**: Captures body composition details and circumferences.
* **Auto-Calculations**: BMI and Waist-to-Hip Ratio (WHR) are calculated server-side when saving a measurement.
* **WHR Indicator**: Based on gender rules stored in `src/lib/constants.ts`:
  * *Women*: WHR < 0.8 is "Healthy", >= 0.8 is "At Risk"
  * *Men*: WHR < 0.95 is "Healthy", >= 0.95 is "At Risk"
* **Progress Tracking**: Integrates Recharts to render historical progression of body weight, fat %, and other key metrics.

### Phase 3A: Fitness Screening Schema & Validations (Completed)
* **Zod Schemas**: Created schemas in `src/lib/validations/fitness-screening.ts` covering:
  1. `parqSchema`: 7 boolean questions + assessed date.
  2. `lifestyleProfileSchema`: Occupation, sleep quality/timings, travel, and habits (with refinements validating dependencies).
  3. `medicalConditionsSchema`: Array of conditions. Handles details and specifies names for `OTHER` items.
  4. `menstrualHistorySchema`: For female members, validating average cycle length, onset age, date of last cycle, and symptoms.
* **Database Schema**: Schema migrated successfully to support historical logs for PAR-Q, Lifestyle, Medical Conditions, and Menstrual History.

---

## Key Business Logic & Calculations

### 1. BMI Calculation
$$BMI = \frac{Weight\ (kg)}{(Height\ (m))^2}$$
Computed server-side using the `calcBMI` utility in `constants.ts`.

### 2. Waist-Hip Ratio (WHR)
$$WHR = \frac{Waist\ Circumference}{Hip\ Circumference}$$
Computed server-side using the `calcWHR` utility.

### 3. Medical Clearance Flag (`medicalClearanceRequired`)
Must ALWAYS be derived server-side. Evaluated on the 7 core questions of the PAR-Q assessment:
```typescript
export function deriveMedicalClearanceRequired(data: ParqFormValues): boolean {
  return (
    data.q1_heartTrouble ||
    data.q2_chestPain ||
    data.q3_dizzinessFainting ||
    data.q4_highBloodPressure ||
    data.q5_boneJointProblems ||
    data.q6_otherReasons ||
    data.q7_over45Unaccustomed
  )
}
```
If **any** of the answers are `true`, `medicalClearanceRequired` is set to `true`.

### 4. Historical Tracking
Screening history is logged and queried as chronological records, sorting newest records first using the `assessedAt` datetime parameter.

---

## Development & Security Conventions

### 1. Backend-First Integrity
* All values must be validated using Zod schemas on the server, even if checked on the client.
* Derived metrics (such as BMI, WHR, and `medicalClearanceRequired`) must be calculated server-side.

### 2. Error & Exception Handling
* Never return raw database exceptions to the client.
* Catch Prisma's unique constraint (`P2002`) and record not found (`P2025`) errors and return structured `ActionResult` payloads:
  ```typescript
  type ActionResult =
    | { success: true; entityId: string }
    | {
        success: false
        error: {
          fieldErrors: Record<string, string[] | undefined>
          formErrors: string[]
        }
      }
  ```

### 3. Session & Access Control
* Ensure actions enforce authorization rules by calling `requireSession()` or checking `session.user.role`.
* Audit log creation is mandatory on every modifying database transaction (e.g. `CREATE_MEMBER`, `CREATE_MEASUREMENT`, `UPDATE_MEASUREMENT`).

### 4. Code Health
* The application must compile cleanly with `npx tsc --noEmit` and satisfy `npm run lint` and `npm run build` before completion of any milestones.

---

## Assumptions & Known Issues
* **Recharts / Hydration Warning**: Recharts has known hydration warnings when rendering inside Next.js App Router components. These are bypassed by loading the charts component client-side with `{ ssr: false }`.
* **Member Gender Invariance**: A member's gender is fixed at registration. If altered, historical metrics like WHR status indicators may change retroactively due to the server-side lookup against gender rules.
