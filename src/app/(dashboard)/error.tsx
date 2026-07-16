"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center animate-in fade-in duration-300">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h2 className="text-lg font-semibold tracking-tight">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground">
          An error occurred while loading this part of the dashboard. Please try refreshing or clicking the button below to retry.
        </p>
      </div>
      <Button onClick={() => reset()} variant="outline" className="mt-2">
        Try again
      </Button>
    </div>
  )
}
