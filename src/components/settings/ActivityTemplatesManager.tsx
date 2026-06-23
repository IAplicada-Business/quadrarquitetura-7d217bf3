// Gerencia templates de atividades por tipo de obra (Sprint 4c — 9b).
//
// Pedido vídeo 9 da Mariana: "quando você copia um template do Trello,
// você já tem as atividades". Em Configurações, a Quadra cria/edita
// templates com listas de atividades já estruturadas (com disciplina,
// área padrão, duração e dependências). Quando cria uma nova obra,
// aplica o template e ganha o ponto de partida.
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LayoutTemplate, Plus, Pencil, Trash2, ListTree } from "lucide-react";
import {
  useActivityTemplates,
  type ActivityTemplateWithItems,
} from "@/hooks/useActivityTemplates";
import type { Tables } from "@/integrations/supabase/types";

type ProjectType = Tables<"projects">["project_type"];

interface DraftItem {
  position: number;
  name: string;
  ambiente: string;
  discipline: string;
  area_m2: string;
  duration_days: string;
  description: string;
  // posições (índices na lista) das quais este item depende
  depends_on_positions: number[];
}

const ANY_TYPE = "__any__";

const projectTypeLabel: Record<string, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  saude: "Saúde",
  outro: "Outro",
};

export default function ActivityTemplatesManager() {
  const { templates, isLoading, createTemplate, updateTemplate, remove } = useActivityTemplates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<{
    name: string;
    description: string;
    project_type: string;
    items: DraftItem[];
  }>({
    name: "",
    description: "",
    project_type: ANY_TYPE,
    items: [],
  });

  const openCreate = () => {
    setEditingId(null);
    setCreating(true);
    setDraft({
      name: "",
      description: "",
      project_type: ANY_TYPE,
      items: [{
        position: 0,
        name: "",
        ambiente: "",
        discipline: "",
        area_m2: "",
        duration_days: "",
        description: "",
        depends_on_positions: [],
      }],
    });
  };

  const openEdit = (tpl: ActivityTemplateWithItems) => {
    setEditingId(tpl.id);
    setCreating(true);
    setDraft({
      name: tpl.name,
      description: tpl.description ?? "",
      project_type: tpl.project_type ?? ANY_TYPE,
      items: tpl.items
        .sort((a, b) => a.position - b.position)
        .map((it) => ({
          position: it.position,
          name: it.name,
          ambiente: it.ambiente ?? "",
          discipline: it.discipline ?? "",
          area_m2: it.area_m2 != null ? String(it.area_m2) : "",
          duration_days: it.duration_days != null ? String(it.duration_days) : "",
          description: it.description ?? "",
          depends_on_positions: it.depends_on_positions ?? [],
        })),
    });
  };

  const closeDialog = () => {
    setCreating(false);
    setEditingId(null);
  };

  const addItem = () => {
    setDraft((d) => ({
      ...d,
      items: [...d.items, {
        position: d.items.length,
        name: "",
        ambiente: "",
        discipline: "",
        area_m2: "",
        duration_days: "",
        description: "",
        depends_on_positions: [],
      }],
    }));
  };

  const removeItem = (pos: number) => {
    setDraft((d) => ({
      ...d,
      items: d.items
        .filter((it) => it.position !== pos)
        // Reindexa posições e remove dependências apontando para o removido
        .map((it, idx) => ({
          ...it,
          position: idx,
          depends_on_positions: it.depends_on_positions
            .filter((p) => p !== pos)
            .map((p) => (p > pos ? p - 1 : p)),
        })),
    }));
  };

  const updateItem = (pos: number, field: keyof DraftItem, value: any) => {
    setDraft((d) => ({
      ...d,
      items: d.items.map((it) => (it.position === pos ? { ...it, [field]: value } : it)),
    }));
  };

  const toggleDep = (itemPos: number, depPos: number) => {
    setDraft((d) => ({
      ...d,
      items: d.items.map((it) => {
        if (it.position !== itemPos) return it;
        const has = it.depends_on_positions.includes(depPos);
        return {
          ...it,
          depends_on_positions: has
            ? it.depends_on_positions.filter((p) => p !== depPos)
            : [...it.depends_on_positions, depPos],
        };
      }),
    }));
  };

  const handleSave = () => {
    if (!draft.name.trim() || draft.items.length === 0) return;
    const items = draft.items
      .filter((it) => it.name.trim())
      .map((it) => ({
        position: it.position,
        name: it.name.trim(),
        ambiente: it.ambiente.trim() || null,
        discipline: it.discipline.trim() || null,
        area_m2: it.area_m2 ? parseFloat(it.area_m2) : null,
        duration_days: it.duration_days ? parseInt(it.duration_days) : null,
        description: it.description.trim() || null,
        depends_on_positions: it.depends_on_positions.length > 0
          ? it.depends_on_positions
          : null,
      }));
    const projectType = draft.project_type === ANY_TYPE
      ? null
      : (draft.project_type as Exclude<ProjectType, null>);
    if (editingId) {
      updateTemplate.mutate({
        id: editingId,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        project_type: projectType,
        items,
      }, { onSuccess: closeDialog });
    } else {
      createTemplate.mutate({
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        project_type: projectType ?? undefined,
        items,
      }, { onSuccess: closeDialog });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5" />
          Templates de Atividades
        </CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Novo Template
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum template cadastrado. Crie um template com atividades padrão para reaproveitar em novas obras.
          </p>
        ) : (
          <div className="divide-y">
            {templates.map((tpl) => (
              <div key={tpl.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm flex items-center gap-2">
                    {tpl.name}
                    {tpl.project_type && (
                      <Badge variant="outline" className="text-[10px]">{projectTypeLabel[tpl.project_type]}</Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <ListTree className="h-3 w-3" />
                      {tpl.items.length} atividades
                    </Badge>
                  </p>
                  {tpl.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{tpl.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(tpl)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => remove.mutate(tpl.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={creating} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_220px] gap-3">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Ex: Reforma residencial padrão"
                />
              </div>
              <div>
                <Label>Tipo de obra</Label>
                <Select
                  value={draft.project_type}
                  onValueChange={(v) => setDraft((d) => ({ ...d, project_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_TYPE}>Qualquer tipo</SelectItem>
                    <SelectItem value="residencial">Residencial</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Atividades do template</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {draft.items.map((it) => (
                  <div key={it.position} className="rounded-md border p-3 space-y-2 bg-muted/20">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono text-muted-foreground mt-2 w-6">#{it.position + 1}</span>
                      <Input
                        value={it.name}
                        onChange={(e) => updateItem(it.position, "name", e.target.value)}
                        placeholder="Nome da atividade"
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeItem(it.position)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pl-8">
                      <Input
                        placeholder="Ambiente"
                        value={it.ambiente}
                        onChange={(e) => updateItem(it.position, "ambiente", e.target.value)}
                      />
                      <Input
                        placeholder="Disciplina"
                        value={it.discipline}
                        onChange={(e) => updateItem(it.position, "discipline", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="m²"
                        value={it.area_m2}
                        onChange={(e) => updateItem(it.position, "area_m2", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="dias úteis"
                        value={it.duration_days}
                        onChange={(e) => updateItem(it.position, "duration_days", e.target.value)}
                      />
                    </div>
                    {draft.items.length > 1 && (
                      <div className="pl-8">
                        <Label className="text-[11px] text-muted-foreground uppercase">Depende de</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {draft.items
                            .filter((other) => other.position !== it.position)
                            .map((other) => {
                              const selected = it.depends_on_positions.includes(other.position);
                              return (
                                <button
                                  key={other.position}
                                  type="button"
                                  onClick={() => toggleDep(it.position, other.position)}
                                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                                    selected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-muted text-muted-foreground border-border hover:bg-accent"
                                  }`}
                                >
                                  #{other.position + 1} {other.name || "(sem nome)"}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={
                !draft.name.trim() ||
                draft.items.filter((it) => it.name.trim()).length === 0 ||
                createTemplate.isPending ||
                updateTemplate.isPending
              }
            >
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
