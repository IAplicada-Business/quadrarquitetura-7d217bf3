import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

interface InvoiceNFFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
  projectId?: string;
  showProjectSelect?: boolean;
  projects?: { id: string; name: string }[];
}

export function InvoiceNFForm({ open, onOpenChange, onSubmit, initialData, isLoading, projectId, showProjectSelect, projects }: InvoiceNFFormProps) {
  const [form, setForm] = useState({
    project_id: projectId || "",
    nf_number: "",
    nf_type: "recebida" as string,
    issuer_name: "",
    issuer_cnpj: "",
    recipient_name: "",
    recipient_cnpj: "",
    service_description: "",
    amount: "",
    issue_date: "",
    competence_month: "",
    status: "pendente",
    notes: "",
    file_url: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        project_id: (initialData.project_id as string) || projectId || "",
        nf_number: (initialData.nf_number as string) || "",
        nf_type: (initialData.nf_type as string) || "recebida",
        issuer_name: (initialData.issuer_name as string) || "",
        issuer_cnpj: (initialData.issuer_cnpj as string) || "",
        recipient_name: (initialData.recipient_name as string) || "",
        recipient_cnpj: (initialData.recipient_cnpj as string) || "",
        service_description: (initialData.service_description as string) || "",
        amount: String(initialData.amount ?? ""),
        issue_date: (initialData.issue_date as string) || "",
        competence_month: (initialData.competence_month as string) || "",
        status: (initialData.status as string) || "pendente",
        notes: (initialData.notes as string) || "",
        file_url: (initialData.file_url as string) || "",
      });
    } else {
      setForm({
        project_id: projectId || "",
        nf_number: "",
        nf_type: "recebida",
        issuer_name: "",
        issuer_cnpj: "",
        recipient_name: "",
        recipient_cnpj: "",
        service_description: "",
        amount: "",
        issue_date: "",
        competence_month: "",
        status: "pendente",
        notes: "",
        file_url: "",
      });
    }
  }, [initialData, projectId, open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("invoices").upload(path, file);
    if (error) {
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("invoices").getPublicUrl(path);
    setForm((f) => ({ ...f, file_url: pub.publicUrl }));
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!form.amount || !form.issue_date || !form.project_id) return;
    onSubmit({
      project_id: form.project_id,
      nf_number: form.nf_number || null,
      nf_type: form.nf_type,
      issuer_name: form.issuer_name || null,
      issuer_cnpj: form.issuer_cnpj || null,
      recipient_name: form.recipient_name || null,
      recipient_cnpj: form.recipient_cnpj || null,
      service_description: form.service_description || null,
      amount: parseFloat(form.amount),
      issue_date: form.issue_date,
      competence_month: form.competence_month || null,
      status: form.status,
      notes: form.notes || null,
      file_url: form.file_url || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {showProjectSelect && projects && (
            <div>
              <Label>Projeto *</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm((f) => ({ ...f, project_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nº NF</Label>
              <Input value={form.nf_number} onChange={(e) => setForm((f) => ({ ...f, nf_number: e.target.value }))} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.nf_type} onValueChange={(v) => setForm((f) => ({ ...f, nf_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="emitida">Emitida</SelectItem>
                  <SelectItem value="recebida">Recebida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Emitente</Label>
              <Input value={form.issuer_name} onChange={(e) => setForm((f) => ({ ...f, issuer_name: e.target.value }))} />
            </div>
            <div>
              <Label>CNPJ Emitente</Label>
              <Input value={form.issuer_cnpj} onChange={(e) => setForm((f) => ({ ...f, issuer_cnpj: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Destinatário</Label>
              <Input value={form.recipient_name} onChange={(e) => setForm((f) => ({ ...f, recipient_name: e.target.value }))} />
            </div>
            <div>
              <Label>CNPJ Destinatário</Label>
              <Input value={form.recipient_cnpj} onChange={(e) => setForm((f) => ({ ...f, recipient_cnpj: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Descrição do serviço</Label>
            <Textarea value={form.service_description} onChange={(e) => setForm((f) => ({ ...f, service_description: e.target.value }))} rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Valor *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <Label>Data Emissão *</Label>
              <Input type="date" value={form.issue_date} onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))} />
            </div>
            <div>
              <Label>Competência</Label>
              <Input type="month" value={form.competence_month} onChange={(e) => setForm((f) => ({ ...f, competence_month: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="enviada_contador">Enviada ao Contador</SelectItem>
                <SelectItem value="arquivada">Arquivada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <div>
            <Label>Arquivo (XML/PDF)</Label>
            <div className="flex items-center gap-2">
              <Input type="file" accept=".xml,.pdf" onChange={handleUpload} disabled={uploading} />
              {uploading && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}
            </div>
            {form.file_url && (
              <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                <Upload className="h-3 w-3" /> Ver arquivo
              </a>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={isLoading || !form.amount || !form.issue_date || !form.project_id} className="w-full">
            {initialData ? "Salvar" : "Adicionar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
