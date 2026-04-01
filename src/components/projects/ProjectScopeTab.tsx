import { useState, useMemo } from "react";
import { Plus, Sparkles, GripVertical, Pencil, Trash2, Link2, Users, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProjectActivities, ProjectActivity } from "@/hooks/useProjectActivities";
import { ActivityForm } from "./ActivityForm";
import { GenerateActivitiesDialog } from "./GenerateActivitiesDialog";
import { SupplierScopeDialog } from "./SupplierScopeDialog";
import { MultiSelectFilter } from "@/components/construction/MultiSelectFilter";
import { getDisciplineColor } from "@/lib/disciplineColors";

interface ProjectScopeTabProps {
  projectId: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "hsl(var(--muted-foreground))" },
  em_andamento: { label: "Em Andamento", color: "#1B2A4A" },
  concluida: { label: "Concluída", color: "#16A34A" },
  bloqueada: { label: "Bloqueada", color: "#DC2626" },
};

function ActivityRow({
  activity,
  index,
  onEdit,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  allActivities,
}: {
  activity: ProjectActivity;
  index: number;
  onEdit: (a: ProjectActivity) => void;
  onRemove: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  allActivities: ProjectActivity[];
}) {
  const status = STATUS_MAP[activity.status] || STATUS_MAP.pendente;
  const predecessor = activity.depends_on?.length
    ? allActivities.find(a => a.id === activity.depends_on[0])
    : null;

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, activity.id)}
      onDragOver={onDragOver}
      onDrop={e => onDrop(e, activity.id)}
      className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0 hover:bg-muted/30 transition-colors group cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{index}</span>
      <span className="flex-1 text-sm font-medium truncate min-w-0">{activity.name}</span>

      {activity.discipline && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 border-0 shrink-0"
          style={{
            backgroundColor: getDisciplineColor(activity.discipline) + "20",
            color: getDisciplineColor(activity.discipline),
          }}
        >
          {activity.discipline}
        </Badge>
      )}

      <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
        {activity.area_m2 != null ? `${activity.area_m2} m²` : "-"}
      </span>
      <span className="text-xs text-muted-foreground w-12 text-right shrink-0">
        {activity.duration_days != null ? `${activity.duration_days}d` : "-"}
      </span>

      <Badge
        variant="outline"
        className="text-[10px] px-1.5 py-0 border-0 shrink-0 w-20 justify-center"
        style={{ backgroundColor: status.color + "15", color: status.color }}
      >
        {status.label}
      </Badge>

      {predecessor ? (
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 w-20 shrink-0 truncate">
          <Link2 className="h-3 w-3" /> {predecessor.name.substring(0, 12)}
        </span>
      ) : (
        <span className="w-20 shrink-0" />
      )}

      {activity.progress_percent > 0 && (
        <div className="flex items-center gap-1 w-16 shrink-0">
          <Progress value={activity.progress_percent} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground">{activity.progress_percent}%</span>
        </div>
      )}
      {activity.progress_percent === 0 && <span className="w-16 shrink-0" />}

      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(activity)} className="p-1 rounded hover:bg-muted">
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
        <button onClick={() => onRemove(activity.id)} className="p-1 rounded hover:bg-destructive/10">
          <Trash2 className="h-3 w-3 text-destructive" />
        </button>
      </div>
    </div>
  );
}

export function ProjectScopeTab({ projectId }: ProjectScopeTabProps) {
  const { activities, isLoading, create, update, remove } = useProjectActivities(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ProjectActivity> | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [groupByDiscipline, setGroupByDiscipline] = useState(false);
  const [disciplineFilter, setDisciplineFilter] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const allDisciplines = useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => { if (a.discipline) set.add(a.discipline); });
    return Array.from(set).sort();
  }, [activities]);

  const filtered = useMemo(() => {
    let list = [...activities];
    if (disciplineFilter.length > 0) {
      list = list.filter(a => a.discipline && disciplineFilter.includes(a.discipline));
    }
    return list;
  }, [activities, disciplineFilter]);

  const grouped = useMemo(() => {
    if (!groupByDiscipline) return null;
    const map: Record<string, ProjectActivity[]> = {};
    filtered.forEach(a => {
      const key = a.discipline || "Sem disciplina";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, groupByDiscipline]);

  const handleSubmit = (data: Partial<ProjectActivity>) => {
    if (data.id) {
      const { id, ...rest } = data;
      update.mutate({ id, ...rest });
    } else {
      create.mutate(data);
    }
    setEditingItem(null);
  };

  const handleEdit = (item: ProjectActivity) => { setEditingItem(item); setFormOpen(true); };
  const handleNew = () => { setEditingItem(null); setFormOpen(true); };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    const target = activities.find(a => a.id === targetId);
    if (target) update.mutate({ id: dragId, position: target.position });
    setDragId(null);
  };

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const rowProps = {
    onEdit: handleEdit,
    onRemove: (id: string) => remove.mutate(id),
    onDragStart,
    onDragOver,
    onDrop,
    allActivities: activities,
  };

  let globalIndex = 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-display">Escopo da Obra</h3>
          <p className="text-sm text-muted-foreground">
            {activities.length} atividade{activities.length !== 1 ? "s" : ""} no escopo
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelectFilter
            label="Disciplina"
            options={allDisciplines}
            selected={disciplineFilter}
            onChange={setDisciplineFilter}
          />
          <div className="flex items-center gap-1.5">
            <Switch checked={groupByDiscipline} onCheckedChange={setGroupByDiscipline} id="group-toggle" />
            <label htmlFor="group-toggle" className="text-xs text-muted-foreground cursor-pointer">Agrupar</label>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSupplierDialogOpen(true)}>
            <Users className="h-4 w-4 mr-1" /> Escopo Fornecedor
          </Button>
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma atividade cadastrada. Clique em "Nova Atividade" para começar.
        </div>
      ) : groupByDiscipline && grouped ? (
        <div className="space-y-2">
          {grouped.map(([disc, items]) => {
            const startIdx = globalIndex + 1;
            const isOpen = !collapsedGroups.has(disc);
            return (
              <Collapsible key={disc} open={isOpen} onOpenChange={() => toggleGroup(disc)}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: getDisciplineColor(disc) }}
                    />
                    <span className="text-sm font-medium">{disc}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                      {items.length}
                    </Badge>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border rounded-lg mt-1 overflow-hidden">
                    {items.map((activity) => {
                      globalIndex++;
                      return (
                        <ActivityRow
                          key={activity.id}
                          activity={activity}
                          index={globalIndex}
                          {...rowProps}
                        />
                      );
                    })}
                  </div>
                </CollapsibleContent>
                {!isOpen && (() => { globalIndex += items.length; return null; })()}
              </Collapsible>
            );
          })}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {filtered.map((activity, i) => (
            <ActivityRow key={activity.id} activity={activity} index={i + 1} {...rowProps} />
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

      <GenerateActivitiesDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        projectId={projectId}
        existingCount={activities.length}
        onCreate={(data) => create.mutate(data)}
      />

      <SupplierScopeDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        projectId={projectId}
        activities={activities}
      />
    </div>
  );
}
