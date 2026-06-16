// src/middleware.ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"


export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"]
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  // Admin-only routes
  const role = (session?.user as any)?.role
  
  if (pathname.startsWith("/settings") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
  return NextResponse.next()
})