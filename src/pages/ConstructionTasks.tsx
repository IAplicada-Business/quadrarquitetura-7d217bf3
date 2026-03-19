import { useState, useMemo, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ConstructionTaskForm } from "@/components/construction/ConstructionTaskForm";
import { MultiSelectFilter } from "@/components/construction/MultiSelectFilter";
import { Plus, Pencil, Trash2, ListChecks, Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronDown, PauseCircle, List, LayoutGrid, Filter, Upload, Sparkles } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { format, isBefore, startOfDay } from "date-fns";

const statusLabels: Record<string, string> = {
  planejado: "Planejado",
  em_execucao: "Em Execução",
  executado: "Executado",
  atrasado: "Atrasado",
  pendencia: "Pendência",
};

const statusColors: Record<string, string> = {
  planejado: "bg-muted text-muted-foreground",
  em_execucao: "bg-blue-100 text-blue-800",
  executado: "bg-green-100 text-green-800",
  atrasado: "bg-red-100 text-red-800",
  pendencia: "bg-yellow-100 text-yellow-800",
};

const ALL_STATUSES = ["planejado", "em_execucao", "executado", "atrasado", "pendencia"];

export default function ConstructionTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Record<string, unknown> | null>(null);
  const [parentTaskForSub, setParentTaskForSub] = useState<{ id: string; project_id: string; task_name: string } | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Filter states
  const [filterDisciplines, setFilterDisciplines] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterResponsibles, setFilterResponsibles] = useState<string[]>([]);
  const [filterEnvironments, setFilterEnvironments] = useState<string[]>([]);
  const [groupByDiscipline, setGroupByDiscipline] = useState(false);
  const [showPendencias, setShowPendencias] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["all_schedule_tasks", selectedProject],
    queryFn: async () => {
      let q = supabase.from("schedule_tasks").select("*, projects(name)").order("start_date", { ascending: true });
      if (selectedProject !== "all") q = q.eq("project_id", selectedProject);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Extract unique filter options from loaded tasks
  const filterOptions = useMemo(() => {
    const disciplines = new Set<string>();
    const responsibles = new Set<string>();
    const environments = new Set<string>();
    tasks.forEach((t: any) => {
      if (t.discipline) disciplines.add(t.discipline);
      if (t.environment) environments.add(t.environment);
      if (t.supplier_name) {
        t.supplier_name.split(",").forEach((s: string) => {
          const trimmed = s.trim();
          if (trimmed) responsibles.add(trimmed);
        });
      }
    });
    return {
      disciplines: Array.from(disciplines).sort(),
      responsibles: Array.from(responsibles).sort(),
      environments: Array.from(environments).sort(),
      statuses: ALL_STATUSES.map((s) => ({ value: s, label: statusLabels[s] })),
    };
  }, [tasks]);

  const today = startOfDay(new Date());

  // Apply all filters
  const filteredTasks = useMemo(() => {
    let result = tasks as any[];

    if (filterDisciplines.length > 0) {
      result = result.filter((t: any) => t.discipline && filterDisciplines.includes(t.discipline));
    }
    if (filterStatuses.length > 0) {
      result = result.filter((t: any) => filterStatuses.includes(t.status));
    }
    if (filterResponsibles.length > 0) {
      result = result.filter((t: any) => {
        if (!t.supplier_name) return false;
        const names = t.supplier_name.split(",").map((s: string) => s.trim());
        return names.some((n: string) => filterResponsibles.includes(n));
      });
    }
    if (filterEnvironments.length > 0) {
      result = result.filter((t: any) => t.environment && filterEnvironments.includes(t.environment));
    }
    if (showPendencias) {
      result = result.filter((t: any) => {
        if (t.status === "pendencia") return true;
        if (t.status !== "executado" && t.end_date && isBefore(new Date(t.end_date), today)) return true;
        return false;
      });
    }

    return result;
  }, [tasks, filterDisciplines, filterStatuses, filterResponsibles, filterEnvironments, showPendencias, today]);

  const parentTasks = useMemo(() => filteredTasks.filter((t: any) => !t.parent_id), [filteredTasks]);
  const subtasksByParent = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredTasks.forEach((t: any) => {
      if (t.parent_id) {
        if (!map[t.parent_id]) map[t.parent_id] = [];
        map[t.parent_id].push(t);
      }
    });
    return map;
  }, [filteredTasks]);

  // Grouped by discipline
  const tasksByDiscipline = useMemo(() => {
    if (!groupByDiscipline) return {};
    const map: Record<string, any[]> = {};
    parentTasks.forEach((t: any) => {
      const disc = t.discipline || "Sem disciplina";
      if (!map[disc]) map[disc] = [];
      map[disc].push(t);
    });
    return map;
  }, [parentTasks, groupByDiscipline]);

  // Task name lookup for dependencies column
  const taskNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    tasks.forEach((t: any) => { map[t.id] = t.task_name; });
    return map;
  }, [tasks]);

  const toggleExpand = (id: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createTask = useMutation({
    mutationFn: async (item: Record<string, unknown>) => {
      const projectId = item.project_id as string;
      if (!projectId) throw new Error("Selecione um projeto");
      const { error } = await supabase.from("schedule_tasks").insert({
        task_name: item.task_name as string,
        description: item.description as string | undefined,
        start_date: item.start_date as string | undefined,
        end_date: item.end_date as string | undefined,
        status: (item.status as string) ?? "planejado",
        payment_note: item.payment_note as string | undefined,
        supplier_name: item.supplier_name as string | undefined,
        discipline: item.discipline as string | undefined,
        environment: item.environment as string | undefined,
        estimated_days: item.estimated_days as number | undefined,
        dependencies: item.dependencies as string[] | undefined,
        materials: item.materials as any,
        progress_percentage: item.progress_percentage as number | undefined,
        project_id: projectId,
        user_id: user!.id,
        parent_id: (item.parent_id as string) || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_schedule_tasks"] });
      toast({ title: "Atividade criada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { project_id, parent_id, ...rest } = updates;
      const payload: Record<string, unknown> = { ...rest };
      if (project_id) payload.project_id = project_id as string;
      const { error } = await supabase.from("schedule_tasks").update(payload as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_schedule_tasks"] });
      toast({ title: "Atividade atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_schedule_tasks"] });
      toast({ title: "Atividade removida" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Metrics count ALL tasks (including subtasks)
  const metrics = useMemo(() => {
    const all = tasks as any[];
    const total = all.length;
    const emExecucao = all.filter((t) => t.status === "em_execucao").length;
    const atrasadas = all.filter((t) => t.status !== "executado" && t.end_date && isBefore(new Date(t.end_date), today)).length;
    const concluidas = all.filter((t) => t.status === "executado").length;
    const pendencias = all.filter((t) => t.status === "pendencia").length;
    return { total, emExecucao, atrasadas, concluidas, pendencias };
  }, [tasks, today]);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id as string, ...data });
    } else {
      createTask.mutate(data);
    }
    setEditingTask(null);
    setParentTaskForSub(null);
  };

  const quickComplete = (id: string) => {
    updateTask.mutate({ id, status: "executado", progress_percentage: 100 });
  };

  const openNewSubtask = (task: any) => {
    setEditingTask(null);
    setParentTaskForSub({ id: task.id, project_id: task.project_id, task_name: task.task_name });
    setFormOpen(true);
    setExpandedTasks((prev) => new Set(prev).add(task.id));
  };

  const allTasksForForm = useMemo(() => {
    return tasks.map((t: any) => ({
      id: t.id,
      task_name: t.task_name,
      end_date: t.end_date,
      parent_id: t.parent_id,
    }));
  }, [tasks]);

  const getDependencyNames = (deps: string[] | null) => {
    if (!deps || deps.length === 0) return "—";
    return deps.map((id) => taskNameMap[id] || "?").join(", ");
  };

  const COL_COUNT = 11 + (showPendencias ? 1 : 0);

  const renderTaskRow = (t: any, isSubtask = false) => {
    const subCount = subtasksByParent[t.id]?.length || 0;
    const isExpanded = expandedTasks.has(t.id);
    const isCompleted = t.status === "executado";

    return (
      <TableRow key={t.id} className={isSubtask ? "bg-muted/30" : ""}>
        {showPendencias && (
          <TableCell className="w-10">
            <Checkbox
              checked={isCompleted}
              disabled={isCompleted || updateTask.isPending}
              onCheckedChange={() => quickComplete(t.id)}
            />
          </TableCell>
        )}
        <TableCell className="font-medium">
          <div className="flex items-center gap-1">
            {!isSubtask && subCount > 0 && (
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => toggleExpand(t.id)}>
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            )}
            {!isSubtask && subCount === 0 && <span className="w-5" />}
            {isSubtask && <span className="w-5 ml-3 text-muted-foreground">↳</span>}
            <span>{t.task_name}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm">{t.environment ?? "—"}</TableCell>
        <TableCell className="text-sm">{t.discipline ?? "—"}</TableCell>
        <TableCell className="text-sm">{t.supplier_name ?? "—"}</TableCell>
        <TableCell className="text-sm max-w-[150px] truncate" title={getDependencyNames(t.dependencies)}>
          {getDependencyNames(t.dependencies)}
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className={statusColors[t.status] ?? ""}>
            {statusLabels[t.status] ?? t.status}
          </Badge>
        </TableCell>
        <TableCell className="text-sm">{t.start_date ? format(new Date(t.start_date), "dd/MM/yyyy") : "—"}</TableCell>
        <TableCell className="text-sm">{t.end_date ? format(new Date(t.end_date), "dd/MM/yyyy") : "—"}</TableCell>
        <TableCell className="text-sm text-center">{t.estimated_days ?? "—"}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Progress value={Number(t.progress_percentage ?? 0)} className="h-2 w-16" />
            <span className="text-xs text-muted-foreground">{t.progress_percentage ?? 0}%</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            {!isSubtask && (
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Adicionar subtarefa" onClick={() => openNewSubtask(t)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
              setParentTaskForSub(isSubtask ? { id: t.parent_id, project_id: t.project_id, task_name: "" } : null);
              setEditingTask(t);
              setFormOpen(true);
            }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTask.mutate(t.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        {showPendencias && <TableHead className="w-10">✓</TableHead>}
        <TableHead>Atividade</TableHead>
        <TableHead>Ambiente</TableHead>
        <TableHead>Disciplina</TableHead>
        <TableHead>Responsável</TableHead>
        <TableHead>Depende de</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Início</TableHead>
        <TableHead>Fim</TableHead>
        <TableHead>Prazo (dias)</TableHead>
        <TableHead>Progresso</TableHead>
        <TableHead className="w-28">Ações</TableHead>
      </TableRow>
    </TableHeader>
  );

  const renderRows = (taskList: any[]) => (
    taskList.map((t: any) => (
      <Fragment key={t.id}>
        {renderTaskRow(t)}
        {expandedTasks.has(t.id) && subtasksByParent[t.id]?.map((sub: any) => renderTaskRow(sub, true))}
      </Fragment>
    ))
  );

  const renderTableBody = () => {
    if (isLoading) {
      return <TableRow><TableCell colSpan={COL_COUNT} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>;
    }
    if (parentTasks.length === 0) {
      return <TableRow><TableCell colSpan={COL_COUNT} className="text-center py-8 text-muted-foreground">Nenhuma atividade encontrada</TableCell></TableRow>;
    }

    if (groupByDiscipline) {
      return Object.entries(tasksByDiscipline).sort(([a], [b]) => a.localeCompare(b)).map(([discipline, dTasks]) => (
        <Fragment key={discipline}>
          <TableRow className="bg-accent/50">
            <TableCell colSpan={COL_COUNT} className="font-semibold text-sm py-2">
              {discipline} ({dTasks.length})
            </TableCell>
          </TableRow>
          {renderRows(dTasks)}
        </Fragment>
      ));
    }

    return renderRows(parentTasks);
  };

  const hasActiveFilters = filterDisciplines.length > 0 || filterStatuses.length > 0 || filterResponsibles.length > 0 || filterEnvironments.length > 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarefas por Obra</h1>
        <Button onClick={() => { setEditingTask(null); setParentTaskForSub(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova Atividade
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="flex items-center gap-3 p-4">
          <ListChecks className="h-8 w-8 text-muted-foreground" />
          <div><p className="text-2xl font-bold">{metrics.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <Clock className="h-8 w-8 text-blue-500" />
          <div><p className="text-2xl font-bold">{metrics.emExecucao}</p><p className="text-xs text-muted-foreground">Em Execução</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div><p className="text-2xl font-bold">{metrics.atrasadas}</p><p className="text-xs text-muted-foreground">Atrasadas</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <PauseCircle className="h-8 w-8 text-yellow-500" />
          <div><p className="text-2xl font-bold">{metrics.pendencias}</p><p className="text-xs text-muted-foreground">Pendências</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div><p className="text-2xl font-bold">{metrics.concluidas}</p><p className="text-xs text-muted-foreground">Concluídas</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-56 h-9"><SelectValue placeholder="Filtrar por obra" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Obras</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <MultiSelectFilter
          label="Disciplina"
          options={filterOptions.disciplines}
          selected={filterDisciplines}
          onChange={setFilterDisciplines}
        />
        <MultiSelectFilter
          label="Status"
          options={ALL_STATUSES}
          selected={filterStatuses}
          onChange={setFilterStatuses}
        />
        <MultiSelectFilter
          label="Responsável"
          options={filterOptions.responsibles}
          selected={filterResponsibles}
          onChange={setFilterResponsibles}
        />
        <MultiSelectFilter
          label="Ambiente"
          options={filterOptions.environments}
          selected={filterEnvironments}
          onChange={setFilterEnvironments}
        />

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={showPendencias ? "default" : "outline"}
            size="sm"
            className="h-9"
            onClick={() => setShowPendencias(!showPendencias)}
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Pendências
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setGroupByDiscipline(!groupByDiscipline)}
          >
            {groupByDiscipline ? <List className="h-3.5 w-3.5 mr-1" /> : <LayoutGrid className="h-3.5 w-3.5 mr-1" />}
            {groupByDiscipline ? "Ver por lista" : "Agrupar por disciplina"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            {renderTableHeader()}
            <TableBody>
              {renderTableBody()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConstructionTaskForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) { setParentTaskForSub(null); setEditingTask(null); } }}
        onSubmit={handleSubmit}
        initialData={editingTask}
        isLoading={createTask.isPending || updateTask.isPending}
        projects={projects}
        parentTask={parentTaskForSub}
        allTasks={allTasksForForm}
      />
    </div>
  );
}
