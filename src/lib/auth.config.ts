import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  providers: [], // Configured with credentials provider in auth.ts (Node.js runtime)
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    }
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  }
}

export default authConfig
