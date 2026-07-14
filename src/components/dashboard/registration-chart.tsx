"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface RegistrationChartProps {
  data: {
    month: string
    registrations: number
  }[]
}

export function RegistrationChart({ data }: RegistrationChartProps) {
  return (
    <Card className="col-span-4 hover:bg-muted/50 transition-colors">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Registration Trends</CardTitle>
        <CardDescription>Monthly member registrations (Last 6 Months)</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No registration data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-[11px] text-muted-foreground uppercase font-bold">Month</span>
                            <span className="text-[11px] text-muted-foreground uppercase font-bold">Registrations</span>
                            <span className="text-sm font-semibold text-foreground">{payload[0].payload.month}</span>
                            <span className="text-sm font-semibold text-primary">{payload[0].value}</span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="registrations"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
