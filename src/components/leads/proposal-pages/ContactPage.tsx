import { PageContainer, COLORS, FONT_TITLE, ValidityFooter, type ProposalPageProps } from "./shared";

export function ProposalContactPage({ contactInstagram, contactPhone1, contactPhone2, pageWidth, pageHeight }: ProposalPageProps) {
  return (
    <PageContainer bg={COLORS.roseMauve} pageWidth={pageWidth} pageHeight={pageHeight}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          textAlign: "center",
          padding: "60px 48px",
          color: COLORS.textoClaro,
        }}
      >
        {/* Social label */}
        <div
          style={{
            fontSize: 10,
            letterSpacing: 5,
            textTransform: "uppercase",
            opacity: 0.7,
            marginBottom: 12,
          }}
        >
          Siga nas redes sociais
        </div>

        {/* Instagram handle */}
        <div
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 42,
            fontWeight: 600,
            letterSpacing: 1,
            marginBottom: 32,
          }}
        >
          {contactInstagram || "@quadraarq"}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 48,
            height: 1,
            background: COLORS.textoClaro,
            opacity: 0.4,
            margin: "0 auto 32px",
          }}
        />

        {/* Contacts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 48 }}>
          <div style={{ fontSize: 13, opacity: 0.85, letterSpacing: 1 }}>
            <strong style={{ fontWeight: 600, opacity: 1 }}>Camilla</strong>
            &nbsp;&nbsp;{contactPhone1 || "(31) 97264-1970"}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, letterSpacing: 1 }}>
            <strong style={{ fontWeight: 600, opacity: 1 }}>Mariana</strong>
            &nbsp;&nbsp;{contactPhone2 || "(31) 9124-4672"}
          </div>
        </div>

        {/* Thank you */}
        <div
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 26,
            fontStyle: "italic",
            fontWeight: 300,
            opacity: 0.65,
          }}
        >
          Obrigada pela confiança.
        </div>
      </div>
      <ValidityFooter validUntil={validUntil} dark />
    </PageContainer>
  );
}
