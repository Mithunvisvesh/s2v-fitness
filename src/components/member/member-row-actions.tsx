"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MoreHorizontal, Eye, Pencil, Archive, ArchiveRestore } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
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
import { archiveMember, restoreMember } from "@/server/actions/members"

interface MemberRowActionsProps {
  memberId: string
  memberName: string
  variant?: "active" | "archived"
  canManage: boolean
}

export function MemberRowActions({
  memberId,
  memberName,
  variant = "active",
  canManage,
}: MemberRowActionsProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      try {
        if (variant === "archived") {
          await restoreMember(memberId)
          toast.success(`${memberName} restored.`)
        } else {
          await archiveMember(memberId)
          toast.success(`${memberName} archived.`)
        }
        setConfirmOpen(false)
        router.refresh()
      } catch {
        toast.error("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${memberName}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/members/${memberId}`}>
              <Eye /> View profile
            </Link>
          </DropdownMenuItem>
          {canManage && variant === "active" && (
            <DropdownMenuItem asChild>
              <Link href={`/members/${memberId}/edit`}>
                <Pencil /> Edit
              </Link>
            </DropdownMenuItem>
          )}
          {canManage && (
            <DropdownMenuItem
              variant={variant === "active" ? "destructive" : "default"}
              onSelect={(e) => {
                e.preventDefault()
                setConfirmOpen(true)
              }}
            >
              {variant === "archived" ? (
                <>
                  <ArchiveRestore /> Restore
                </>
              ) : (
                <>
                  <Archive /> Archive
                </>
              )}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {variant === "archived" ? "Restore this member?" : "Archive this member?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {variant === "archived"
                ? `${memberName} will reappear in the active member directory.`
                : `${memberName} will move to the archive. You can restore them at any time, and nothing is deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Working..." : variant === "archived" ? "Restore" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
