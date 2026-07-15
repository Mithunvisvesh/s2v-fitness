"use client"

import { useState, useTransition } from "react"
import { Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { deleteMeasurement } from "@/server/actions/measurements"
import { formatDate } from "@/lib/utils"
import { getBMIStatus, getWHRStatus } from "@/lib/constants"

interface MeasurementRow {
  id: string
  measuredAt: Date
  weightKg: number | null
  bmi: number | null
  bodyFatPercent: number | null
  waistCirc: number | null
  hipCirc: number | null
  waistHipRatio: number | null
  ratioIndicator: string | null
}

const BMI_VARIANT = {
  Underweight: "warning",
  Healthy: "success",
  Overweight: "warning",
  Obese: "destructive",
} as const

interface MeasurementHistoryTableProps {
  measurements: MeasurementRow[]
  memberId: string
  memberGender: string
  canManage: boolean
  onEdit?: (id: string) => void
}

export function MeasurementHistoryTable({
  measurements,
  memberId,
  memberGender,
  canManage,
  onEdit,
}: MeasurementHistoryTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      const res = await deleteMeasurement(deleteId, memberId)
      if (!res.success) {
        toast.error(res.error.formErrors[0] || "Failed to delete measurement.")
      } else {
        toast.success("Measurement deleted.")
      }
      setDeleteId(null)
      router.refresh()
    })
  }

  if (measurements.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No measurements recorded yet.
      </p>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>BMI</TableHead>
            <TableHead>Body Fat %</TableHead>
            <TableHead>Waist</TableHead>
            <TableHead>Hip</TableHead>
            <TableHead>WHR</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {measurements.map((m) => {
            const bmiStatus = m.bmi ? getBMIStatus(m.bmi) : null
            const whrStatus = m.waistHipRatio
              ? getWHRStatus(m.waistHipRatio, memberGender)
              : null
            return (
              <TableRow key={m.id}>
                <TableCell>{formatDate(m.measuredAt)}</TableCell>
                <TableCell>
                  {m.weightKg != null ? `${m.weightKg} kg` : "—"}
                </TableCell>
                <TableCell>
                  {m.bmi != null ? (
                    <span className="flex items-center gap-1.5">
                      {m.bmi.toFixed(1)}
                      {bmiStatus && (
                        <Badge variant={BMI_VARIANT[bmiStatus]} className="text-xs">
                          {bmiStatus}
                        </Badge>
                      )}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {m.bodyFatPercent != null ? `${m.bodyFatPercent}%` : "—"}
                </TableCell>
                <TableCell>
                  {m.waistCirc != null ? `${m.waistCirc} cm` : "—"}
                </TableCell>
                <TableCell>
                  {m.hipCirc != null ? `${m.hipCirc} cm` : "—"}
                </TableCell>
                <TableCell>
                  {m.waistHipRatio != null ? (
                    <span className="flex items-center gap-1.5">
                      {m.waistHipRatio.toFixed(2)}
                      {whrStatus && (
                        <Badge
                          variant={whrStatus === "Healthy" ? "success" : "destructive"}
                          className="text-xs"
                        >
                          {whrStatus}
                        </Badge>
                      )}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEdit(m.id)}
                        >
                          <Pencil />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(m.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this measurement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The measurement record will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
