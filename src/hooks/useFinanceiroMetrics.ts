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
  const today = new Date();

  const query = useQuery({
    queryKey: ["financeiro-metrics"],
    queryFn: async () => {
      const [paymentsRes, nfsRes] = await Promise.all([
        supabase
          .from("payments")
          .select("id, value, due_date, paid_date, status, description, source, supplier_name, project_id, created_at, projects(name)")
          .eq("source", "escritorio"),
        supabase.from("invoices_nf").select("id").eq("status", "pendente"),
      ]);
      return {
        payments: (paymentsRes.data ?? []) as unknown as PaymentRow[],
        pendingNFs: (nfsRes.data ?? []).length,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const computed = useMemo(() => {
    if (!query.data) return null;
    const { payments, pendingNFs } = query.data;
    const taxRate = 6; // default

    const currentMonthStr = format(today, "yyyy-MM");
    const prevMonthStr = format(subMonths(today, 1), "yyyy-MM");
    const todayStr = format(today, "yyyy-MM-dd");

    // Helper: is payment a revenue? (description contains "honorário" or "receita", or no supplier_name)
    const isReceita = (p: PaymentRow) => {
      const desc = (p.description ?? "").toLowerCase();
      return desc.includes("receita") || desc.includes("honorár") || (!p.supplier_name && p.value > 0);
    };

    const isDespesa = (p: PaymentRow) => !isReceita(p);

    // Paid this month
    const paidThisMonth = payments.filter((p) => p.status === "pago" && p.paid_date?.startsWith(currentMonthStr));
    const paidPrevMonth = payments.filter((p) => p.status === "pago" && p.paid_date?.startsWith(prevMonthStr));

    const receitaThis = paidThisMonth.filter(isReceita).reduce((s, p) => s + p.value, 0);
    const receitaPrev = paidPrevMonth.filter(isReceita).reduce((s, p) => s + p.value, 0);
    const receitaVariation = receitaPrev > 0 ? Math.round(((receitaThis - receitaPrev) / receitaPrev) * 100) : 0;

    const despesaThis = paidThisMonth.filter(isDespesa).reduce((s, p) => s + p.value, 0);
    const despesaPrev = paidPrevMonth.filter(isDespesa).reduce((s, p) => s + p.value, 0);
    const despesaVariation = despesaPrev > 0 ? Math.round(((despesaThis - despesaPrev) / despesaPrev) * 100) : 0;

    // A receber 30 dias
    const thirtyDaysLater = format(new Date(today.getTime() + 30 * 86400000), "yyyy-MM-dd");
    const pendentes30d = payments.filter(
      (p) => p.status === "pendente" && p.due_date && p.due_date >= todayStr && p.due_date <= thirtyDaysLater
    );
    const aReceber30d = pendentes30d.reduce((s, p) => s + p.value, 0);

    // Margem líquida
    const impostos = receitaThis * (taxRate / 100);
    const liquido = receitaThis - despesaThis - impostos;
    const margemLiquida = receitaThis > 0 ? Math.round((liquido / receitaThis) * 100) : 0;

    // ── Próximos recebimentos ──
    const proximosRecebimentos: ProximoRecebimento[] = payments
      .filter((p) => p.status === "pendente" && p.due_date && p.due_date >= todayStr)
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
      .slice(0, 4)
      .map((p) => ({
        project: p.projects?.name ?? "Projeto",
        description: p.description ?? "",
        value: p.value,
        dueDate: p.due_date!,
        daysLeft: differenceInDays(parseISO(p.due_date!), today),
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
      const m = subMonths(today, i);
      const mStr = format(m, "yyyy-MM");
      const label = format(m, "MMM", { locale: ptBR });
      const capLabel = label.charAt(0).toUpperCase() + label.slice(1);

      const monthPaid = payments.filter((p) => p.status === "pago" && p.paid_date?.startsWith(mStr));
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
  }, [query.data, today]);

  return { data: computed, isLoading: query.isLoading };
}
