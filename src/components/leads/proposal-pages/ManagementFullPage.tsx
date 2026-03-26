import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, type ProposalPageProps } from "./shared";

const CARDS = [
  {
    title: "Planejamento",
    items: [
      "Estudo do projeto 3D e executivo",
      "Definição do escopo e sequências",
      "Documento de responsabilidade",
      "Contato com síndico e condomínio",
      "Regras de execução do condomínio",
    ],
  },
  {
    title: "Orçamento",
    items: [
      "Alinhamento de fornecedores",
      "Orçamento completo de todos os itens",
      "Provisão de imprevistos",
      "Comparação e correção de orçamentos",
      "Tabela de acompanhamento para o cliente",
    ],
  },
  {
    title: "Aquisição de Material",
    items: [
      "Lista de compras online",
      "Ajuste de datas com a logística",
      "Conferência de links e itens",
      "Gestão de pagamentos e lembretes",
      "Conta numerário para pequenos itens",
    ],
  },
  {
    title: "Verificação de Qualidade",
    items: [
      "Acompanhamento constante em obra",
      "Visitas com o cliente para alinhamento",
      "Medições constantes para evitar retrabalho",
      "Revisões de projeto com aval da projetista",
    ],
  },
  {
    title: "Acompanhamento da Execução",
    items: [
      "Revisão do cronograma durante a obra",
      "Medições e liberações de pagamento",
      "Conferência de NBRs e normas",
      "Contato constante com a projetista",
    ],
  },
  {
    title: "Gestão de Pessoas",
    items: [
      "Orientação de mão de obra",
      "Feedbacks e sugestões de execução",
      "Gestão de retirada de lixo",
      "Isolamento de piso",
      "Limpeza durante a obra",
    ],
  },
];

export function ProposalManagementFullPage({ pageWidth, pageHeight }: ProposalPageProps) {
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
          Metodologia
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
          Gerenciamento de Obra
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
          Organizamos, coordenamos e controlamos todas as etapas da reforma para garantir prazo, orçamento e qualidade
        </p>

        {/* Grid 3×2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {CARDS.map((card, i) => (
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
                {card.items.map((item, j) => (
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
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
