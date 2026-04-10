import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { useMessageTemplates, type MessageTemplate } from "@/hooks/useMessageTemplates";

const CATEGORIES = [
  { value: "lead", label: "Lead" },
  { value: "proposta", label: "Proposta" },
  { value: "contrato", label: "Contrato" },
  { value: "obra", label: "Obra" },
  { value: "financeiro", label: "Financeiro" },
  { value: "geral", label: "Geral" },
];

const VARIABLES_BY_CATEGORY: Record<string, string[]> = {
  lead: ["{{nome_cliente}}", "{{telefone}}", "{{tipo_projeto}}"],
  proposta: ["{{nome_cliente}}", "{{projeto}}", "{{valor}}", "{{validade}}"],
  contrato: ["{{nome_cliente}}", "{{projeto}}", "{{valor}}"],
  obra: ["{{nome_cliente}}", "{{projeto}}", "{{resumo}}", "{{progresso}}", "{{proxima_etapa}}"],
  financeiro: ["{{nome_cliente}}", "{{projeto}}", "{{parcela}}", "{{valor}}", "{{data_vencimento}}"],
  geral: ["{{nome_cliente}}", "{{projeto}}"],
};

type Draft = { name: string; type: "whatsapp" | "email"; category: string; body: string };

export default function MessageTemplatesSettings() {
  const { templates, isLoading, create, update, remove } = useMessageTemplates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>({ name: "", type: "whatsapp", category: "geral", body: "" });

  const saveDraft = () => {
    if (!draft.name.trim() || !draft.body.trim()) return;
    if (editingId) {
      update.mutate({ id: editingId, name: draft.name, type: draft.type, category: draft.category, body: draft.body });
      setEditingId(null);
    } else {
      create.mutate({ name: draft.name, type: draft.type, category: draft.category, body: draft.body, variables: [] });
      setIsAdding(false);
    }
    setDraft({ name: "", type: "whatsapp", category: "geral", body: "" });
  };

  const startEdit = (t: MessageTemplate) => {
    setDraft({ name: t.name, type: t.type, category: t.category || "geral", body: t.body });
    setEditingId(t.id);
    setIsAdding(false);
  };

  const cancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setDraft({ name: "", type: "whatsapp", category: "geral", body: "" });
  };

  const showForm = isAdding || editingId !== null;
  const availableVars = VARIABLES_BY_CATEGORY[draft.category] || VARIABLES_BY_CATEGORY.geral;

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mensagens Padrão
        </CardTitle>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => { setIsAdding(true); setDraft({ name: "", type: "whatsapp", category: "geral", body: "" }); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input placeholder="Nome do template" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as "whatsapp" | "email" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
              <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Corpo da mensagem… Use variáveis como {{nome_cliente}}"
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={4}
            />
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Variáveis:</span>
              {availableVars.map((v) => (
                <Badge
                  key={v}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-primary/10"
                  onClick={() => setDraft({ ...draft, body: draft.body + " " + v })}
                >
                  {v}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={cancel}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
              <Button size="sm" onClick={saveDraft} disabled={!draft.name.trim() || !draft.body.trim()}>
                <Save className="h-4 w-4 mr-1" /> Salvar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
        ) : templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{t.name}</span>
                    <Badge variant="outline" className="text-xs">{t.type === "whatsapp" ? "WhatsApp" : "E-mail"}</Badge>
                    {t.category && <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(t)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !showForm && <p className="text-sm text-muted-foreground text-center py-4">Nenhum template cadastrado</p>
        )}
      </CardContent>
    </Card>
  );
}
