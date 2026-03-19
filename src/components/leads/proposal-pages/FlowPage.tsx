import { PageContainer, COLORS, LogoSmall, type ProposalPageProps } from "./shared";

const STEPS = [
  { title: "LEVANTAMENTO E\nREUNIÃO DE BRIEFING", sub: "Reunião para alinharmos o conceito desejado e necessidades", field: "timelineBriefing" as const },
  { title: "ESTUDO\nPRELIMINAR", sub: "Aprovação do Layout / Retorno do cliente: 7 dias / Retorno da Quadra: 7 dias", field: "timelineStudy" as const },
  { title: "ORÇAMENTO\nEXECUTIVO", sub: "Valor completo do que foi definido", field: null },
  { title: "REUNIÃO\nPRIORIDADES", sub: "Alinhamento do valor da obra com o budget do cliente", field: "timelinePriorities" as const },
  { title: "INÍCIO\nDA OBRA", sub: "", field: "timelineConstruction" as const },
];

function ArrowShape({ title, color, width = 180 }: { title: string; color: string; width?: number }) {
  const h = 56;
  const arrowW = 16;
  return (
    <div style={{ position: "relative", width, height: h, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${width} ${h}`} width={width} height={h} style={{ display: "block" }}>
        <polygon
          points={`0,0 ${width - arrowW},0 ${width},${h / 2} ${width - arrowW},${h} 0,${h} ${arrowW},${h / 2}`}
          fill={color}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        paddingLeft: arrowW + 4, paddingRight: arrowW + 4,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textoClaro, textTransform: "uppercase", whiteSpace: "pre-line", textAlign: "center", lineHeight: 1.3 }}>
          {title}
        </span>
      </div>
    </div>
  );
}

function DaysBadge({ value, label }: { value: number; label?: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: 40, flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textoTituloVinho, textTransform: "uppercase" }}>
        {label || `${value} DIAS`}
      </span>
    </div>
  );
}

export function ProposalFlowPage(props: ProposalPageProps) {
  const { timelineBriefing = 4, timelineStudy = 15, timelinePriorities = 7, timelineConstruction = 25, logoUrl } = props;

  const row1Colors = [COLORS.roseMauve, COLORS.roseMauve, COLORS.azulMarinho];
  const row2Colors = [COLORS.roseMauve, COLORS.azulMarinho];

  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div style={{ padding: "60px 40px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2 style={{ color: COLORS.textoEscuro, fontSize: 28, fontWeight: 700, textAlign: "center", textTransform: "uppercase", marginBottom: 48 }}>
          Como funciona nosso serviço?
        </h2>

        {/* Row 1: steps 0, 1, 2 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 10 }}>
          <ArrowShape title={STEPS[0].title} color={row1Colors[0]} width={200} />
          <DaysBadge value={timelineBriefing} />
          <ArrowShape title={STEPS[1].title} color={row1Colors[1]} width={200} />
          <DaysBadge value={timelineStudy} />
          <ArrowShape title={STEPS[2].title} color={row1Colors[2]} width={200} />
        </div>
        {/* Sub-texts row 1 */}
        <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 36 }}>
          <div style={{ width: 200, textAlign: "center", padding: "0 6px" }}>
            <p style={{ fontSize: 9, color: COLORS.textoEscuro, lineHeight: 1.4 }}>{STEPS[0].sub}</p>
          </div>
          <div style={{ minWidth: 40 }} />
          <div style={{ width: 200, textAlign: "center", padding: "0 6px" }}>
            <p style={{ fontSize: 9, color: COLORS.textoEscuro, lineHeight: 1.4 }}>{STEPS[1].sub}</p>
          </div>
          <div style={{ minWidth: 40 }} />
          <div style={{ width: 200, textAlign: "center", padding: "0 6px" }}>
            <p style={{ fontSize: 9, color: COLORS.textoEscuro, lineHeight: 1.4 }}>{STEPS[2].sub}</p>
          </div>
        </div>

        {/* Row 2: steps 3, 4 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 10 }}>
          <ArrowShape title={STEPS[3].title} color={row2Colors[0]} width={220} />
          <DaysBadge value={timelinePriorities} />
          <ArrowShape title={STEPS[4].title} color={row2Colors[1]} width={220} />
          <DaysBadge value={timelineConstruction} label={`em torno de\n${timelineConstruction} dias`} />
        </div>
        {/* Sub-texts row 2 */}
        <div style={{ display: "flex", justifyContent: "center", gap: 0 }}>
          <div style={{ width: 220, textAlign: "center", padding: "0 6px" }}>
            <p style={{ fontSize: 9, color: COLORS.textoEscuro, lineHeight: 1.4 }}>{STEPS[3].sub}</p>
          </div>
          <div style={{ minWidth: 40 }} />
          <div style={{ width: 220, textAlign: "center", padding: "0 6px" }}>
            <p style={{ fontSize: 9, color: COLORS.textoEscuro, lineHeight: 1.4 }}>{STEPS[4].sub}</p>
          </div>
          <div style={{ minWidth: 40 }} />
        </div>
      </div>
      <LogoSmall url={logoUrl} />
    </PageContainer>
  );
}
