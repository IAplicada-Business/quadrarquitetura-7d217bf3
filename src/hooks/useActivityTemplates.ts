import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type ActivityTemplate = Tables<"activity_templates">;
export type ActivityTemplateItem = Tables<"activity_template_items">;

export interface ActivityTemplateWithItems extends ActivityTemplate {
  items: ActivityTemplateItem[];
}

export function useActivityTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["activity_templates"],
    queryFn: async () => {
      const { data: templates, error } = await supabase
        .from("activity_templates")
        .select("*")
        .order("name");
      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from("activity_template_items")
        .select("*")
        .order("position");
      if (itemsError) throw itemsError;

      const byTemplate = new Map<string, ActivityTemplateItem[]>();
      for (const it of items ?? []) {
        const arr = byTemplate.get(it.template_id) ?? [];
        arr.push(it);
        byTemplate.set(it.template_id, arr);
      }

      return (templates ?? []).map((t) => ({
        ...t,
        items: byTemplate.get(t.id) ?? [],
      })) as ActivityTemplateWithItems[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      project_type?: ActivityTemplate["project_type"];
      items: Array<Omit<ActivityTemplateItem, "id" | "user_id" | "template_id" | "created_at" | "updated_at">>;
    }) => {
      const { data: tpl, error } = await supabase
        .from("activity_templates")
        .insert({
          name: input.name,
          description: input.description ?? null,
          project_type: input.project_type ?? null,
          user_id: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      if (input.items.length > 0) {
        const { error: itemsError } = await supabase
          .from("activity_template_items")
          .insert(input.items.map((it) => ({
            ...it,
            template_id: tpl.id,
            user_id: user!.id,
          })));
        if (itemsError) throw itemsError;
      }
      return tpl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_templates"] });
      toast({ title: "Template criado" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateTemplate = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string | null;
      project_type?: ActivityTemplate["project_type"];
      items?: Array<Omit<ActivityTemplateItem, "id" | "user_id" | "template_id" | "created_at" | "updated_at">>;
    }) => {
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.project_type !== undefined) updates.project_type = input.project_type;
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("activity_templates")
          .update(updates as never)
          .eq("id", input.id);
        if (error) throw error;
      }
      if (input.items) {
        // Substituição completa dos itens (simplifica reordenação e
        // alteração de `depends_on_positions`). Cascade via FK cuida da
        // limpeza.
        const { error: delError } = await supabase
          .from("activity_template_items")
          .delete()
          .eq("template_id", input.id);
        if (delError) throw delError;
        if (input.items.length > 0) {
          const { error: insError } = await supabase
            .from("activity_template_items")
            .insert(input.items.map((it) => ({
              ...it,
              template_id: input.id,
              user_id: user!.id,
            })));
          if (insError) throw insError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_templates"] });
      toast({ title: "Template atualizado" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("activity_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_templates"] });
      toast({ title: "Template removido" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  /**
   * Aplica um template a um projeto: copia cada item para
   * `project_activities`, materializando `depends_on_positions` em
   * UUIDs reais das atividades criadas. Pula itens com nome duplicado
   * no projeto para que aplicar o mesmo template duas vezes não gere
   * duplicatas.
   */
  const applyToProject = useMutation({
    mutationFn: async (input: { templateId: string; projectId: string }) => {
      const { data: tplItems, error: itemsError } = await supabase
        .from("activity_template_items")
        .select("*")
        .eq("template_id", input.templateId)
        .order("position");
      if (itemsError) throw itemsError;
      if (!tplItems || tplItems.length === 0) return { created: 0 };

      const { data: existing } = await supabase
        .from("project_activities")
        .select("id, name")
        .eq("project_id", input.projectId);
      const existingNames = new Set((existing ?? []).map((a: any) => a.name));

      const { data: lastPos } = await supabase
        .from("project_activities")
        .select("position")
        .eq("project_id", input.projectId)
        .order("position", { ascending: false })
        .limit(1);
      const baseOffset = (lastPos?.[0]?.position ?? -1) + 1;

      // 1ª passada: insere atividades sem `depends_on` e guarda o mapa
      // position-no-template → id-criado.
      const positionToId = new Map<number, string>();
      for (const it of tplItems) {
        if (existingNames.has(it.name)) continue;
        const { data: created, error } = await supabase
          .from("project_activities")
          .insert({
            project_id: input.projectId,
            user_id: user!.id,
            name: it.name,
            discipline: it.discipline,
            area_m2: it.area_m2,
            duration_days: it.duration_days,
            description: it.description,
            position: baseOffset + it.position,
            status: "pendente",
            progress_percent: 0,
          } as any)
          .select("id")
          .single();
        if (error) throw error;
        positionToId.set(it.position, (created as any).id);
      }

      // 2ª passada: aplica `depends_on` materializado.
      for (const it of tplItems) {
        const newId = positionToId.get(it.position);
        if (!newId) continue;
        const deps = (it.depends_on_positions ?? [])
          .map((p) => positionToId.get(p))
          .filter((x): x is string => Boolean(x));
        if (deps.length > 0) {
          await supabase
            .from("project_activities")
            .update({ depends_on: deps } as any)
            .eq("id", newId);
        }
      }

      return { created: positionToId.size };
    },
    onSuccess: ({ created }) => {
      queryClient.invalidateQueries({ queryKey: ["project_activities"] });
      toast({ title: `${created} atividade(s) criadas a partir do template` });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao aplicar template", description: e.message, variant: "destructive" }),
  });

  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    createTemplate,
    updateTemplate,
    remove,
    applyToProject,
  };
}
