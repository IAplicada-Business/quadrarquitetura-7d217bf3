import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScheduleTasks } from "@/hooks/useScheduleTasks";
import { useScopeItems } from "@/hooks/useScopeItems";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ScheduleTaskForm } from "./ScheduleTaskForm";
import { ProjectPendingTab } from "./ProjectPendingTab";
import { GanttChart } from "./GanttChart";
import { ClientScheduleView } from "./ClientScheduleView";
import { useQueryClient } from "@tanstack/react-query";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [ganttView, setGanttView] = useState<"week" | "month">("week");
  const [filterDiscipline, setFilterDiscipline] = useState("all");
  const [importing, setImporting] = useState(false);

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    items.forEach((t: any) => {
      const d = t.discipline || (t.scope_items as any)?.discipline;
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filterDiscipline === "all") return items;
    return items.filter((t: any) => {
      const d = t.discipline || (t.scope_items as any)?.discipline;
      return d === filterDiscipline;
    });
  }, [items, filterDiscipline]);

  const clientTasks = useMemo(() =>
    items.filter((t: any) => t.is_client_visible !== false).map((t: any) => ({
      id: t.id,
      task_name: t.task_name,
      start_date: t.start_date,
      end_date: t.end_date,
      status: t.status,
      discipline: t.discipline || (t.scope_items as any)?.discipline || null,
      color: t.color,
      progress_percentage: t.progress_percentage,
    })),
  [items]);

  const total = items.length;
  const inProgress = items.filter((t: any) => t.status === "em_execucao").length;
  const overdue = items.filter((t: any) => t.status === "atrasado").length;
  const completed = items.filter((t: any) => t.status === "executado").length;

  const handleEdit = (task: any) => {
    setEditing(task as Record<string, unknown>);
    setFormOpen(true);
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

      // Check which disciplines already exist
      const existingDisciplines = new Set(items.map((t: any) => t.discipline || (t.scope_items as any)?.discipline));
      const newItems = contractedItems.filter(s => !existingDisciplines.has(s.discipline));

      if (newItems.length === 0) {
        toast({ title: "Todas as disciplinas já estão no cronograma." });
        return;
      }

      const inserts = newItems.map((s, idx) => ({
        project_id: projectId,
        user_id: user.id,
        task_name: s.discipline,
        discipline: s.discipline,
        scope_item_id: s.id,
        status: "planejado",
        order_index: items.length + idx + 1,
        is_client_visible: true,
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
            <div className="flex gap-2">
              <Select value={ganttView} onValueChange={(v) => setGanttView(v as any)}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDiscipline} onValueChange={setFilterDiscipline}>
                <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Disciplina" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {disciplines.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
          ) : (
            <GanttChart
              tasks={filteredItems.map((t: any) => ({
                id: t.id, task_name: t.task_name, start_date: t.start_date, end_date: t.end_date,
                status: t.status, discipline: t.discipline || (t.scope_items as any)?.discipline || null,
                supplier_name: t.supplier_name, progress_percentage: t.progress_percentage,
                color: t.color, requires_presence: t.requires_presence, is_daily_detail: t.is_daily_detail,
              }))}
              onEdit={handleEdit}
              viewMode={ganttView}
            />
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
    </div>
  );
}
