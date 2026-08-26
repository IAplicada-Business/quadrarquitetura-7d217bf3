import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth } from "date-fns";
import { ACTIVE_PARTNER_STAGES, type PartnerStage } from "@/hooks/useLeads";

interface PartnerRow {
  id: string;
  name: string;
  partner_stage: PartnerStage | null;
}

interface ReferredLeadRow {
  id: string;
  status: string;
  created_at: string;
  referred_by_partner_id: string;
}

export interface TopPartner {
  partnerId: string;
  name: string;
  count: number;
}

/**
 * Métricas do pipeline de parceiros — espelha o padrão de
 * useComercialMetrics, mas nunca lê leads do tipo comercial (exceto os
 * que carregam referred_by_partner_id, só pra medir o resultado das
 * indicações). Não é misturado no dashboard comercial: consumido numa
 * aba própria em DashboardEscritorio.
 */
export function usePartnerMetrics() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["partner-metrics"],
    queryFn: async () => {
      const [partnersRes, referredRes] = await Promise.all([
        supabase.from("leads").select("id, name, partner_stage").eq("lead_type", "parceiro"),
        supabase
          .from("leads")
          .select("id, status, created_at, referred_by_partner_id")
          .eq("lead_type", "comercial")
          .not("referred_by_partner_id", "is", null),
      ]);
      return {
        partners: (partnersRes.data ?? []) as PartnerRow[],
        referred: (referredRes.data ?? []) as ReferredLeadRow[],
      };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const data = useMemo(() => {
    if (!query.data) return null;
    const { partners, referred } = query.data;

    const totalParceiros = partners.length;
    const parceirosAtivos = partners.filter((p) => p.partner_stage && ACTIVE_PARTNER_STAGES.has(p.partner_stage)).length;

    const monthStart = startOfMonth(new Date());
    const indicacoesNoMes = referred.filter((r) => new Date(r.created_at) >= monthStart).length;

    const countByPartner = new Map<string, number>();
    referred.forEach((r) => countByPartner.set(r.referred_by_partner_id, (countByPartner.get(r.referred_by_partner_id) ?? 0) + 1));

    const topParceiros: TopPartner[] = partners
      .map((p) => ({ partnerId: p.id, name: p.name, count: countByPartner.get(p.id) ?? 0 }))
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const fechadas = referred.filter((r) => r.status === "fechado").length;
    const taxaConversaoIndicacoes = referred.length > 0 ? Math.round((fechadas / referred.length) * 100) : 0;

    return {
      totalParceiros,
      parceirosAtivos,
      indicacoesNoMes,
      totalIndicacoes: referred.length,
      indicacoesFechadas: fechadas,
      taxaConversaoIndicacoes,
      topParceiros,
    };
  }, [query.data]);

  return { data, isLoading: query.isLoading };
}
