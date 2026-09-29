import { useRef } from "react";
import { Bold, Italic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  "aria-label"?: string;
}

/**
 * Editor rich text simples: textarea + Negrito / Itálico.
 * Guarda **negrito** e *itálico* no texto (mesma sintaxe que a página de
 * escopo já usava) e Enter vira quebra de linha no PDF.
 */
export function RichTextField({ id, value, onChange, rows = 4, placeholder, "aria-label": ariaLabel }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (marker: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + marker + selected + marker + value.slice(end);
    onChange(next);
    // Recoloca o cursor dentro (ou ao redor) da seleção marcada.
    requestAnimationFrame(() => {
      el.focus();
      const cursorStart = start + marker.length;
      const cursorEnd = cursorStart + selected.length;
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Button type="button" size="sm" variant="outline" className="h-7 w-7 p-0" title="Negrito (**texto**)" aria-label="Negrito" onClick={() => wrap("**")}>
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-7 w-7 p-0" title="Itálico (*texto*)" aria-label="Itálico" onClick={() => wrap("*")}>
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[11px] text-muted-foreground ml-1">**negrito** · *itálico* · Enter quebra linha</span>
      </div>
      <Textarea
        id={id}
        ref={ref}
        value={value}
        rows={rows}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm"
      />
    </div>
  );
}
