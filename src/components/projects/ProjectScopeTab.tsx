import { useState, useMemo } from "react";
import { Plus, Sparkles, GripVertical, Link2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProjectActivities, ProjectActivity } from "@/hooks/useProjectActivities";
import { ActivityForm } from "./ActivityForm";
import { getDisciplineColor } from "@/lib/disciplineColors";

interface ProjectScopeTabProps {
  projectId: string;
}

const COLUMNS = [
  { key: "pendente", label: "Pendente", color: "hsl(var(--muted-foreground))" },
  { key: "em_andamento", label: "Em Andamento", color: "#1B2A4A" },
  { key: "concluida", label: "Concluída", color: "#16A34A" },
  { key: "bloqueada", label: "Bloqueada", color: "#DC2626" },
] as const;

export function ProjectScopeTab({ projectId }: ProjectScopeTabProps) {
  const { activities, isLoading, create, update, remove } = useProjectActivities(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ProjectActivity> | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, ProjectActivity[]> = {
      pendente: [], em_andamento: [], concluida: [], bloqueada: [],
    };
    activities.forEach(a => {
      const key = a.status || "pendente";
      if (map[key]) map[key].push(a);
      else map.pendente.push(a);
    });
    return map;
  }, [activities]);

  const handleSubmit = (data: Partial<ProjectActivity>) => {
    if (data.id) {
      const { id, ...rest } = data;
      update.mutate({ id, ...rest });
    } else {
      create.mutate(data);
    }
    setEditingItem(null);
  };

  const handleEdit = (item: ProjectActivity) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!dragId) return;
    const activity = activities.find(a => a.id === dragId);
    if (activity && activity.status !== newStatus) {
      update.mutate({ id: dragId, status: newStatus });
    }
    setDragId(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-display">Escopo da Obra</h3>
          <p className="text-sm text-muted-foreground">
            {activities.length} atividade{activities.length !== 1 ? "s" : ""} no escopo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAiDialogOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1" /> Gerar com IA
          </Button>
          <Button onClick={handleNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Nova Atividade
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {COLUMNS.map(col => (
            <div
              key={col.key}
              className="rounded-lg border bg-muted/20 min-h-[200px] flex flex-col"
              onDragOver={onDragOver}
              onDrop={e => onDrop(e, col.key)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-sm font-medium">{col.label}</span>
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                  {grouped[col.key]?.length || 0}
                </Badge>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh]">
                {(grouped[col.key] || []).map(activity => (
                  <div
                    key={activity.id}
                    draggable
                    onDragStart={e => onDragStart(e, activity.id)}
                    className="rounded-md border bg-background p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow group"
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{activity.name}</p>
                        {activity.discipline && (
                          <Badge
                            variant="outline"
                            className="mt-1 text-[10px] px-1.5 py-0 border-0"
                            style={{
                              backgroundColor: getDisciplineColor(activity.discipline) + "20",
                              color: getDisciplineColor(activity.discipline),
                            }}
                          >
                            {activity.discipline}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => handleEdit(activity)} className="p-1 rounded hover:bg-muted">
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button onClick={() => remove.mutate(activity.id)} className="p-1 rounded hover:bg-destructive/10">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      {activity.area_m2 != null && <span>{activity.area_m2} m²</span>}
                      {activity.duration_days != null && <span>{activity.duration_days}d</span>}
                      {activity.depends_on && activity.depends_on.length > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Link2 className="h-3 w-3" /> {activity.depends_on.length}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {activity.progress_percent > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={activity.progress_percent} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground">{activity.progress_percent}%</span>
                      </div>
                    )}
                  </div>
                ))}

                {(grouped[col.key] || []).length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    Arraste atividades aqui
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ActivityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingItem}
        allActivities={activities}
        isLoading={create.isPending || update.isPending}
      />

      {/* AI Dialog - Placeholder */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Atividades com IA</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary/50" />
            <p className="text-sm">Funcionalidade em breve.</p>
            <p className="text-xs mt-1">A IA irá sugerir atividades com base no tipo de obra.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
