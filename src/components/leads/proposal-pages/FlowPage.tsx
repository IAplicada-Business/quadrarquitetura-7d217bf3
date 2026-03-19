import { PageContainer, COLORS, LogoSmall, type ProposalPageProps } from "./shared";

const STEPS = [
  { title: "LEVANTAMENTO E\nREUNIÃO DE BRIEFING", sub: "Reunião para alinharmos o conceito desejado e necessidades", field: "timelineBriefing" as const },
  { title: "ESTUDO\nPRELIMINAR", sub: "Aprovação do Layout / Retorno do cliente: 7 dias / Retorno da Quadra: 7 dias", field: "timelineStudy" as const },
  { title: "ORÇAMENTO\nEXECUTIVO", sub: "Valor completo do que foi definido", field: null },
  { title: "REUNIÃO\nPRIORIDADES", sub: "Alinhamento do valor da obra com o budget do cliente", field: "timelinePriorities" as const },
  { title: "INÍCIO\nDA OBRA", sub: "", field: "timelineConstruction" as const },
];

export function ProposalFlowPage(props: ProposalPageProps) {
  const { timelineBriefing = 4, timelineStudy = 15, timelinePriorities = 7, timelineConstruction = 25, logoUrl } = props;
  const values: Record<string, number> = { timelineBriefing, timelineStudy, timelinePriorities, timelineConstruction };

  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div style={{ padding: "60px 60px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2 style={{ color: COLORS.textoEscuro, fontSize: 36, fontWeight: 700, textAlign: "center", textTransform: "uppercase", marginBottom: 60 }}>
          Como funciona nosso serviço?
        </h2>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 8 }}>
          {STEPS.map((step, i) => {
            const dayValue = step.field ? values[step.field] : null;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 220, textAlign: "center" }}>
                  {dayValue != null && (
                    <div style={{ color: COLORS.textoTituloVinho, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                      {step.field === "timelineConstruction" ? `em torno de ${dayValue} dias trabalhados` : `${dayValue} DIAS`}
                    </div>
                  )}
                  <div style={{
                    background: COLORS.azulMarinho,
                    color: COLORS.textoClaro,
                    padding: "20px 16px",
                    borderRadius: 8,
                    minHeight: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", whiteSpace: "pre-line", textAlign: "center", lineHeight: 1.3 }}>
                      {step.title}
                    </span>
                  </div>
                  {step.sub && (
                    <p style={{ color: COLORS.textoEscuro, fontSize: 11, marginTop: 10, lineHeight: 1.4, padding: "0 8px" }}>{step.sub}</p>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 30, height: 2, background: `linear-gradient(90deg, ${COLORS.roseMauve}, ${COLORS.azulMarinho})`, margin: "0 -4px", marginTop: dayValue != null ? 22 : 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <LogoSmall url={logoUrl} />
    </PageContainer>
  );
}
