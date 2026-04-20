import { useMemo, useState } from "react";
import { Plus, Trash2, Copy, CheckCircle2, Circle, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useDeliveryChecklist, type DeliveryChecklistItem } from "@/hooks/useDeliveryChecklist";
import { useProjectActivities } from "@/hooks/useProjectActivities";
import { VoiceInputButton } from "@/components/ui/voice-input-button";

const priorityLabels: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

const priorityColors: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-primary/10 text-primary border-primary/30",
  alta: "bg-warning/15 text-warning border-warning/30",
  urgente: "bg-destructive/15 text-destructive border-destructive/30",
};

/**
 * Checklist de entrega da obra.
 * Solicitado na call de 16/04 — lista de pendências finais ("rejunte na
 * pedra", "PU da soleira") vinculadas opcionalmente a atividades do
 * escopo. Sem percentual — apenas resolvido/pendente.
 *
 * UX: agrupa itens por atividade (ou "Gerais" quando sem activity_id),
 * progresso por grupo, botão de marcar resolvido, copiar resumo das
 * pendências para WhatsApp.
 */
export function ProjectDeliveryChecklistTab({ projectId }: { projectId: string }) {
  const { items, isLoading, create, update, remove } = useDeliveryChecklist(projectId);
  const { activities } = useProjectActivities(projectId);

  const [formOpen, setFormOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [activityId, setActivityId] = useState<string>("none");
  const [responsible, setResponsible] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<string>("media");

  const resetForm = () => {
    setDesc("");
    setActivityId("none");
    setResponsible("");
    setDueDate("");
    setPriority("media");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;
    const activity = activities.find((a) => a.id === activityId);
    create.mutate(
      {
        description: desc.trim(),
        activity_id: activityId !== "none" ? activityId : null,
        discipline: activity?.discipline || null,
        responsible: responsible.trim() || null,
        due_date: dueDate || null,
        priority: priority as DeliveryChecklistItem["priority"],
      },
      {
        onSuccess: () => {
          setFormOpen(false);
          resetForm();
        },
      },
    );
  };

  // Agrupa por atividade (ou "Gerais")
  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; items: DeliveryChecklistItem[] }>();
    for (const item of items) {
      const key = item.activity_id || "__gerais__";
      const activity = activities.find((a) => a.id === item.activity_id);
      const title = item.activity_id
        ? activity?.name || "Atividade desconhecida"
        : "Pendências gerais";
      if (!map.has(key)) map.set(key, { title, items: [] });
      map.get(key)!.items.push(item);
    }
    return Array.from(map.entries());
  }, [items, activities]);

  const totalItems = items.length;
  const resolvedItems = items.filter((i) => i.resolved).length;
  const pendingItems = totalItems - resolvedItems;
  const progressPct = totalItems > 0 ? Math.round((resolvedItems / totalItems) * 100) : 0;

  const handleCopyPending = () => {
    const pending = items.filter((i) => !i.resolved);
    if (pending.length === 0) {
      toast("Nenhuma pendência para copiar.");
      return;
    }
    const byGroup = new Map<string, DeliveryChecklistItem[]>();
    for (const p of pending) {
      const activity = activities.find((a) => a.id === p.activity_id);
      const key = activity?.name || "Gerais";
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push(p);
    }
    const lines: string[] = ["*Pendências para entrega da obra*", ""];
    for (const [group, arr] of byGroup) {
      lines.push(`_${group}_`);
      for (const p of arr) {
        lines.push(
          `• ${p.description}${p.responsible ? ` — ${p.responsible}` : ""}${p.due_date ? ` (até ${new Date(p.due_date + "T00:00:00").toLocaleDateString("pt-BR")})` : ""}`,
        );
      }
      lines.push("");
    }
    navigator.clipboard.writeText(lines.join("\n"));
    toast("Pendências copiadas para a área de transferência!");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Checklist de Entrega</h3>
          <p className="text-sm text-muted-foreground">
            Pendências finais da obra. Vincule à atividade do escopo quando fizer sentido.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyPending} disabled={pendingItems === 0}>
            <Copy className="h-4 w-4 mr-1" /> Copiar pendências
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nova pendência
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalItems}</p>
            <p className="text-xs text-muted-foreground">Itens totais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{pendingItems}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{progressPct}%</p>
            <p className="text-xs text-muted-foreground">Concluído</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista agrupada */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>Nenhuma pendência cadastrada.</p>
          <p className="text-xs mt-1">
            Clique em "Nova pendência" para começar a montar a lista de entrega.
          </p>
        </div>
      ) : (
        grouped.map(([key, group]) => {
          const resolvedInGroup = group.items.filter((i) => i.resolved).length;
          const totalInGroup = group.items.length;
          return (
            <Card key={key} className="overflow-hidden">
              <CardHeader className="py-3 px-4 bg-muted/30">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold">{group.title}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {resolvedInGroup}/{totalInGroup}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 ${item.resolved ? "opacity-60" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => update.mutate({ id: item.id, resolved: !item.resolved })}
                      className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      title={item.resolved ? "Marcar como pendente" : "Marcar como resolvido"}
                    >
                      {item.resolved ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${item.resolved ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 ${priorityColors[item.priority] || ""}`}
                        >
                          {priorityLabels[item.priority] || item.priority}
                        </Badge>
                        {item.responsible && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {item.responsible}
                          </span>
                        )}
                        {item.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        {item.discipline && (
                          <span className="text-[10px]">• {item.discipline}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => remove.mutate(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova pendência de entrega</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label>Descrição *</Label>
                <VoiceInputButton
                  title="Ditar pendência"
                  onTranscript={(t) => setDesc((prev) => (prev ? prev + " " + t : t))}
                />
              </div>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Ex: passar rejunte na pedra da bancada"
                rows={2}
                required
              />
            </div>
            <div>
              <Label>Atividade do escopo (opcional)</Label>
              <Select value={activityId} onValueChange={setActivityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo (pendência geral)</SelectItem>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                      {a.discipline ? ` — ${a.discipline}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Responsável</Label>
                <Input
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="Ex: Pedreiro João"
                />
              </div>
              <div>
                <Label>Prazo</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={create.isPending}>
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
