import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  type: "whatsapp" | "email";
  category: string | null;
  body: string;
  variables: string[];
  created_at: string;
}

export function useMessageTemplates(category?: string | string[]) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["message_templates"];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MessageTemplate[];
    },
    enabled: !!user,
  });

  const filtered = category
    ? (query.data || []).filter((t) => {
        if (Array.isArray(category)) return category.includes(t.category || "");
        return t.category === category || t.category === "geral";
      })
    : query.data || [];

  const create = useMutation({
    mutationFn: async (tpl: Omit<MessageTemplate, "id" | "user_id" | "created_at">) => {
      const { error } = await supabase.from("message_templates" as any).insert({
        ...tpl,
        user_id: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast({ title: "Template criado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MessageTemplate> & { id: string }) => {
      const { error } = await supabase.from("message_templates" as any).update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast({ title: "Template atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("message_templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast({ title: "Template removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return {
    templates: query.data || [],
    filtered,
    isLoading: query.isLoading,
    create,
    update,
    remove,
  };
}
