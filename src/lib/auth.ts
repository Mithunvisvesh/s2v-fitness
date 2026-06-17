import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("========== LOGIN ATTEMPT ==========")

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password")
          return null
        }

        console.log("Email entered:", credentials.email)

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        console.log("User found:", !!user)

        if (!user) {
          console.log("No user in database")
          return null
        }

        console.log("DB Email:", user.email)
        console.log("DB Role:", user.role)
        console.log("Stored Hash:", user.password)

        const valid = await compare(
          credentials.password as string,
          user.password
        )

        console.log("Password valid:", valid)

        if (!valid) {
          console.log("Password mismatch")
          return null
        }

        console.log("Login successful")

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.sub!
        ;(session.user as any).role = token.role
      }
      return session
    }
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  }
})