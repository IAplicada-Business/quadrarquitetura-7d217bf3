import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bug, GraduationCap, Megaphone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { listarPendentesAprovacaoAutor } from "@/lib/oportunidades.functions";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Buddy — plataforma base IAplicada, no menu superior.
 *
 * Ícone discreto (só a logo, sem texto ao lado) com Bug / Training / News.
 * Nesta etapa só o Bug é funcional. Visível pra todo usuário autenticado —
 * quem pode mover card no Kanban é assunto do banco, não deste menu.
 */
export function BuddyMenu() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Badge de entregas que o próprio usuário precisa aprovar. Se a consulta
  // falhar (migration ainda não aplicada, por exemplo), o menu continua
  // funcionando sem o badge em vez de sumir do header.
  const { data: pendentes = [] } = useQuery({
    queryKey: ["oportunidades-pendentes-aprovacao"],
    queryFn: () => listarPendentesAprovacaoAutor(),
    enabled: !!user,
    staleTime: 60_000,
    retry: false,
  });

  const temPendentes = pendentes.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Mesmo botão redondo dos vizinhos (microfone, sino, tema): h-9 w-9
            com bg-muted. */}
        <button
          className="relative h-9 w-9 rounded-full grid place-items-center bg-muted transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          aria-label="Buddy IAplicada"
          title="Buddy"
        >
          {/* A marca da IAplicada é um ladrilho quadrado com fundo escuro
              próprio — sem recortar em círculo ela aparece como um quadradinho
              no meio dos botões redondos do header. */}
          <img
            src="/buddy/iaplicada-logo.png"
            alt=""
            className="h-6 w-6 rounded-full object-cover"
          />
          {temPendentes && (
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 z-50 bg-popover">
        <DropdownMenuLabel className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
          Buddy · IAplicada
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/buddy/bug")} className="gap-2">
          <Bug className="h-4 w-4" />
          <span className="flex-1">Bug</span>
          {temPendentes && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {pendentes.length}
            </Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-2">
          <GraduationCap className="h-4 w-4" />
          <span className="flex-1">Training</span>
          <span className="text-[10px] text-muted-foreground">em breve</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-2">
          <Megaphone className="h-4 w-4" />
          <span className="flex-1">News</span>
          <span className="text-[10px] text-muted-foreground">em breve</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
