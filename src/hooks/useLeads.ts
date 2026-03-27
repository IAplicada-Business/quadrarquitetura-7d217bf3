import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { handleDeleteError } from "@/lib/handleDeleteError";

export const LEAD_STATUSES = [
  "novo",
  "contato_feito",
  "reuniao_agendada",
  "proposta_enviada",
  "fechado",
  "perdido",
] as const;

export const leadStatusLabels: Record<string, string> = {
  novo: "Novo Lead",
  contato_feito: "Contato Feito",
  reuniao_agendada: "Reunião Agendada",
  proposta_enviada: "Proposta Enviada",
  fechado: "Fechado",
  perdido: "Perdido",
};

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string;
  phone_secondary: string | null;
  project_type: string;
  origin: string;
  responsible: string | null;
  notes: string | null;
  status: string;
  meeting_date: string | null;
  converted_client_id: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function useLeads() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (lead: { name: string; phone: string; email?: string; phone_secondary?: string; project_type?: string; origin?: string; responsible?: string; notes?: string; status?: string; meeting_date?: string }) => {
      const { error } = await supabase.from("leads").insert({
        user_id: user!.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || null,
        phone_secondary: lead.phone_secondary || null,
        project_type: (lead.project_type || "residencial") as any,
        origin: (lead.origin || "outro") as any,
        responsible: lead.responsible || null,
        notes: lead.notes || null,
        status: lead.status || "novo",
        meeting_date: lead.meeting_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead criado com sucesso" });
    },
    onError: (e: Error) => toast({ title: "Erro ao criar lead", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const castUpdates: Record<string, unknown> = { ...updates };
      if (castUpdates.origin) castUpdates.origin = castUpdates.origin as any;
      if (castUpdates.project_type) castUpdates.project_type = castUpdates.project_type as any;
      const { error } = await supabase.from("leads").update(castUpdates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro ao atualizar lead", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead removido" });
    },
    onError: (e: any) => handleDeleteError(e, "leads"),
  });

  const convertToClient = useMutation({
    mutationFn: async (lead: Lead) => {
      // Create client from lead data
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          user_id: user!.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          phone_secondary: lead.phone_secondary,
          client_type: lead.project_type as any,
          origin: lead.origin as any,
        })
        .select()
        .single();
      if (clientError) throw clientError;

      // Update lead with converted_client_id and status
      const { error: leadError } = await supabase
        .from("leads")
        .update({ converted_client_id: client.id, status: "fechado" })
        .eq("id", lead.id);
      if (leadError) throw leadError;

      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Lead convertido em cliente!" });
    },
    onError: (e: Error) => toast({ title: "Erro ao converter lead", description: e.message, variant: "destructive" }),
  });

  return {
    leads: leadsQuery.data ?? [],
    isLoading: leadsQuery.isLoading,
    create,
    update,
    remove,
    convertToClient,
  };
}
