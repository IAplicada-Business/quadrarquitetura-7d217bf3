import { useLocation, Navigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

/**
 * Bloqueia o conteúdo da rota atual para usuários sem permissão de ver
 * a tela (mesmo digitando a URL na mão). O menu já esconde os itens;
 * isto aqui é a segunda camada, no roteamento.
 */
export function PermissionGate({ children }: { children: React.ReactNode }) {
  const { isLoading, canViewPath, homeUrl } = usePermissions();
  const location = useLocation();

  // Enquanto carrega, não decide — evita piscar "sem acesso" pra quem tem.
  if (isLoading) return null;

  if (canViewPath(location.pathname)) return <>{children}</>;

  // Sem acesso à tela atual: manda pra primeira tela permitida.
  if (homeUrl && homeUrl !== location.pathname) {
    return <Navigate to={homeUrl} replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <ShieldOff className="h-10 w-10 text-muted-foreground/40" />
      <h2 className="text-lg font-semibold">Acesso restrito</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Você não tem permissão para ver esta tela. Fale com o administrador
        do sistema para solicitar acesso.
      </p>
    </div>
  );
}
