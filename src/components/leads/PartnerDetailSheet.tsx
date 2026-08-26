import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Phone, Mail, Send, Pencil, ExternalLink, Handshake } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLeads, partnerStageLabels, leadStatusLabels, type Lead } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { LeadFormDialog } from "@/components/leads/LeadFormDialog";

const stageColors: Record<string, string> = {
  novo: "bg-blue-500/10 text-blue-700 border-blue-200",
  primeira_conversa: "bg-amber-500/10 text-amber-700 border-amber-200",
  parceria_ativa: "bg-green-500/10 text-green-700 border-green-200",
  trouxe_indicacao: "bg-purple-500/10 text-purple-700 border-purple-200",
  fidelizado: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
  inativo: "bg-gray-500/10 text-gray-700 border-gray-200",
};

interface PartnerDetailSheetProps {
  partnerId: string | null;
  onOpenChange: (open: boolean) => void;
  leadsHook: ReturnType<typeof useLeads>;
}

/**
 * Painel lateral com a "visão de parceiro": indicações agrupadas
 * (obras/leads que ele trouxe) e histórico, sem sair do kanban —
 * abre pra qualquer parceiro, em qualquer etapa, ao clicar no card.
 * A página completa (/partners/:id) continua existindo pra quem
 * quiser um link direto ou mais espaço.
 */
export function PartnerDetailSheet({ partnerId, onOpenChange, leadsHook }: PartnerDetailSheetProps) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const partner = leadsHook.leads.find((p) => p.id === partnerId) ?? null;

  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ["leads", "referred-by", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("referred_by_partner_id", partnerId!)
        .eq("lead_type", "comercial")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!partnerId,
  });

  const fechadas = referrals.filter((r) => r.status === "fechado").length;
  const taxaConversao = referrals.length > 0 ? Math.round((fechadas / referrals.length) * 100) : 0;

  return (
    <Sheet open={!!partnerId} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        {partner && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" /> {partner.name}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4 mt-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {partner.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {partner.phone}</span>}
                {partner.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {partner.email}</span>}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {partner.partner_stage && (
                  <Badge variant="outline" className={`text-xs ${stageColors[partner.partner_stage]}`}>
                    {partnerStageLabels[partner.partner_stage]}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  Parceiro desde {format(new Date(partner.created_at), "MMM 'de' yyyy", { locale: pt })}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/partners/${partner.id}`)}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Página completa
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Indicações trazidas</p>
                  <p className="text-xl font-bold">{referrals.length}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Taxa de conversão</p>
                  <p className="text-xl font-bold">{taxaConversao}%</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium flex items-center gap-1.5 mb-2">
                  <Send className="h-3.5 w-3.5" /> Indicações (agrupadas)
                </p>
                {referralsLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando…</p>
                ) : referrals.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                    Este parceiro ainda não trouxe nenhuma indicação.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {referrals.map((lead) => (
                      <Link
                        key={lead.id}
                        to={`/leads/${lead.id}`}
                        className="flex items-center justify-between gap-2 p-2.5 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm font-medium truncate">{lead.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px]">{leadStatusLabels[lead.status] || lead.status}</Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(lead.created_at), "dd/MM/yy", { locale: pt })}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {editOpen && (
              <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} editingLead={partner} lockType="parceiro" leadsHook={leadsHook} />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
