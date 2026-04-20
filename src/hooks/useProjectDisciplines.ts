import { useMemo } from "react";
import { useProjectActivities } from "@/hooks/useProjectActivities";
import { useScopeItems } from "@/hooks/useScopeItems";

/**
 * Source of truth para as disciplinas do projeto.
 *
 * Regra (post call 16/04): o escopo (`project_activities`) é a fonte
 * canônica. Se o escopo estiver preenchido, é dele que saem as
 * disciplinas. Caso contrário, cai para `scope_items` (estrutura
 * antiga) para não perder dados de projetos migrados.
 *
 * Use este hook em qualquer lugar que precise listar disciplinas
 * disponíveis (filtros, selects, etc.) — isso elimina a divergência
 * entre Cronograma/Materiais/Acompanhamento que a Camilla reportou.
 */
export function useProjectDisciplines(projectId: string | undefined) {
  const { activities } = useProjectActivities(projectId);
  const { items: scopeItems } = useScopeItems(projectId);

  return useMemo(() => {
    const set = new Set<string>();

    // Preferência: project_activities (escopo novo)
    if (activities.length > 0) {
      for (const a of activities) {
        if (a.discipline) set.add(a.discipline);
      }
    }

    // Fallback: scope_items contratados (escopo antigo)
    if (set.size === 0) {
      for (const s of scopeItems) {
        if (!s.parent_id && s.discipline) set.add(s.discipline);
      }
    }

    return {
      disciplines: Array.from(set).sort(),
      source:
        activities.length > 0
          ? ("activities" as const)
          : ("scope_items" as const),
    };
  }, [activities, scopeItems]);
}
