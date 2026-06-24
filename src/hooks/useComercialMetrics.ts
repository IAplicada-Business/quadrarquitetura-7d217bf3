import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, differenceInDays, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { C } from "@/lib/chartColors";

interface LeadRow {
  id: string;
  status: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ProposalRow {
  id: string;
  status: string;
  price_full: number | null;
  final_value: number | null;
  sent_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  lead_id: string;
  notes: string | null;
  leads: { name: string; phone: string; email: string | null } | null;
}

export interface FunilStage {
  label: string;
  count: number;
  color: string;
}

export interface Oportunidade {
  leadId: string;
  leadName: string;
  daysSinceContact: number;
  proposalValue: number;
}

export interface PropostaAberta {
  id: string;
  leadName: string;
  daysSinceSent: number;
  value: number;
  urgencyLabel: string;
  urgencyColor: string;
}

export interface PipelineMonth {
  month: string;
  fechados: number;
  propostas: number;
  em_andamento: number;
}

export function useComercialMetrics() {
  const { user } = useAuth();
  const today = useMemo(() => new Date(), []);

  const query = useQuery({
    queryKey: ["comercial-metrics"],
    queryFn: async () => {
      const [leadsRes, proposalsRes] = await Promise.all([
        supabase.from("leads").select("id, status, name, created_at, updated_at"),
        supabase.from("proposals").select("id, status, price_full, final_value, sent_at, approved_at, created_at, updated_at, lead_id, notes, leads(name, phone, email)"),
      ]);
      return {
        leads: (leadsRes.data ?? []) as LeadRow[],
        proposals: (proposalsRes.data ?? []) as ProposalRow[],
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const computed = useMemo(() => {
    if (!query.data) return null;
    const { leads, proposals } = query.data;

    const currentMonthStr = format(today, "yyyy-MM");
    const prevMonthStr = format(subMonths(today, 1), "yyyy-MM");

    // Leads do mês atual
    const leadsThisMonth = leads.filter((l) => l.created_at?.startsWith(currentMonthStr));
    const leadsPrevMonth = leads.filter((l) => l.created_at?.startsWith(prevMonthStr));

    // ── Funil comercial (mês atual) ──
    const thisMonthLeads = leadsThisMonth;
    const funnelLeads = thisMonthLeads.length;
    const funnelContato = thisMonthLeads.filter((l) =>
      ["em_contato", "contato_feito", "reuniao_agendada", "proposta_enviada", "fechado"].includes(l.status)
    ).length;
    const funnelReuniao = thisMonthLeads.filter((l) =>
      ["reuniao_agendada", "proposta_enviada", "fechado"].includes(l.status)
    ).length;
    const funnelProposta = thisMonthLeads.filter((l) =>
      ["proposta_enviada", "fechado"].includes(l.status)
    ).length;
    const funnelFechado = thisMonthLeads.filter((l) => l.status === "fechado").length;

    const funil: FunilStage[] = [
      { label: "Leads",    count: funnelLeads,    color: C.navyFaint },
      { label: "Contato",  count: funnelContato,  color: C.navyMid   },
      { label: "Reunião",  count: funnelReuniao,  color: C.terra     },
      { label: "Proposta", count: funnelProposta, color: C.warning   },
      { label: "Fechado",  count: funnelFechado,  color: C.success   },
    ];

    const convRate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
    const funnelRates = [
      convRate(funnelContato, funnelLeads),
      convRate(funnelReuniao, funnelContato),
      convRate(funnelProposta, funnelReuniao),
      convRate(funnelFechado, funnelProposta),
    ];
    const conversaoTotal = convRate(funnelFechado, funnelLeads);

    // Ticket médio aprovadas no mês
    const approvedThisMonth = proposals.filter(
      (p) => p.status === "aprovada" && p.updated_at?.startsWith(currentMonthStr)
    );
    const ticketMedio =
      approvedThisMonth.length > 0
        ? approvedThisMonth.reduce((s, p) => s + (p.price_full ?? p.final_value ?? 0), 0) / approvedThisMonth.length
        : 0;

    // ── KPIs ──
    const leadsThisCount = leadsThisMonth.length;
    const leadsPrevCount = leadsPrevMonth.length;
    const leadsVariation = leadsPrevCount > 0 ? Math.round(((leadsThisCount - leadsPrevCount) / leadsPrevCount) * 100) : 0;

    const prevMonthLeadsAll = leadsPrevMonth;
    const taxaConversaoThis = leadsThisCount > 0 ? Math.round((funnelFechado / leadsThisCount) * 100) : 0;
    const prevFechados = prevMonthLeadsAll.filter((l) => l.status === "fechado").length;
    const taxaConversaoPrev = leadsPrevCount > 0 ? Math.round((prevFechados / leadsPrevCount) * 100) : 0;
    const taxaVariation = taxaConversaoPrev > 0 ? taxaConversaoThis - taxaConversaoPrev : 0;

    // Tempo médio de fechamento
    const closedLeads = leads.filter((l) => l.status === "fechado" && l.created_at && l.updated_at);
    const avgClosingDays =
      closedLeads.length > 0
        ? Math.round(
            closedLeads.reduce((s, l) => s + differenceInDays(parseISO(l.updated_at), parseISO(l.created_at)), 0) /
              closedLeads.length
          )
        : 0;

    // Propostas aguardando
    const proposalsAguardando = proposals.filter((p) => p.status === "enviada");
    const hasUrgent = proposalsAguardando.some(
      (p) => p.sent_at && differenceInDays(today, parseISO(p.sent_at)) > 7
    );

    // ── Oportunidades quentes ──
    const leadsPropostaEnviada = leads
      .filter((l) => l.status === "proposta_enviada")
      .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
      .slice(0, 4);

    const oportunidades: Oportunidade[] = leadsPropostaEnviada.map((l) => {
      const daysSince = differenceInDays(today, parseISO(l.updated_at));
      const proposal = proposals.find((p) => p.lead_id === l.id);
      return {
        leadId: l.id,
        leadName: l.name,
        daysSinceContact: daysSince,
        proposalValue: proposal?.price_full ?? proposal?.final_value ?? 0,
      };
    });

    // ── Propostas em aberto ──
    const propostasAbertas: PropostaAberta[] = proposalsAguardando
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(0, 5)
      .map((p) => {
        const daysSince = p.sent_at ? differenceInDays(today, parseISO(p.sent_at)) : 0;
        let urgencyLabel = "Aguardando";
        let urgencyColor = "text-muted-foreground";
        if (daysSince >= 7) {
          urgencyLabel = "Urgente";
          urgencyColor = "text-red-500";
        }
        return {
          id: p.id,
          leadName: p.leads?.name ?? "Lead",
          daysSinceSent: daysSince,
          value: p.price_full ?? p.final_value ?? 0,
          urgencyLabel,
          urgencyColor,
        };
      });

    const totalEmNegociacao = propostasAbertas.reduce((s, p) => s + p.value, 0);

    // ── Pipeline 6 meses ──
    const pipeline6m: PipelineMonth[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(today, i);
      const mStr = format(m, "yyyy-MM");
      const label = format(m, "MMM", { locale: ptBR });
      const capLabel = label.charAt(0).toUpperCase() + label.slice(1);

      const fechados = leads.filter(
        (l) => l.status === "fechado" && l.updated_at?.startsWith(mStr)
      ).length;
      const propostasMonth = leads.filter(
        (l) => l.status === "proposta_enviada" && l.created_at?.startsWith(mStr)
      ).length;
      const emAndamento = leads.filter(
        (l) =>
          ["contato_feito", "reuniao_agendada"].includes(l.status) &&
          l.created_at?.startsWith(mStr)
      ).length;

      pipeline6m.push({ month: capLabel, fechados, propostas: propostasMonth, em_andamento: emAndamento });
    }

    return {
      funil,
      funnelRates,
      conversaoTotal,
      ticketMedio,
      kpis: {
        leadsThisMonth: leadsThisCount,
        leadsVariation,
        taxaConversao: taxaConversaoThis,
        taxaVariation,
        tempoMedioFechamento: avgClosingDays,
        proposalsAguardando: proposalsAguardando.length,
        hasUrgent,
      },
      oportunidades,
      propostasAbertas,
      totalEmNegociacao,
      pipeline6m,
    };
  }, [query.data, today]);

  return { data: computed, isLoading: query.isLoading };
}
