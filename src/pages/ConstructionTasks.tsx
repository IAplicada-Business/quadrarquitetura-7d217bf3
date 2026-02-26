import { useState, useMemo } from "react";
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
import { ConstructionTaskForm } from "@/components/construction/ConstructionTaskForm";
import { Plus, Pencil, Trash2, ListChecks, Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronDown } from "lucide-react";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  planejado: "Planejado",
  em_execucao: "Em Execução",
  executado: "Executado",
  atrasado: "Atrasado",
};

const statusColors: Record<string, string> = {
  planejado: "bg-muted text-muted-foreground",
  em_execucao: "bg-blue-100 text-blue-800",
  executado: "bg-green-100 text-green-800",
  atrasado: "bg-red-100 text-red-800",
};

export default function ConstructionTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Record<string, unknown> | null>(null);
  const [parentTaskForSub, setParentTaskForSub] = useState<{ id: string; project_id: string; task_name: string } | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

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

  const parentTasks = useMemo(() => tasks.filter((t: any) => !t.parent_id), [tasks]);
  const subtasksByParent = useMemo(() => {
    const map: Record<string, any[]> = {};
    tasks.forEach((t: any) => {
      if (t.parent_id) {
        if (!map[t.parent_id]) map[t.parent_id] = [];
        map[t.parent_id].push(t);
      }
    });
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
        start_date: item.start_date as string | undefined,
        end_date: item.end_date as string | undefined,
        status: (item.status as string) ?? "planejado",
        payment_note: item.payment_note as string | undefined,
        supplier_name: item.supplier_name as string | undefined,
        discipline: item.discipline as string | undefined,
        progress_percentage: item.progress_percentage as number | undefined,
        project_id: projectId,
        user_id: user!.id,
        parent_id: (item.parent_id as string) || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_schedule_tasks"] });
      toast({ title: "Tarefa criada" });
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
      toast({ title: "Tarefa atualizada" });
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
      toast({ title: "Tarefa removida" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const metrics = useMemo(() => {
    const total = parentTasks.length;
    const emExecucao = parentTasks.filter((t: any) => t.status === "em_execucao").length;
    const atrasadas = parentTasks.filter((t: any) => t.status === "atrasado").length;
    const concluidas = parentTasks.filter((t: any) => t.status === "executado").length;
    return { total, emExecucao, atrasadas, concluidas };
  }, [parentTasks]);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id as string, ...data });
    } else {
      createTask.mutate(data);
    }
    setEditingTask(null);
    setParentTaskForSub(null);
  };

  const openNewSubtask = (task: any) => {
    setEditingTask(null);
    setParentTaskForSub({ id: task.id, project_id: task.project_id, task_name: task.task_name });
    setFormOpen(true);
    setExpandedTasks((prev) => new Set(prev).add(task.id));
  };

  const renderTaskRow = (t: any, isSubtask = false) => {
    const subCount = subtasksByParent[t.id]?.length || 0;
    const isExpanded = expandedTasks.has(t.id);

    return (
      <TableRow key={t.id} className={isSubtask ? "bg-muted/30" : ""}>
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
        <TableCell className="text-muted-foreground text-sm">{t.projects?.name ?? "—"}</TableCell>
        <TableCell className="text-sm">{t.discipline ?? "—"}</TableCell>
        <TableCell className="text-sm">{t.supplier_name ?? "—"}</TableCell>
        <TableCell>
          <Badge variant="secondary" className={statusColors[t.status] ?? ""}>
            {statusLabels[t.status] ?? t.status}
          </Badge>
        </TableCell>
        <TableCell className="text-sm">{t.start_date ? format(new Date(t.start_date), "dd/MM/yyyy") : "—"}</TableCell>
        <TableCell className="text-sm">{t.end_date ? format(new Date(t.end_date), "dd/MM/yyyy") : "—"}</TableCell>
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarefas por Obra</h1>
        <Button onClick={() => { setEditingTask(null); setParentTaskForSub(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova Tarefa
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div><p className="text-2xl font-bold">{metrics.concluidas}</p><p className="text-xs text-muted-foreground">Concluídas</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Filtrar por obra" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Obras</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarefa</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Responsáveis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="w-28">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : parentTasks.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma tarefa encontrada</TableCell></TableRow>
              ) : (
                parentTasks.map((t: any) => (
                  <>
                    {renderTaskRow(t)}
                    {expandedTasks.has(t.id) && subtasksByParent[t.id]?.map((sub: any) => renderTaskRow(sub, true))}
                  </>
                ))
              )}
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
      />
    </div>
  );
}
