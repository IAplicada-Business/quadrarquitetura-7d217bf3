import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProjectPayments } from "@/hooks/useProjectPayments";
import { useInvoices } from "@/hooks/useInvoices";
import { useProjectPurchases } from "@/hooks/useProjectPurchases";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentForm } from "./PaymentForm";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceNFList } from "./InvoiceNFList";
import jsPDF from "jspdf";

function formatCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-warning/15 text-warning border-warning/30" },
  notificado: { label: "Notificado", className: "bg-primary/15 text-primary border-primary/30" },
  pago: { label: "Pago", className: "bg-success/15 text-success border-success/30" },
  atrasado: { label: "Atrasado", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function ProjectFinancialTab({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const { user } = useAuth();
  const payments = useProjectPayments(projectId);
  const invoices = useInvoices(projectId);
  const purchases = useProjectPurchases(projectId);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Record<string, unknown> | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Record<string, unknown> | null>(null);

  // Tax rate from settings
  const { data: taxRate } = useQuery({
    queryKey: ["settings-tax-rate"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return (data as any)?.tax_rate_percent ?? 6;
    },
    enabled: !!user,
  });

  // DRE calculations
  const dre = useMemo(() => {
    const rate = taxRate ?? 6;
    const receitaHonorarios = payments.items
      .filter((p) => p.source === "escritorio" && p.status === "pago")
      .reduce((s, p) => s + p.value, 0);
    const receitaObra = payments.items
      .filter((p) => p.source === "obra" && p.value > 0 && p.description?.toLowerCase().includes("receita"))
      .reduce((s, p) => s + p.value, 0);
    const receitaTotal = receitaHonorarios + receitaObra;

    const despesasFornecedores = payments.items
      .filter((p) => (p.source === "obra" || p.source === "cotacao") && p.status === "pago" && !p.description?.toLowerCase().includes("receita"))
      .reduce((s, p) => s + p.value, 0);
    const despesasCompras = purchases.items.reduce((s, p) => s + (p.value || 0), 0);
    const despesasTotal = despesasFornecedores + despesasCompras;

    const resultadoBruto = receitaTotal - despesasTotal;
    const impostos = receitaTotal * (rate / 100);
    const resultadoLiquido = resultadoBruto - impostos;
    const margem = receitaTotal > 0 ? (resultadoLiquido / receitaTotal) * 100 : 0;

    return {
      receitaHonorarios, receitaObra, receitaTotal,
      despesasFornecedores, despesasCompras, despesasTotal,
      resultadoBruto, impostos, resultadoLiquido, margem, rate,
    };
  }, [payments.items, purchases.items, taxRate]);

  // Payment totals
  const paymentTotals = useMemo(() => {
    const paid = payments.items.filter((p) => p.status === "pago").reduce((s, p) => s + p.value, 0);
    const pending = payments.items.filter((p) => p.status !== "pago").reduce((s, p) => s + p.value, 0);
    return { paid, pending, total: paid + pending };
  }, [payments.items]);

  // Invoice totals grouped by category
  const invoiceGroups = useMemo(() => {
    const groups: Record<string, { items: typeof invoices.items; total: number }> = {};
    for (const inv of invoices.items) {
      const cat = inv.category || "Diversos";
      if (!groups[cat]) groups[cat] = { items: [], total: 0 };
      groups[cat].items.push(inv);
      groups[cat].total += inv.value || 0;
    }
    return groups;
  }, [invoices.items]);

  const invoiceTotal = invoices.items.reduce((s, i) => s + (i.value || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs defaultValue="pagamentos">
        <TabsList>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="notas">Notas Fiscais (Compras)</TabsTrigger>
          <TabsTrigger value="notas_nf">Notas Fiscais</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
        </TabsList>

        <TabsContent value="pagamentos" className="space-y-4 mt-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total Pago</CardTitle></CardHeader>
              <CardContent><p className="text-lg font-bold text-success">{formatCurrency(paymentTotals.paid)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Pendente</CardTitle></CardHeader>
              <CardContent><p className="text-lg font-bold text-warning">{formatCurrency(paymentTotals.pending)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total Geral</CardTitle></CardHeader>
              <CardContent><p className="text-lg font-bold text-display">{formatCurrency(paymentTotals.total)}</p></CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-display">Fluxo de Pagamentos</h3>
            <Button size="sm" onClick={() => { setEditingPayment(null); setPaymentFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Novo Pagamento
            </Button>
          </div>

          {payments.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : payments.items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhum pagamento cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.items.map((p) => {
                  const st = paymentStatusConfig[p.status || "pendente"];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.description || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(p.value)}</TableCell>
                      <TableCell>{formatDate(p.due_date)}</TableCell>
                      <TableCell>{formatDate(p.paid_date)}</TableCell>
                      <TableCell>{p.installment_number && p.total_installments ? `${p.installment_number}/${p.total_installments}` : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className={st?.className}>{st?.label || p.status}</Badge>
                          {p.source === "cotacao" && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">Gerado da cotação</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingPayment(p as Record<string, unknown>); setPaymentFormOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => payments.remove.mutate(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="notas" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-display">Notas Fiscais</h3>
              <p className="text-sm text-muted-foreground">Total: {formatCurrency(invoiceTotal)}</p>
            </div>
            <Button size="sm" onClick={() => { setEditingInvoice(null); setInvoiceFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Nova NF
            </Button>
          </div>

          {invoices.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : Object.keys(invoiceGroups).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhuma nota fiscal cadastrada.
            </div>
          ) : (
            Object.entries(invoiceGroups).map(([category, { items: catItems, total }]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-display">{category}</h4>
                  <span className="text-sm font-medium text-primary">{formatCurrency(total)}</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Nº</TableHead>
                      <TableHead>Lugar</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catItems.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.invoice_number || "—"}</TableCell>
                        <TableCell>{inv.store_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{inv.description || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(inv.value)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingInvoice(inv as Record<string, unknown>); setInvoiceFormOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => invoices.remove.mutate(inv.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="notas_nf" className="space-y-4 mt-4">
          <InvoiceNFList projectId={projectId} />
        </TabsContent>
      </Tabs>

      <PaymentForm
        open={paymentFormOpen}
        onOpenChange={setPaymentFormOpen}
        onSubmit={(data) => {
          if (editingPayment) {
            payments.update.mutate({ id: editingPayment.id as string, ...data });
          } else {
            payments.create.mutate(data);
          }
          setEditingPayment(null);
        }}
        initialData={editingPayment}
        isLoading={payments.create.isPending || payments.update.isPending}
      />

      <InvoiceForm
        open={invoiceFormOpen}
        onOpenChange={setInvoiceFormOpen}
        onSubmit={(data) => {
          if (editingInvoice) {
            invoices.update.mutate({ id: editingInvoice.id as string, ...data });
          } else {
            invoices.create.mutate(data);
          }
          setEditingInvoice(null);
        }}
        initialData={editingInvoice}
        isLoading={invoices.create.isPending || invoices.update.isPending}
      />
    </div>
  );
}
