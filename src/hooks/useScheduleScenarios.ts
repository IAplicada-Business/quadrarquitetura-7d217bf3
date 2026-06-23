import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { buildTimeline, type ScheduleStep, type BusinessDayOptions } from "@/lib/businessCalendar";
import type { Tables } from "@/integrations/supabase/types";

export type ScheduleScenario = Tables<"schedule_scenarios">;
export type ScheduleScenarioActivity = Tables<"schedule_scenario_activities">;

export interface ScenarioWithActivities extends ScheduleScenario {
  activities: ScheduleScenarioActivity[];
}

export function useScheduleScenarios(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["schedule_scenarios", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data: scenarios, error } = await supabase
        .from("schedule_scenarios")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!scenarios || scenarios.length === 0) return [];

      const { data: activities, error: actError } = await supabase
        .from("schedule_scenario_activities")
        .select("*")
        .in("scenario_id", scenarios.map((s) => s.id))
        .order("position");
      if (actError) throw actError;

      const byScenario = new Map<string, ScheduleScenarioActivity[]>();
      for (const a of activities ?? []) {
        const arr = byScenario.get(a.scenario_id) ?? [];
        arr.push(a);
        byScenario.set(a.scenario_id, arr);
      }
      return scenarios.map((s) => ({
        ...s,
        activities: byScenario.get(s.id) ?? [],
      })) as ScenarioWithActivities[];
    },
    enabled: !!user && !!projectId,
  });

  /**
   * Cria um cenário a partir do estado atual das `project_activities`.
   * Snapshot completa: copia disciplinas, durações, datas, depends_on
   * (traduzindo UUIDs em UUIDs novos).
   */
  const createFromCurrent = useMutation({
    mutationFn: async (input: { name: string; description?: string; isBaseline?: boolean }) => {
      if (!projectId) throw new Error("projectId missing");
      const { data: scenario, error } = await supabase
        .from("schedule_scenarios")
        .insert({
          project_id: projectId,
          user_id: user!.id,
          name: input.name,
          description: input.description ?? null,
          is_baseline: input.isBaseline ?? false,
        })
        .select()
        .single();
      if (error) throw error;

      const { data: activities, error: actError } = await supabase
        .from("project_activities")
        .select("*")
        .eq("project_id", projectId)
        .order("position");
      if (actError) throw actError;

      if (!activities || activities.length === 0) return scenario;

      // Mapa de UUID da atividade original → UUID do snapshot.
      // Primeiro insere todas com depends_on vazio, depois faz uma 2ª
      // passada com depends_on materializado.
      const inserts = activities.map((a: any) => ({
        scenario_id: scenario.id,
        user_id: user!.id,
        source_activity_id: a.id,
        position: a.position ?? 0,
        name: a.name,
        discipline: a.discipline,
        area_m2: a.area_m2,
        duration_days: a.duration_days,
        start_date: a.start_date,
        end_date: a.end_date,
        description: a.description,
      }));

      const { data: created, error: insError } = await supabase
        .from("schedule_scenario_activities")
        .insert(inserts as any)
        .select("id, source_activity_id");
      if (insError) throw insError;

      const srcToNew = new Map<string, string>();
      for (const r of created ?? []) {
        if (r.source_activity_id) srcToNew.set(r.source_activity_id, r.id);
      }

      // Materializa depends_on. Itens que apontavam para atividades
      // do projeto que não foram copiadas (não devia acontecer) caem.
      const updates: Array<{ id: string; depends_on: string[] }> = [];
      for (const a of activities as any[]) {
        const myId = srcToNew.get(a.id);
        if (!myId || !a.depends_on?.length) continue;
        const deps = a.depends_on
          .map((d: string) => srcToNew.get(d))
          .filter((x: any): x is string => !!x);
        if (deps.length > 0) updates.push({ id: myId, depends_on: deps });
      }
      if (updates.length > 0) {
        await Promise.all(
          updates.map((u) =>
            supabase
              .from("schedule_scenario_activities")
              .update({ depends_on: u.depends_on } as any)
              .eq("id", u.id),
          ),
        );
      }

      return scenario;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_scenarios", projectId] });
      toast({ title: "Cenário criado" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao criar cenário", description: e.message, variant: "destructive" }),
  });

  const updateScenario = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ScheduleScenario>) => {
      const { error } = await supabase
        .from("schedule_scenarios")
        .update(updates as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_scenarios", projectId] });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const removeScenario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_scenarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_scenarios", projectId] });
      toast({ title: "Cenário removido" });
    },
  });

  const updateActivity = useMutation({
    mutationFn: async ({ id, scenarioId: _s, ...updates }: { id: string; scenarioId: string } & Partial<ScheduleScenarioActivity>) => {
      const { error } = await supabase
        .from("schedule_scenario_activities")
        .update(updates as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["schedule_scenarios", projectId] });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  /**
   * Aplica `buildTimeline` no cenário e persiste as datas calculadas.
   */
  const recalcCenarioTimeline = useMutation({
    mutationFn: async (input: { scenarioId: string; projectStart: string; opts?: BusinessDayOptions }) => {
      const { data: items, error } = await supabase
        .from("schedule_scenario_activities")
        .select("*")
        .eq("scenario_id", input.scenarioId)
        .order("position");
      if (error) throw error;
      if (!items || items.length === 0) return 0;

      const steps: ScheduleStep[] = items
        .filter((a) => a.duration_days && a.duration_days > 0)
        .map((a) => ({
          id: a.id,
          name: a.name,
          duration_days: a.duration_days as number,
          depends_on: a.depends_on ?? undefined,
        }));
      const computed = buildTimeline(steps, input.projectStart, input.opts);
      await Promise.all(
        computed.map((c) =>
          supabase
            .from("schedule_scenario_activities")
            .update({ start_date: c.start_date, end_date: c.end_date } as any)
            .eq("id", c.id),
        ),
      );
      return computed.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["schedule_scenarios", projectId] });
      toast({ title: `${count} atividade(s) recalculadas no cenário` });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao recalcular", description: e.message, variant: "destructive" }),
  });

  /**
   * Promove cenário a "baseline": substitui as datas/duração/dependências
   * das `project_activities` casadas por `source_activity_id`. Não cria
   * atividades novas — se um item do cenário não tem source, é ignorado
   * (UX intencional: o cenário é uma proposta sobre o que existe).
   */
  const promoteToProject = useMutation({
    mutationFn: async (scenarioId: string) => {
      const { data: items, error } = await supabase
        .from("schedule_scenario_activities")
        .select("*")
        .eq("scenario_id", scenarioId);
      if (error) throw error;
      if (!items) return 0;

      let updated = 0;
      const newScenarioIdToSourceId = new Map<string, string>();
      for (const it of items) {
        if (it.source_activity_id) newScenarioIdToSourceId.set(it.id, it.source_activity_id);
      }

      for (const it of items) {
        if (!it.source_activity_id) continue;
        // Traduz depends_on de UUIDs do cenário → UUIDs das project_activities.
        const deps = (it.depends_on ?? [])
          .map((d) => newScenarioIdToSourceId.get(d))
          .filter((x): x is string => !!x);
        const { error: upError } = await supabase
          .from("project_activities")
          .update({
            duration_days: it.duration_days,
            start_date: it.start_date,
            end_date: it.end_date,
            depends_on: deps.length > 0 ? deps : null,
          } as any)
          .eq("id", it.source_activity_id);
        if (upError) throw upError;
        updated++;
      }

      // Remove flag de baseline dos outros, marca este como baseline.
      await supabase
        .from("schedule_scenarios")
        .update({ is_baseline: false } as never)
        .eq("project_id", projectId!);
      await supabase
        .from("schedule_scenarios")
        .update({ is_baseline: true, applied_at: new Date().toISOString() } as never)
        .eq("id", scenarioId);

      return updated;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["schedule_scenarios", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project_activities", projectId] });
      toast({ title: `${count} atividade(s) atualizadas a partir do cenário` });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao promover cenário", description: e.message, variant: "destructive" }),
  });

  return {
    scenarios: query.data ?? [],
    isLoading: query.isLoading,
    createFromCurrent,
    updateScenario,
    removeScenario,
    updateActivity,
    recalcCenarioTimeline,
    promoteToProject,
  };
}
