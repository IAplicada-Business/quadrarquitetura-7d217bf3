import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, LogoQuadraDark, CONTRACT_STYLES, type ContractPageProps } from "./shared";
import { ANEXO_PRORROGACAO } from "@/data/defaultContractClauses";

function daysText(days: number | null): string {
  if (!days) return "A definir";
  return `${days} dias`;
}

interface TimelineRow {
  fase: string;
  sigla: string;
  descricao: string;
  prazo: string;
}

function buildTimeline(p: ContractPageProps): TimelineRow[] {
  return [
    { fase: "Levantamento", sigla: "LV", descricao: "Realização do levantamento dos espaços a serem reformados e elaboração de plantas e cortes para base do projeto.", prazo: `Em até ${daysText(p.timelineLevantamento)} após a Data de Assinatura.` },
    { fase: "Briefing", sigla: "BR", descricao: "Reunião entre as Partes para definição e preliminar elaboração do programa de necessidades a ser desenvolvido no Projeto.", prazo: `Em até ${daysText(p.timelineBriefing)} após LV.` },
    { fase: "Anteprojeto", sigla: "AP", descricao: "Apresentação das informações técnicas preliminares e estimativas do Projeto quanto aos elementos, instalações, componentes, prazos e custos.", prazo: `Conclusão em até ${daysText(p.timelineAnteprojeto)} após BR.\nApós apresentação, prazo de até ${daysText(p.timelineAnteprojetoAprovacao)} para aprovação pela Contratante.` },
    { fase: "Projeto Executivo", sigla: "PE", descricao: "Apresentação final, detalhada, completa e definitiva das informações técnicas do projeto e de seus elementos, instalações e componentes.", prazo: `Em até ${daysText(p.timelineProjetoExecutivo)} após aprovação do AP.` },
    { fase: "Reunião de Prioridades", sigla: "RP", descricao: "Reunião entre as Partes para definição das prioridades orçamentárias de execução da obra e apresentação do respectivo Projeto de Prioridade.", prazo: `Em até ${daysText(p.timelineReuniaoPrioridades)} após entrega do PE.` },
    { fase: "Gestão de Pagamentos", sigla: "GP", descricao: "Envio de lista de compras de insumos para execução da obra com base no PP.", prazo: `Em até ${daysText(p.timelineGestaoPagamentos)} após a RP.` },
    { fase: "Supervisão de Obra", sigla: "SO", descricao: "Acompanhamento e supervisão semanal do serviço a ser realizado na obra.", prazo: "Semanal, após o início da obra, até sua conclusão." },
  ];
}

export function AnexoCronogramaPage(props: ContractPageProps) {
  const rows = buildTimeline(props);

  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div style={{ padding: CONTRACT_STYLES.padding, paddingBottom: 60 }}>
        <h2 style={{ fontFamily: FONT_TITLE, fontWeight: 600, fontSize: 14, color: COLORS.azulMarinho, textAlign: "center", letterSpacing: 3, marginBottom: 6 }}>
          ANEXO I
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 9, color: COLORS.azulMarinho, textAlign: "center", letterSpacing: 1, marginBottom: 20, opacity: 0.7 }}>
          CRONOGRAMA DO PROJETO — {props.projectName || "________"}
        </p>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 7.5 }}>
          <thead>
            <tr>
              {["Fase", "Descrição", "Prazos"].map((h) => (
                <th key={h} style={{
                  background: COLORS.azulMarinho, color: "#fff", padding: "6px 8px",
                  textAlign: "left", fontWeight: 600, fontSize: 7.5, letterSpacing: 0.5,
                  borderBottom: `2px solid ${COLORS.linhaDestaque}`,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.sigla} style={{ background: i % 2 === 0 ? "rgba(212,184,160,0.15)" : "transparent" }}>
                <td style={{ padding: "5px 8px", fontWeight: 600, color: COLORS.azulMarinho, borderBottom: `1px solid ${COLORS.shapeBege}`, whiteSpace: "nowrap", verticalAlign: "top", width: 90 }}>
                  {row.fase} ("{row.sigla}")
                </td>
                <td style={{ padding: "5px 8px", color: COLORS.textoEscuro, borderBottom: `1px solid ${COLORS.shapeBege}`, lineHeight: 1.4, verticalAlign: "top" }}>
                  {row.descricao}
                </td>
                <td style={{ padding: "5px 8px", color: COLORS.textoEscuro, borderBottom: `1px solid ${COLORS.shapeBege}`, lineHeight: 1.4, whiteSpace: "pre-wrap", verticalAlign: "top", width: 160 }}>
                  {row.prazo}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Prorrogacao */}
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontFamily: FONT_TITLE, fontWeight: 600, fontSize: 9, color: COLORS.azulMarinho, marginBottom: 6 }}>
            Da Prorrogação dos Prazos
          </h4>
          <div style={{
            fontFamily: FONT_BODY, fontSize: 7, color: COLORS.textoEscuro,
            lineHeight: 1.5, whiteSpace: "pre-wrap", textAlign: "justify",
          }}>
            {ANEXO_PRORROGACAO}
          </div>
        </div>
      </div>
      <LogoQuadraDark />
    </PageContainer>
  );
}
