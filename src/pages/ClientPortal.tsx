import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientScheduleView } from "@/components/projects/ClientScheduleView";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Wallet, Camera, MessageCircle, AlertTriangle, FileBarChart, Check, Send } from "lucide-react";
import { toast } from "sonner";

function formatCurrency(v: number | null | undefined) {
  if (v == null) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
}

function formatWeekLabel(weekStart: string) {
  const start = new Date(weekStart + "T00:00:00");
  const end = addDays(start, 6);
  return `Semana de ${format(start, "dd", { locale: ptBR })} a ${format(end, "dd 'de' MMMM", { locale: ptBR })}`;
}

interface WeeklyReport {
  id: string;
  week_start: string;
  summary: string;
  next_steps: string;
  completion_percent: number;
  photo_urls: string[];
  client_pending: string | null;
  created_at: string;
}

interface PendingResponse {
  id: string;
  weekly_report_id: string;
  pending_item: string;
  response_text: string | null;
  status: string;
  responded_at: string | null;
  client_name: string | null;
  created_at: string;
}

interface PortalData {
  project: { name: string; address: string | null; city: string | null; estimated_budget: number | null; ideal_budget: number | null; client_move_in_date?: string | null };
  tasks: any[];
  payments: any[];
  invoices: any[];
  photos: { url: string; date: string }[];
  weekly_reports: WeeklyReport[];
  pending_responses: PendingResponse[];
}

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [respondModal, setRespondModal] = useState<{ reportId: string; item: string } | null>(null);
  const [responseText, setResponseText] = useState("");
  const [clientName, setClientName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-client-portal-data`;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro desconhecido");
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const submitResponse = async (reportId: string, pendingItem: string, status: "aprovado" | "respondido", text?: string) => {
    let name = clientName;
    if (!name) {
      name = prompt("Seu nome (para registro):") || "";
      if (!name) { toast.error("Nome é obrigatório para registrar a resposta"); return; }
      setClientName(name);
    }

    setSubmitting(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-client-response`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          token,
          weekly_report_id: reportId,
          pending_item: pendingItem,
          response_text: text || null,
          status,
          client_name: name,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao enviar resposta");

      // Update local state
      if (data) {
        setData({
          ...data,
          pending_responses: [
            ...(data.pending_responses || []),
            {
              id: json.data?.id || crypto.randomUUID(),
              weekly_report_id: reportId,
              pending_item: pendingItem,
              response_text: text || null,
              status,
              responded_at: new Date().toISOString(),
              client_name: name,
              created_at: new Date().toISOString(),
            },
          ],
        });
      }
      toast.success(status === "aprovado" ? "Aprovado com sucesso!" : "Resposta enviada!");
      setRespondModal(null);
      setResponseText("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold">Link inválido ou expirado</h1>
            <p className="text-muted-foreground text-sm">
              Este link de acompanhamento não é válido. Solicite um novo link ao responsável pelo seu projeto.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { project, tasks, payments, invoices, photos, weekly_reports, pending_responses = [] } = data;
  const contracted = project.estimated_budget || 0;
  const paid = payments
    .filter((p: any) => p.status === "pago")
    .reduce((s: number, p: any) => s + (p.value || 0), 0);
  const balance = contracted - paid;

  const getResponseForReport = (reportId: string, item: string) =>
    pending_responses.find(r => r.weekly_report_id === reportId && r.pending_item === item && r.status !== "aguardando");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase opacity-80 mb-1">Quadra Arquitetura</p>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {(project.address || project.city) && (
            <p className="text-sm opacity-80 mt-1">
              {[project.address, project.city].filter(Boolean).join(" — ")}
            </p>
          )}
          {project.client_move_in_date && (
            <div className="mt-3 inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-md px-3 py-1.5">
              <span className="text-xs opacity-80">Mudança planejada:</span>
              <span className="text-sm font-display tabular-nums">
                {(() => {
                  const d = new Date(project.client_move_in_date + "T00:00:00");
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
                  if (days < 0) return `Há ${Math.abs(days)} dia(s)`;
                  if (days === 0) return "Hoje";
                  if (days === 1) return "1 dia";
                  return `${days} dias`;
                })()}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-8 pb-16">
        {/* Cronograma */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Cronograma</h2>
          </div>
          <ClientScheduleView tasks={tasks} projectName={project.name} />
        </section>

        {/* Relatórios Semanais */}
        {weekly_reports && weekly_reports.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileBarChart className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Relatórios Semanais</h2>
            </div>
            <div className="space-y-4">
              {weekly_reports.map((report) => {
                const existingResponse = report.client_pending
                  ? getResponseForReport(report.id, report.client_pending)
                  : null;

                return (
                  <Card key={report.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">
                        {formatWeekLabel(report.week_start)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Conclusão geral</span>
                          <span className="font-semibold">{report.completion_percent}%</span>
                        </div>
                        <Progress value={report.completion_percent} className="h-2" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Resumo</p>
                        <p className="text-sm whitespace-pre-line">{report.summary}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Próximas etapas</p>
                        <p className="text-sm whitespace-pre-line">{report.next_steps}</p>
                      </div>
                      {report.photo_urls && report.photo_urls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {report.photo_urls.slice(0, 6).map((url, i) => (
                            <button
                              key={i}
                              onClick={() => setLightboxUrl(url)}
                              className="aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                            >
                              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                      {report.client_pending && (
                        <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-r-md p-3 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                              Precisamos de você:
                            </p>
                            <p className="text-sm whitespace-pre-line">{report.client_pending}</p>
                          </div>

                          {existingResponse ? (
                            <div className="bg-background/80 rounded-md p-3 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={existingResponse.status === "aprovado" ? "default" : "secondary"} className="text-[10px]">
                                  {existingResponse.status === "aprovado" ? "✓ Aprovado" : "Respondido"}
                                </Badge>
                                {existingResponse.client_name && (
                                  <span className="text-xs text-muted-foreground">por {existingResponse.client_name}</span>
                                )}
                                {existingResponse.responded_at && (
                                  <span className="text-xs text-muted-foreground">
                                    em {format(new Date(existingResponse.responded_at), "dd/MM HH:mm", { locale: ptBR })}
                                  </span>
                                )}
                              </div>
                              {existingResponse.response_text && (
                                <p className="text-sm">{existingResponse.response_text}</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                disabled={submitting}
                                onClick={() => submitResponse(report.id, report.client_pending!, "aprovado")}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                disabled={submitting}
                                onClick={() => setRespondModal({ reportId: report.id, item: report.client_pending! })}
                              >
                                <Send className="h-3.5 w-3.5 mr-1" /> Responder
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Prestação de Contas */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Prestação de Contas</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Contratado</p>
              <p className="text-sm font-bold">{formatCurrency(contracted)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Pago</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(paid)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Saldo</p>
              <p className="text-sm font-bold">{formatCurrency(balance)}</p>
            </CardContent></Card>
          </div>
          {payments.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Pagamentos</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div>
                        <p className="font-medium">{p.description || "Pagamento"}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.due_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(p.value)}</p>
                        <Badge variant={p.status === "pago" ? "default" : "outline"} className="text-[10px]">
                          {p.status === "pago" ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {invoices.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Notas Fiscais / Materiais</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {invoices.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div>
                        <p className="font-medium">{inv.store_name || inv.description || "NF"}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(inv.date)}</p>
                      </div>
                      <p className="font-medium">{formatCurrency(inv.value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Fotos */}
        {photos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Camera className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Fotos da Obra</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((photo, i) => (
                <button key={i} onClick={() => setLightboxUrl(photo.url)} className="aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity">
                  <img src={photo.url} alt={`Foto da obra ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Contato */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Contato</h2>
          </div>
          <Card>
            <CardContent className="p-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Dúvidas? Entre em contato com a Quadra Arquitetura</p>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-1">
          {lightboxUrl && <img src={lightboxUrl} alt="Foto da obra" className="w-full h-full object-contain rounded" />}
        </DialogContent>
      </Dialog>

      {/* Response Modal */}
      <Dialog open={!!respondModal} onOpenChange={() => { setRespondModal(null); setResponseText(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Responder Pendência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-r-md p-3">
              <p className="text-sm">{respondModal?.item}</p>
            </div>
            <div>
              <Label>Seu nome</Label>
              <Input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Nome para registro"
                required
              />
            </div>
            <div>
              <Label>Sua resposta</Label>
              <Textarea
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                placeholder="Escreva sua resposta..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRespondModal(null); setResponseText(""); }}>Cancelar</Button>
            <Button
              disabled={submitting || !responseText.trim() || !clientName.trim()}
              onClick={() => {
                if (respondModal) {
                  submitResponse(respondModal.reportId, respondModal.item, "respondido", responseText);
                }
              }}
            >
              <Send className="h-4 w-4 mr-1" /> Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
