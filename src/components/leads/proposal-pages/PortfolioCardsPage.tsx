import { PageContainer, COLORS, LogoSmall, FONT_TITLE, FONT_BODY, ValidityFooter, type ProposalPageProps } from "./shared";

interface PortfolioCard {
  id: string;
  nome: string;
  foto_url: string;
  legenda?: string;
}

export function ProposalPortfolioCardsPage(props: ProposalPageProps) {
  const cards = (props.portfolioCards || []).slice(0, 4);
  if (!cards.length) return null;

  const rows = cards.length <= 2 ? 1 : 2;

  return (
    <PageContainer bg={COLORS.begeClaro} pageWidth={props.pageWidth} pageHeight={props.pageHeight}>
      <div style={{ padding: "36px 40px", height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Title */}
        <h2
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.textoTituloVinho,
            textAlign: "center",
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          Nossos Projetos
        </h2>

        {/* Grid */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: cards.length === 1 ? "1fr" : "1fr 1fr",
            gridTemplateRows: rows === 1 ? "1fr" : "1fr 1fr",
            gap: 16,
          }}
        >
          {cards.map((card, i) => (
            <div key={card.id || i} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, borderRadius: 8, overflow: "hidden", minHeight: 0 }}>
                <img
                  src={card.foto_url}
                  alt={card.nome}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <p
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: COLORS.textoEscuro,
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                {card.nome}
              </p>
              {card.legenda && (
                <p
                  style={{
                    fontFamily: FONT_TITLE,
                    fontSize: 13,
                    fontStyle: "italic",
                    color: COLORS.roseMauve,
                    textAlign: "center",
                    marginTop: 2,
                  }}
                >
                  {card.legenda}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <ValidityFooter validUntil={props.validUntil} />
      <LogoSmall url={props.logoUrl} />
    </PageContainer>
  );
}
