import { PageContainer, COLORS, FONT_TITLE, ValidityFooter, type ProposalPageProps } from "./shared";
import { blockContent, FLOW_STEP_TIMELINE } from "@/lib/proposalBlocks";
import { RichText } from "./RichText";

export function ProposalScopeFlowPage({ scopeDescription, timelineBriefing, timelineStudy, timelineAnteprojeto, timelineBudget, timelinePriorities, timelineConstruction, timelineMobilization, timelineFiscalization, ambientes, totalArea, etapasAtivas, pageWidth, pageHeight, validUntil, blockContent: raw }: ProposalPageProps) {
  const c = blockContent("scope", raw);
  const text = scopeDescription || c.defaultText;

  // Etapas vêm do bloco (editáveis em Blocos do PDF). A proposta decide
  // quais entram (etapas_ativas, por key) e os prazos das 7 originais.
  const daysMap: Record<string, number | undefined> = {
    briefing: timelineBriefing,
    study: timelineStudy,
    anteprojeto: timelineAnteprojeto,
    budget: timelineBudget,
    priorities: timelinePriorities,
    construction: timelineConstruction,
    mobilization: timelineMobilization,
    fiscalization: timelineFiscalization,
  };
  const steps = c.steps
    .filter((s) => !etapasAtivas || !s.key || etapasAtivas.includes(s.key))
    .map((s, i) => {
      const daysKey = s.key ? FLOW_STEP_TIMELINE[s.key] : undefined;
      const daysVal = daysKey ? daysMap[daysKey] : undefined;
      const days = daysVal ? `${daysKey === "priorities" ? "~" : ""}${daysVal} dias` : (s.meta ?? "").trim();
      return { id: s.key ?? `step-${i}`, title: s.title, desc: s.desc ?? "", num: i + 1, days };
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
            {c.tag}
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
            {c.title}
          </h2>
          <div
            className="scope-markdown"
            style={{
              fontSize: 13,
              color: COLORS.azulMarinho,
              lineHeight: 1.75,
              textAlign: "center",
              maxWidth: 440,
              margin: "0 auto",
            }}
          >
            <RichText text={text} styles={{ strong: { fontWeight: 600, color: COLORS.textoTituloVinho } }} />
          </div>

          {/* Ambientes */}
          {ambientes && ambientes.length > 0 && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.textoTituloVinho, marginBottom: 4 }}>
                {c.ambientesLabel}
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
          {c.processTag}
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
          {c.processTitle}
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
      <ValidityFooter validUntil={validUntil} />
    </PageContainer>
  );
}
