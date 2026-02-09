import { useState } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle, Hammer, MapPin, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ProjectForm } from "@/components/projects/ProjectForm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SiteTracking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["active_projects_tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(name)")
        .in("status", ["mobilizacao", "execucao"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { error } = await supabase.from("projects").insert({ ...values, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active_projects_tracking"] });
      toast.success("Obra criada com sucesso!");
      setFormOpen(false);
    },
    onError: () => toast.error("Erro ao criar obra."),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { id, ...rest } = values;
      const { error } = await supabase.from("projects").update(rest as any).eq("id", id as string);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active_projects_tracking"] });
      toast.success("Obra atualizada!");
      setFormOpen(false);
      setEditingProject(null);
    },
    onError: () => toast.error("Erro ao atualizar obra."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active_projects_tracking"] });
      toast.success("Obra excluída!");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao excluir obra."),
  });

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editingProject) {
      updateMutation.mutate({ ...data, id: editingProject.id });
    } else {
      createMutation.mutate({ ...data, status: data.status || "execucao" });
    }
  };

  const handleNewObra = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-display">Acompanhamento de Obras</h1>
          <p className="text-muted-foreground">Projetos em Mobilização ou Execução aparecem automaticamente aqui. Você também pode criar obras diretamente.</p>
        </div>
        <Button onClick={handleNewObra}><Plus className="h-4 w-4 mr-2" />Nova Obra</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Hammer className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Obras Ativas</p>
              <p className="text-2xl font-bold text-blue-700">{projects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Pendências</p>
              <p className="text-2xl font-bold text-amber-700">12</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Entregas Hoje</p>
              <p className="text-2xl font-bold text-green-700">3</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Visitas Semana</p>
              <p className="text-2xl font-bold text-purple-700">5</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold text-display mt-8 mb-4">Progresso das Obras</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
            Nenhuma obra em fase de execução ou mobilização.
          </div>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-bold">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{(project.clients as any)?.name}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize">
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-bold">{project.finish_level || 0}%</span>
                  </div>
                  <Progress value={project.finish_level || 0} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Início: {project.start_date ? format(new Date(project.start_date), "dd/MM") : "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{project.city || "—"}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button className="flex-1" variant="outline" size="sm" onClick={() => navigate(`/projects/${project.id}`)}>
                    <Eye className="h-4 w-4 mr-1" />Ver
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(project.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ProjectForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingProject(null); }}
        onSubmit={handleSubmit}
        initialData={editingProject}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Obra</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta obra? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
