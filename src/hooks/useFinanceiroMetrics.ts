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

export function useFinanceiroMetrics() {
  const { user } = useAuth();
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const todayDate = useMemo(() => new Date(), []);

  const query = useQuery({
    queryKey: ["financeiro-metrics"],
    queryFn: async () => {
      const [paymentsRes, nfsRes, settingsRes] = await Promise.all([
        supabase
          .from("payments")
          .select("id, value, due_date, paid_date, status, description, source, supplier_name, project_id, payment_type, created_at, projects(name)"),
        supabase.from("invoices_nf").select("id").eq("status", "pendente"),
        supabase.from("settings").select("tax_rate_percent").limit(1).maybeSingle(),
      ]);
      return {
        payments: (paymentsRes.data ?? []) as unknown as PaymentRow[],
        pendingNFs: (nfsRes.data ?? []).length,
        taxRate: ((settingsRes.data as Record<string, unknown>)?.tax_rate_percent as number) ?? 6,
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const computed = useMemo(() => {
    if (!query.data) return null;
    const { payments, pendingNFs, taxRate } = query.data;

    const currentMonthStr = format(todayDate, "yyyy-MM");
    const prevMonthStr = format(subMonths(todayDate, 1), "yyyy-MM");

    const isEscritorio = (p: PaymentRow) =>
      p.source === "escritorio" || (!p.source && !p.project_id);
    const isCancelado = (p: PaymentRow) => p.status === "cancelado";
    const isReceita = (p: PaymentRow) =>
      p.payment_type === "receita" || (!p.payment_type && p.source !== "obra");
    const isDespesa = (p: PaymentRow) => p.payment_type === "despesa";

    // Filter to escritório-only, exclude cancelled
    const escritorioPayments = payments.filter((p) => isEscritorio(p) && !isCancelado(p));

    // Paid this month
    const paidThisMonth = escritorioPayments.filter((p) => p.status === "pago" && p.paid_date?.startsWith(currentMonthStr));
    const paidPrevMonth = escritorioPayments.filter((p) => p.status === "pago" && p.paid_date?.startsWith(prevMonthStr));

    const receitaThis = paidThisMonth.filter(isReceita).reduce((s, p) => s + p.value, 0);
    const receitaPrev = paidPrevMonth.filter(isReceita).reduce((s, p) => s + p.value, 0);
    const receitaVariation = receitaPrev > 0 ? Math.round(((receitaThis - receitaPrev) / receitaPrev) * 100) : 0;

    const despesaThis = paidThisMonth.filter(isDespesa).reduce((s, p) => s + p.value, 0);
    const despesaPrev = paidPrevMonth.filter(isDespesa).reduce((s, p) => s + p.value, 0);
    const despesaVariation = despesaPrev > 0 ? Math.round(((despesaThis - despesaPrev) / despesaPrev) * 100) : 0;

    // A receber 30 dias
    const thirtyDaysLater = format(new Date(todayDate.getTime() + 30 * 86400000), "yyyy-MM-dd");
    const pendentes30d = escritorioPayments.filter(
      (p) => p.status === "pendente" && p.due_date && p.due_date >= todayStr && p.due_date <= thirtyDaysLater
    );
    const aReceber30d = pendentes30d.reduce((s, p) => s + p.value, 0);

    // Margem líquida
    const impostos = receitaThis * (taxRate / 100);
    const liquido = receitaThis - despesaThis - impostos;
    const margemLiquida = receitaThis > 0 ? Math.round((liquido / receitaThis) * 100) : 0;

    // ── Próximos recebimentos ──
    const proximosRecebimentos: ProximoRecebimento[] = escritorioPayments
      .filter((p) => p.status === "pendente" && p.due_date && p.due_date >= todayStr)
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
      .slice(0, 4)
      .map((p) => ({
        project: p.projects?.name ?? "Projeto",
        description: p.description ?? "",
        value: p.value,
        dueDate: p.due_date!,
        daysLeft: differenceInDays(parseISO(p.due_date!), todayDate),
      }));

    // ── DRE ──
    const dre: DRE = {
      receitaBruta: receitaThis,
      despesasOperacionais: despesaThis,
      impostosEstimados: impostos,
      taxRate,
      resultadoLiquido: liquido,
      margemLiquida,
    };

    // ── Gráfico 6 meses ──
    const grafico6m: GraficoMonth[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(todayDate, i);
      const mStr = format(m, "yyyy-MM");
      const label = format(m, "MMM", { locale: ptBR });
      const capLabel = label.charAt(0).toUpperCase() + label.slice(1);

      const monthPaid = escritorioPayments.filter((p) => p.status === "pago" && p.paid_date?.startsWith(mStr));
      const rec = monthPaid.filter(isReceita).reduce((s, p) => s + p.value, 0);
      const desp = monthPaid.filter(isDespesa).reduce((s, p) => s + p.value, 0);
      const imp = rec * (taxRate / 100);
      const liq = rec - desp - imp;
      const marg = rec > 0 ? Math.round((liq / rec) * 100) : 0;

      grafico6m.push({ month: capLabel, receita: rec, despesa: desp, margem: marg });
    }

    return {
      kpis: {
        receitaMes: receitaThis,
        receitaVariation,
        aReceber30d,
        aReceber30dCount: pendentes30d.length,
        despesasMes: despesaThis,
        despesaVariation,
        margemLiquida,
      },
      proximosRecebimentos,
      dre,
      grafico6m,
      pendingNFs,
    };
  }, [query.data, todayDate, todayStr]);

  return { data: computed, isLoading: query.isLoading };
}
