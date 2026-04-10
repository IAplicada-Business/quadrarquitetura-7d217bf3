import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useProjectAI() {
  const [loading, setLoading] = useState(false);

  const callAction = async (projectId: string, action: string, data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error("Não autenticado");
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/project-ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId, action, data }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(body.error || "Erro no serviço de IA");
      }
      return await resp.json();
    } catch (err: any) {
      toast({ title: "Erro na IA", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { callAction, loading };
}
