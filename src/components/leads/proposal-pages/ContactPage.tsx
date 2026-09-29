import { PageContainer, COLORS, FONT_TITLE, ValidityFooter, type ProposalPageProps } from "./shared";
import { blockContent } from "@/lib/proposalBlocks";
import { RichText } from "./RichText";

export function ProposalContactPage({ contactInstagram, contactPhone1, contactPhone2, pageWidth, pageHeight, validUntil, blockContent: raw }: ProposalPageProps) {
  const c = blockContent("contact", raw);
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
          {c.socialLabel}
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
          {contactInstagram || c.instagramFallback}
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
            <strong style={{ fontWeight: 600, opacity: 1 }}>{c.contact1Name}</strong>
            &nbsp;&nbsp;{contactPhone1 || c.contact1Fallback}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, letterSpacing: 1 }}>
            <strong style={{ fontWeight: 600, opacity: 1 }}>{c.contact2Name}</strong>
            &nbsp;&nbsp;{contactPhone2 || c.contact2Fallback}
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
          <RichText text={c.thanks} />
        </div>
      </div>
      <ValidityFooter validUntil={validUntil} dark />
    </PageContainer>
  );
}
