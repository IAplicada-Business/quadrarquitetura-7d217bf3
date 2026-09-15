/**
 * Lembrete ao autor quando há itens Em Entregue aguardando a aprovação dele.
 * Política Bruno 04/08:
 *  - popup na 1ª abertura do sistema no dia
 *  - enquanto não aprovar, reaparece a cada 1 hora
 */
import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
// [ADAPTADO — Quadra] Este projeto usa React Router; a rota do Bug é /buddy/bug.
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  aprovarEntregaOportunidade,
  recusarEntregaOportunidade,
  motivoRecusaValido,
  MOTIVO_RECUSA_MIN,
  listarPendentesAprovacaoAutor,
  TIPO_LABEL,
  type Oportunidade,
} from "@/lib/oportunidades.functions";
import {
  deveMostrarReminder,
  diaSaoPaulo,
  loadRemindState,
  saveRemindState,
  OPORT_APROVACAO_HORA_MS,
} from "@/lib/oportunidades-aprovacao-reminder";
import { CheckCircle2, Lightbulb, Clock, XCircle } from "lucide-react";
import { msgErro } from "@/lib/utils";
import { toast } from "sonner";

const TICK_MS = 60_000;

type Pendente = Pick<
  Oportunidade,
  "id" | "numero" | "titulo" | "tipo" | "status" | "aprovado_autor_em" | "atualizado_em"
>;

export function OportunidadesAprovacaoReminder() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const { data: pendentes = [] } = useQuery({
    queryKey: ["oportunidades-pendentes-aprovacao"],
    queryFn: () => listarPendentesAprovacaoAutor(),
    staleTime: 30_000,
    refetchInterval: OPORT_APROVACAO_HORA_MS,
  });

  const avaliar = useCallback(() => {
    if (pendentes.length === 0) {
      setOpen(false);
      return;
    }
    if (deveMostrarReminder(new Date(), loadRemindState())) {
      setOpen(true);
      const agora = new Date();
      saveRemindState({
        day: diaSaoPaulo(agora),
        lastShownAt: agora.toISOString(),
        snoozeUntil: null,
      });
    }
  }, [pendentes.length]);

  useEffect(() => {
    avaliar();
  }, [avaliar, tick, pendentes.length]);

  // Reavalia a cada minuto (cobre o “a cada hora” com o app aberto).
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  function adiarUmaHora() {
    const agora = new Date();
    saveRemindState({
      day: diaSaoPaulo(agora),
      lastShownAt: agora.toISOString(),
      snoozeUntil: new Date(agora.getTime() + OPORT_APROVACAO_HORA_MS).toISOString(),
    });
    setOpen(false);
    toast.message("Lembraremos em 1 hora enquanto houver itens pendentes.");
  }

  const aprovar = useMutation({
    mutationFn: (id: string) => aprovarEntregaOportunidade(id),
    onSuccess: async () => {
      toast.success("Entrega aprovada.");
      await qc.invalidateQueries({ queryKey: ["oportunidades-pendentes-aprovacao"] });
      await qc.invalidateQueries({ queryKey: ["oportunidades"] });
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível aprovar."),
  });

  // Tarefa 07 — este popup é o caminho por onde o autor de fato chega às
  // entregas pendentes. Sem Recusar aqui, as únicas saídas eram Aprovar e
  // "Aprovar todos", que é o botão em destaque — ou seja, a interface empurrava
  // para aprovar mesmo quem queria reprovar. Era o que produzia "reprovado"
  // escrito em campo de comentário.
  const [recusando, setRecusando] = useState<Pendente | null>(null);
  const [motivo, setMotivo] = useState("");
  const recusar = useMutation({
    mutationFn: () => recusarEntregaOportunidade(recusando!.id, motivo),
    onSuccess: async () => {
      const numero = recusando?.numero;
      setRecusando(null);
      setMotivo("");
      toast.success(`${numero} voltou para Em análise.`);
      await qc.invalidateQueries({ queryKey: ["oportunidades-pendentes-aprovacao"] });
      await qc.invalidateQueries({ queryKey: ["oportunidades"] });
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.error(msgErro(e, "Não foi possível recusar.")),
  });

  async function aprovarTodos(lista: Pendente[]) {
    for (const p of lista) {
      try {
        await aprovarEntregaOportunidade(p.id);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao aprovar um item.");
        await qc.invalidateQueries({ queryKey: ["oportunidades-pendentes-aprovacao"] });
        return;
      }
    }
    toast.success(lista.length === 1 ? "Entrega aprovada." : `${lista.length} entregas aprovadas.`);
    await qc.invalidateQueries({ queryKey: ["oportunidades-pendentes-aprovacao"] });
    await qc.invalidateQueries({ queryKey: ["oportunidades"] });
    await qc.invalidateQueries({ queryKey: ["notifications"] });
    setOpen(false);
  }

  if (pendentes.length === 0) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) adiarUmaHora();
        else setOpen(true);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Entregas aguardando sua aprovação
          </DialogTitle>
          <DialogDescription>
            {pendentes.length === 1
              ? "Há 1 item que você reportou marcado como entregue. Valide se resolve o problema."
              : `Há ${pendentes.length} itens que você reportou marcados como entregues. Valide cada um.`}
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-72 space-y-2 overflow-y-auto py-1">
          {pendentes.map((p) => (
            <li
              key={p.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground">
                  {p.numero} · {TIPO_LABEL[p.tipo] ?? p.tipo}
                </div>
                <div className="truncate text-sm font-medium">{p.titulo}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-8" asChild>
                  <Link to="/buddy/bug" onClick={() => setOpen(false)}>
                    Ver
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-amber-300 text-amber-900 hover:bg-amber-50"
                  disabled={aprovar.isPending || recusar.isPending}
                  onClick={() => {
                    setMotivo("");
                    setRecusando(p);
                  }}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Recusar
                </Button>
                <Button
                  size="sm"
                  className="h-8"
                  disabled={aprovar.isPending || recusar.isPending}
                  onClick={() => aprovar.mutate(p.id)}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Aprovar
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={adiarUmaHora}>
            <Clock className="mr-1 h-3.5 w-3.5" />
            Lembrar em 1 hora
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/buddy/bug" onClick={() => setOpen(false)}>
                Abrir Buddy · Bug
              </Link>
            </Button>
            {/* Secundário de propósito: este diálogo existe para VALIDAR se a
                entrega resolve o problema. Um botão que aprova tudo de uma vez,
                em destaque, trabalha contra isso — foi assim que seis pessoas
                acabaram escrevendo "reprovado" em campo de comentário em vez de
                recusar. Continua disponível para quem realmente conferiu item a
                item; só deixou de ser o caminho mais fácil. */}
            <Button
              type="button"
              variant="secondary"
              disabled={aprovar.isPending || recusar.isPending}
              onClick={() => void aprovarTodos(pendentes)}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Aprovar todos
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <Dialog
        open={!!recusando}
        onOpenChange={(o) => {
          if (!o && !recusar.isPending) {
            setRecusando(null);
            setMotivo("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar entrega — {recusando?.numero}</DialogTitle>
            <DialogDescription>
              O card volta para <span className="font-medium">Em análise</span> e o motivo fica
              registrado no histórico, com seu nome e a data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-recusa-reminder">O que continua errado?</Label>
            <Textarea
              id="motivo-recusa-reminder"
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: continua sem trazer a conta do banco no mês 2, e não há como preencher manualmente."
            />
            <p className="text-xs text-muted-foreground">
              {!motivoRecusaValido(motivo)
                ? `Faltam ${MOTIVO_RECUSA_MIN - motivo.trim().length} caractere(s).`
                : "Quanto mais específico, menos ida e volta."}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={recusar.isPending}
              onClick={() => {
                setRecusando(null);
                setMotivo("");
              }}
            >
              Cancelar
            </Button>
            <Button
              disabled={recusar.isPending || !motivoRecusaValido(motivo)}
              onClick={() => recusar.mutate()}
            >
              {recusar.isPending ? "Recusando…" : "Confirmar recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
