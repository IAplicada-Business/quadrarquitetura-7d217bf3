// Sprint 4d (item 13) — Mariana (vídeo 13): "para você instalar
// [vidraçaria, porta, espelho], você precisa medir. Quero que ele
// entenda 'vidraçaria com bandeja de vidro' e gere a cadeia: pedir
// orçamento, pra quem pedir, acompanhar, conferir entrega. Eu queria
// que ele gerasse essa série pra mim".
//
// Regras determinísticas (sem IA) por disciplina: cada disciplina
// que envolve fabricação/sob-medida gera uma lista de tarefas
// pré-instalação que aparecem no kanban de Tarefas Quadra com
// `category=pendencias` e `task_type=administrativo`.

import { supabase } from "@/integrations/supabase/client";

export interface ActivityForTasks {
  id?: string;
  name: string;
  discipline: string | null;
  start_date?: string | null;
  medicao_date?: string | null;
}

interface TaskBlueprint {
  title: (a: ActivityForTasks) => string;
  description?: (a: ActivityForTasks) => string;
  category: string;
  task_type: string;
  // Offset em dias úteis ANTES do start_date da atividade-fim.
  // Negativo = antes. Se atividade não tem data, vira null e a
  // arquiteta resolve depois.
  offset_business_days: number;
}

// Disciplines where medicao_date re-anchors the chain.
// When medicao_date is set, offsets are calculated FROM medicao_date (medir=0)
// instead of from start_date with the full pre-measurement offset.
export const MEDICAO_ANCHORED_DISCIPLINES = new Set([
  "Marcenaria", "Marmoraria", "Vidros", "Esquadrias", "Serralheria",
]);

const PREREQ_BY_DISCIPLINE: Record<string, TaskBlueprint[]> = {
  "Marcenaria": [
    { title: (a) => `Medir em obra — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: -45 },
    { title: (a) => `Pedir orçamento de ${a.name} (marcenaria)`, category: "orcamentos", task_type: "compras", offset_business_days: -40 },
    { title: (a) => `Aprovar marceneiro e projeto executivo — ${a.name}`, category: "orcamentos", task_type: "administrativo", offset_business_days: -30 },
    { title: (a) => `Acompanhar produção — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: -10 },
    { title: (a) => `Conferir entrega e montagem — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: 0 },
  ],
  "Marmoraria": [
    { title: (a) => `Medir em obra — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: -20 },
    { title: (a) => `Pedir orçamento de ${a.name} (marmoraria)`, category: "orcamentos", task_type: "compras", offset_business_days: -18 },
    { title: (a) => `Conferir entrega e instalação — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: 0 },
  ],
  "Vidros": [
    { title: (a) => `Medir em obra — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: -12 },
    { title: (a) => `Pedir orçamento de ${a.name} (vidraçaria)`, category: "orcamentos", task_type: "compras", offset_business_days: -10 },
    { title: (a) => `Conferir entrega e instalação — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: 0 },
  ],
  "Esquadrias": [
    { title: (a) => `Medir em obra — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: -30 },
    { title: (a) => `Pedir orçamento de ${a.name} (esquadrias)`, category: "orcamentos", task_type: "compras", offset_business_days: -28 },
    { title: (a) => `Conferir entrega e instalação — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: 0 },
  ],
  "Serralheria": [
    { title: (a) => `Medir em obra — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: -20 },
    { title: (a) => `Pedir orçamento de ${a.name} (serralheria)`, category: "orcamentos", task_type: "compras", offset_business_days: -18 },
    { title: (a) => `Conferir entrega e instalação — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: 0 },
  ],
  "Louças e Metais": [
    { title: (a) => `Pedir orçamento de ${a.name}`, category: "orcamentos", task_type: "compras", offset_business_days: -25 },
    { title: (a) => `Comprar ${a.name} (louças/metais)`, category: "compras", task_type: "compras", offset_business_days: -15 },
    { title: (a) => `Conferir entrega — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: -2 },
  ],
  "Iluminação": [
    { title: (a) => `Pedir orçamento — ${a.name}`, category: "orcamentos", task_type: "compras", offset_business_days: -25 },
    { title: (a) => `Comprar luminárias — ${a.name}`, category: "compras", task_type: "compras", offset_business_days: -10 },
    { title: (a) => `Acompanhar instalação — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: 0 },
  ],
  "Revestimento": [
    { title: (a) => `Pedir orçamento de revestimento — ${a.name}`, category: "orcamentos", task_type: "compras", offset_business_days: -20 },
    { title: (a) => `Comprar revestimento — ${a.name}`, category: "compras", task_type: "compras", offset_business_days: -10 },
    { title: (a) => `Conferir entrega na obra — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: -2 },
  ],
  "Piso": [
    { title: (a) => `Pedir orçamento de piso — ${a.name}`, category: "orcamentos", task_type: "compras", offset_business_days: -20 },
    { title: (a) => `Comprar piso — ${a.name}`, category: "compras", task_type: "compras", offset_business_days: -10 },
    { title: (a) => `Conferir entrega na obra — ${a.name}`, category: "cronograma", task_type: "obra", offset_business_days: -2 },
  ],
};

function dateOffset(iso: string | null | undefined, days: number): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getPrerequisitePreview(activity: ActivityForTasks) {
  const discipline = activity.discipline ?? "";
  const blueprints = PREREQ_BY_DISCIPLINE[discipline] ?? [];

  // When medicao_date is set for a measurement-anchored discipline, we know
  // the real measure date. Recalculate from that anchor:
  //   medir = medicao_date (offset 0 relative to measurement)
  //   orçar = medicao_date + (orçar_offset - medir_offset)
  //   entregar = medicao_date + (entregar_offset - medir_offset)
  // The "medir" blueprint always has the most negative offset in those
  // disciplines, so we shift everything by subtracting the medir offset.
  const useMedicao =
    activity.medicao_date &&
    MEDICAO_ANCHORED_DISCIPLINES.has(discipline) &&
    blueprints.length > 0;

  const measureOffset = useMedicao
    ? Math.min(...blueprints.map((bp) => bp.offset_business_days))
    : 0;

  return blueprints.map((bp) => {
    let due_date: string | null;
    if (useMedicao) {
      // Re-anchor: medir task lands on medicao_date, rest shift accordingly.
      const relativeOffset = bp.offset_business_days - measureOffset;
      due_date = dateOffset(activity.medicao_date!, relativeOffset);
    } else {
      due_date = dateOffset(activity.start_date ?? null, bp.offset_business_days);
    }
    return {
      title: bp.title(activity),
      category: bp.category,
      task_type: bp.task_type,
      priority: "media",
      due_date,
    };
  });
}

export async function createPrerequisiteTasks(args: {
  activity: ActivityForTasks;
  projectId: string;
  userId: string;
}): Promise<number> {
  const preview = getPrerequisitePreview(args.activity);
  if (preview.length === 0) return 0;

  const rows = preview.map((t) => ({
    user_id: args.userId,
    project_id: args.projectId,
    title: t.title,
    description: args.activity.id
      ? `Pré-requisito gerado automaticamente para a atividade "${args.activity.name}".`
      : null,
    category: t.category,
    task_type: t.task_type,
    priority: t.priority,
    due_date: t.due_date,
    source_transcript: null,
  }));

  const { error } = await supabase.from("voice_tasks").insert(rows);
  if (error) throw error;
  return rows.length;
}
