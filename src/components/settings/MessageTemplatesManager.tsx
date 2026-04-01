import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Trash2, Edit2, Save, X } from "lucide-react";

interface MessageTemplate {
  name: string;
  type: "whatsapp" | "email";
  body: string;
}

interface Props {
  templates: MessageTemplate[];
  onSave: (templates: MessageTemplate[]) => void;
  isPending?: boolean;
}

const VARIABLES = ["{{nome_cliente}}", "{{projeto}}", "{{valor}}", "{{data}}"];

export default function MessageTemplatesManager({ templates, onSave, isPending }: Props) {
  const [items, setItems] = useState<MessageTemplate[]>(templates);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<MessageTemplate>({ name: "", type: "whatsapp", body: "" });
  const [isAdding, setIsAdding] = useState(false);

  const saveDraft = () => {
    if (!draft.name.trim() || !draft.body.trim()) return;
    let updated: MessageTemplate[];
    if (editingIndex !== null) {
      updated = items.map((t, i) => (i === editingIndex ? draft : t));
      setEditingIndex(null);
    } else {
      updated = [...items, draft];
      setIsAdding(false);
    }
    setItems(updated);
    setDraft({ name: "", type: "whatsapp", body: "" });
    onSave(updated);
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    onSave(updated);
  };

  const startEdit = (index: number) => {
    setDraft({ ...items[index] });
    setEditingIndex(index);
    setIsAdding(false);
  };

  const cancel = () => {
    setEditingIndex(null);
    setIsAdding(false);
    setDraft({ name: "", type: "whatsapp", body: "" });
  };

  const showForm = isAdding || editingIndex !== null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Templates de Mensagem
        </CardTitle>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => { setIsAdding(true); setDraft({ name: "", type: "whatsapp", body: "" }); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Nome do template"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as "whatsapp" | "email" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Corpo da mensagem... Use variáveis como {{nome_cliente}}"
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={4}
            />
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Variáveis:</span>
              {VARIABLES.map((v) => (
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
              <Button size="sm" onClick={saveDraft} disabled={isPending || !draft.name.trim()}>
                <Save className="h-4 w-4 mr-1" /> Salvar
              </Button>
            </div>
          </div>
        )}

        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((t, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{t.name}</span>
                    <Badge variant="outline" className="text-xs">{t.type === "whatsapp" ? "WhatsApp" : "E-mail"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(i)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(i)}>
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
