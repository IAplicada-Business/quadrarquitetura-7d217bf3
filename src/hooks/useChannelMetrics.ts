import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays } from "date-fns";

const WINDOW_DAYS = 90;

interface LeadRow {
  id: string;
  status: string;
  created_at: string;
  channel_id: string | null;
}

interface ProposalRow {
  status: string;
  price_full: number | null;
  final_value: number | null;
  lead_id: string;
}

export interface ChannelMetric {
  channelId: string | null;
  name: string;
  color: string;
  leadCount: number;
  conversionRate: number;
  ticketMedio: number;
}

const SEM_CANAL_COLOR = "#94A3B8";

export function useChannelMetrics() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["channel-metrics"],
    queryFn: async () => {
      // .eq("lead_type", "comercial") — este bloco alimenta o dashboard
      // comercial; leads do pipeline de parceiros não entram aqui mesmo
      // que algum dia ganhem canal de aquisição.
      const [channelsRes, leadsRes0, proposalsRes] = await Promise.all([
        supabase.from("acquisition_channels").select("id, name, color, is_active"),
        supabase.from("leads").select("id, status, created_at, channel_id").eq("lead_type", "comercial"),
        supabase.from("proposals").select("status, price_full, final_value, lead_id"),
      ]);
      // 42703 = coluna lead_type ainda não existe (migration pendente).
      const leadsRes = leadsRes0.error?.code === "42703"
        ? await supabase.from("leads").select("id, status, created_at, channel_id")
        : leadsRes0;
      return {
        channels: channelsRes.data ?? [],
        leads: (leadsRes.data ?? []) as LeadRow[],
        proposals: (proposalsRes.data ?? []) as ProposalRow[],
      };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const data = useMemo((): ChannelMetric[] | null => {
    if (!query.data) return null;
    const { channels, leads, proposals } = query.data;

    const windowStart = subDays(new Date(), WINDOW_DAYS);
    const leadsInWindow = leads.filter((l) => new Date(l.created_at) >= windowStart);

    const approvedByLead = new Map<string, number>();
    proposals
      .filter((p) => p.status === "aprovada")
      .forEach((p) => {
        const value = p.price_full ?? p.final_value ?? 0;
        approvedByLead.set(p.lead_id, (approvedByLead.get(p.lead_id) ?? 0) + value);
      });

    const buckets = new Map<string | null, LeadRow[]>();
    leadsInWindow.forEach((l) => {
      const key = l.channel_id;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(l);
    });

    const metrics: ChannelMetric[] = [];
    for (const channel of channels) {
      const channelLeads = buckets.get(channel.id) ?? [];
      if (channelLeads.length === 0) continue;
      const closed = channelLeads.filter((l) => l.status === "fechado");
      const approvedValues = closed
        .map((l) => approvedByLead.get(l.id))
        .filter((v): v is number => v != null && v > 0);
      metrics.push({
        channelId: channel.id,
        name: channel.name,
        color: channel.color,
        leadCount: channelLeads.length,
        conversionRate: channelLeads.length > 0 ? Math.round((closed.length / channelLeads.length) * 100) : 0,
        ticketMedio: approvedValues.length > 0 ? approvedValues.reduce((s, v) => s + v, 0) / approvedValues.length : 0,
      });
    }

    const semCanal = buckets.get(null) ?? [];
    if (semCanal.length > 0) {
      const closed = semCanal.filter((l) => l.status === "fechado");
      const approvedValues = closed
        .map((l) => approvedByLead.get(l.id))
        .filter((v): v is number => v != null && v > 0);
      metrics.push({
        channelId: null,
        name: "Sem canal",
        color: SEM_CANAL_COLOR,
        leadCount: semCanal.length,
        conversionRate: closed.length > 0 ? Math.round((closed.length / semCanal.length) * 100) : 0,
        ticketMedio: approvedValues.length > 0 ? approvedValues.reduce((s, v) => s + v, 0) / approvedValues.length : 0,
      });
    }

    return metrics.sort((a, b) => b.leadCount - a.leadCount);
  }, [query.data]);

  return { data, isLoading: query.isLoading, windowDays: WINDOW_DAYS };
}
