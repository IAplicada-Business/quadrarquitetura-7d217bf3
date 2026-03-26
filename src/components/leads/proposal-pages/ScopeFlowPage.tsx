import { PageContainer, COLORS, FONT_TITLE, type ProposalPageProps } from "./shared";

const FLOW_STEPS = [
  { num: 1, title: "Levantamento\n& Briefing", desc: "Alinhamento de conceito e necessidades", days: "4 dias" },
  { num: 2, title: "Estudo\nPreliminar", desc: "Aprovação do layout", days: "15 dias" },
  { num: 3, title: "Orçamento\nExecutivo", desc: "Valor total definido", days: "7 dias" },
  { num: 4, title: "Reunião de\nPrioridades", desc: "Budget x escopo", days: "~25 dias" },
  { num: 5, title: "Início\nda Obra", desc: "Gerenciamento pleno", days: "" },
];

const DEFAULT_SCOPE =
  "Desenvolvemos o **projeto executivo** com todos os desenhos necessários à obra, considerando cada ideia discutida com o cliente. Em seguida, conduzimos o **gerenciamento completo** — administração de fornecedores, cronograma, pagamentos, vistorias e conferências. Acompanhamos também o **pós-obra**, garantindo que tudo funcione como entregue.";

export function ProposalScopeFlowPage({ scopeDescription, timelineBriefing, timelineStudy, timelinePriorities, ambientes, totalArea }: ProposalPageProps) {
  const text = scopeDescription || DEFAULT_SCOPE;

  const renderText = (t: string) => {
    const parts = t.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} style={{ fontWeight: 600, color: COLORS.textoTituloVinho }}>
          {part}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const steps = [...FLOW_STEPS];
  if (timelineBriefing) steps[0].days = `${timelineBriefing} dias`;
  if (timelineStudy) steps[1].days = `${timelineStudy} dias`;
  if (timelinePriorities) steps[3].days = `~${timelinePriorities} dias`;

  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div style={{ padding: "52px 52px 44px", height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Scope section */}
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLORS.linhaDestaque,
              fontWeight: 500,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            O que está sendo contemplado
          </div>
          <h2
            style={{
              fontFamily: FONT_TITLE,
              fontSize: 30,
              fontWeight: 600,
              color: COLORS.azulMarinho,
              textAlign: "center",
              marginBottom: 20,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Nosso Escopo
          </h2>
          <p
            style={{
              fontSize: 13,
              color: COLORS.azulMarinho,
              lineHeight: 1.75,
              textAlign: "center",
              maxWidth: 440,
              margin: "0 auto",
            }}
          >
            {renderText(text)}
          </p>

          {/* Ambientes */}
          {ambientes && ambientes.length > 0 && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.textoTituloVinho, marginBottom: 4 }}>
                Ambientes contemplados:
              </p>
              <p style={{ fontSize: 11, color: COLORS.azulMarinho, lineHeight: 1.6 }}>
                {ambientes.join(" · ")}
              </p>
              {totalArea && (
                <p style={{ fontSize: 10, color: COLORS.roseMauve, marginTop: 4 }}>
                  Metragem total: {totalArea} m²
                </p>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: COLORS.linhaDestaque, opacity: 0.3, margin: "36px 0" }} />

        {/* Process section */}
        <div
          style={{
            fontSize: 9,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: COLORS.linhaDestaque,
            fontWeight: 500,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Como funciona
        </div>
        <h3
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 26,
            fontWeight: 600,
            color: COLORS.azulMarinho,
            textAlign: "center",
            marginBottom: 28,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Nosso Processo
        </h3>

        {/* Flow grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0, alignItems: "start" }}>
          {steps.map((step, i) => (
            <div key={i} style={{ textAlign: "center", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", minHeight: 120 }}>
              {/* Connecting lines */}
              {i > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 18,
                    left: -2,
                    width: "50%",
                    height: 1,
                    background: COLORS.roseMauve,
                    opacity: 0.5,
                  }}
                />
              )}
              {i < steps.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: 18,
                    right: -2,
                    width: "50%",
                    height: 1,
                    background: COLORS.roseMauve,
                    opacity: 0.5,
                  }}
                />
              )}
              {/* Circle */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  margin: "0 auto 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT_TITLE,
                  fontSize: 16,
                  fontWeight: 700,
                  position: "relative",
                  zIndex: 1,
                  background: i % 2 === 0 ? COLORS.roseMauve : COLORS.azulMarinho,
                  color: COLORS.textoClaro,
                  flexShrink: 0,
                }}
              >
                {step.num}
              </div>
              {/* Title */}
              <h5
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: COLORS.azulMarinho,
                  lineHeight: 1.3,
                  marginBottom: 4,
                  whiteSpace: "pre-line",
                }}
              >
                {step.title}
              </h5>
              {/* Description */}
              <p style={{ fontSize: 9, color: "#777", lineHeight: 1.4, marginTop: 4, marginBottom: 4, minHeight: 28 }}>{step.desc}</p>
              {/* Days badge */}
              {step.days ? (
                <span
                  style={{
                    display: "inline-block",
                    minWidth: 52,
                    height: 22,
                    lineHeight: "22px",
                    textAlign: "center",
                    fontSize: 9,
                    fontWeight: 500,
                    color: COLORS.roseMauve,
                    border: `1px solid ${COLORS.roseMauve}`,
                    borderRadius: 11,
                    padding: "0 8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.days}
                </span>
              ) : (
                <span style={{ display: "inline-block", height: 22 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
