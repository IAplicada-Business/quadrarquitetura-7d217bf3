import { useQuery } from "@tanstack/react-query";
import { GraduationCap, LayoutDashboard, Map } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logoAzul from "@/assets/logo-azul.png";

const ICONE_POR_CHAVE: Record<string, typeof Map> = {
  mapeamento: Map,
  portal: LayoutDashboard,
  treinamento: GraduationCap,
};

type LinkProjeto = {
  chave: string;
  label: string;
  url: string | null;
  descricao: string | null;
  ordem: number;
};

/**
 * Docs do projeto — atalhos que a IAplicada mantém no CRM dela e sincroniza
 * na tabela `iaplicada_links` (a cada 5 min). Este sistema só lê.
 *
 * Link de arquivo chega como URL assinada renovada a cada sync, por isso o
 * menu sempre lê a tabela em vez de guardar a URL em outro lugar.
 */
export function DocsProjetoMenu() {
  const { user } = useAuth();

  const { data: links = [] } = useQuery({
    queryKey: ["iaplicada-links"],
    queryFn: async (): Promise<LinkProjeto[]> => {
      const { data, error } = await supabase
        .from("iaplicada_links")
        .select("chave, label, url, descricao, ordem")
        .order("ordem");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Tabela vazia ou consulta com erro (ex.: migration ainda não aplicada):
  // o ícone simplesmente não aparece — nunca quebra o header.
  if (links.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-8 w-8 rounded-full grid place-items-center opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          aria-label="Docs do projeto"
          title="Docs do projeto"
        >
          {/* 24px (e não 20 como o Buddy): a logo da Quadra é um lettering com
              respiro interno, então no mesmo tamanho ela lê menor e mais
              embaçada que a marca da IAplicada, que é um ícone cheio. O botão
              continua 32px — o equilíbrio é óptico, não métrico. */}
          <img src={logoAzul} alt="" className="h-6 w-6 object-contain" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 z-50 bg-popover">
        <DropdownMenuLabel className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
          Docs do projeto
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map((l) => {
          const Icone = ICONE_POR_CHAVE[l.chave] ?? LayoutDashboard;
          const item = (
            <>
              <Icone className="h-4 w-4 shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-1.5">
                  <span className="truncate">{l.label}</span>
                  {!l.url && <span className="text-[10px] text-muted-foreground">em breve</span>}
                </span>
                {l.descricao && (
                  <span className="truncate text-[11px] font-normal text-muted-foreground">
                    {l.descricao}
                  </span>
                )}
              </span>
            </>
          );
          if (!l.url) {
            return (
              <DropdownMenuItem key={l.chave} disabled className="gap-2 items-start">
                {item}
              </DropdownMenuItem>
            );
          }
          return (
            <DropdownMenuItem key={l.chave} asChild className="gap-2 items-start">
              <a href={l.url} target="_blank" rel="noreferrer">
                {item}
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
