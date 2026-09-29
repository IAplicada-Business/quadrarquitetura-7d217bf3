import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, PAGE_H, ValidityFooter, type ProposalPageProps } from "./shared";
import foundersPhoto from "@/assets/founders-photo.png";
import { blockContent, DEFAULT_ABOUT_TEXT } from "@/lib/proposalBlocks";
import { RichText } from "./RichText";

export function ProposalAboutPage({ aboutText, logoUrl, pageWidth, pageHeight, validUntil, blockContent: raw }: ProposalPageProps) {
  const c = blockContent("about", raw);
  // Texto do bloco (editado em Blocos do PDF) tem prioridade; se o time
  // ainda não mexeu nele, vale o texto fixo "quem_somos" dos assets.
  const blockBodyEdited = c.body.trim() !== "" && c.body !== DEFAULT_ABOUT_TEXT;
  const body = blockBodyEdited ? c.body : aboutText || c.body || DEFAULT_ABOUT_TEXT;
  return (
    <PageContainer bg={COLORS.begeClaro} pageWidth={pageWidth} pageHeight={pageHeight}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          height: PAGE_H,
        }}
      >
        {/* Left: photo column */}
        <div style={{ overflow: "hidden", height: PAGE_H, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src={foundersPhoto}
            alt="Camilla e Mariana"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />
        </div>

        {/* Right: text column */}
        <div
          style={{
            padding: "56px 36px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Tag */}
          <div
            style={{
              fontSize: 9,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLORS.linhaDestaque,
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            {c.tag}
          </div>

          {/* Title */}
          <h2
            style={{
              fontFamily: FONT_TITLE,
              fontSize: 38,
              fontWeight: 600,
              color: COLORS.textoTituloVinho,
              lineHeight: 1.1,
              marginBottom: 20,
              textDecoration: "underline",
              textDecorationColor: COLORS.linhaDestaque,
              textUnderlineOffset: 5,
              textDecorationThickness: 1.5,
            }}
          >
            {c.title}
          </h2>

          {/* Body text */}
          <p
            style={{
              fontSize: 12.5,
              color: COLORS.textoEscuro,
              lineHeight: 1.75,
              marginBottom: 28,
            }}
          >
            <RichText text={body} />
          </p>

          {/* Founders list */}
          <div
            style={{
              borderTop: `1px solid ${COLORS.linhaDestaque}`,
              paddingTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {c.founders.map((f, i) => (
              <div key={i}>
                <h4
                  style={{
                    fontFamily: FONT_TITLE,
                    fontWeight: 600,
                    fontSize: 15,
                    color: COLORS.textoTituloVinho,
                    letterSpacing: 1,
                    marginBottom: 0,
                  }}
                >
                  {f.title}
                </h4>
                <p style={{ fontSize: 11, color: "#666", lineHeight: 1.5, marginBottom: 0 }}>
                  <RichText text={f.desc || ""} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ValidityFooter validUntil={validUntil} />
    </PageContainer>
  );
}
