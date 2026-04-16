import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, LogoQuadra, LogoQuadraDark, CONTRACT_STYLES } from "./shared";

interface ClauseItem {
  number: number;
  title: string;
  content: string;
}

interface Props {
  clauses: ClauseItem[];
  pageNumber: number;
  isEvenPage?: boolean;
}

export function ClausePage({ clauses, pageNumber, isEvenPage }: Props) {
  const bg = isEvenPage ? COLORS.begeClaro : "#FFFFFF";

  return (
    <PageContainer bg={bg}>
      <div style={{ padding: CONTRACT_STYLES.padding, paddingBottom: 60 }}>
        {clauses.map((clause, idx) => (
          <div key={clause.number} style={{ marginBottom: idx < clauses.length - 1 ? 16 : 0 }}>
            <h3 style={{
              fontFamily: FONT_TITLE,
              fontWeight: 600,
              fontSize: CONTRACT_STYLES.clauseTitleSize,
              color: COLORS.azulMarinho,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
              paddingBottom: 4,
              borderBottom: `1px solid ${COLORS.linhaDestaque}`,
            }}>
              {clause.title}
            </h3>
            <div style={{
              fontFamily: FONT_BODY,
              fontSize: CONTRACT_STYLES.bodyFontSize,
              color: COLORS.textoEscuro,
              lineHeight: CONTRACT_STYLES.lineHeight,
              whiteSpace: "pre-wrap",
              textAlign: "justify",
            }}>
              {clause.content}
            </div>
          </div>
        ))}
      </div>

      {/* Page number */}
      <div style={{
        position: "absolute", bottom: 20, left: 0, right: 0,
        textAlign: "center", fontFamily: FONT_BODY, fontSize: 8,
        color: isEvenPage ? COLORS.textoEscuro : "#999", opacity: 0.5,
      }}>
        {pageNumber}
      </div>
      <LogoQuadraDark />
    </PageContainer>
  );
}
