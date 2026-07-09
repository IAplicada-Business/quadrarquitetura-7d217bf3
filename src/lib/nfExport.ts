// Exportação de NFs em .xlsx de verdade (SheetJS), substituindo o CSV.
//
// Mariana relatou repetidamente ("seguimos com problemas a respeito das
// planilhas pra nota fiscal") que o CSV não abria direito no Excel dela
// mesmo depois do ajuste de `;` + BOM. O .xlsx elimina a classe inteira
// de problema: sem adivinhação de separador/encoding, valores entram
// como número (somáveis direto na planilha) e cada tipo vai numa aba.
import * as XLSX from "xlsx";

export interface NFExportRow {
  nf_number: string | null;
  nf_type: string;
  project_name?: string | null;
  issuer_name: string | null;
  recipient_name: string | null;
  amount: number | null;
  issue_date: string | null;
  competence_month: string | null;
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  enviada_contador: "Enviada ao Contador",
  arquivada: "Arquivada",
};

function formatDateBr(d: string | null): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function buildSheet(rows: NFExportRow[], includeProject: boolean): XLSX.WorkSheet {
  const header = [
    "Nº NF",
    ...(includeProject ? ["Projeto"] : []),
    "Emitente",
    "Tomador",
    "Valor (R$)",
    "Data Emissão",
    "Competência",
    "Status",
  ];

  const data = rows.map(r => [
    r.nf_number || "",
    ...(includeProject ? [r.project_name || ""] : []),
    r.issuer_name || "",
    r.recipient_name || "",
    r.amount ?? 0,
    formatDateBr(r.issue_date),
    r.competence_month || "",
    STATUS_LABEL[r.status] ?? r.status,
  ]);

  const total = rows.reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalRow = [
    ...Array(includeProject ? 3 : 2).fill(""),
    "TOTAL",
    total,
    "", "", "",
  ];

  const ws = XLSX.utils.aoa_to_sheet([header, ...data, totalRow]);

  // Coluna Valor com formato numérico brasileiro
  const valorCol = includeProject ? 4 : 3;
  for (let i = 1; i <= data.length + 1; i++) {
    const addr = XLSX.utils.encode_cell({ r: i, c: valorCol });
    if (ws[addr] && typeof ws[addr].v === "number") ws[addr].z = "#,##0.00";
  }

  ws["!cols"] = [
    { wch: 14 },
    ...(includeProject ? [{ wch: 22 }] : []),
    { wch: 26 },
    { wch: 26 },
    { wch: 14 },
    { wch: 13 },
    { wch: 13 },
    { wch: 20 },
  ];

  return ws;
}

/**
 * Gera e baixa um .xlsx com abas separadas para NFs emitidas e recebidas.
 * Passa `includeProject: true` quando a listagem é geral (não por projeto).
 */
export function exportNFsToXlsx(
  filename: string,
  emitidas: NFExportRow[],
  recebidas: NFExportRow[],
  opts: { includeProject?: boolean } = {}
) {
  const includeProject = opts.includeProject ?? false;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSheet(emitidas, includeProject), "NFs Emitidas");
  XLSX.utils.book_append_sheet(wb, buildSheet(recebidas, includeProject), "NFs Recebidas");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
