import { useState } from "react";
import { Plus, Pencil, Trash2, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useInvoicesNF } from "@/hooks/useInvoicesNF";
import { InvoiceNFForm } from "./InvoiceNFForm";
import { csvRow, csvBrl, downloadCsv } from "@/lib/csv";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const NF_TYPE_LABEL: Record<string, string> = { emitida: "Emitida", recebida: "Recebida" };
const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  enviada_contador: "Enviada ao Contador",
  arquivada: "Arquivada",
};

function formatCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-warning/15 text-warning border-warning/30" },
  enviada_contador: { label: "Enviada", className: "bg-primary/15 text-primary border-primary/30" },
  arquivada: { label: "Arquivada", className: "bg-muted text-muted-foreground border-muted" },
};

const typeConfig: Record<string, { label: string; className: string }> = {
  emitida: { label: "Emitida", className: "bg-success/15 text-success border-success/30" },
  recebida: { label: "Recebida", className: "bg-accent text-accent-foreground border-accent" },
};

interface InvoiceNFListProps {
  projectId?: string;
  showProjectColumn?: boolean;
  projects?: { id: string; name: string }[];
}

export function InvoiceNFList({ projectId, showProjectColumn, projects }: InvoiceNFListProps) {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterProject, setFilterProject] = useState<string>(projectId || "");

  const filters = {
    projectId: filterProject && filterProject !== "all" ? filterProject : undefined,
    nfType: filterType && filterType !== "all" ? filterType : undefined,
    competenceMonth: filterMonth || undefined,
    status: filterStatus && filterStatus !== "all" ? filterStatus : undefined,
  };
  const { items, isLoading, create, update, remove } = useInvoicesNF(filters);

  const { data: defaultServiceCode } = useQuery({
    queryKey: ["settings-nf-service-code"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("nf_service_code").limit(1).maybeSingle();
      return (data as any)?.nf_service_code as string | null ?? null;
    },
    enabled: !!user,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  const handleSendToAccountant = (item: any) => {
    update.mutate({ id: item.id, status: "enviada_contador", sent_to_accountant_at: new Date().toISOString() });
  };

  const totalEmitidas = items.filter((i: any) => i.nf_type === "emitida").reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
  const totalRecebidas = items.filter((i: any) => i.nf_type === "recebida").reduce((s: number, i: any) => s + (i.amount ?? 0), 0);

  const handleExportCSV = () => {
    const emitidas = items.filter((i: any) => i.nf_type === "emitida");
    const recebidas = items.filter((i: any) => i.nf_type === "recebida");
    const header = csvRow([
      "Nº NF", "Tipo", "Emitente", "Tomador", "Valor (R$)",
      "Data Emissão", "Competência", "Status",
    ]);
    const toRow = (i: any) => csvRow([
      i.nf_number || "",
      NF_TYPE_LABEL[i.nf_type] ?? i.nf_type,
      i.issuer_name || "",
      i.recipient_name || "",
      csvBrl(i.amount),
      i.issue_date || "",
      i.competence_month || "",
      STATUS_LABEL[i.status] ?? i.status,
    ]);
    let csv = "NOTAS FISCAIS EMITIDAS\n" + header;
    emitidas.forEach((i: any) => { csv += toRow(i); });
    csv += csvRow(["", "", "", "Total Emitidas", csvBrl(totalEmitidas)]) + "\n";
    csv += "NOTAS FISCAIS RECEBIDAS\n" + header;
    recebidas.forEach((i: any) => { csv += toRow(i); });
    csv += csvRow(["", "", "", "Total Recebidas", csvBrl(totalRecebidas)]);
    downloadCsv(`relatorio_nf_${filterMonth || "geral"}.csv`, csv);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {showProjectColumn && projects && (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Projeto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="emitida">Emitida</SelectItem>
            <SelectItem value="recebida">Recebida</SelectItem>
          </SelectContent>
        </Select>
        <Input type="month" className="w-[160px]" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} placeholder="Competência" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="enviada_contador">Enviada</SelectItem>
            <SelectItem value="arquivada">Arquivada</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={items.length === 0}>
          <FileText className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova NF
        </Button>
      </div>

      {/* Totals */}
      <div className="flex gap-4 text-sm">
        <span>Emitidas: <strong className="text-success">{formatCurrency(totalEmitidas)}</strong></span>
        <span>Recebidas: <strong className="text-primary">{formatCurrency(totalRecebidas)}</strong></span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Nenhuma nota fiscal encontrada.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº NF</TableHead>
              <TableHead>Tipo</TableHead>
              {showProjectColumn && <TableHead>Projeto</TableHead>}
              <TableHead>Emitente</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Competência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: any) => {
              const st = statusConfig[item.status] || statusConfig.pendente;
              const tp = typeConfig[item.nf_type] || typeConfig.recebida;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nf_number || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={tp.className}>{tp.label}</Badge></TableCell>
                  {showProjectColumn && <TableCell className="text-muted-foreground">{item.projects?.name || "—"}</TableCell>}
                  <TableCell>{item.issuer_name || "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(item.amount)}</TableCell>
                  <TableCell>{formatDate(item.issue_date)}</TableCell>
                  <TableCell>{item.competence_month || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={st.className}>{st.label}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.status === "pendente" && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" title="Enviar ao Contador" onClick={() => handleSendToAccountant(item)}>
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(item); setFormOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(item.id)}>
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

      <InvoiceNFForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => {
          if (editing) {
            update.mutate({ id: editing.id as string, ...data });
          } else {
            create.mutate(data);
          }
          setEditing(null);
        }}
        initialData={editing}
        isLoading={create.isPending || update.isPending}
        projectId={projectId}
        showProjectSelect={showProjectColumn}
        projects={projects}
        defaultServiceCode={defaultServiceCode}
      />
    </div>
  );
}
