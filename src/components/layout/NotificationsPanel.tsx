import { useState } from "react";
import { Check, CheckCheck, Clock, AlertTriangle, XCircle, Package, UserPlus, FileQuestion, Info, Plus, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeIcons: Record<string, typeof Info> = {
  task_overdue: Clock,
  payment_due_soon: AlertTriangle,
  payment_overdue: XCircle,
  material_pending_delivery: Package,
  new_lead: UserPlus,
  quote_no_response: FileQuestion,
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const typeColors: Record<string, string> = {
  task_overdue: "text-orange-500",
  payment_due_soon: "text-yellow-500",
  payment_overdue: "text-destructive",
  material_pending_delivery: "text-blue-500",
  new_lead: "text-green-500",
  quote_no_response: "text-purple-500",
  info: "text-blue-500",
  warning: "text-yellow-500",
  success: "text-green-500",
  error: "text-destructive",
};

function getNavRoute(n: Notification): string | null {
  if (!n.related_entity_type) return null;
  switch (n.related_entity_type) {
    case "task": return n.related_project_id ? `/projects/${n.related_project_id}` : null;
    case "payment": return n.related_project_id ? `/projects/${n.related_project_id}` : null;
    case "material": return n.related_project_id ? `/projects/${n.related_project_id}` : null;
    case "lead": return "/leads/pipeline";
    case "budget_quote": return n.related_project_id ? `/projects/${n.related_project_id}` : null;
    default: return null;
  }
}

function NotificationItem({ n, onRead, onDelete, onNavigate }: { n: Notification; onRead: (id: string) => void; onDelete: (id: string) => void; onNavigate: (n: Notification) => void }) {
  const Icon = typeIcons[n.type] || Info;
  return (
    <div
      className={`flex items-start gap-2 p-2 rounded-md text-sm transition-colors cursor-pointer hover:bg-muted/80 ${n.is_read ? "opacity-60" : "bg-muted/50"}`}
      onClick={() => onNavigate(n)}
    >
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${typeColors[n.type] || "text-muted-foreground"}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium leading-tight truncate">{n.title}</p>
        {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
        </p>
      </div>
      <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {!n.is_read && (
          <button onClick={() => onRead(n.id)} className="p-1 rounded hover:bg-muted" title="Marcar como lida">
            <Check className="h-3 w-3" />
          </button>
        )}
        <button onClick={() => onDelete(n.id)} className="p-1 rounded hover:bg-muted text-destructive" title="Excluir">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Painel de notificações.
 *
 * Virou diálogo controlado quando o sino saiu do header e foi para o menu do
 * perfil: um Popover precisa de um gatilho visível para se ancorar, e o item
 * do menu some no clique. Quem abre é quem guarda o estado.
 */
export function NotificationsDialog({ open, onOpenChange }: NotificationsDialogProps) {
  const { notifications, unreadCount, create, markAsRead, markAllAsRead, remove } = useNotifications();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const setOpen = onOpenChange;
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    create.mutate({ title, message: message || undefined, type });
    setShowForm(false);
    setTitle("");
    setMessage("");
    setType("info");
  };

  const handleNavigate = (n: Notification) => {
    if (!n.is_read) markAsRead.mutate(n.id);
    const route = getNavRoute(n);
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="flex-row items-center justify-between space-y-0 p-3 pr-12 border-b">
            <DialogTitle className="text-sm">Notificações</DialogTitle>
            <DialogDescription className="sr-only">
              Avisos do sistema sobre tarefas, pagamentos, materiais e leads.
            </DialogDescription>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllAsRead.mutate()}>
                  <CheckCheck className="h-3 w-3 mr-1" /> Marcar todas
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(true)} aria-label="Nova notificação">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-2 space-y-1">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação</p>
              ) : (
                notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    n={n}
                    onRead={(id) => markAsRead.mutate(id)}
                    onDelete={(id) => remove.mutate(id)}
                    onNavigate={handleNavigate}
                  />
                ))
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => { setOpen(false); navigate("/notifications"); }}
            >
              Ver todas as notificações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Notificação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Título da notificação" />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Detalhes (opcional)" rows={2} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={create.isPending}>Criar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
