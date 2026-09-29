import React from "react";

/**
 * Renderização segura do "rich text simples" usado nos blocos da
 * proposta: **negrito**, *itálico* e quebras de linha. Nada vira HTML
 * bruto, então texto digitado pelo time não injeta markup na página.
 */
export interface RichTextStyles {
  strong?: React.CSSProperties;
  em?: React.CSSProperties;
}

const TOKEN = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g;

function renderLine(line: string, styles: RichTextStyles | undefined, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of line.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(line.slice(last, idx));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(
        <strong key={`${keyPrefix}-s${i++}`} style={{ fontWeight: 600, ...styles?.strong }}>
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(
        <em key={`${keyPrefix}-e${i++}`} style={{ fontStyle: "italic", ...styles?.em }}>
          {tok.slice(1, -1)}
        </em>,
      );
    }
    last = idx + tok.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export function renderRichText(text: string, styles?: RichTextStyles): React.ReactNode[] {
  const lines = (text ?? "").split(/\r?\n/);
  const out: React.ReactNode[] = [];
  lines.forEach((line, li) => {
    if (li > 0) out.push(<br key={`br${li}`} />);
    out.push(...renderLine(line, styles, `l${li}`));
  });
  return out;
}

/** Converte o rich text simples em texto puro (pra alt, títulos etc.). */
export function stripRichText(text: string): string {
  return (text ?? "").replace(/\*\*([^*\n]+?)\*\*/g, "$1").replace(/\*([^*\n]+?)\*/g, "$1");
}

export function RichText({ text, styles }: { text: string; styles?: RichTextStyles }) {
  return <>{renderRichText(text, styles)}</>;
}
