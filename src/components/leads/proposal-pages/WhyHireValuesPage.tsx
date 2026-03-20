import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, formatBRL, type ProposalPageProps } from "./shared";

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

export function ProposalWhyHireValuesPage({
  priceFull,
  priceCash,
  installmentsCount,
  installmentEntry,
  installmentValue,
  priceNote,
}: ProposalPageProps) {
  const investmentLabel = priceFull ? formatBRL(priceFull) : "A consultar";
  const paymentLabel =
    installmentsCount && installmentValue
      ? `${installmentsCount}x de ${formatBRL(installmentValue)}`
      : "Boleto ou Pix";
  const paymentSub =
    installmentsCount && installmentValue ? `Entrada: ${formatBRL(installmentEntry)}` : "Parcelamento disponível";
  const investmentSub = priceFull ? (priceCash ? `À vista: ${formatBRL(priceCash)}` : "") : "Personalizado ao escopo";

  return (
    <PageContainer bg={COLORS.azulMarinho}>
      <div style={{ padding: "52px 52px 44px", color: COLORS.textoClaro, height: "100%" }}>
        {/* Title */}
        <h2
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 28,
            fontWeight: 600,
            textAlign: "center",
            marginBottom: 32,
            textTransform: "uppercase",
            letterSpacing: 2,
            color: COLORS.textoClaro,
          }}
        >
          Por que Contratar Arquitetos para Gerenciar sua Obra?
        </h2>

        {/* 2×2 grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          {WHY_CARDS.map((card, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(244,220,200,0.12)",
                borderRadius: 6,
                padding: "20px 18px",
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

        {/* Values section */}
        <div style={{ borderTop: "1px solid rgba(244,220,200,0.15)", paddingTop: 32 }}>
          <h3
            style={{
              fontFamily: FONT_TITLE,
              fontSize: 26,
              fontWeight: 600,
              textAlign: "center",
              marginBottom: 20,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLORS.textoClaro,
            }}
          >
            Valores
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {/* Investment box */}
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 6,
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: COLORS.linhaDestaque,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Investimento Total
              </span>
              <div style={{ fontFamily: FONT_TITLE, fontSize: 22, fontWeight: 600, color: COLORS.textoClaro }}>
                {investmentLabel}
              </div>
              {investmentSub && (
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 3, color: COLORS.textoClaro }}>{investmentSub}</div>
              )}
            </div>

            {/* Payment box */}
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 6,
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: COLORS.linhaDestaque,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                Formas de Pagamento
              </span>
              <div style={{ fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 600, color: COLORS.textoClaro }}>
                {paymentLabel}
              </div>
              <div style={{ fontSize: 10, opacity: 0.55, marginTop: 3, color: COLORS.textoClaro }}>{paymentSub}</div>
            </div>
          </div>

          <p
            style={{
              fontSize: 10,
              opacity: 0.5,
              textAlign: "center",
              fontStyle: "italic",
              lineHeight: 1.5,
              color: COLORS.textoClaro,
            }}
          >
            {priceNote || "* Mão de obra e materiais de execução não estão inclusos neste valor."}
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
