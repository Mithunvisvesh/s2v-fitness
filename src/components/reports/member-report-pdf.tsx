import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { MemberReportData } from "@/server/queries/reports"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.5,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e3a8a",
    textAlign: "center",
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e3a8a",
    backgroundColor: "#eff6ff",
    padding: 6,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  gridItem: {
    width: "50%",
    marginBottom: 8,
  },
  label: {
    fontWeight: "bold",
    color: "#4b5563",
    fontSize: 9,
  },
  value: {
    fontSize: 10,
    marginTop: 2,
  },
  noData: {
    fontSize: 10,
    color: "#9ca3af",
    fontStyle: "italic",
    paddingLeft: 6,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
  },
})

interface MemberReportPdfProps {
  data: MemberReportData
}

export function MemberReportPdf({ data }: MemberReportPdfProps) {
  const { member, latestMeasurement, latestParq, latestFitnessTest } = data
  const generatedAt = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>S2V Fitness Management System</Text>
          <Text style={styles.subtitle}>Consolidated Health & Fitness Report · Generated on {generatedAt}</Text>
        </View>

        {/* Member Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Profile</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.value}>{member.fullName}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Membership Number</Text>
              <Text style={styles.value}>{member.membershipNo}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Mobile Contact</Text>
              <Text style={styles.value}>{member.mobile}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Package Type</Text>
              <Text style={styles.value}>{member.package}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Assigned Counsellor</Text>
              <Text style={styles.value}>{member.counsellor?.name || "Unassigned"}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Assigned Trainer</Text>
              <Text style={styles.value}>{member.trainer?.name || "Unassigned"}</Text>
            </View>
          </View>
        </View>

        {/* Body Composition (Latest Measurement) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Composition & Measurements</Text>
          {latestMeasurement ? (
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Height (cm)</Text>
                <Text style={styles.value}>{latestMeasurement.heightCm || "—"}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Weight (kg)</Text>
                <Text style={styles.value}>{latestMeasurement.weightKg || "—"}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>BMI (Body Mass Index)</Text>
                <Text style={styles.value}>
                  {latestMeasurement.bmi ? `${latestMeasurement.bmi.toFixed(1)}` : "—"}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Body Fat %</Text>
                <Text style={styles.value}>
                  {latestMeasurement.bodyFatPercent ? `${latestMeasurement.bodyFatPercent}%` : "—"}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Waist-Hip Ratio (WHR)</Text>
                <Text style={styles.value}>
                  {latestMeasurement.waistHipRatio ? `${latestMeasurement.waistHipRatio.toFixed(2)} (${latestMeasurement.ratioIndicator || "Normal"})` : "—"}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Biological Age</Text>
                <Text style={styles.value}>{latestMeasurement.biologicalAge || "—"}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noData}>No body measurements recorded yet.</Text>
          )}
        </View>

        {/* Health Screening (PAR-Q) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Screening (PAR-Q)</Text>
          {latestParq ? (
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Assessment Date</Text>
                <Text style={styles.value}>
                  {new Date(latestParq.assessedAt).toLocaleDateString("en-GB")}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Medical Clearance Required?</Text>
                <Text style={[styles.value, { color: latestParq.medicalClearanceRequired ? "#dc2626" : "#16a34a" }]}>
                  {latestParq.medicalClearanceRequired ? "YES (Flagged Condition)" : "NO"}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noData}>No PAR-Q health screening assessments recorded yet.</Text>
          )}
        </View>

        {/* Fitness Metrics (Latest Fitness Test) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Fitness Metrics</Text>
          {latestFitnessTest ? (
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Test Date</Text>
                <Text style={styles.value}>
                  {new Date(latestFitnessTest.testDate).toLocaleDateString("en-GB")}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Cardio Distance/Duration</Text>
                <Text style={styles.value}>
                  {latestFitnessTest.distance ? `${latestFitnessTest.distance} km` : "—"} on {latestFitnessTest.cardioMachine || "Treadmill"} ({latestFitnessTest.durationMinutes || "—"} mins)
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Wall Pushups (Reps)</Text>
                <Text style={styles.value}>{latestFitnessTest.wallPushUpsReps || "—"}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Squats (Reps)</Text>
                <Text style={styles.value}>{latestFitnessTest.squatsReps || "—"}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Crunches (Reps)</Text>
                <Text style={styles.value}>{latestFitnessTest.crunchesReps || "—"}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Sit & Reach (Flexibility)</Text>
                <Text style={styles.value}>
                  {latestFitnessTest.sitAndReachCm ? `${latestFitnessTest.sitAndReachCm} cm` : "—"}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Iron Man Hold / Pelvic Bridge</Text>
                <Text style={styles.value}>
                  Hold: {latestFitnessTest.ironManHoldSec ? `${latestFitnessTest.ironManHoldSec}s` : "—"} · Bridge: {latestFitnessTest.pelvicBridgeSec ? `${latestFitnessTest.pelvicBridgeSec}s` : "—"}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Balance standing (L / R)</Text>
                <Text style={styles.value}>
                  Left: {latestFitnessTest.lSingleLegStanding || "—"} · Right: {latestFitnessTest.rSingleLegStanding || "—"}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noData}>No physical fitness tests recorded yet.</Text>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>S2V Fitness Management System · Confidential Document · page 1 of 1</Text>
      </Page>
    </Document>
  )
}
