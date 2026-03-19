import { PageContainer, COLORS, LogoSmall, type ProposalPageProps } from "./shared";

const STEPS = [
  { title: "LEVANTAMENTO E REUNIÃO DE BRIEFING", sub: "Reunião para alinharmos o conceito desejado e necessidades", field: "timelineBriefing" as const },
  { title: "ESTUDO PRELIMINAR", sub: "Aprovação do Layout / Retorno do cliente: 7 dias / Retorno da Quadra: 7 dias", field: "timelineStudy" as const },
  { title: "ORÇAMENTO EXECUTIVO", sub: "Valor completo do que foi definido", field: null },
  { title: "REUNIÃO DE PRIORIDADES", sub: "Alinhamento do valor da obra com o budget do cliente", field: "timelinePriorities" as const },
  { title: "INÍCIO DA OBRA", sub: "", field: "timelineConstruction" as const },
];

function StepBlock({ title, color }: { title: string; color: string }) {
  return (
    <div style={{
      width: 500,
      height: 64,
      background: color,
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px",
    }}>
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        color: COLORS.textoClaro,
        textTransform: "uppercase",
        textAlign: "center",
        letterSpacing: 0.5,
        lineHeight: 1.3,
      }}>
        {title}
      </span>
    </div>
  );
}

function DaysConnector({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <div style={{ width: 2, height: 12, background: COLORS.linhaDestaque }} />
      <div style={{
        padding: "3px 14px",
        borderRadius: 12,
        border: `2px solid ${COLORS.linhaDestaque}`,
        background: COLORS.begeClaro,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: COLORS.textoTituloVinho,
          textTransform: "uppercase",
          whiteSpace: "pre-line",
          textAlign: "center",
          lineHeight: 1.3,
        }}>
          {label}
        </span>
      </div>
      <div style={{ width: 2, height: 12, background: COLORS.linhaDestaque }} />
    </div>
  );
}

export function ProposalFlowPage(props: ProposalPageProps) {
  const { timelineBriefing = 4, timelineStudy = 15, timelinePriorities = 7, timelineConstruction = 25, logoUrl } = props;

  const stepColors = [COLORS.roseMauve, COLORS.azulMarinho, COLORS.roseMauve, COLORS.azulMarinho, COLORS.roseMauve];

  const daysLabels = [
    `${timelineBriefing} DIAS`,
    `${timelineStudy} DIAS`,
    `${timelinePriorities} DIAS`,
    `em torno de ${timelineConstruction} dias`,
  ];

  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div style={{ padding: "60px 40px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h2 style={{ color: COLORS.textoEscuro, fontSize: 28, fontWeight: 700, textAlign: "center", textTransform: "uppercase", marginBottom: 40 }}>
          Como funciona nosso serviço?
        </h2>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <StepBlock title={step.title} color={stepColors[i]} />
              {step.sub && (
                <p style={{ fontSize: 10, color: COLORS.textoEscuro, lineHeight: 1.4, textAlign: "center", maxWidth: 420, marginTop: 6, marginBottom: 0 }}>
                  {step.sub}
                </p>
              )}
              {i < STEPS.length - 1 && (
                <div style={{ marginTop: 4, marginBottom: 4 }}>
                  <DaysConnector label={daysLabels[i]} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <LogoSmall url={logoUrl} />
    </PageContainer>
  );
}
