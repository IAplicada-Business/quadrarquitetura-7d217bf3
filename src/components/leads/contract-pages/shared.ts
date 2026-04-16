// Re-export shared constants from proposal pages
export { COLORS, PAGE_W, PAGE_H, FONT_TITLE, FONT_BODY, PageContainer, LogoQuadra, formatBRL } from "@/components/leads/proposal-pages/shared";

// Dark version of LogoQuadra for light backgrounds (begeClaro, white)
export { LogoQuadraDark } from "./LogoQuadraDark";

// Contract-specific types
export interface ContractPageProps {
  contractNumber: string;
  // Contratante
  clientPersonType: "pessoa_fisica" | "pessoa_juridica";
  clientName: string;
  clientCpfCnpj: string;
  clientNationality: string;
  clientMaritalStatus: string;
  clientRg: string;
  clientRazaoSocial: string;
  clientTipoSocietario: string;
  clientRepresentanteLegal: string;
  clientLogradouro: string;
  clientNumero: string;
  clientComplemento: string;
  clientBairro: string;
  clientCidade: string;
  clientEstado: string;
  clientCep: string;
  clientEmail: string;
  clientPhone: string;
  // Signatarios
  signatarioContratanteName: string;
  signatarioContratanteEmail: string;
  signatarioContratadaName: string;
  signatarioContratadaEmail: string;
  // Servicos
  serviceDescription: string;
  environments: string;
  totalArea: number | null;
  projectName: string;
  // Valor
  value: number | null;
  // Pagamento
  installmentsSchedule: { description: string; value: number | null; dueDate: string }[];
  // Cronograma
  timelineLevantamento: number | null;
  timelineBriefing: number | null;
  timelineAnteprojeto: number | null;
  timelineAnteprojetoAprovacao: number | null;
  timelineProjetoExecutivo: number | null;
  timelineReuniaoPrioridades: number | null;
  timelineGestaoPagamentos: number | null;
  // Outros
  signatureDate: string;
  foro: string;
  estimatedDuration: string;
  // Clausulas customizadas (override)
  customClauses: string;
}

export function formatContractDate(dateStr: string): string {
  if (!dateStr) return "_____ de _____________ de _______";
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const month = months[parseInt(parts[1], 10) - 1] || "___";
  const year = parts[0];
  return `${day} de ${month} de ${year}`;
}

export function numberToWords(value: number): string {
  if (value === 0) return "zero reais";
  const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function groupToWords(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "cem";
    const parts: string[] = [];
    if (n >= 100) { parts.push(hundreds[Math.floor(n / 100)]); n %= 100; }
    if (n >= 20) { parts.push(tens[Math.floor(n / 10)]); n %= 10; }
    if (n >= 10) { parts.push(teens[n - 10]); n = 0; }
    if (n > 0) parts.push(units[n]);
    return parts.join(" e ");
  }

  const intPart = Math.floor(value);
  const centPart = Math.round((value - intPart) * 100);
  const groups: string[] = [];

  if (intPart >= 1000000) {
    const millions = Math.floor(intPart / 1000000);
    groups.push(groupToWords(millions) + (millions === 1 ? " milhão" : " milhões"));
  }
  const remainder = intPart % 1000000;
  if (remainder >= 1000) {
    const thousands = Math.floor(remainder / 1000);
    groups.push(groupToWords(thousands) + " mil");
  }
  const last = remainder % 1000;
  if (last > 0) groups.push(groupToWords(last));

  let result = groups.join(", ");
  if (intPart === 1) result += " real";
  else if (intPart > 0) result += " reais";

  if (centPart > 0) {
    if (intPart > 0) result += " e ";
    result += groupToWords(centPart);
    result += centPart === 1 ? " centavo" : " centavos";
  }

  return result;
}

export const CONTRACT_STYLES = {
  bodyFontSize: 9,
  clauseTitleSize: 11,
  sectionTitleSize: 13,
  padding: 48,
  lineHeight: 1.65,
} as const;
