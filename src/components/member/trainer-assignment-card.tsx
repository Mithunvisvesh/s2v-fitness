"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { assignTrainer } from "@/server/actions/members"

interface Trainer {
  id: string
  name: string
}

interface TrainerAssignmentCardProps {
  memberId: string
  currentTrainerId: string | null
  trainers: Trainer[]
  role: string
}

export function TrainerAssignmentCard({
  memberId,
  currentTrainerId,
  trainers,
  role,
}: TrainerAssignmentCardProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(currentTrainerId || "unassigned")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canAssign = role === "ADMIN" || role === "COUNSELLOR"
  const currentTrainer = trainers.find((t) => t.id === currentTrainerId)

  async function handleAssign() {
    setIsSubmitting(true)
    try {
      const targetId = selectedTrainerId === "unassigned" ? null : selectedTrainerId
      const result = await assignTrainer(memberId, targetId)
      if (!result.success) {
        toast.error(result.error.formErrors[0] || "Failed to update trainer assignment.")
        return
      }
      toast.success("Trainer assignment updated successfully.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Trainer Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canAssign ? (
          <div className="flex flex-col gap-3">
            <Select
              value={selectedTrainerId}
              onValueChange={setSelectedTrainerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trainer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned (None)</SelectItem>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAssign}
              disabled={isSubmitting || selectedTrainerId === (currentTrainerId || "unassigned")}
              className="w-full"
            >
              {isSubmitting ? "Updating..." : "Update Assignment"}
            </Button>
          </div>
        ) : (
          <div className="text-sm">
            <span className="text-muted-foreground">Assigned Trainer: </span>
            <strong className="text-foreground">
              {currentTrainer ? currentTrainer.name : "Unassigned"}
            </strong>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
