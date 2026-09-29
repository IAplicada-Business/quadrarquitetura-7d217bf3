import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, ValidityFooter, type ProposalPageProps } from "./shared";
import { blockContent } from "@/lib/proposalBlocks";
import { RichText } from "./RichText";

export function ProposalManagementFullPage({ pageWidth, pageHeight, validUntil, blockContent: raw }: ProposalPageProps) {
  const c = blockContent("management", raw);
  const cols = c.cards.length <= 4 ? 2 : 3;
  return (
    <PageContainer bg={COLORS.azulMarinho} pageWidth={pageWidth} pageHeight={pageHeight}>
      <div style={{ padding: "44px 44px 40px", color: COLORS.textoClaro, height: "100%" }}>
        {/* Tag */}
        <div
          style={{
            fontSize: 9,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: COLORS.linhaDestaque,
            fontWeight: 500,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {c.tag}
        </div>
        {/* Title */}
        <h2
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 34,
            fontWeight: 600,
            textAlign: "center",
            marginBottom: 6,
            color: COLORS.textoClaro,
          }}
        >
          {c.title}
        </h2>
        {/* Subtitle */}
        <p
          style={{
            fontSize: 10,
            letterSpacing: 1,
            textAlign: "center",
            opacity: 0.6,
            textTransform: "uppercase",
            lineHeight: 1.5,
            marginBottom: 32,
            maxWidth: 400,
            marginLeft: "auto",
            marginRight: "auto",
            color: COLORS.textoClaro,
          }}
        >
          <RichText text={c.subtitle} />
        </p>

        {/* Grid 3×2 */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
          {c.cards.map((card, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(244,220,200,0.12)",
                borderRadius: 6,
                padding: "16px 14px",
              }}
            >
              <h4
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: COLORS.linhaDestaque,
                  marginBottom: 10,
                  paddingBottom: 8,
                  borderBottom: "1px solid rgba(196,117,110,0.25)",
                }}
              >
                {card.title}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {(card.items || []).map((item, j) => (
                  <li
                    key={j}
                    style={{
                      fontSize: 10,
                      color: COLORS.textoClaro,
                      opacity: 0.85,
                      lineHeight: 1.5,
                      padding: "2px 0",
                      paddingLeft: 10,
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        color: COLORS.linhaDestaque,
                        opacity: 0.6,
                        fontSize: 9,
                      }}
                    >
                      —
                    </span>
                    <RichText text={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <ValidityFooter validUntil={validUntil} dark />
    </PageContainer>
  );
}
