import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSupplierAllocations } from "@/hooks/useSupplierAllocations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  supplier: { id: string; name: string; category: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-sm ${i < value ? "text-yellow-400" : "text-muted-foreground/30"}`}>★</span>
      ))}
    </span>
  );
}

export function SupplierDetailSheet({ supplier, open, onOpenChange }: Props) {
  const { user } = useAuth();

  // All allocations for this supplier
  const { data: allocations = [] } = useQuery({
    queryKey: ["supplier_allocations_detail", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_allocations")
        .select("*, projects(name)")
        .eq("supplier_id", supplier!.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!supplier?.id && !!user,
  });

  // Compare: all allocations of same category/discipline
  const category = supplier?.category;
  const { data: categoryAllocations = [] } = useQuery({
    queryKey: ["supplier_allocations_category", category],
    queryFn: async () => {
      if (!category) return [];
      const { data, error } = await supabase
        .from("supplier_allocations")
        .select("*, suppliers(name)")
        .eq("discipline", category);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!category && !!user && open,
  });

  // Chart data: avg contracted_value per supplier
  const chartData = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number; supplierId: string }>();
    categoryAllocations.forEach((a: any) => {
      if (!a.contracted_value) return;
      const key = a.supplier_id;
      const existing = map.get(key);
      if (existing) {
        existing.total += Number(a.contracted_value);
        existing.count += 1;
      } else {
        map.set(key, {
          name: a.suppliers?.name || "—",
          total: Number(a.contracted_value),
          count: 1,
          supplierId: key,
        });
      }
    });
    return Array.from(map.values())
      .map(v => ({ name: v.name, avg: Math.round(v.total / v.count), supplierId: v.supplierId }))
      .sort((a, b) => a.avg - b.avg);
  }, [categoryAllocations]);

  // Stats
  const totalObras = allocations.length;
  const avgContracted = totalObras > 0
    ? allocations.reduce((s: number, a: any) => s + (Number(a.contracted_value) || 0), 0) / allocations.filter((a: any) => a.contracted_value).length || 0
    : 0;
  const deviations = allocations.filter((a: any) => a.contracted_value && a.final_value);
  const avgDeviation = deviations.length > 0
    ? deviations.reduce((s: number, a: any) => s + ((Number(a.final_value) - Number(a.contracted_value)) / Number(a.contracted_value)) * 100, 0) / deviations.length
    : 0;

  // Rating
  const rated = allocations.filter((a: any) => a.rating != null);
  const avgRating = rated.length > 0
    ? Math.round(rated.reduce((s: number, a: any) => s + a.rating, 0) / rated.length * 10) / 10
    : 0;
  const recentNotes = allocations.filter((a: any) => a.notes).slice(0, 3);

  if (!supplier) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {supplier.name}
            {supplier.category && <Badge variant="secondary">{supplier.category}</Badge>}
          </SheetTitle>
        </SheetHeader>

        {/* Histórico de Obras */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold mb-3">Histórico de Obras</h3>
          {allocations.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma contratação registrada.</p>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Projeto</TableHead>
                      <TableHead className="text-xs">Disciplina</TableHead>
                      <TableHead className="text-xs text-right">Contratado</TableHead>
                      <TableHead className="text-xs text-right">Final</TableHead>
                      <TableHead className="text-xs">Avaliação</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs">{a.projects?.name || "—"}</TableCell>
                        <TableCell className="text-xs">{a.discipline || "—"}</TableCell>
                        <TableCell className="text-xs text-right">
                          {a.contracted_value ? `R$ ${Number(a.contracted_value).toLocaleString("pt-BR")}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {a.final_value ? `R$ ${Number(a.final_value).toLocaleString("pt-BR")}` : "—"}
                        </TableCell>
                        <TableCell>{a.rating ? <Stars value={a.rating} /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-xs">
                          {a.start_date ? format(new Date(a.start_date), "dd/MM/yy", { locale: ptBR }) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span><strong>{totalObras}</strong> obras</span>
                <span>Valor médio: <strong>R$ {Math.round(avgContracted).toLocaleString("pt-BR")}</strong></span>
                <span>Desvio médio: <strong className={avgDeviation > 0 ? "text-destructive" : "text-green-600"}>
                  {avgDeviation > 0 ? "+" : ""}{avgDeviation.toFixed(1)}%
                </strong></span>
              </div>
            </>
          )}
        </section>

        {/* Comparativo de Preços */}
        {chartData.length > 1 && (
          <section className="mt-6">
            <h3 className="text-sm font-semibold mb-3">Comparativo de Preços — {category}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.supplierId}
                        fill={entry.supplierId === supplier.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Avaliação Consolidada */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold mb-3">Avaliação Consolidada</h3>
          {rated.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem avaliações registradas.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Stars value={Math.round(avgRating)} />
                <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({rated.length} avaliações)</span>
              </div>
              {recentNotes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Últimas observações:</p>
                  {recentNotes.map((a: any) => (
                    <div key={a.id} className="text-xs border rounded-md p-2">
                      <span className="text-muted-foreground">
                        {a.start_date ? format(new Date(a.start_date), "dd/MM/yy") : "—"} —
                      </span>{" "}
                      {a.notes}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </SheetContent>
    </Sheet>
  );
}
