"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

interface ChartPoint {
  date: string
  value: number | null
}

interface MeasurementData {
  measuredAt: Date
  weightKg: number | null
  bmi: number | null
  bodyFatPercent: number | null
  waistCirc: number | null
  hipCirc: number | null
}

function toChartData(
  measurements: MeasurementData[],
  key: keyof Omit<MeasurementData, "measuredAt">
): ChartPoint[] {
  return [...measurements]
    .reverse() // oldest → newest for left-to-right
    .map((m) => ({
      date: formatDate(m.measuredAt),
      value: m[key] as number | null,
    }))
    .filter((p) => p.value !== null)
}

function toWHRData(measurements: MeasurementData[]): ChartPoint[] {
  return [...measurements]
    .reverse()
    .map((m) => ({
      date: formatDate(m.measuredAt),
      value:
        m.waistCirc && m.hipCirc
          ? Math.round((m.waistCirc / m.hipCirc) * 100) / 100
          : null,
    }))
    .filter((p) => p.value !== null)
}



function ProgressChart({
  title,
  data,
  unit,
  referenceValue,
  referenceLabel,
  domain,
}: {
  title: string
  data: ChartPoint[]
  unit: string
  referenceValue?: number
  referenceLabel?: string
  domain?: [number | "auto", number | "auto"]
}) {
  if (data.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">
            {data.length === 0
              ? "No data recorded yet."
              : "Record at least 2 measurements to see a chart."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={data}
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={domain ?? ["auto", "auto"]}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              formatter={(value) => { if (typeof value !== "number") return ["—", title]; return [`${value} ${unit}`, title] as [string, string] }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
            {referenceValue !== undefined && (
              <ReferenceLine
                y={referenceValue}
                stroke="hsl(var(--destructive))"
                strokeDasharray="4 4"
                label={{
                  value: referenceLabel ?? "",
                  position: "right",
                  fontSize: 10,
                  fill: "var(--muted-foreground)",
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--primary)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface ProgressChartsProps {
  measurements: MeasurementData[]
  memberGender: string
}

export function ProgressCharts({ measurements, memberGender }: ProgressChartsProps) {
  if (measurements.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Record measurements to see progress charts.
      </p>
    )
  }

  const whrRisk = memberGender === "FEMALE" ? 0.8 : 0.95

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ProgressChart
        title="Weight Progress"
        data={toChartData(measurements, "weightKg")}
        unit="kg"
      />
      <ProgressChart
        title="BMI Progress"
        data={toChartData(measurements, "bmi")}
        unit=""
        referenceValue={25}
        referenceLabel="Overweight"
        domain={[10, 45]}
      />
      <ProgressChart
        title="Body Fat % Progress"
        data={toChartData(measurements, "bodyFatPercent")}
        unit="%"
      />
      <ProgressChart
        title="Waist Circumference"
        data={toChartData(measurements, "waistCirc")}
        unit="cm"
      />
      <ProgressChart
        title="Hip Circumference"
        data={toChartData(measurements, "hipCirc")}
        unit="cm"
      />
      <ProgressChart
        title="Waist/Hip Ratio"
        data={toWHRData(measurements)}
        unit=""
        referenceValue={whrRisk}
        referenceLabel={`Risk (${whrRisk})`}
        domain={[0.5, 1.2]}
      />
    </div>
  )
}
