import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface TemplateField {
  key: string;
  label: string;
  multiline?: boolean;
}

interface TemplateManagerProps {
  title: string;
  templates: Array<Record<string, any> & { id: string; name: string; is_active: boolean | null }>;
  fields: TemplateField[];
  onCreate: (data: Record<string, unknown>) => void;
  onUpdate: (data: { id: string } & Record<string, unknown>) => void;
  onRemove: (id: string) => void;
  isPending?: boolean;
}

export function TemplateManager({ title, templates, fields, onCreate, onUpdate, onRemove, isPending }: TemplateManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const openNew = () => {
    setEditing(null);
    const empty: Record<string, string> = { name: "" };
    fields.forEach((f) => { empty[f.key] = ""; });
    setFormData(empty);
    setFormOpen(true);
  };

  const openEdit = (t: Record<string, unknown>) => {
    setEditing(t);
    const data: Record<string, string> = { name: (t.name as string) || "" };
    fields.forEach((f) => { data[f.key] = (t[f.key] as string) || ""; });
    setFormData(data);
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) return;
    const payload: Record<string, unknown> = {};
    Object.entries(formData).forEach(([k, v]) => { payload[k] = v || undefined; });
    if (editing) {
      onUpdate({ id: editing.id as string, ...payload });
    } else {
      onCreate(payload);
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <Button size="sm" onClick={openNew}><Plus className="h-3 w-3 mr-1" /> Novo</Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum template criado ainda.</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{t.name}</span>
                  {t.is_active ? (
                    <Badge variant="secondary" className="ml-2 text-[10px]">Ativo</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 text-[10px]">Inativo</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t as Record<string, unknown>)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onRemove(t.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Template" : "Novo Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.multiline ? (
                  <Textarea value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} rows={4} />
                ) : (
                  <Input value={formData[f.key] || ""} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || isPending}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
