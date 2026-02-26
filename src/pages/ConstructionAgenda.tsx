import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isToday, isTomorrow, isThisWeek, parseISO, isPast, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ClipboardList, MapPin, Filter } from "lucide-react";
import { useScheduleTasks } from "@/hooks/useScheduleTasks";
import { useSiteVisits } from "@/hooks/useSiteVisits";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AgendaItem {
  id: string;
  type: "tarefa" | "visita";
  title: string;
  projectName: string;
  projectId: string;
  date: string;
  status: string;
  extra?: string;
}

export default function ConstructionAgenda() {
  const { user } = useAuth();
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Fetch all projects for filter
  const { data: projects } = useQuery({
    queryKey: ["projects_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all schedule_tasks (no project filter to get all)
  const { items: allTasks, isLoading: loadingTasks } = useScheduleTasks(filterProject === "all" ? undefined : filterProject);
  const { visits, isLoading: loadingVisits } = useSiteVisits(filterProject === "all" ? undefined : filterProject);

  // We need to fetch tasks for all projects when filterProject is "all"
  const { data: globalTasks } = useQuery({
    queryKey: ["all_schedule_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_tasks")
        .select("*, projects(name)")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && filterProject === "all",
  });

  const agendaItems = useMemo(() => {
    const items: AgendaItem[] = [];

    const tasksSource = filterProject === "all" ? (globalTasks ?? []) : allTasks;

    tasksSource.forEach((t: any) => {
      const date = t.end_date || t.start_date;
      if (!date) return;
      items.push({
        id: t.id,
        type: "tarefa",
        title: t.task_name,
        projectName: t.projects?.name || "—",
        projectId: t.project_id,
        date,
        status: t.status || "planejado",
        extra: t.discipline || undefined,
      });
    });

    visits.forEach((v) => {
      items.push({
        id: v.id,
        type: "visita",
        title: `${v.visit_type}`,
        projectName: v.projects?.name || "—",
        projectId: v.project_id,
        date: v.visit_date,
        status: "agendado",
        extra: v.notes || undefined,
      });
    });

    if (filterType !== "all") {
      return items.filter((i) => i.type === filterType);
    }

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [globalTasks, allTasks, visits, filterProject, filterType]);

  const grouped = useMemo(() => {
    const groups: Record<string, AgendaItem[]> = {};

    agendaItems.forEach((item) => {
      const d = parseISO(item.date);
      let label: string;
      if (isToday(d)) label = "Hoje";
      else if (isTomorrow(d)) label = "Amanhã";
      else if (isPast(d)) label = "Atrasado";
      else if (isThisWeek(d, { weekStartsOn: 1 })) label = "Esta semana";
      else label = format(d, "dd/MM/yyyy");

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    // Sort groups: Atrasado first, Hoje, Amanhã, Esta semana, then dates
    const order = ["Atrasado", "Hoje", "Amanhã", "Esta semana"];
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });

    return sorted;
  }, [agendaItems]);

  const isLoading = loadingTasks || loadingVisits;

  const statusColor = (status: string) => {
    switch (status) {
      case "concluido": return "default";
      case "em_andamento": return "secondary";
      case "atrasado": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground text-sm">Tarefas, visitas e compromissos organizados por data</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="tarefa">Tarefas</SelectItem>
              <SelectItem value="visita">Visitas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mb-3 opacity-40" />
            <p>Nenhum compromisso encontrado</p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(([label, items]) => (
          <div key={label}>
            <h2 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${label === "Atrasado" ? "text-destructive" : "text-muted-foreground"}`}>
              {label}
            </h2>
            <div className="space-y-2">
              {items.map((item) => (
                <Card key={item.id} className={`${label === "Atrasado" ? "border-destructive/30" : ""}`}>
                  <CardContent className="flex items-center gap-4 py-3 px-4">
                    <div className="shrink-0">
                      {item.type === "tarefa" ? (
                        <ClipboardList className="h-5 w-5 text-primary" />
                      ) : (
                        <MapPin className="h-5 w-5 text-accent-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.projectName}
                        {item.extra && ` · ${item.extra}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusColor(item.status)} className="text-xs capitalize">
                        {item.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(parseISO(item.date), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
