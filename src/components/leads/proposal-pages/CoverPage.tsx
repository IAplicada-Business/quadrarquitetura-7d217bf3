import { PageContainer, COLORS, LogoQuadra, FONT_TITLE, FONT_BODY, ValidityFooter, type ProposalPageProps } from "./shared";
import sociasCover from "@/assets/socias-cover.jpg";
import { blockContent } from "@/lib/proposalBlocks";

export function ProposalCoverPage({ clientName, projectName, logoUrl, pageWidth, pageHeight, validUntil, blockContent: raw }: ProposalPageProps) {
  const c = blockContent("cover", raw);
  return (
    <PageContainer bg={COLORS.azulMarinho} pageWidth={pageWidth} pageHeight={pageHeight}>
      {/* Background photo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${sociasCover})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, transparent 25%, rgba(27,42,74,0.55) 50%, rgba(27,42,74,0.90) 75%, rgba(27,42,74,0.97) 100%)",
        }}
      />
      {/* Content */}
      <div
        style={{
          position: "absolute",
          bottom: 64,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        <span
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 54,
            fontWeight: 300,
            color: COLORS.textoClaro,
            letterSpacing: 14,
            display: "block",
            marginBottom: 10,
          }}
        >
          {c.title}
        </span>
        <div
          style={{
            width: 48,
            height: 1,
            background: COLORS.linhaDestaque,
            margin: "14px auto",
          }}
        />
        <div
          style={{
            fontFamily: FONT_BODY,
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: 6,
            color: COLORS.textoClaro,
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          {clientName || c.clientFallback}
        </div>
        {projectName ? (
          <div
            style={{
              fontSize: 11,
              letterSpacing: 4,
              color: COLORS.textoClaro,
              opacity: 0.55,
              textTransform: "uppercase",
              marginTop: 6,
            }}
          >
            {projectName}
          </div>
        ) : null}
      </div>
      <ValidityFooter validUntil={validUntil} dark />
      <LogoQuadra />
    </PageContainer>
  );
}
