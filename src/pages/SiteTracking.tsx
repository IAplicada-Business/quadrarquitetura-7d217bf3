import { useState } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle, Hammer, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SiteTracking() {
  const { user } = useAuth();

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-display">Acompanhamento de Obras</h1>
          <p className="text-muted-foreground">Visão geral das obras em andamento</p>
        </div>
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
              <p className="text-2xl font-bold text-amber-700">12</p> {/* Mocked for now */}
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
              <p className="text-2xl font-bold text-green-700">3</p> {/* Mocked for now */}
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
              <p className="text-2xl font-bold text-purple-700">5</p> {/* Mocked for now */}
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

                <Button className="w-full" variant="outline" asChild>
                  <a href={`/projects/${project.id}`}>Ver Detalhes</a>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
