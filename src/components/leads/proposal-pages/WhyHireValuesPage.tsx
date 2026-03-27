import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, ValidityFooter, type ProposalPageProps } from "./shared";

const WHY_CARDS = [
  {
    num: "01",
    title: "Alinhamento Técnico e Estético",
    desc: "Unimos a precisão técnica à sensibilidade projetual — garantindo fidelidade ao conceito em cada etapa da execução.",
  },
  {
    num: "02",
    title: "Fidelidade Total ao Projeto",
    desc: "Conhecemos o projeto de dentro para fora. Nenhum detalhe é perdido na transição do papel para a obra.",
  },
  {
    num: "03",
    title: "Transformamos Conceito em Solução",
    desc: "Resolvemos imprevistos com visão de projeto, sem comprometer a estética aprovada.",
  },
  {
    num: "04",
    title: "Presença Constante na Obra",
    desc: "Da fase inicial até a instalação de eletros, metais e pequenos detalhes — estamos lá para cada decisão.",
  },
];

export function ProposalWhyHireValuesPage(props: ProposalPageProps) {
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
          Por que Contratar Arquitetos para Gerenciar sua Obra?
        </h2>

        {/* 2×2 grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {WHY_CARDS.map((card, i) => (
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
                {card.num}
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
                <p style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.5, color: COLORS.textoClaro }}>{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ValidityFooter validUntil={props.validUntil} dark />
    </PageContainer>
  );
}
