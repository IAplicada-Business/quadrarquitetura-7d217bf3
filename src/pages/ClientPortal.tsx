import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientScheduleView } from "@/components/projects/ClientScheduleView";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Wallet, Camera, MessageCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function formatCurrency(v: number | null | undefined) {
  if (v == null) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
}

interface PortalData {
  project: { name: string; address: string | null; city: string | null; estimated_budget: number | null; ideal_budget: number | null };
  tasks: any[];
  payments: any[];
  invoices: any[];
  photos: { url: string; date: string }[];
}

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

  const { project, tasks, payments, invoices, photos } = data;
  const contracted = project.estimated_budget || 0;
  const paid = payments
    .filter((p: any) => p.status === "pago")
    .reduce((s: number, p: any) => s + (p.value || 0), 0);
  const balance = contracted - paid;

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
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-8 pb-16">
        {/* Seção 1 — Cronograma */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Cronograma</h2>
          </div>
          <ClientScheduleView tasks={tasks} projectName={project.name} />
        </section>

        {/* Seção 2 — Prestação de Contas */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Prestação de Contas</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Contratado</p>
                <p className="text-sm font-bold">{formatCurrency(contracted)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Pago</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(paid)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Saldo</p>
                <p className="text-sm font-bold">{formatCurrency(balance)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment list */}
          {payments.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pagamentos</CardTitle>
              </CardHeader>
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

          {/* Invoice list */}
          {invoices.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notas Fiscais / Materiais</CardTitle>
              </CardHeader>
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

        {/* Seção 3 — Fotos */}
        {photos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Camera className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Fotos da Obra</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxUrl(photo.url)}
                  className="aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                >
                  <img src={photo.url} alt={`Foto da obra ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Seção 4 — Contato */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Contato</h2>
          </div>
          <Card>
            <CardContent className="p-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Dúvidas? Entre em contato com a Quadra Arquitetura
              </p>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-1">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Foto da obra" className="w-full h-full object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
