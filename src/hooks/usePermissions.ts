import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { resolvePageKey, firstAllowedUrl } from "@/lib/pagePermissions";

interface PermRow {
  page_key: string;
  can_view: boolean;
  can_edit: boolean;
}

/**
 * Permissões de tela do usuário logado.
 *
 * Regras:
 * - admin → acesso total, sempre.
 * - não-admin SEM nenhuma linha em user_permissions → acesso total
 *   (compatibilidade: usuários antigos nunca configurados continuam
 *   funcionando; restrição só passa a valer quando o admin salva
 *   permissões pra pessoa).
 * - não-admin COM linhas → vê apenas as telas com can_view.
 */
export function usePermissions() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["my-permissions", user?.id],
    queryFn: async () => {
      const [rolesRes, permsRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
        supabase.from("user_permissions").select("page_key, can_view, can_edit").eq("user_id", user!.id),
      ]);
      return {
        isAdmin: (rolesRes.data ?? []).some((r: any) => r.role === "admin"),
        perms: (permsRes.data ?? []) as PermRow[],
      };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  return useMemo(() => {
    const isAdmin = data?.isAdmin ?? false;
    const perms = data?.perms ?? [];
    const restricted = !isAdmin && perms.length > 0;

    const canView = (pageKey: string) =>
      !restricted || perms.some(p => p.page_key === pageKey && p.can_view);

    const canEdit = (pageKey: string) =>
      !restricted || perms.some(p => p.page_key === pageKey && p.can_edit);

    const canViewPath = (pathname: string) => {
      const key = resolvePageKey(pathname);
      return key === null ? true : canView(key);
    };

    return {
      isLoading,
      isAdmin,
      restricted,
      canView,
      canEdit,
      canViewPath,
      homeUrl: firstAllowedUrl(canView),
    };
  }, [data, isLoading]);
}
