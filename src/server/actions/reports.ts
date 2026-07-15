"use server"

import { getMemberReportData } from "@/server/queries/reports"

export async function getMemberReportDataAction(memberId: string) {
  return getMemberReportData(memberId)
}
