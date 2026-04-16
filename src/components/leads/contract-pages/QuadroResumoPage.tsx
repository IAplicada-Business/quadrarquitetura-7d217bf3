import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, LogoQuadraDark, formatBRL, type ContractPageProps, numberToWords, formatContractDate, CONTRACT_STYLES } from "./shared";
import { CONTRATADA_FULL_TEXT, DEFAULT_FORO } from "@/data/defaultContractClauses";

function Row({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div style={{ display: "flex", borderBottom: isLast ? "none" : `1px solid ${COLORS.shapeBege}`, minHeight: 28 }}>
      <div style={{
        width: 130, flexShrink: 0, padding: "6px 10px",
        fontFamily: FONT_BODY, fontWeight: 600, fontSize: 7.5,
        color: COLORS.azulMarinho, textTransform: "uppercase", letterSpacing: 0.5,
        background: "rgba(212,184,160,0.25)", borderRight: `1px solid ${COLORS.shapeBege}`,
      }}>
        {label}
      </div>
      <div style={{
        flex: 1, padding: "6px 10px",
        fontFamily: FONT_BODY, fontWeight: 400, fontSize: 7.5,
        color: COLORS.textoEscuro, lineHeight: 1.5,
        whiteSpace: "pre-wrap",
      }}>
        {value}
      </div>
    </div>
  );
}

function buildContratanteText(p: ContractPageProps): string {
  const addr = [p.clientLogradouro, p.clientNumero && `n.º ${p.clientNumero}`, p.clientComplemento, p.clientBairro && `bairro ${p.clientBairro}`, p.clientCidade && `na cidade de ${p.clientCidade}`, p.clientEstado && `Estado de ${p.clientEstado}`, p.clientCep && `CEP ${p.clientCep}`].filter(Boolean).join(", ");

  if (p.clientPersonType === "pessoa_juridica") {
    return `${p.clientRazaoSocial || p.clientName || "________"}, ${p.clientTipoSocietario || "________"}, inscrito(a) no CNPJ sob o n.º ${p.clientCpfCnpj || "________"}, com sede em ${addr || "________"}, representado na forma dos seus atos constitutivos.`;
  }
  return `${p.clientName || "________"}, ${p.clientNationality || "________"}, ${p.clientMaritalStatus || "________"}, inscrito(a) no CPF sob o n.º ${p.clientCpfCnpj || "________"}, com endereço residencial na ${addr || "________"}.`;
}

function buildPaymentText(p: ContractPageProps): string {
  if (!p.installmentsSchedule || p.installmentsSchedule.length === 0) return "A definir";
  return p.installmentsSchedule.map((inst, i) => {
    const val = inst.value != null ? formatBRL(inst.value) : "________";
    const date = inst.dueDate ? formatContractDate(inst.dueDate) : "________";
    const desc = inst.description || (i === 0 ? "Na Data de Assinatura" : `Parcela ${i + 1}`);
    return `${desc}: ${val}${inst.dueDate ? ` (em ${date})` : ""}`;
  }).join("\n");
}

export function QuadroResumoPage(props: ContractPageProps) {
  const valorText = props.value != null ? `${formatBRL(props.value)} (${numberToWords(props.value)})` : "________";

  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div style={{ padding: CONTRACT_STYLES.padding }}>
        <h2 style={{ fontFamily: FONT_TITLE, fontWeight: 600, fontSize: 16, color: COLORS.azulMarinho, textAlign: "center", letterSpacing: 4, marginBottom: 24 }}>
          QUADRO RESUMO
        </h2>

        <div style={{ border: `1px solid ${COLORS.shapeBege}`, borderRadius: 4, overflow: "hidden" }}>
          <Row label="Contratante" value={buildContratanteText(props)} />
          <Row label="Contratada" value={CONTRATADA_FULL_TEXT} />
          <Row label="Signatários" value={`Contratante: ${props.signatarioContratanteName || "________"}\nE-mail: ${props.signatarioContratanteEmail || "________"}\n\nContratada: ${props.signatarioContratadaName || "________"}\nE-mail: ${props.signatarioContratadaEmail || "________"}`} />
          <Row label="Serviços" value={`A Contratada prestará os serviços de Elaboração de Projeto Arquitetônico para Reforma e Execução de Obra, sendo responsável pelas atividades especificadas no Anexo I. ("Projeto")\n\n${props.serviceDescription || ""}`} />
          <Row label="Vigência" value={`O Contrato terá vigência de acordo com o prazo de início e fim dos Serviços previsto no Anexo I deste Contrato.${props.estimatedDuration ? `\nPrazo estimado: ${props.estimatedDuration}` : ""}`} />
          <Row label="Valor" value={`Pela prestação dos Serviços, a Contratante pagará à Contratada o valor total de ${valorText}.`} />
          <Row label="Forma de Pagamento" value={`A Contratante realizará o pagamento parcelado, conforme abaixo:\n\n${buildPaymentText(props)}`} />
          <Row label="Foro de Eleição" value={`Para a resolução de todas as controvérsias resultantes deste Contrato será competente o foro de ${props.foro || DEFAULT_FORO}, renunciando as Partes a qualquer outro, por mais privilegiado que seja.`} />
          <Row label="Definições" value="Os termos referidos em letras maiúsculas neste Contrato têm os significados atribuídos no Quadro Resumo ou ao longo do Contrato entre parênteses e aspas, com o mesmo significado no singular ou no plural, e em qualquer gênero." />
          <Row label="Anexos" value="Anexo I: Cronograma do Projeto" isLast />
        </div>
      </div>
      <LogoQuadraDark />
    </PageContainer>
  );
}
