"use client"

import { useEffect, useState } from "react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MemberReportPdf } from "@/components/reports/member-report-pdf"
import { MemberReportData } from "@/server/queries/reports"

interface ReportDownloadButtonProps {
  data: MemberReportData
}

export function ReportDownloadButton({ data }: ReportDownloadButtonProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  const fileName = `Report_${data.member.membershipNo}_${data.member.fullName.replace(/[^a-zA-Z0-9.-]/g, "_")}.pdf`

  if (!isMounted) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Download className="h-4 w-4" />
        Prepare Report
      </Button>
    )
  }

  return (
    <PDFDownloadLink
      document={<MemberReportPdf data={data} />}
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
          {loading ? "Generating PDF..." : "Download Report"}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
