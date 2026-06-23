// Helpers para gerar CSV que abre certo no Excel BR.
//
// Mariana relatou (vídeo c99a6146): "na hora que eu exporto essa
// planilhinha aqui, não tá dando pra contar porque da quantidade
// pra aproveitar nada". O CSV anterior era:
//   - separador `,` (Excel BR espera `;`)
//   - sem BOM UTF-8 (acentos viravam lixo)
//   - quotes sem escape duplo (campos com `"` quebravam linha)
//   - `nf_type` cru em vez de label legível

/** Escapa uma célula respeitando RFC 4180 (com double-quote escape). */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[";\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Monta uma linha CSV com `;` como separador (Excel BR). */
export function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(";") + "\n";
}

/**
 * Dispara download do CSV no browser. Adiciona BOM UTF-8 (`﻿`)
 * para o Excel reconhecer acentos.
 */
export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Formata valor numérico BRL para CSV (vírgula decimal). */
export function csvBrl(value: number | null | undefined): string {
  if (value == null) return "0,00";
  return value.toFixed(2).replace(".", ",");
}
