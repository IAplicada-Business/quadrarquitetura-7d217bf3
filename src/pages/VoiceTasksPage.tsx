import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceTasks, VoiceTask } from "@/hooks/useVoiceTasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, Trash2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

const priorityColors: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-primary/10 text-primary",
  alta: "bg-warning/10 text-warning",
  urgente: "bg-destructive/10 text-destructive",
};

const statusIcons: Record<string, any> = {
  pendente: Clock,
  concluido: CheckCircle2,
};

const categoryLabels: Record<string, string> = {
  cronograma: "Cronograma",
  escopo: "Escopo",
  orcamentos: "Orçamentos",
  materiais: "Materiais",
  pendencias: "Pendências",
  financeiro: "Financeiro",
  compras: "Compras",
  documentos: "Documentos",
};

export default function VoiceTasksPage() {
  const { user } = useAuth();
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name").eq("user_id", user!.id).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { tasks, isLoading, update, remove } = useVoiceTasks(filterProject === "all" ? undefined : filterProject);

  const filtered = tasks.filter((t) => {
    if (filterType !== "all" && t.task_type !== filterType) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by project
  const grouped = filtered.reduce<Record<string, { name: string; tasks: VoiceTask[] }>>((acc, task) => {
    const proj = projects.find((p) => p.id === task.project_id);
    const name = proj?.name || "Projeto desconhecido";
    if (!acc[task.project_id]) acc[task.project_id] = { name, tasks: [] };
    acc[task.project_id].tasks.push(task);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-display">Tarefas de Voz</h1>
          <p className="text-sm text-muted-foreground">Tarefas criadas pelo assistente de voz IA</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Mic className="h-3 w-3" />
          {tasks.length} tarefas
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 h-9" />
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Projeto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="projeto">Projeto</SelectItem>
            <SelectItem value="obra">Obra</SelectItem>
            <SelectItem value="compras">Compras</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
            <SelectItem value="administrativo">Administrativo</SelectItem>
            <SelectItem value="geral">Geral</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grouped tasks */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mic className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhuma tarefa de voz encontrada.</p>
            <p className="text-sm text-muted-foreground">Use o assistente de voz no header para criar tarefas.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([projectId, group]) => (
          <Card key={projectId}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{group.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.tasks
                .filter((t) => !t.parent_id)
                .map((task) => {
                  const subtasks = group.tasks.filter((t) => t.parent_id === task.id);
                  const StatusIcon = statusIcons[task.status] || Clock;
                  return (
                    <div key={task.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <StatusIcon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{task.title}</p>
                            {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <Badge variant="outline" className="text-[10px] h-5">{categoryLabels[task.category] || task.category}</Badge>
                              <Badge className={`text-[10px] h-5 ${priorityColors[task.priority]}`}>{task.priority}</Badge>
                              {task.responsible && <span className="text-[10px] text-muted-foreground">→ {task.responsible}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {task.status === "pendente" && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => update({ id: task.id, status: "concluido" })}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(task.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {subtasks.length > 0 && (
                        <div className="ml-6 mt-2 space-y-1.5 border-l-2 border-border pl-3">
                          {subtasks.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className={sub.status === "concluido" ? "line-through text-muted-foreground" : ""}>{sub.title}</span>
                                {sub.responsible && <span className="text-muted-foreground">→ {sub.responsible}</span>}
                              </div>
                              <div className="flex items-center gap-1">
                                {sub.status === "pendente" && (
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => update({ id: sub.id, status: "concluido" })}>
                                    <CheckCircle2 className="h-3 w-3 text-success" />
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => remove(sub.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
