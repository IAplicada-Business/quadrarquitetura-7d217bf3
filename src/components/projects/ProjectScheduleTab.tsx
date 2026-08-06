import { useState, useMemo } from "react";
import { differenceInDays, isBefore, addDays, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, Download, AlertTriangle, ChevronDown, RefreshCw, FileDown, Sparkles, Loader2, CalendarCheck, FileSpreadsheet, FlaskConical, Home, ShoppingBag, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useClientClosingSchedule, type ClosingScheduleItem } from "@/hooks/useClientClosingSchedule";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScheduleTasks } from "@/hooks/useScheduleTasks";
import { useScopeItems } from "@/hooks/useScopeItems";
import { useProjectActivities, computeRecalculateAll } from "@/hooks/useProjectActivities";
import { useProjectDisciplines } from "@/hooks/useProjectDisciplines";
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
import { ApplyCalendarDialog } from "./ApplyCalendarDialog";
import { ScheduleScenariosDialog } from "./ScheduleScenariosDialog";
import { useQueryClient } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProjectAI } from "@/hooks/useProjectAI";
import { csvRow, downloadCsv } from "@/lib/csv";

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
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [projectStartDate, setProjectStartDate] = useState<string | null>(null);
  const [scenariosDialogOpen, setScenariosDialogOpen] = useState(false);

  // Fechamento Cliente — form state
  const { items: closingItems, isLoading: closingLoading, create: closingCreate, update: closingUpdate, remove: closingRemove } = useClientClosingSchedule(projectId);
  const [closingFormOpen, setClosingFormOpen] = useState(false);
  const [closingEditing, setClosingEditing] = useState<ClosingScheduleItem | null>(null);
  const [closingDraft, setClosingDraft] = useState({ description: "", delivery_date: "", closing_date: "", delivery_time: "", estimated_value: "", status: "em_cotacao" as ClosingScheduleItem["status"] });

  // client_move_in_date — for Lista Cliente countdown
  const { data: projectMeta } = useQuery({
    queryKey: ["project_meta_move_in", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("client_move_in_date, name").eq("id", projectId).maybeSingle();
      return data;
    },
    enabled: !!projectId,
  });
  const moveInDate: string | null = (projectMeta as any)?.client_move_in_date ?? null;

  // Fechamento Cliente — group items by month of closing_date (must be at component level, not inside JSX IIFE)
  const closingGrouped = useMemo(() => {
    const map = new Map<string, ClosingScheduleItem[]>();
    closingItems.forEach(item => {
      const key = item.closing_date
        ? format(parseISO(item.closing_date), "MMMM/yyyy", { locale: ptBR }).toUpperCase()
        : "SEM DATA";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries());
  }, [closingItems]);

  // Disciplinas canônicas vêm do escopo (useProjectDisciplines), mesclando
  // com o que já existe em schedule_tasks para não perder dados antigos.
  const { disciplines: scopeDisciplines } = useProjectDisciplines(projectId);
  const disciplines = useMemo(() => {
    const set = new Set<string>(scopeDisciplines);
    items.forEach((t: any) => {
      const d = t.discipline || (t.scope_items as any)?.discipline;
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [scopeDisciplines, items]);

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

  const openCalendarDialog = async () => {
    // Busca real_start_date do projeto para pré-preencher data de início
    const { data } = await supabase
      .from("projects")
      .select("real_start_date")
      .eq("id", projectId)
      .maybeSingle();
    setProjectStartDate((data?.real_start_date as string | null) ?? null);
    setCalendarDialogOpen(true);
  };

  const handleApplyCalendar = (changes: { id: string; start_date: string; end_date: string }[]) => {
    batchUpdateDates.mutate(changes);
    setCalendarDialogOpen(false);
  };

  // Gera checkpoints (Prompt 6 do guia) a partir das atividades já
  // datadas, chamando a edge `generate-checkpoints` que insere em
  // `site_visits`. Determinístico: cada disciplina tem regra fixa
  // de quais checkpoints emitir.
  const [generatingCheckpoints, setGeneratingCheckpoints] = useState(false);
  const handleGenerateCheckpoints = async () => {
    if (activities.length === 0) return;
    setGeneratingCheckpoints(true);
    try {
      const payload = activities
        .filter((a) => a.start_date && a.end_date)
        .map((a) => ({
          id: a.id,
          name: a.name,
          discipline: a.discipline,
          start_date: a.start_date,
          end_date: a.end_date,
        }));
      if (payload.length === 0) {
        toast({ title: "Aplique o calendário antes para que as atividades tenham datas." });
        return;
      }
      const { data, error } = await supabase.functions.invoke("generate-checkpoints", {
        body: { project_id: projectId, activities: payload, replace_existing: true },
      });
      if (error) throw error;
      toast({
        title: `${data?.created ?? 0} checkpoints criados`,
        description: "Verifique em Acompanhamento da obra (visitas).",
      });
    } catch (e: any) {
      toast({ title: "Erro ao gerar checkpoints", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingCheckpoints(false);
    }
  };

  // Export CSV do cronograma (Prompt 7 do guia da Mariana — base para
  // planilha / MS Project / Notion).
  const handleExportScheduleCSV = () => {
    const rows = useActivitiesSource
      ? activities.map((a) => ({
          name: a.name,
          discipline: a.discipline ?? "",
          duration: a.duration_days ?? "",
          start: a.start_date ?? "",
          end: a.end_date ?? "",
          predecessors: (a.depends_on ?? [])
            .map((id) => activities.find((x) => x.id === id)?.name)
            .filter(Boolean)
            .join(" | "),
        }))
      : items.map((t: any) => ({
          name: t.task_name,
          discipline: t.discipline || (t.scope_items as any)?.discipline || "",
          duration: t.estimated_days ?? "",
          start: t.start_date ?? "",
          end: t.end_date ?? "",
          predecessors: "",
        }));
    let csv = csvRow(["Atividade", "Disciplina", "Duração (dias úteis)", "Início", "Término", "Predecessoras"]);
    rows.forEach((r) =>
      csv += csvRow([r.name, r.discipline, r.duration, r.start, r.end, r.predecessors]),
    );
    downloadCsv(`cronograma_${projectId}.csv`, csv);
  };

  const handleImportFromScope = async () => {
    if (!user) return;
    setImporting(true);
    try {
      // Prioriza project_activities (escopo novo, uma linha por atividade).
      // Fallback para scope_items apenas se não houver atividades cadastradas.
      if (activities.length > 0) {
        const existingSourceIds = new Set(
          items.map((t: any) => t.source_activity_id).filter(Boolean)
        );
        const newActivities = activities.filter(a => !existingSourceIds.has(a.id));
        if (newActivities.length === 0) {
          toast({ title: "Todas as atividades do escopo já estão no cronograma." });
          return;
        }
        const statusMap: Record<string, string> = {
          pendente: "planejado",
          em_andamento: "em_execucao",
          concluida: "executado",
          bloqueada: "atrasado",
        };
        const inserts = newActivities.map((a, idx) => ({
          project_id: projectId,
          user_id: user.id,
          task_name: a.name,
          discipline: a.discipline,
          start_date: a.start_date,
          end_date: a.end_date,
          status: statusMap[a.status] || "planejado",
          source_activity_id: a.id,
          order_index: items.length + idx + 1,
          is_client_visible: true,
        }));
        const { error } = await supabase.from("schedule_tasks").insert(inserts as any);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["schedule_tasks", projectId] });
        toast({ title: `${newActivities.length} atividades importadas do escopo!` });
        return;
      }

      const contractedItems = scopeItems.filter(s => s.scope_type === "contratado" && !s.parent_id);
      if (contractedItems.length === 0) {
        toast({ title: "Nenhuma atividade ou disciplina contratada encontrada no escopo." });
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
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
          <TabsTrigger value="lista_cliente">Lista Cliente</TabsTrigger>
          <TabsTrigger value="fechamento">Fechamento Cliente</TabsTrigger>
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
              {useActivitiesSource && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openCalendarDialog}
                  disabled={batchUpdateDates.isPending || activities.length === 0}
                  title="Aplica calendário brasileiro: pula fim de semana, feriados e recesso"
                >
                  <CalendarCheck className="h-4 w-4 mr-1" /> Aplicar calendário BR
                </Button>
              )}
              {useActivitiesSource && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setScenariosDialogOpen(true)}
                  disabled={activities.length === 0}
                  title="Cria snapshots editáveis do cronograma para testar mudanças"
                >
                  <FlaskConical className="h-4 w-4 mr-1" /> Cenários
                </Button>
              )}
              {useActivitiesSource && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateCheckpoints}
                  disabled={generatingCheckpoints || activities.length === 0}
                  title="Gera visitas técnicas a partir das atividades (medição, recebimento, instalação, finalização)"
                >
                  {generatingCheckpoints ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CalendarCheck className="h-4 w-4 mr-1" />
                  )}
                  Gerar Checkpoints
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleExportScheduleCSV} disabled={(useActivitiesSource ? activities.length : items.length) === 0}>
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Exportar Cronograma
              </Button>
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

        {/* ===== LISTA CLIENTE (Cronograma Reverso) ===== */}
        <TabsContent value="lista_cliente" className="space-y-4 mt-4">
          {(() => {
            const today = new Date();

            const closingStatusLabel: Record<string, string> = {
              em_cotacao: "Em cotação",
              aprovado: "Aprovado",
              comprado: "Comprado",
              entregue: "Entregue",
            };
            const closingStatusClass: Record<string, string> = {
              em_cotacao: "bg-yellow-100 text-yellow-800 border-yellow-300",
              aprovado: "bg-primary/10 text-primary border-primary/30",
              comprado: "bg-blue-100 text-blue-800 border-blue-300",
              entregue: "bg-success/15 text-success border-success/30",
            };

            // Construction activity rows
            type ActivityRow = { type: "activity"; id: string; name: string; start_date: string | null; end_date: string | null; duration_days: number | null; sortDate: string };
            type ClosingRow = { type: "closing"; id: string; name: string; start_date: string | null; end_date: string | null; status: ClosingScheduleItem["status"]; delivery_time: string | null; estimated_value: number | null; sortDate: string };
            type AnyRow = ActivityRow | ClosingRow;

            const actRows: ActivityRow[] = (useActivitiesSource ? activities : items.map((t: any) => ({
              id: t.id,
              name: t.task_name,
              start_date: t.start_date,
              end_date: t.end_date,
              duration_days: t.estimated_days ?? null,
            })))
              .filter((a: any) => a.start_date || a.end_date)
              .map((a: any) => ({
                type: "activity" as const,
                id: a.id,
                name: a.name ?? a.task_name,
                start_date: a.start_date ?? null,
                end_date: a.end_date ?? null,
                duration_days: a.duration_days ?? null,
                sortDate: a.start_date ?? a.end_date ?? "",
              }));

            // Closing (procurement) rows — delivery_date is when item arrives on site
            const closingRowsMapped: ClosingRow[] = closingItems
              .filter(i => i.delivery_date || i.closing_date)
              .map(i => ({
                type: "closing" as const,
                id: i.id,
                name: i.description,
                start_date: i.closing_date ?? null,
                end_date: i.delivery_date ?? null,
                status: i.status,
                delivery_time: i.delivery_time ?? null,
                estimated_value: i.estimated_value ?? null,
                sortDate: i.delivery_date ?? i.closing_date ?? "",
              }));

            // Merge and sort DESC
            const allRows: AnyRow[] = [...actRows, ...closingRowsMapped]
              .sort((a, b) => b.sortDate.localeCompare(a.sortDate));

            // Days to move-in
            const daysToMove = moveInDate
              ? differenceInDays(parseISO(moveInDate), today)
              : null;

            return (
              <div className="space-y-4">
                {/* Countdown banner */}
                {moveInDate && (
                  <div className={`rounded-lg border p-4 flex items-center gap-4 ${daysToMove !== null && daysToMove < 0 ? "bg-destructive/5 border-destructive/30" : daysToMove !== null && daysToMove <= 14 ? "bg-warning/5 border-warning/30" : "bg-success/5 border-success/30"}`}>
                    <Home className={`h-6 w-6 shrink-0 ${daysToMove !== null && daysToMove < 0 ? "text-destructive" : daysToMove !== null && daysToMove <= 14 ? "text-warning" : "text-success"}`} />
                    <div>
                      <p className="text-sm font-semibold">
                        {daysToMove === null ? "—" : daysToMove < 0 ? `Mudança há ${Math.abs(daysToMove)} dias` : daysToMove === 0 ? "Mudança hoje!" : `Faltam ${daysToMove} dias para a mudança`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Data prevista: {new Date(moveInDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                )}

                {allRows.length === 0 && !moveInDate ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    Aplique o calendário no Gantt para gerar datas e exibir a lista do cliente.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>COMEÇO / FECHAMENTO</TableHead>
                          <TableHead>TÉRMINO / ENTREGA</TableHead>
                          <TableHead className="flex-1">SERVIÇO / ITEM</TableHead>
                          <TableHead className="text-center">PRAZO / STATUS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const rows: React.ReactNode[] = [];
                          let mudancaInserted = !moveInDate;

                          for (const row of allRows) {
                            // Insert MUDANÇA before the first row whose sortDate < moveInDate
                            if (!mudancaInserted && moveInDate && row.sortDate < moveInDate) {
                              mudancaInserted = true;
                              rows.push(
                                <TableRow key="mudanca" className="bg-green-100 dark:bg-green-900/30 font-bold">
                                  <TableCell className="font-bold">{new Date(moveInDate + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                                  <TableCell className="font-bold">{new Date(moveInDate + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                                  <TableCell className="font-bold flex items-center gap-2">
                                    <Home className="h-4 w-4 text-green-700 dark:text-green-400" />
                                    MUDANÇA
                                  </TableCell>
                                  <TableCell className="text-center font-bold">0</TableCell>
                                </TableRow>
                              );
                            }

                            if (row.type === "closing") {
                              rows.push(
                                <TableRow key={`closing-${row.id}`} className="bg-blue-50/60 dark:bg-blue-950/20">
                                  <TableCell className="text-sm text-muted-foreground">{formatDate(row.start_date)}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{formatDate(row.end_date)}</TableCell>
                                  <TableCell className="text-sm font-medium flex items-center gap-2">
                                    <ShoppingBag className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    {row.name}
                                    {row.estimated_value != null && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        · {row.estimated_value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className={`text-[10px] px-1.5 ${closingStatusClass[row.status]}`}>
                                      {closingStatusLabel[row.status]}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            } else {
                              rows.push(
                                <TableRow key={row.id}>
                                  <TableCell className="text-sm">{formatDate(row.start_date)}</TableCell>
                                  <TableCell className="text-sm">{formatDate(row.end_date)}</TableCell>
                                  <TableCell className="text-sm font-medium">{row.name}</TableCell>
                                  <TableCell className="text-center text-sm">{row.duration_days ?? "—"}</TableCell>
                                </TableRow>
                              );
                            }
                          }
                          // If moveInDate is later than all rows
                          if (!mudancaInserted && moveInDate) {
                            rows.unshift(
                              <TableRow key="mudanca" className="bg-green-100 dark:bg-green-900/30 font-bold">
                                <TableCell className="font-bold">{new Date(moveInDate + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                                <TableCell className="font-bold">{new Date(moveInDate + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                                <TableCell className="font-bold flex items-center gap-2">
                                  <Home className="h-4 w-4 text-green-700 dark:text-green-400" />
                                  MUDANÇA
                                </TableCell>
                                <TableCell className="text-center font-bold">0</TableCell>
                              </TableRow>
                            );
                          }
                          return rows;
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })()}
        </TabsContent>

        {/* ===== FECHAMENTO CLIENTE ===== */}
        <TabsContent value="fechamento" className="space-y-4 mt-4">
          {(() => {
            const statusLabel: Record<string, string> = {
              em_cotacao: "Em cotação",
              aprovado: "Aprovado",
              comprado: "Comprado",
              entregue: "Entregue",
            };
            const statusClass: Record<string, string> = {
              em_cotacao: "bg-yellow-100 text-yellow-800 border-yellow-300",
              aprovado: "bg-primary/10 text-primary border-primary/30",
              comprado: "bg-blue-100 text-blue-800 border-blue-300",
              entregue: "bg-success/15 text-success border-success/30",
            };

            // Group by month of closing_date (computed at component level as closingGrouped)
            const grouped = closingGrouped;

            const openForm = (item?: ClosingScheduleItem) => {
              if (item) {
                setClosingEditing(item);
                setClosingDraft({
                  description: item.description,
                  delivery_date: item.delivery_date ?? "",
                  closing_date: item.closing_date ?? "",
                  delivery_time: item.delivery_time ?? "",
                  estimated_value: item.estimated_value?.toString() ?? "",
                  status: item.status,
                });
              } else {
                setClosingEditing(null);
                setClosingDraft({ description: "", delivery_date: "", closing_date: "", delivery_time: "", estimated_value: "", status: "em_cotacao" });
              }
              setClosingFormOpen(true);
            };

            const saveClosing = () => {
              const payload = {
                description: closingDraft.description,
                delivery_date: closingDraft.delivery_date || null,
                closing_date: closingDraft.closing_date || null,
                delivery_time: closingDraft.delivery_time || null,
                estimated_value: closingDraft.estimated_value ? Number(closingDraft.estimated_value) : null,
                status: closingDraft.status,
                display_order: 0,
              };
              if (closingEditing) {
                closingUpdate.mutate({ id: closingEditing.id, ...payload }, { onSuccess: () => setClosingFormOpen(false) });
              } else {
                closingCreate.mutate(payload as any, { onSuccess: () => setClosingFormOpen(false) });
              }
            };

            const today = new Date();
            const daysToMove = moveInDate ? differenceInDays(parseISO(moveInDate), today) : null;

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Cronograma de Fechamento do Cliente</h3>
                    <p className="text-xs text-muted-foreground">Obrigações que o cliente precisa cumprir para o cronograma ser executado</p>
                  </div>
                  <Button size="sm" onClick={() => openForm()}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Item
                  </Button>
                </div>

                {moveInDate && (
                  <div className={`rounded-lg border p-4 flex items-center gap-4 ${daysToMove !== null && daysToMove < 0 ? "bg-destructive/5 border-destructive/30" : daysToMove !== null && daysToMove <= 14 ? "bg-warning/5 border-warning/30" : "bg-success/5 border-success/30"}`}>
                    <Home className={`h-6 w-6 shrink-0 ${daysToMove !== null && daysToMove < 0 ? "text-destructive" : daysToMove !== null && daysToMove <= 14 ? "text-warning" : "text-success"}`} />
                    <div>
                      <p className="text-sm font-semibold">
                        {daysToMove === null ? "—" : daysToMove < 0 ? `Mudança há ${Math.abs(daysToMove)} dias` : daysToMove === 0 ? "Mudança hoje!" : `Faltam ${daysToMove} dias para a mudança`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Data prevista: {new Date(moveInDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                )}

                {closingLoading ? (
                  <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
                ) : closingItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Nenhuma obrigação cadastrada.<br />
                    Adicione itens que o cliente precisa fechar (marcenaria, mármores, eletros, etc.).
                  </div>
                ) : (
                  <div className="space-y-6">
                    {grouped.map(([monthLabel, monthItems]) => {
                      const monthTotal = monthItems.reduce((s, i) => s + (i.estimated_value ?? 0), 0);
                      return (
                        <div key={monthLabel}>
                          <div className="flex items-center justify-between px-1 mb-2">
                            <span className="text-xs font-bold tracking-widest text-muted-foreground">{monthLabel}</span>
                            {monthTotal > 0 && (
                              <span className="text-xs font-semibold text-primary">
                                Total: {monthTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                            )}
                          </div>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead>DATA DE ENTREGA</TableHead>
                                  <TableHead>DATA LIMITE DE FECHAMENTO</TableHead>
                                  <TableHead className="flex-1">DESCRIÇÃO</TableHead>
                                  <TableHead>PRAZO DE ENTREGA</TableHead>
                                  <TableHead className="text-right">VALOR PREVISTO</TableHead>
                                  <TableHead>STATUS</TableHead>
                                  <TableHead className="w-16" />
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {monthItems.map(item => (
                                  <TableRow key={item.id}>
                                    <TableCell className="text-sm">{item.delivery_date ? new Date(item.delivery_date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                                    <TableCell className="text-sm">{item.closing_date ? new Date(item.closing_date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                                    <TableCell className="text-sm font-medium">{item.description}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{item.delivery_time ?? "—"}</TableCell>
                                    <TableCell className="text-sm text-right">
                                      {item.estimated_value != null ? item.estimated_value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={`text-[10px] px-1.5 ${statusClass[item.status]}`}>
                                        {statusLabel[item.status]}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openForm(item)}>
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => closingRemove.mutate(item.id)}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add/Edit Dialog */}
                <Dialog open={closingFormOpen} onOpenChange={setClosingFormOpen}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{closingEditing ? "Editar Item" : "Novo Item de Fechamento"}</DialogTitle>
                      <DialogDescription>Obrigação que o cliente deve cumprir para a obra prosseguir no prazo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium">Descrição *</label>
                        <input className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm" value={closingDraft.description} onChange={e => setClosingDraft(d => ({ ...d, description: e.target.value }))} placeholder="Ex: Marcenaria — armários da cozinha" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium">Data limite de fechamento</label>
                          <input type="date" className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm" value={closingDraft.closing_date} onChange={e => setClosingDraft(d => ({ ...d, closing_date: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Data de entrega no site</label>
                          <input type="date" className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm" value={closingDraft.delivery_date} onChange={e => setClosingDraft(d => ({ ...d, delivery_date: e.target.value }))} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium">Prazo de entrega</label>
                          <input className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm" value={closingDraft.delivery_time} onChange={e => setClosingDraft(d => ({ ...d, delivery_time: e.target.value }))} placeholder="Ex: 60 dias úteis" />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Valor previsto (R$)</label>
                          <input type="number" className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm" value={closingDraft.estimated_value} onChange={e => setClosingDraft(d => ({ ...d, estimated_value: e.target.value }))} placeholder="0" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Status</label>
                        <select className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm" value={closingDraft.status} onChange={e => setClosingDraft(d => ({ ...d, status: e.target.value as ClosingScheduleItem["status"] }))}>
                          <option value="em_cotacao">Em cotação</option>
                          <option value="aprovado">Aprovado</option>
                          <option value="comprado">Comprado</option>
                          <option value="entregue">Entregue</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setClosingFormOpen(false)}>Cancelar</Button>
                      <Button onClick={saveClosing} disabled={!closingDraft.description.trim() || closingCreate.isPending || closingUpdate.isPending}>
                        {closingEditing ? "Salvar" : "Adicionar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      <ScheduleTaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={async (data) => {
          if (editing) {
            await update.mutateAsync({ id: editing.id as string, ...data });
          } else {
            await create.mutateAsync(data as any);
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
        onSubmit={async (data) => {
          if (editingActivity?.id) {
            const { id: _ignore, ...rest } = data as any;
            await updateActivity.mutateAsync({ id: editingActivity.id, ...rest });
          } else {
            const { id: _ignore, ...rest } = data as any;
            await createActivity.mutateAsync(rest);
          }
          setEditingActivity(null);
        }}
        onCascade={(updates) => {
          batchUpdateDates.mutate(updates);
        }}
        initialData={editingActivity}
        allActivities={activities}
        projectId={projectId}
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

      <ApplyCalendarDialog
        open={calendarDialogOpen}
        onOpenChange={setCalendarDialogOpen}
        activities={activities}
        defaultStartDate={projectStartDate}
        onApply={handleApplyCalendar}
        isApplying={batchUpdateDates.isPending}
      />

      <ScheduleScenariosDialog
        open={scenariosDialogOpen}
        onOpenChange={setScenariosDialogOpen}
        projectId={projectId}
        projectStartDate={projectStartDate}
        activities={activities}
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
              const norm = (s: string) => (s || "").trim().toLowerCase();
              const activityByName = new Map(activities.map(a => [norm(a.name), a]));
              const updates: { id: string; start_date: string; end_date: string }[] = [];
              const unmatched: string[] = [];
              for (const s of aiSchedule) {
                const act = activityByName.get(norm(s.activity_name));
                const actStart = addDays(startDate, (s.week_number - 1) * 7);
                const actEnd = addDays(actStart, s.duration_days);
                if (act) {
                  updates.push({ id: act.id, start_date: format(actStart, "yyyy-MM-dd"), end_date: format(actEnd, "yyyy-MM-dd") });
                } else {
                  unmatched.push(s.activity_name);
                }
              }
              if (updates.length > 0) {
                batchUpdateDates.mutate(updates);
              }
              if (unmatched.length > 0) {
                toast({
                  title: `${updates.length} atividades atualizadas, ${unmatched.length} não encontradas`,
                  description: `Crie manualmente: ${unmatched.slice(0, 3).join(", ")}${unmatched.length > 3 ? "..." : ""}`,
                  variant: "destructive",
                });
              } else if (updates.length > 0) {
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
