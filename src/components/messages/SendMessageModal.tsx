import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Copy, ExternalLink } from "lucide-react";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { toast } from "@/hooks/use-toast";

interface SendMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string | string[];
  context: Record<string, string>;
  phone?: string;
}

function interpolate(body: string, context: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key) => context[key] || match);
}

function highlightVariables(text: string, context: Record<string, string>) {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{(\w+)\}\}$/);
    if (match) {
      const val = context[match[1]];
      return (
        <span key={i} className={`font-semibold ${val ? "text-primary" : "text-destructive"}`}>
          {val || part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function SendMessageModal({ open, onOpenChange, category, context, phone: initialPhone }: SendMessageModalProps) {
  const { filtered } = useMessageTemplates(category);
  const [selectedId, setSelectedId] = useState<string>("");
  const [phone, setPhone] = useState(initialPhone || "");

  const template = useMemo(() => filtered.find((t) => t.id === selectedId), [filtered, selectedId]);
  const interpolatedText = useMemo(() => (template ? interpolate(template.body, context) : ""), [template, context]);

  const handleOpenWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(interpolatedText)}`, "_blank");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(interpolatedText);
    toast({ title: "Texto copiado!" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Enviar Mensagem
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Template</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
              <SelectContent>
                {filtered.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.category && <span className="text-muted-foreground ml-1">({t.category})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {template && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {highlightVariables(template.body, context)}
            </div>
          )}

          <div>
            <Label>Telefone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(31) 99999-9999"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Variáveis disponíveis:</span>
            {Object.entries(context).map(([key, val]) => (
              <Badge key={key} variant="outline" className="text-[10px]">
                {`{{${key}}}`} = {val || "—"}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={handleCopy} disabled={!template}>
              <Copy className="h-4 w-4 mr-1" /> Copiar texto
            </Button>
            <Button onClick={handleOpenWhatsApp} disabled={!template || !phone.trim()} className="bg-green-600 hover:bg-green-700 text-white">
              <ExternalLink className="h-4 w-4 mr-1" /> Abrir no WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
