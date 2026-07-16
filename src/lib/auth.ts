import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/db"
import { authConfig } from "./auth.config"

interface FailedLoginAttempt {
  count: number
  lockoutUntil: Date | null
}

// In-memory store for tracking failed login attempts keyed by email.
// Note: In production or horizontally scaled multi-instance deployments, a persistent, shared 
// store like Redis or a database-backed table is highly recommended to enforce rate limits globally.
const failedAttemptsMap = new Map<string, FailedLoginAttempt>()

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

function trackFailure(email: string) {
  const now = new Date()
  let record = failedAttemptsMap.get(email)

  if (record && record.lockoutUntil && record.lockoutUntil <= now) {
    record = { count: 0, lockoutUntil: null }
  } else if (!record) {
    record = { count: 0, lockoutUntil: null }
  }

  record.count += 1
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockoutUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS)
  }

  failedAttemptsMap.set(email, record)
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = (credentials.email as string).toLowerCase().trim()
        const now = new Date()

        // Check lockout status
        const record = failedAttemptsMap.get(email)
        if (record && record.lockoutUntil && record.lockoutUntil > now) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.isActive) {
          trackFailure(email)
          return null
        }

        const valid = await compare(credentials.password as string, user.password)

        if (!valid) {
          trackFailure(email)
          return null
        }

        // Success, reset history
        failedAttemptsMap.delete(email)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ]
})
