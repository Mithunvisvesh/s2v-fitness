# S2V Fitness Management System

A full-stack, enterprise-grade SaaS platform built to streamline modern gym administration, health screenings, fitness progression tracking, and member lifecycle management.

## Overview

The S2V Fitness Management System digitizes and consolidates the physical fitness screening, postural analysis, and training progression workflow for gym operations. Built for performance, data security, and ease of use, it bridges the gap between gym administration and trainers by providing real-time analytics, structured physical tracking, and secure document management.

The platform implements a strict role-based access control (RBAC) mechanism. This ensures that sensitive medical disclosures (such as menstrual history or detailed medical notes) are restricted to authorized personnel (Administrators and Counsellors) while allowing Trainers to view core physical assessments, log body compositions, and record trainer assignments.

---

## Key Features

*   **Role-Based Access Control (RBAC)**: Enforces access restrictions across three core roles:
    *   `ADMIN` & `COUNSELLOR`: Full read/write access to all screening parameters, medical records, files, user permissions, and trainer-to-member assignments.
    *   `TRAINER`: Restricted access; trainers can only view and manage members explicitly assigned to them, and are barred from accessing sensitive medical sections.
*   **Comprehensive Health & Fitness Screening**:
    *   **PAR-Q (Physical Activity Readiness Questionnaire)**: Standardized health clearance question checks with live alerts indicating when medical clearance is required.
    *   **Postural Analysis**: Standardized diagnostic checks covering Head/Neck, Spine, Scapula, Pelvis, and Feet alignments.
    *   **Physical Fitness Tests**: Aggregates treadmill/aerobic tests, rep counts (Push-ups, Squats, Crunches), flexibility (Sit and Reach), core endurance, and balance holds.
*   **Archiving & Member Lifecycle**: Support for soft-deletes and restores, allowing staff to archive inactive members while retaining their complete historical fitness footprint.
*   **Secure File Uploads via Supabase Storage**: Safe upload and storage of physical document scans (like signed medical clearance forms, waivers, or custom diet plans) with automatic audit logging.
*   **Dynamic PDF Report Generation**: Single-click downloads of consolidated, professional member health reports utilizing `@react-pdf/renderer` with on-the-fly client rendering.
*   **Interactive Analytics Dashboard**: Beautiful dark-mode optimized Recharts analytics compiling active membership trends, monthly registration numbers, and membership package distributions.

---

## Tech Stack

*   **Framework**: Next.js 14 (App Router)
*   **Database**: PostgreSQL
*   **ORM**: Prisma ORM
*   **Authentication**: NextAuth v5 (Auth.js) with split configuration for optimized Vercel Edge Middleware performance
*   **Storage Provider**: Supabase Storage
*   **Charting Library**: Recharts (fully dark-mode responsive)
*   **Styling**: Tailwind CSS & shadcn/ui components (Sonner toast, Radix UI)
*   **PDF Compiler**: `@react-pdf/renderer`

---

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (v18.x or later)
*   PostgreSQL database instance
*   Supabase Account (for Storage buckets)

### Local Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Mithunvisvesh/s2v-fitness.git
    cd s2v-fitness
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Create a `.env` file in the root directory and populate it with your local configurations (refer to `.env.example`):
    ```env
    # Database Configuration (DATABASE_URL represents the pooled connection, DIRECT_URL represents the unpooled connection required for migrations; both must be configured in hosting providers like Vercel)
    DATABASE_URL="postgresql://username:password@localhost:5432/s2v_fitness?schema=public"
    DIRECT_URL="postgresql://username:password@localhost:5432/s2v_fitness?schema=public"

    # Authentication Configuration
    AUTH_SECRET="your-next-auth-secret-key"
    AUTH_URL="http://localhost:3000"
    NEXT_PUBLIC_APP_URL="http://localhost:3000"

    # Supabase Credentials (for Storage Uploads)
    NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
    ```

4.  **Sync Database Schema & Generate Prisma Client**:
    Push the schema directly to your local database instance:
    ```bash
    npx prisma db push
    ```

5.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Author & Credits

Developed by **Mithunvisvesh** for **S2V Fitness Centre**.
