import { useState, useMemo } from "react";
import { differenceInDays, isBefore, addDays, format } from "date-fns";
import { Plus, Pencil, Trash2, Download, AlertTriangle, ChevronDown, RefreshCw, FileDown, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScheduleTasks } from "@/hooks/useScheduleTasks";
import { useScopeItems } from "@/hooks/useScopeItems";
import { useProjectActivities, computeRecalculateAll } from "@/hooks/useProjectActivities";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScheduleTaskForm } from "./ScheduleTaskForm";
import { ProjectPendingTab } from "./ProjectPendingTab";
import { GanttChart } from "./GanttChart";
import { ClientScheduleView } from "./ClientScheduleView";
import { ActivityForm } from "./ActivityForm";
import { CascadePreviewDialog, type CascadeChange } from "./CascadePreviewDialog";
import { useQueryClient } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProjectAI } from "@/hooks/useProjectAI";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

const statusConfig: Record<string, { label: string; className: string }> = {
  planejado: { label: "Planejado", className: "bg-muted text-muted-foreground border-border" },
  em_execucao: { label: "Em Execução", className: "bg-primary/15 text-primary border-primary/30" },
  executado: { label: "Executado", className: "bg-success/15 text-success border-success/30" },
  atrasado: { label: "Atrasado", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function ProjectScheduleTab({ projectId }: { projectId: string }) {
  const { items, isLoading, create, update, remove } = useScheduleTasks(projectId);
  const { items: scopeItems } = useScopeItems(projectId);
  const { activities, isLoading: activitiesLoading, create: createActivity, update: updateActivity, remove: removeActivity, batchUpdateDates } = useProjectActivities(projectId);
  const useActivitiesSource = activities.length > 0;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [ganttView, setGanttView] = useState<"day" | "week" | "month">("week");
  const [filterDiscipline, setFilterDiscipline] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterEnvironment, setFilterEnvironment] = useState("all");
  const [importing, setImporting] = useState(false);
  const [recalcChanges, setRecalcChanges] = useState<CascadeChange[]>([]);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generatingFromScope, setGeneratingFromScope] = useState(false);
  const { callAction, loading: aiLoading } = useProjectAI();
  const [aiSchedule, setAiSchedule] = useState<any[] | null>(null);
  const [aiScheduleOpen, setAiScheduleOpen] = useState(false);

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    items.forEach((t: any) => {
      const d = t.discipline || (t.scope_items as any)?.discipline;
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [items]);

  const suppliers = useMemo(() => {
    const set = new Set<string>();
    items.forEach((t: any) => { if (t.supplier_name) set.add(t.supplier_name); });
    return Array.from(set).sort();
  }, [items]);

  const environments = useMemo(() => {
    const set = new Set<string>();
    items.forEach((t: any) => { if (t.environment) set.add(t.environment); });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((t: any) => {
      const d = t.discipline || (t.scope_items as any)?.discipline;
      if (filterDiscipline !== "all" && d !== filterDiscipline) return false;
      if (filterSupplier !== "all" && t.supplier_name !== filterSupplier) return false;
      if (filterEnvironment !== "all" && t.environment !== filterEnvironment) return false;
      return true;
    });
  }, [items, filterDiscipline, filterSupplier, filterEnvironment]);

  const activityStatusColorMap: Record<string, string> = {
    pendente: "#9CA3AF",
    em_andamento: "#1B2A4A",
    concluida: "#16A34A",
    bloqueada: "#DC2626",
  };

  const activityStatusMap: Record<string, string> = {
    pendente: "planejado",
    em_andamento: "em_execucao",
    concluida: "executado",
    bloqueada: "atrasado",
  };

  const activitiesGanttTasks = useMemo(() =>
    activities.map(a => ({
      id: a.id,
      task_name: a.name,
      start_date: a.start_date,
      end_date: a.end_date,
      status: activityStatusMap[a.status] || "planejado",
      discipline: a.discipline,
      supplier_name: null,
      progress_percentage: a.progress_percent,
      color: activityStatusColorMap[a.status] || "#9CA3AF",
      requires_presence: null,
      is_daily_detail: null,
      dependencies: a.depends_on,
      environment: null,
      estimated_days: a.duration_days,
    })),
  [activities]);

  const allGanttTasks = useMemo(() =>
    useActivitiesSource ? activitiesGanttTasks :
    items.map((t: any) => ({
      id: t.id, task_name: t.task_name, start_date: t.start_date, end_date: t.end_date,
      status: t.status, discipline: t.discipline || (t.scope_items as any)?.discipline || null,
      supplier_name: t.supplier_name, progress_percentage: t.progress_percentage,
      color: t.color, requires_presence: t.requires_presence, is_daily_detail: t.is_daily_detail,
      dependencies: t.dependencies, environment: t.environment, estimated_days: t.estimated_days,
    })),
  [items, activitiesGanttTasks, useActivitiesSource]);

  const ganttTasks = useMemo(() =>
    useActivitiesSource ? activitiesGanttTasks :
    filteredItems.map((t: any) => ({
      id: t.id, task_name: t.task_name, start_date: t.start_date, end_date: t.end_date,
      status: t.status, discipline: t.discipline || (t.scope_items as any)?.discipline || null,
      supplier_name: t.supplier_name, progress_percentage: t.progress_percentage,
      color: t.color, requires_presence: t.requires_presence, is_daily_detail: t.is_daily_detail,
      dependencies: t.dependencies, environment: t.environment, estimated_days: t.estimated_days,
    })),
  [filteredItems, activitiesGanttTasks, useActivitiesSource]);

  const clientTasks = useMemo(() =>
    items.filter((t: any) => t.is_client_visible === true).map((t: any) => ({
      id: t.id, task_name: t.task_name, start_date: t.start_date, end_date: t.end_date,
      status: t.status, discipline: t.discipline || (t.scope_items as any)?.discipline || null,
      color: t.color, progress_percentage: t.progress_percentage,
    })),
  [items]);

  const sourceItems = useActivitiesSource ? activities : items;
  const total = sourceItems.length;
  const inProgress = useActivitiesSource
    ? activities.filter(a => a.status === "em_andamento").length
    : items.filter((t: any) => t.status === "em_execucao").length;
  const overdue = useActivitiesSource
    ? activities.filter(a => a.status === "bloqueada").length
    : items.filter((t: any) => t.status === "atrasado").length;
  const completed = useActivitiesSource
    ? activities.filter(a => a.status === "concluida").length
    : items.filter((t: any) => t.status === "executado").length;

  // Deadline alert tasks
  const alertTasks = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const soonDate = addDays(today, 3);
    const finishedStatuses = ["concluido", "executado"];
    return items
      .filter((t: any) => {
        if (!t.end_date || finishedStatuses.includes(t.status || "")) return false;
        return isBefore(new Date(t.end_date), addDays(today, 4));
      })
      .map((t: any) => {
        const endDate = new Date(t.end_date);
        const days = differenceInDays(new Date(todayStr), endDate);
        const isOverdue = days > 0;
        return { ...t, daysOffset: days, isOverdue, discipline: t.discipline || (t.scope_items as any)?.discipline };
      })
      .sort((a: any, b: any) => b.daysOffset - a.daysOffset);
  }, [items]);

  const handleEdit = (task: any) => {
    if (useActivitiesSource) {
      const act = activities.find(a => a.id === task.id);
      setEditingActivity(act || null);
      setActivityFormOpen(true);
    } else {
      setEditing(task as Record<string, unknown>);
      setFormOpen(true);
    }
  };

  const handleRecalculateAll = () => {
    const changes = computeRecalculateAll(activities);
    if (changes.length === 0) {
      toast({ title: "Nenhuma alteração necessária. Todas as datas estão consistentes." });
      return;
    }
    setRecalcChanges(changes);
  };

  const handleRecalcConfirm = () => {
    batchUpdateDates.mutate(recalcChanges.map(c => ({ id: c.id, start_date: c.newStart, end_date: c.newEnd })));
    setRecalcChanges([]);
  };

  const handleImportFromScope = async () => {
    if (!user) return;
    setImporting(true);
    try {
      const contractedItems = scopeItems.filter(s => s.scope_type === "contratado" && !s.parent_id);
      if (contractedItems.length === 0) {
        toast({ title: "Nenhuma disciplina contratada encontrada no escopo." });
        return;
      }
      const existingDisciplines = new Set(items.map((t: any) => t.discipline || (t.scope_items as any)?.discipline));
      const newItems = contractedItems.filter(s => !existingDisciplines.has(s.discipline));
      if (newItems.length === 0) {
        toast({ title: "Todas as disciplinas já estão no cronograma." });
        return;
      }
      const inserts = newItems.map((s, idx) => ({
        project_id: projectId, user_id: user.id, task_name: s.discipline,
        discipline: s.discipline, scope_item_id: s.id, status: "planejado",
        order_index: items.length + idx + 1, is_client_visible: true,
      }));
      const { error } = await supabase.from("schedule_tasks").insert(inserts);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["schedule_tasks", projectId] });
      toast({ title: `${newItems.length} etapas importadas do escopo!` });
    } catch (e: any) {
      toast({ title: "Erro ao importar", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  // Activities with dates for "Gerar do Escopo"
  const schedulableActivities = useMemo(() =>
    activities.filter(a => a.start_date || a.duration_days),
  [activities]);

  const handleGenerateFromScope = async () => {
    if (!user) return;
    setGeneratingFromScope(true);
    try {
      // Fetch existing schedule_tasks with source_activity_id
      const { data: existingTasks } = await supabase
        .from("schedule_tasks")
        .select("id, source_activity_id")
        .eq("project_id", projectId)
        .not("source_activity_id", "is", null);

      const existingMap = new Map((existingTasks || []).map((t: any) => [t.source_activity_id, t.id]));

      let created = 0;
      let updated = 0;

      for (const activity of schedulableActivities) {
        const statusMap: Record<string, string> = {
          pendente: "planejado",
          em_andamento: "em_execucao",
          concluida: "executado",
          bloqueada: "atrasado",
        };
        const taskData: Record<string, unknown> = {
          task_name: activity.name,
          start_date: activity.start_date,
          end_date: activity.end_date,
          status: statusMap[activity.status] || "planejado",
          discipline: activity.discipline,
        };

        const existingId = existingMap.get(activity.id);
        if (existingId) {
          const { error } = await supabase.from("schedule_tasks").update(taskData).eq("id", existingId);
          if (!error) updated++;
        } else {
          const { error } = await supabase.from("schedule_tasks").insert({
            ...taskData,
            project_id: projectId,
            user_id: user.id,
            source_activity_id: activity.id,
            order_index: items.length + created + 1,
            is_client_visible: true,
          } as any);
          if (!error) created++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["schedule_tasks", projectId] });
      const parts = [];
      if (created > 0) parts.push(`${created} criadas`);
      if (updated > 0) parts.push(`${updated} atualizadas`);
      toast({ title: `Cronograma gerado do escopo`, description: parts.join(", ") });
      setGenerateDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingFromScope(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs defaultValue="gantt">
        <TabsList>
          <TabsTrigger value="gantt">Gantt (Interno)</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="cliente">Visão Cliente</TabsTrigger>
          <TabsTrigger value="pendencias">Pendências</TabsTrigger>
        </TabsList>

        <TabsContent value="gantt" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-display">{total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{inProgress}</p>
              <p className="text-xs text-muted-foreground">Em Execução</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{overdue}</p>
              <p className="text-xs text-muted-foreground">Atrasadas</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{completed}</p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </CardContent></Card>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              <Select value={ganttView} onValueChange={(v) => setGanttView(v as any)}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia (14d)</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDiscipline} onValueChange={setFilterDiscipline}>
                <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Disciplina" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Disciplinas</SelectItem>
                  {disciplines.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              {suppliers.length > 0 && (
                <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                  <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Fornecedor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Fornecedores</SelectItem>
                    {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {environments.length > 0 && (
                <Select value={filterEnvironment} onValueChange={setFilterEnvironment}>
                  <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Ambiente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Ambientes</SelectItem>
                    {environments.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex gap-2">
              {useActivitiesSource && (
                <Button size="sm" variant="outline" onClick={handleRecalculateAll} disabled={batchUpdateDates.isPending}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Recalcular Cronograma
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setGenerateDialogOpen(true)} disabled={schedulableActivities.length === 0}>
                <FileDown className="h-4 w-4 mr-1" /> Gerar do Escopo
              </Button>
              <Button size="sm" variant="outline" disabled={aiLoading || activities.length === 0} onClick={async () => {
                const result = await callAction(projectId, "generate_schedule", { activities: activities.map(a => ({ name: a.name, discipline: a.discipline, area_m2: a.area_m2 })) });
                if (result?.schedule) { setAiSchedule(result.schedule); setAiScheduleOpen(true); }
              }}>
                {aiLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                Gerar cronograma com IA
              </Button>
              <Button size="sm" variant="outline" onClick={handleImportFromScope} disabled={importing}>
                <Download className="h-4 w-4 mr-1" /> Importar do Escopo
              </Button>
              <Button size="sm" onClick={() => {
                if (useActivitiesSource) {
                  setEditingActivity(null);
                  setActivityFormOpen(true);
                } else {
                  setEditing(null);
                  setFormOpen(true);
                }
              }}>
                <Plus className="h-4 w-4 mr-1" /> Nova Etapa
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <GanttChart
              tasks={ganttTasks}
              allTasks={allGanttTasks}
              onEdit={handleEdit}
              viewMode={ganttView}
            />
          )}

          {/* Pendências e Atrasos */}
          {alertTasks.length > 0 && (
            <Collapsible defaultOpen={alertTasks.some((t: any) => t.isOverdue)}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-semibold text-display hover:opacity-80 transition-opacity">
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Pendências e Atrasos
                <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{alertTasks.length}</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border rounded-lg divide-y mt-1">
                  {alertTasks.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/30 cursor-pointer" onClick={() => handleEdit(t)}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.isOverdue ? "#DC2626" : "#D97706" }} />
                        <span className="font-medium truncate">{t.task_name}</span>
                        {t.discipline && <span className="text-muted-foreground hidden sm:inline">· {t.discipline}</span>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-muted-foreground">{t.supplier_name || "—"}</span>
                        <span className="text-muted-foreground">{t.end_date ? format(new Date(t.end_date), "dd/MM") : "—"}</span>
                        <span className="font-semibold" style={{ color: t.isOverdue ? "#DC2626" : "#D97706" }}>
                          {t.isOverdue ? `−${t.daysOffset}d` : `${Math.abs(t.daysOffset)}d`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </TabsContent>

        <TabsContent value="lista" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-display">Lista de Etapas</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleImportFromScope} disabled={importing}>
                <Download className="h-4 w-4 mr-1" /> Importar do Escopo
              </Button>
              <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Nova Etapa
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhuma etapa cadastrada. Use "Importar do Escopo" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">%</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((task: any) => {
                  const st = statusConfig[task.status || "planejado"];
                  const disc = task.discipline || (task.scope_items as any)?.discipline;
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="text-muted-foreground">{task.order_index || "—"}</TableCell>
                      <TableCell className="font-medium">{task.task_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{disc || "—"}</TableCell>
                      <TableCell className="text-xs">{task.supplier_name || "—"}</TableCell>
                      <TableCell>{formatDate(task.start_date)}</TableCell>
                      <TableCell>{formatDate(task.end_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={st?.className}>{st?.label || task.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs">{task.progress_percentage ?? 0}%</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(task)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(task.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="cliente" className="mt-4">
          <ClientScheduleView tasks={clientTasks} />
        </TabsContent>

        <TabsContent value="pendencias" className="mt-4">
          <ProjectPendingTab projectId={projectId} />
        </TabsContent>
      </Tabs>

      <ScheduleTaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => {
          if (editing) {
            update.mutate({ id: editing.id as string, ...data });
          } else {
            create.mutate(data);
          }
          setEditing(null);
        }}
        initialData={editing}
        isLoading={create.isPending || update.isPending}
        scopeItems={scopeItems.filter((s) => !s.parent_id).map((s) => ({ id: s.id, discipline: s.discipline }))}
      />

      <ActivityForm
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
        onSubmit={(data) => {
          if (editingActivity?.id) {
            updateActivity.mutate({ id: editingActivity.id, ...data });
          } else {
            createActivity.mutate(data);
          }
          setEditingActivity(null);
        }}
        onCascade={(updates) => {
          batchUpdateDates.mutate(updates);
        }}
        initialData={editingActivity}
        allActivities={activities}
        isLoading={createActivity.isPending || updateActivity.isPending}
      />

      <CascadePreviewDialog
        open={recalcChanges.length > 0}
        onOpenChange={(open) => { if (!open) setRecalcChanges([]); }}
        changes={recalcChanges}
        onConfirm={handleRecalcConfirm}
        isLoading={batchUpdateDates.isPending}
        title="Recalcular todo o cronograma"
      />

      {/* Generate from Scope Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Cronograma do Escopo</DialogTitle>
            <DialogDescription>
              {schedulableActivities.length > 0
                ? `${schedulableActivities.length} atividades com datas definidas encontradas no escopo. Gerar cronograma?`
                : "Nenhuma atividade com datas definidas encontrada."}
            </DialogDescription>
          </DialogHeader>
          {schedulableActivities.length > 0 && (
            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
              {schedulableActivities.map(a => (
                <div key={a.id} className="px-3 py-2 text-sm flex justify-between">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {a.start_date ? new Date(a.start_date).toLocaleDateString("pt-BR") : "—"} → {a.end_date ? new Date(a.end_date).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleGenerateFromScope} disabled={generatingFromScope || schedulableActivities.length === 0}>
              {generatingFromScope ? "Gerando..." : `Gerar ${schedulableActivities.length} etapas`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Schedule Modal */}
      <Dialog open={aiScheduleOpen} onOpenChange={setAiScheduleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cronograma Sugerido pela IA</DialogTitle>
            <DialogDescription>Sequência de execução com duração e dependências estimadas.</DialogDescription>
          </DialogHeader>
          {aiSchedule && (
            <div className="max-h-80 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Atividade</TableHead><TableHead className="text-center">Duração (dias)</TableHead><TableHead>Depende de</TableHead><TableHead className="text-center">Semana</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {aiSchedule.map((s: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{s.activity_name}</TableCell>
                      <TableCell className="text-center">{s.duration_days}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{s.depends_on_activity_name || "—"}</TableCell>
                      <TableCell className="text-center">{s.week_number}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiScheduleOpen(false)}>Fechar</Button>
            <Button onClick={async () => {
              if (!aiSchedule || !user) return;
              // Calculate dates from project start or today
              const { data: project } = await supabase.from("projects").select("start_date").eq("id", projectId).single();
              const startDate = project?.start_date ? new Date(project.start_date) : new Date();
              const updates = aiSchedule.map((s: any) => {
                const act = activities.find(a => a.name === s.activity_name);
                if (!act) return null;
                const actStart = addDays(startDate, (s.week_number - 1) * 7);
                const actEnd = addDays(actStart, s.duration_days);
                return { id: act.id, start_date: format(actStart, "yyyy-MM-dd"), end_date: format(actEnd, "yyyy-MM-dd") };
              }).filter(Boolean);
              if (updates.length > 0) {
                batchUpdateDates.mutate(updates as any);
                toast({ title: `${updates.length} atividades atualizadas com cronograma da IA` });
              }
              setAiScheduleOpen(false);
            }}>
              Aplicar ao cronograma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
