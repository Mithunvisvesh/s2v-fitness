import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Perform a cheap query to register database activity
    await prisma.package.count()
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Health check database error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Database connection failed",
      },
      { status: 500 }
    )
  }
}
