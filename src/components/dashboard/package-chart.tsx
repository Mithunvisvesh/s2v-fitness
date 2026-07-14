"use client"

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface PackageChartProps {
  data: {
    name: string
    value: number
  }[]
}

const COLORS = [
  "hsl(var(--primary))",
  "rgb(56, 189, 248)",  // Sky blue
  "rgb(168, 85, 247)",  // Purple
  "rgb(244, 63, 94)",   // Rose red
]

export function PackageChart({ data }: PackageChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Package Distribution</CardTitle>
        <CardDescription>Members active by package tier</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {total === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No package tier details recorded.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value as number
                      const pct = ((value / total) * 100).toFixed(1)
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">
                              {payload[0].name}
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              {value} members ({pct}%)
                            </span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
