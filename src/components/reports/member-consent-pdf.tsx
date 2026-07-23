import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1f2937",
    lineHeight: 1.6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 15,
    marginBottom: 20,
  },
  logoContainer: {
    width: 150,
  },
  logo: {
    height: 35,
    objectFit: "contain",
  },
  headerRight: {
    textAlign: "right",
  },
  brandText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e3a8a",
  },
  subBrandText: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a8a",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: 10,
    marginBottom: 12,
    textAlign: "justify",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e3a8a",
    backgroundColor: "#f3f4f6",
    padding: 5,
    marginTop: 15,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
  },
  infoCol: {
    width: "50%",
    marginBottom: 6,
  },
  label: {
    fontWeight: "bold",
    color: "#4b5563",
    fontSize: 8,
  },
  value: {
    fontSize: 10,
    marginTop: 2,
  },
  signatureContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    paddingTop: 20,
  },
  sigBox: {
    width: "45%",
    alignItems: "center",
  },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: "#9ca3af",
    width: "100%",
    marginTop: 5,
    paddingTop: 5,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "bold",
    color: "#4b5563",
  },
  digitalSigWrapper: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  digitalSigImage: {
    height: 40,
    width: 120,
    objectFit: "contain",
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

interface MemberConsentPdfProps {
  memberName: string
  membershipNo: string
  consent: {
    emergencyContactName: string | null
    emergencyMobile: string | null
    relationship: string | null
    consentDate: Date
    digitalSignature: string | null
  }
}

export function MemberConsentPdf({ memberName, membershipNo, consent }: MemberConsentPdfProps) {
  const signingDate = new Date(consent.consentDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src="/logo.png" style={styles.logo} />
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.brandText}>S2V Fitness Centre</Text>
            <Text style={styles.subBrandText}>Gym, Weight Loss & Much More</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Members Consent Form</Text>

        {/* Legal Text 1 */}
        <Text style={styles.bodyText}>
          I, {memberName} (Membership No: {membershipNo}), have agreed to participate in the physical fitness exercise program conducted by S2V Fitness Centre and also accept this form with an acknowledgement that I have voluntarily chosen this program. I take the sole responsibility for my health and wellbeing.
        </Text>

        {/* Legal Text 2 */}
        <Text style={styles.bodyText}>
          I know and have been informed about the benefits of exercise, which include increased work capacity, improved cardiovascular efficiency, increased muscular strength, flexibility, power and endurance. I am also aware of the risk to the Musculo-skeletal system (sprains, strains) and the cardio-respiratory system (dizziness, discomfort in breathing, heart attack), if exercise is not done in a proper way. I hereby certify that I have no further medical problems than those mentioned in my health questionnaire which could increase my risk of injury and illness as a result of participating in a regular exercise program.
        </Text>

        {/* Legal Text 3 */}
        <Text style={styles.bodyText}>
          By signing this consent form, I accept that I am personally responsible for my actions during my program tenure with S2V Fitness Centre and that I waive off the responsibility of the fitness centre and its staff, if I should incur any injury as a result of my negligence.
        </Text>

        {/* Emergency details section */}
        <Text style={styles.sectionTitle}>Emergency Contact Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Emergency Contact Name</Text>
            <Text style={styles.value}>{consent.emergencyContactName || "—"}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Emergency Contact Mobile</Text>
            <Text style={styles.value}>{consent.emergencyMobile || "—"}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Relationship to Member</Text>
            <Text style={styles.value}>{consent.relationship || "—"}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Signing Date</Text>
            <Text style={styles.value}>{signingDate}</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureContainer}>
          <View style={styles.sigBox}>
            <View style={styles.digitalSigWrapper}>
              {/* Spacer for physical signature line */}
            </View>
            <Text style={styles.sigLine}>Fitness Counsellor</Text>
          </View>
          
          <View style={styles.sigBox}>
            <View style={styles.digitalSigWrapper}>
              {consent.digitalSignature && consent.digitalSignature.startsWith("data:image/") ? (
                <Image src={consent.digitalSignature} style={styles.digitalSigImage} />
              ) : (
                <Text style={{ fontSize: 8, color: "#9ca3af", fontStyle: "italic" }}>
                  Accepted Digitally
                </Text>
              )}
            </View>
            <Text style={styles.sigLine}>Member's Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          S2V Fitness Centre · Confidential Document · Generated on {new Date().toLocaleDateString("en-GB")}
        </Text>
      </Page>
    </Document>
  )
}
