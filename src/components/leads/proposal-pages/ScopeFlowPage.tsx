import { PageContainer, COLORS, FONT_TITLE, type ProposalPageProps } from "./shared";

const ALL_FLOW_STEPS = [
  { id: "Briefing", title: "Levantamento\n& Briefing", desc: "Alinhamento de conceito e necessidades", daysKey: "briefing" as const },
  { id: "Estudo Preliminar", title: "Estudo\nPreliminar", desc: "Aprovação do layout", daysKey: "study" as const },
  { id: "Anteprojeto", title: "Anteprojeto", desc: "Detalhamento do projeto", daysKey: null },
  { id: "Orçamento Executivo", title: "Orçamento\nExecutivo", desc: "Valor total definido", daysKey: "budget" as const },
  { id: "Reunião de Prioridades", title: "Reunião de\nPrioridades", desc: "Budget x escopo", daysKey: "priorities" as const },
  { id: "Mobilização de Obra", title: "Mobilização\nde Obra", desc: "Preparação para início", daysKey: "mobilization" as const },
  { id: "Conferência e Fiscalização de Obra", title: "Conferência\ne Fiscalização", desc: "Gerenciamento pleno", daysKey: "fiscalization" as const },
];

const DEFAULT_SCOPE =
  "Desenvolvemos o **projeto executivo** com todos os desenhos necessários à obra, considerando cada ideia discutida com o cliente. Em seguida, conduzimos o **gerenciamento completo** — administração de fornecedores, cronograma, pagamentos, vistorias e conferências. Acompanhamos também o **pós-obra**, garantindo que tudo funcione como entregue.";

export function ProposalScopeFlowPage({ scopeDescription, timelineBriefing, timelineStudy, timelineBudget, timelinePriorities, timelineConstruction, timelineMobilization, timelineFiscalization, ambientes, totalArea, etapasAtivas, pageWidth, pageHeight }: ProposalPageProps) {
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

  const activeEtapas = etapasAtivas || ALL_FLOW_STEPS.map(s => s.id);
  const steps = ALL_FLOW_STEPS.filter(s => activeEtapas.includes(s.id)).map((s, i) => {
    const daysMap: Record<string, number | undefined> = {
      briefing: timelineBriefing,
      study: timelineStudy,
      budget: timelineBudget,
      priorities: timelinePriorities,
      construction: timelineConstruction,
      mobilization: timelineMobilization,
      fiscalization: timelineFiscalization,
    };
    const daysVal = s.daysKey ? daysMap[s.daysKey] : undefined;
    return { ...s, num: i + 1, days: daysVal ? `${s.daysKey === "priorities" ? "~" : ""}${daysVal} dias` : "" };
  });
  const stepCount = steps.length;
  const compact = stepCount > 5;

  return (
    <PageContainer bg={COLORS.begeClaro} pageWidth={pageWidth} pageHeight={pageHeight}>
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
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${stepCount}, 1fr)`, gap: 0, alignItems: "start" }}>
          {steps.map((step, i) => (
            <div key={step.id} style={{ textAlign: "center", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", minHeight: compact ? 100 : 120 }}>
              {/* Connecting lines */}
              {i > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: compact ? 15 : 18,
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
                    top: compact ? 15 : 18,
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
                  width: compact ? 30 : 36,
                  height: compact ? 30 : 36,
                  borderRadius: "50%",
                  margin: "0 auto 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT_TITLE,
                  fontSize: compact ? 13 : 16,
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
                  fontSize: compact ? 8 : 9,
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
              <p style={{ fontSize: compact ? 8 : 9, color: "#777", lineHeight: 1.4, marginTop: 4, marginBottom: 4, minHeight: compact ? 22 : 28 }}>{step.desc}</p>
              {/* Days badge */}
              {step.days ? (
                <span
                  style={{
                    display: "inline-block",
                    minWidth: 52,
                    height: 22,
                    lineHeight: "22px",
                    textAlign: "center",
                    fontSize: compact ? 8 : 9,
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
