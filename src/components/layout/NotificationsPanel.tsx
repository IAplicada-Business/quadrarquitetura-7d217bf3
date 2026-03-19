import { useState } from "react";
import { Bell, Check, CheckCheck, Clock, AlertTriangle, XCircle, Package, UserPlus, FileQuestion, Info, Plus, Trash2, CheckCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function NotificationsPanel() {
  const { notifications, unreadCount, create, markAsRead, markAllAsRead, remove } = useNotifications();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState(false);
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="relative p-2.5 rounded-full bg-secondary text-accent shadow-sm hover:bg-secondary/80 transition-colors"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="default"
                className="absolute -top-0.5 -right-0.5 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] leading-none bg-accent text-accent-foreground"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between p-3 border-b">
            <h4 className="font-semibold text-sm">Notificações</h4>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllAsRead.mutate()}>
                  <CheckCheck className="h-3 w-3 mr-1" /> Marcar todas
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <ScrollArea className="max-h-80">
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
        </PopoverContent>
      </Popover>

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
