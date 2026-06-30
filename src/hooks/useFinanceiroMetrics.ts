import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentRow {
  id: string;
  value: number;
  due_date: string | null;
  paid_date: string | null;
  status: string | null;
  description: string | null;
  source: string | null;
  supplier_name: string | null;
  project_id: string | null;
  payment_type: string;
  created_at: string;
  projects: { name: string } | null;
}

interface ProposalRow {
  id: string;
  status: string;
  price_full: number | null;
  final_value: number | null;
  approved_at: string | null;
}

export interface ProximoRecebimento {
  project: string;
  description: string;
  value: number;
  dueDate: string;
  daysLeft: number;
}

export interface DRE {
  receitaBruta: number;
  despesasOperacionais: number;
  impostosEstimados: number;
  taxRate: number;
  resultadoLiquido: number;
  margemLiquida: number;
}

export interface GraficoMonth {
  month: string;
  receita: number;
  despesa: number;
  margem: number;
}

/**
 * period: "yyyy-MM" para mês específico | "yyyy" para ano inteiro | "all" para todo período
 */
export function useFinanceiroMetrics({
  period = format(new Date(), "yyyy-MM"),
}: {
  period?: string;
} = {}) {
  const { user } = useAuth();
  const todayDate = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const query = useQuery({
    queryKey: ["financeiro-metrics", period],
    queryFn: async () => {
      const [paymentsRes, nfsRes, settingsRes, proposalsRes] = await Promise.all([
        supabase
          .from("payments")
          .select("id, value, due_date, paid_date, status, description, source, supplier_name, project_id, payment_type, created_at, projects(name)"),
        supabase.from("invoices_nf").select("id").eq("status", "pendente"),
        supabase.from("settings").select("tax_rate_percent").limit(1).maybeSingle(),
        supabase.from("proposals").select("id, status, price_full, final_value, approved_at"),
      ]);
      return {
        payments: (paymentsRes.data ?? []) as unknown as PaymentRow[],
        pendingNFs: (nfsRes.data ?? []).length,
        taxRate: ((settingsRes.data as Record<string, unknown>)?.tax_rate_percent as number) ?? 6,
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
    const { payments, pendingNFs, taxRate, proposals } = query.data;

    const isYear = period.length === 4;
    const isAll = period === "all";

    const matchesPeriod = (dateStr: string | null) => {
      if (!dateStr) return false;
      if (isAll) return true;
      return dateStr.startsWith(period);
    };

    const prevPeriod = isAll
      ? null
      : isYear
      ? String(Number(period) - 1)
      : format(subMonths(parseISO(period + "-01"), 1), "yyyy-MM");

    const isEscritorio = (p: PaymentRow) =>
      p.source === "escritorio" || (!p.source && !p.project_id);
    const isCancelado = (p: PaymentRow) => p.status === "cancelado";
    // payment_type nunca é salvo via UI → usamos supplier_name como discriminador:
    // pagamentos A fornecedores (supplier_name ≠ "Receita Escritório") = despesa
    // pagamentos DE clientes (sem supplier_name, ou = "Receita Escritório") = receita
    const isDespesa = (p: PaymentRow) =>
      p.payment_type === "despesa" ||
      (!p.payment_type && !!p.supplier_name && p.supplier_name !== "Receita Escritório");
    const isReceita = (p: PaymentRow) =>
      p.payment_type === "receita" ||
      (!p.payment_type && (!p.supplier_name || p.supplier_name === "Receita Escritório"));

    // Receita: TODOS os pagamentos recebidos (escritório + clientes de obra).
    // Despesa: apenas pagamentos do escritório (custos operacionais).
    const allActive = payments.filter((p) => !isCancelado(p));
    const escritorioActive = allActive.filter(isEscritorio);

    const receitaPaidInPeriod = allActive.filter((p) => p.status === "pago" && isReceita(p) && matchesPeriod(p.paid_date));
    const receitaPaidPrev = prevPeriod
      ? allActive.filter((p) => p.status === "pago" && isReceita(p) && p.paid_date?.startsWith(prevPeriod))
      : [];
    const despesaPaidInPeriod = escritorioActive.filter((p) => p.status === "pago" && isDespesa(p) && matchesPeriod(p.paid_date));
    const despesaPaidPrev = prevPeriod
      ? escritorioActive.filter((p) => p.status === "pago" && isDespesa(p) && p.paid_date?.startsWith(prevPeriod))
      : [];

    const receitaThis = receitaPaidInPeriod.reduce((s, p) => s + p.value, 0);
    const receitaPrev = receitaPaidPrev.reduce((s, p) => s + p.value, 0);
    const receitaVariation = receitaPrev > 0 ? Math.round(((receitaThis - receitaPrev) / receitaPrev) * 100) : 0;

    const despesaThis = despesaPaidInPeriod.reduce((s, p) => s + p.value, 0);
    const despesaPrev = despesaPaidPrev.reduce((s, p) => s + p.value, 0);
    const despesaVariation = despesaPrev > 0 ? Math.round(((despesaThis - despesaPrev) / despesaPrev) * 100) : 0;

    const impostos = receitaThis * (taxRate / 100);
    const liquido = receitaThis - despesaThis - impostos;
    const margemLiquida = receitaThis > 0 ? Math.round((liquido / receitaThis) * 100) : 0;

    // Receita contratada = proposals aprovadas no período (independe de pagamento)
    const receitaContratada = proposals
      .filter((p) => p.status === "aprovada" && matchesPeriod(p.approved_at))
      .reduce((s, p) => s + (p.price_full ?? p.final_value ?? 0), 0);

    // A receber 30 dias — inclui receitas pendentes de obra e escritório
    const thirtyDaysLater = format(new Date(todayDate.getTime() + 30 * 86400000), "yyyy-MM-dd");
    const pendentes30d = allActive.filter(
      (p) => p.status === "pendente" && isReceita(p) && p.due_date && p.due_date >= todayStr && p.due_date <= thirtyDaysLater
    );
    const aReceber30d = pendentes30d.reduce((s, p) => s + p.value, 0);

    // Vencidos — receitas pendentes com due_date < hoje (não marcadas como pagas)
    const vencidos = allActive.filter(
      (p) => (p.status === "pendente" || p.status === "atrasado") && isReceita(p) && p.due_date && p.due_date < todayStr
    );
    const aReceberVencido = vencidos.reduce((s, p) => s + p.value, 0);

    // Próximos recebimentos — inclui pagamentos de clientes de obra
    const proximosRecebimentos: ProximoRecebimento[] = allActive
      .filter((p) => p.status === "pendente" && isReceita(p) && p.due_date && p.due_date >= todayStr)
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
      .slice(0, 4)
      .map((p) => ({
        project: p.projects?.name ?? "Projeto",
        description: p.description ?? "",
        value: p.value,
        dueDate: p.due_date!,
        daysLeft: differenceInDays(parseISO(p.due_date!), todayDate),
      }));

    const dre: DRE = {
      receitaBruta: receitaThis,
      despesasOperacionais: despesaThis,
      impostosEstimados: impostos,
      taxRate,
      resultadoLiquido: liquido,
      margemLiquida,
    };

    // Gráfico 6 meses terminando no período selecionado
    const baseDate = isYear
      ? new Date(Number(period), 11, 1)
      : isAll
      ? todayDate
      : parseISO(period + "-01");

    const grafico6m: GraficoMonth[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(baseDate, i);
      const mStr = format(m, "yyyy-MM");
      const label = format(m, "MMM", { locale: ptBR });
      const capLabel = label.charAt(0).toUpperCase() + label.slice(1);

      const rec = allActive.filter((p) => p.status === "pago" && isReceita(p) && p.paid_date?.startsWith(mStr)).reduce((s, p) => s + p.value, 0);
      const desp = escritorioActive.filter((p) => p.status === "pago" && isDespesa(p) && p.paid_date?.startsWith(mStr)).reduce((s, p) => s + p.value, 0);
      const imp = rec * (taxRate / 100);
      const liq = rec - desp - imp;
      const marg = rec > 0 ? Math.round((liq / rec) * 100) : 0;

      grafico6m.push({ month: capLabel, receita: rec, despesa: desp, margem: marg });
    }

    let periodLabel = "Período";
    if (isAll) {
      periodLabel = "Todo o período";
    } else if (isYear) {
      periodLabel = period;
    } else {
      const d = parseISO(period + "-01");
      const lbl = format(d, "MMM/yyyy", { locale: ptBR });
      periodLabel = lbl.charAt(0).toUpperCase() + lbl.slice(1);
    }

    return {
      kpis: {
        receitaMes: receitaThis,
        receitaVariation,
        receitaContratada,
        aReceber30d,
        aReceber30dCount: pendentes30d.length,
        aReceberVencido,
        aReceberVencidoCount: vencidos.length,
        despesasMes: despesaThis,
        despesaVariation,
        margemLiquida,
      },
      proximosRecebimentos,
      dre,
      grafico6m,
      pendingNFs,
      periodLabel,
    };
  }, [query.data, todayDate, todayStr, period]);

  return { data: computed, isLoading: query.isLoading };
}
