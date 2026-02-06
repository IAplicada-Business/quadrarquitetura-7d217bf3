import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScheduleTasks } from "@/hooks/useScheduleTasks";
import { useScopeItems } from "@/hooks/useScopeItems";
import { ScheduleTaskForm } from "./ScheduleTaskForm";
import { ProjectPendingTab } from "./ProjectPendingTab";

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
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  // Group by discipline
  const grouped = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    for (const task of items) {
      const discipline = (task as Record<string, unknown> & { scope_items?: { discipline: string } }).scope_items?.discipline || "Sem Disciplina";
      if (!groups[discipline]) groups[discipline] = [];
      groups[discipline].push(task);
    }
    return groups;
  }, [items]);

  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs defaultValue="cronograma">
        <TabsList>
          <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
          <TabsTrigger value="pendencias">Pendências</TabsTrigger>
        </TabsList>

        <TabsContent value="cronograma" className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-display">Cronograma da Obra</h3>
          <p className="text-sm text-muted-foreground">Etapas agrupadas por disciplina com status de execução</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova Etapa
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Nenhuma etapa cadastrada no cronograma.
        </div>
      ) : (
        Object.entries(grouped).map(([discipline, tasks]) => (
          <div key={discipline} className="space-y-2">
            <h4 className="font-semibold text-sm text-display flex items-center gap-2">
              <Badge variant="outline">{discipline}</Badge>
              <span className="text-xs text-muted-foreground">({tasks.length} etapas)</span>
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const st = statusConfig[task.status || "planejado"];
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="text-muted-foreground">{task.order_index || "—"}</TableCell>
                      <TableCell className="font-medium">{task.task_name}</TableCell>
                      <TableCell>{formatDate(task.start_date)}</TableCell>
                      <TableCell>{formatDate(task.end_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={st?.className}>{st?.label || task.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{task.payment_note || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(task as Record<string, unknown>); setFormOpen(true); }}>
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
          </div>
        ))
      )}

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
        </TabsContent>

        <TabsContent value="pendencias" className="mt-4">
          <ProjectPendingTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
