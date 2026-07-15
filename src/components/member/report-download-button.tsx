"use client"

import { useEffect, useState } from "react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MemberReportPdf } from "@/components/reports/member-report-pdf"
import { MemberReportData } from "@/server/queries/reports"
import { getMemberReportDataAction } from "@/server/actions/reports"
import { toast } from "sonner"

interface ReportDownloadButtonProps {
  data?: MemberReportData
  memberId?: string
}

export function ReportDownloadButton({ data: initialData, memberId }: ReportDownloadButtonProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [reportData, setReportData] = useState<MemberReportData | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  const handleFetch = async () => {
    if (reportData || !memberId) return
    setIsLoading(true)
    try {
      const res = await getMemberReportDataAction(memberId)
      setReportData(res)
      toast.success("Report data prepared. Click 'Download PDF' to save.")
    } catch {
      toast.error("Failed to prepare report data.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Download className="h-4 w-4" />
        Prepare Report
      </Button>
    )
  }

  if (!reportData) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading}
        onClick={handleFetch}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {isLoading ? "Preparing..." : "Prepare Report"}
      </Button>
    )
  }

  const fileName = `Report_${reportData.member.membershipNo}_${reportData.member.fullName.replace(/[^a-zA-Z0-9.-]/g, "_")}.pdf`

  return (
    <PDFDownloadLink
      document={<MemberReportPdf data={reportData} />}
      fileName={fileName}
      style={{ textDecoration: "none" }}
    >
      {/* 
        @react-pdf/renderer types can sometimes mismatch on children types. 
        Safely casting or returning simple node elements satisfies React 19 TS.
      */}
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading} className="gap-2">
          <Download className="h-4 w-4" />
          {loading ? "Generating PDF..." : "Download PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
