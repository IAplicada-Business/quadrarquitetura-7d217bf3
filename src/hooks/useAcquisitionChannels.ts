import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

export type AcquisitionChannelCategory = Database["public"]["Enums"]["acquisition_channel_category"];

export const CHANNEL_CATEGORIES: AcquisitionChannelCategory[] = [
  "digital",
  "indicacao",
  "evento",
  "parceria",
  "outros",
];

export const CHANNEL_CATEGORY_LABELS: Record<AcquisitionChannelCategory, string> = {
  digital: "Digital",
  indicacao: "Indicação",
  evento: "Evento",
  parceria: "Parceria",
  outros: "Outros",
};

export type AcquisitionChannel = Database["public"]["Tables"]["acquisition_channels"]["Row"];

/** Canais ativos, ordenados pra uso em selects/filtros: display_order asc, categoria "outros" sempre por último. */
export function sortChannelsForSelect(channels: AcquisitionChannel[]): AcquisitionChannel[] {
  return channels
    .filter((c) => c.is_active)
    .slice()
    .sort((a, b) => {
      const aOutros = a.category === "outros" ? 1 : 0;
      const bOutros = b.category === "outros" ? 1 : 0;
      if (aOutros !== bOutros) return aOutros - bOutros;
      return a.display_order - b.display_order;
    });
}

export function useAcquisitionChannels() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["acquisition_channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acquisition_channels")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const channels = useMemo(() => query.data ?? [], [query.data]);

  const create = useMutation({
    mutationFn: async (values: { name: string; category: AcquisitionChannelCategory; color: string; is_partner_channel?: boolean }) => {
      const nextOrder = channels.reduce((max, c) => Math.max(max, c.display_order), -1) + 1;
      const { error } = await supabase.from("acquisition_channels").insert({
        user_id: user!.id,
        name: values.name,
        category: values.category,
        color: values.color,
        is_partner_channel: values.is_partner_channel ?? false,
        display_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acquisition_channels"] });
      toast({ title: "Canal criado" });
    },
    onError: (e: Error) => toast({ title: "Erro ao criar canal", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...values }: { id: string; name?: string; category?: AcquisitionChannelCategory; color?: string; is_active?: boolean; is_partner_channel?: boolean }) => {
      const { error } = await supabase.from("acquisition_channels").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acquisition_channels"] });
      toast({ title: "Canal atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro ao atualizar canal", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("acquisition_channels").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["acquisition_channels"] });
      toast({ title: vars.is_active ? "Canal reativado" : "Canal arquivado" });
    },
    onError: (e: Error) => toast({ title: "Erro ao atualizar canal", description: e.message, variant: "destructive" }),
  });

  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from("acquisition_channels").update({ display_order: index }).eq("id", id).then(({ error }) => {
            if (error) throw error;
          })
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acquisition_channels"] });
    },
    onError: (e: Error) => toast({ title: "Erro ao reordenar canais", description: e.message, variant: "destructive" }),
  });

  const activeSorted = useMemo(() => sortChannelsForSelect(channels), [channels]);

  return {
    channels,
    activeChannels: activeSorted,
    isLoading: query.isLoading,
    create,
    update,
    toggleActive,
    reorder,
  };
}
