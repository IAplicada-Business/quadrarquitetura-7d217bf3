// Entrada digitada para o módulo de tarefas. Schema (voice_tasks) já
// suporta tudo — antes só havia entrada por áudio (VoiceAgentDialog).
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface VoiceTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    project_id: string;
    title: string;
    description?: string;
    responsible?: string;
    task_type?: string;
    category?: string;
    priority?: string;
    due_date?: string;
  }) => void;
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
  isLoading?: boolean;
}

export function VoiceTaskForm({
  open,
  onOpenChange,
  onSubmit,
  projects,
  defaultProjectId,
  isLoading,
}: VoiceTaskFormProps) {
  const [form, setForm] = useState({
    project_id: defaultProjectId || "",
    title: "",
    description: "",
    responsible: "",
    task_type: "geral",
    category: "pendencias",
    priority: "media",
    due_date: "",
  });

  useEffect(() => {
    if (open) {
      setForm((f) => ({
        ...f,
        project_id: defaultProjectId || f.project_id,
      }));
    }
  }, [open, defaultProjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_id || !form.title.trim()) return;
    onSubmit({
      project_id: form.project_id,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      responsible: form.responsible.trim() || undefined,
      task_type: form.task_type,
      category: form.category,
      priority: form.priority,
      due_date: form.due_date || undefined,
    });
    setForm({
      project_id: defaultProjectId || "",
      title: "",
      description: "",
      responsible: "",
      task_type: "geral",
      category: "pendencias",
      priority: "media",
      due_date: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Projeto *</Label>
            <Select
              value={form.project_id}
              onValueChange={(v) => setForm((f) => ({ ...f, project_id: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cronograma">Cronograma</SelectItem>
                  <SelectItem value="escopo">Escopo</SelectItem>
                  <SelectItem value="orcamentos">Orçamentos</SelectItem>
                  <SelectItem value="materiais">Materiais</SelectItem>
                  <SelectItem value="pendencias">Pendências</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="compras">Compras</SelectItem>
                  <SelectItem value="documentos">Documentos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.task_type} onValueChange={(v) => setForm((f) => ({ ...f, task_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="projeto">Projeto</SelectItem>
                  <SelectItem value="obra">Obra</SelectItem>
                  <SelectItem value="compras">Compras</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                  <SelectItem value="geral">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Input
                value={form.responsible}
                onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))}
              />
            </div>
            <div>
              <Label>Prazo</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !form.project_id || !form.title.trim()}>
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
