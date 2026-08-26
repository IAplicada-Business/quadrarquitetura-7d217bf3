import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PartnerReferralSummary {
  count: number;
  lastReferralAt: string | null;
}

/**
 * Conta, pra cada parceiro, quantos leads comerciais ele já trouxe
 * (referred_by_partner_id) e quando foi a última indicação. Uma query
 * só pra todos os parceiros de uma vez (evita N+1 no Pipeline de
 * Parceiros, que renderiza um card por parceiro).
 */
export function usePartnerReferrals() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["partner-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("referred_by_partner_id, created_at")
        .eq("lead_type", "comercial")
        .not("referred_by_partner_id", "is", null);
      if (error) throw error;
      return data as { referred_by_partner_id: string; created_at: string }[];
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const byPartner = useMemo(() => {
    const map = new Map<string, PartnerReferralSummary>();
    for (const row of query.data ?? []) {
      const current = map.get(row.referred_by_partner_id) ?? { count: 0, lastReferralAt: null };
      current.count += 1;
      if (!current.lastReferralAt || row.created_at > current.lastReferralAt) {
        current.lastReferralAt = row.created_at;
      }
      map.set(row.referred_by_partner_id, current);
    }
    return map;
  }, [query.data]);

  const getSummary = (partnerId: string): PartnerReferralSummary =>
    byPartner.get(partnerId) ?? { count: 0, lastReferralAt: null };

  return { byPartner, getSummary, isLoading: query.isLoading };
}
