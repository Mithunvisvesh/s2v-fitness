"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  FileText,
  Image as ImageIcon,
  Trash2,
  Upload,
  Download,
  FileCheck,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { uploadDocument, deleteDocument } from "@/server/actions/documents"
import { formatDate } from "@/lib/utils"

interface DocumentItem {
  id: string
  fileName: string
  fileUrl: string
  fileType: string
  category: string | null
  uploadedAt: Date
  uploader: {
    name: string
    role: string
  }
}

interface DocumentsTabProps {
  memberId: string
  documents: DocumentItem[]
  role: string
}

const CATEGORIES = [
  "General",
  "Medical Clearance",
  "Waiver/Consent",
  "Progress Photo",
  "Diet/Nutrition",
  "Lab Report",
]

export function DocumentsTab({ memberId, documents, role }: DocumentsTabProps) {
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<string>("General")
  const [isPending, startTransition] = useTransition()

  const canManage = role === "ADMIN" || role === "COUNSELLOR"

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error("Please select a file to upload.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("category", category)

    startTransition(async () => {
      try {
        const result = await uploadDocument(memberId, formData)
        if (!result.success) {
          toast.error(result.error.formErrors[0] || "Upload failed.")
          return
        }
        toast.success("Document uploaded successfully.")
        setFile(null)
        // Reset file input value
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      } catch {
        toast.error("An unexpected error occurred during upload.")
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this document? This cannot be undone.")) {
      return
    }

    startTransition(async () => {
      try {
        const result = await deleteDocument(id)
        if (!result.success) {
          toast.error(result.error.formErrors[0] || "Failed to delete document.")
          return
        }
        toast.success("Document deleted successfully.")
      } catch {
        toast.error("An unexpected error occurred during deletion.")
      }
    })
  }

  function getFileIcon(fileType: string) {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-8 w-8 text-sky-500" />
    }
    if (fileType.includes("pdf")) {
      return <FileText className="h-8 w-8 text-rose-500" />
    }
    return <FileCheck className="h-8 w-8 text-muted-foreground" />
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Upload Column */}
      {canManage && (
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Upload Document</CardTitle>
            <CardDescription>
              Upload PDF clearances, progress photos, or diet sheets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer file:text-primary file:font-semibold"
                />
              </div>

              <Button type="submit" disabled={isPending} className="w-full gap-2 mt-4">
                <Upload className="h-4 w-4" />
                {isPending ? "Uploading..." : "Upload File"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Documents List/Grid Column */}
      <div className={canManage ? "md:col-span-2 space-y-4" : "md:col-span-3 space-y-4"}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Uploaded Documents</CardTitle>
            <CardDescription>
              A history of uploaded papers, clearances, and media files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground text-sm">
                No documents uploaded yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.fileType)}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold max-w-[200px] sm:max-w-md truncate">
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.category || "General"} · Uploaded by {doc.uploader.name} ({doc.uploader.role.toLowerCase()}) on {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </a>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                          disabled={isPending}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
