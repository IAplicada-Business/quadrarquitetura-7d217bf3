import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, ValidityFooter, type ProposalPageProps } from "./shared";
import { blockContent } from "@/lib/proposalBlocks";
import { RichText } from "./RichText";

export function ProposalWhyHireValuesPage(props: ProposalPageProps) {
  const c = blockContent("whyhire", props.blockContent);
  return (
    <PageContainer bg={COLORS.azulMarinho} pageWidth={props.pageWidth} pageHeight={props.pageHeight}>
      <div style={{ padding: "52px 52px 44px", color: COLORS.textoClaro, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Title */}
        <h2
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 28,
            fontWeight: 600,
            textAlign: "center",
            marginBottom: 40,
            textTransform: "uppercase",
            letterSpacing: 2,
            color: COLORS.textoClaro,
          }}
        >
          {c.title}
        </h2>

        {/* 2×2 grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {c.cards.map((card, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(244,220,200,0.12)",
                borderRadius: 6,
                padding: "24px 20px",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <span
                style={{
                  fontFamily: FONT_TITLE,
                  fontSize: 32,
                  fontWeight: 300,
                  color: COLORS.linhaDestaque,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h4
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: COLORS.textoClaro,
                    marginBottom: 6,
                  }}
                >
                  {card.title}
                </h4>
                <p style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.5, color: COLORS.textoClaro }}><RichText text={card.desc || ""} /></p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ValidityFooter validUntil={props.validUntil} dark />
    </PageContainer>
  );
}
