import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Handshake } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLeads, type Lead, type LeadType } from "@/hooks/useLeads";
import { useAcquisitionChannels } from "@/hooks/useAcquisitionChannels";
import { toast } from "@/hooks/use-toast";

interface FormState {
  type: LeadType;
  name: string;
  phone: string;
  email: string;
  phone_secondary: string;
  project_type: string;
  channel_id: string | null;
  referred_by_partner_id: string | null;
  responsible: string;
  notes: string;
  meeting_date: string;
}

const emptyForm = (defaultType: LeadType): FormState => ({
  type: defaultType, name: "", phone: "", email: "", phone_secondary: "",
  project_type: "residencial", channel_id: null, referred_by_partner_id: null,
  responsible: "", notes: "", meeting_date: "",
});

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLead: Lead | null;
  /** Quando setado, esconde o toggle de tipo e trava o valor (usado pelo Pipeline de Parceiros, onde o contexto já é inequívoco). */
  lockType?: LeadType;
  /** Hook de leads do tipo "dono" desta tela — usado pra criar/editar quando o tipo não muda. */
  leadsHook: ReturnType<typeof useLeads>;
}

/**
 * Formulário de lead compartilhado entre o Pipeline Comercial e o
 * Pipeline de Parceiros. O tipo (comercial/parceiro) é escolhido antes
 * dos demais campos e determina quais aparecem depois — ver item 9 do
 * pedido de reposicionamento estratégico.
 */
export function LeadFormDialog({ open, onOpenChange, editingLead, lockType, leadsHook }: LeadFormDialogProps) {
  const navigate = useNavigate();
  const { activeChannels } = useAcquisitionChannels();
  // Lista de parceiros só é necessária quando o canal escolhido é "de parceria" —
  // mas o hook é barato (mesma tabela, query cacheada) e não temos como
  // condicioná-lo à seleção de canal sem violar regras de hooks.
  const partnersHook = useLeads("parceiro");
  const activePartners = partnersHook.leads.filter((p) => p.partner_stage !== "inativo");

  const [form, setForm] = useState<FormState>(emptyForm(lockType ?? "comercial"));

  useEffect(() => {
    if (!open) return;
    if (editingLead) {
      setForm({
        type: editingLead.lead_type,
        name: editingLead.name, phone: editingLead.phone, email: editingLead.email || "",
        phone_secondary: editingLead.phone_secondary || "", project_type: editingLead.project_type,
        channel_id: editingLead.channel_id, referred_by_partner_id: editingLead.referred_by_partner_id,
        responsible: editingLead.responsible || "", notes: editingLead.notes || "",
        meeting_date: editingLead.meeting_date || "",
      });
    } else {
      setForm(emptyForm(lockType ?? "comercial"));
    }
  }, [open, editingLead, lockType]);

  const selectedChannel = activeChannels.find((c) => c.id === form.channel_id);
  const showPartnerLinkSelect = form.type === "comercial" && !!selectedChannel?.is_partner_channel;

  const isPartner = form.type === "parceiro";

  const handleSubmit = async () => {
    if (!form.name || !form.phone || leadsHook.create.isPending || leadsHook.update.isPending) return;
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      phone_secondary: form.phone_secondary,
      project_type: isPartner ? undefined : form.project_type,
      channel_id: isPartner ? null : form.channel_id,
      referred_by_partner_id: showPartnerLinkSelect ? form.referred_by_partner_id : null,
      responsible: isPartner ? undefined : form.responsible,
      notes: form.notes,
      meeting_date: isPartner ? undefined : form.meeting_date,
    };
    try {
      if (editingLead) {
        await leadsHook.update.mutateAsync({ id: editingLead.id, ...payload });
      } else {
        await leadsHook.create.mutateAsync({ ...payload, lead_type: form.type });
        if (form.type === "parceiro" && lockType !== "parceiro") {
          toast({ title: "Veja o novo parceiro no Pipeline de Parceiros" });
          navigate("/partners/pipeline");
        }
      }
      onOpenChange(false);
    } catch {
      // Toast de erro já tratado no hook; mantém o formulário aberto.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingLead ? (isPartner ? "Editar Parceiro" : "Editar Lead") : (isPartner ? "Novo Parceiro" : "Novo Lead")}
          </DialogTitle>
        </DialogHeader>

        {!editingLead && !lockType && (
          <ToggleGroup
            type="single"
            value={form.type}
            onValueChange={(v) => v && setForm((f) => ({ ...f, type: v as LeadType }))}
            className="justify-start border rounded-lg p-1 bg-muted/30 w-fit"
          >
            <ToggleGroupItem value="comercial" className="gap-1.5 px-3">
              <Building2 className="h-3.5 w-3.5" /> Lead comercial
            </ToggleGroupItem>
            <ToggleGroupItem value="parceiro" className="gap-1.5 px-3">
              <Handshake className="h-3.5 w-3.5" /> Lead parceiro
            </ToggleGroupItem>
          </ToggleGroup>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{isPartner ? "Estúdio de origem *" : "Nome *"}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={isPartner ? "Ex: Estúdio Morata" : undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone *</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone Secundário</Label>
            <Input value={form.phone_secondary} onChange={(e) => setForm({ ...form, phone_secondary: e.target.value })} />
          </div>

          {!isPartner && (
            <>
              <div className="space-y-1.5">
                <Label>Tipo de Projeto</Label>
                <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residencial">Residencial</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Canal de aquisição</Label>
                <Select
                  value={form.channel_id ?? "none"}
                  onValueChange={(v) => setForm({ ...form, channel_id: v === "none" ? null : v, referred_by_partner_id: null })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione um canal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {activeChannels.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {showPartnerLinkSelect && (
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Parceiro que indicou</Label>
                  <Select
                    value={form.referred_by_partner_id ?? "none"}
                    onValueChange={(v) => setForm({ ...form, referred_by_partner_id: v === "none" ? null : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione o parceiro" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não informado</SelectItem>
                      {activePartners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Responsável</Label>
                <Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Data da Reunião</Label>
                <Input type="date" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} />
              </div>
            </>
          )}

          <div className="md:col-span-2 space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!form.name || !form.phone || leadsHook.create.isPending || leadsHook.update.isPending}>
            {editingLead ? "Salvar" : isPartner ? "Criar Parceiro" : "Criar Lead"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
