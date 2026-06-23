// Sprint 4c — Prompt 6 do guia "Imersão Cronograma 2.0" da Mariana.
// "Definir em quais dias a arquiteta/gestora precisa estar presencialmente
// na obra para garantir controle de qualidade."
//
// Recebe a lista de atividades já com datas calculadas (output do
// `buildTimeline` no front) e devolve checkpoints sugeridos. O algoritmo
// é determinístico baseado na disciplina: serviços de medição → checkpoint
// de início; revestimento/marcenaria/marmoraria → recebimento +
// instalação; demolição → execução crítica; pintura/limpeza → finalização.
// A IA fica reservada para enriquecer a descrição (próxima iteração) —
// nesta versão geramos checkpoints estruturados sem IA para garantir
// previsibilidade e custo zero.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Activity {
  id: string;
  name: string;
  discipline: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface Checkpoint {
  visit_date: string;
  visit_type: string;
  notes: string;
}

const CHECKPOINT_RULES: Record<string, Array<"inicio" | "execucao_critica" | "recebimento" | "instalacao" | "finalizacao" | "medicao">> = {
  "Demolição": ["inicio", "execucao_critica", "finalizacao"],
  "Alvenaria": ["inicio", "execucao_critica", "finalizacao"],
  "Estrutura": ["inicio", "execucao_critica", "finalizacao"],
  "Hidráulica": ["inicio", "execucao_critica", "finalizacao"],
  "Elétrica": ["inicio", "execucao_critica", "finalizacao"],
  "Gesso/Forro": ["inicio", "finalizacao"],
  "Revestimento": ["recebimento", "inicio", "finalizacao"],
  "Piso": ["recebimento", "inicio", "finalizacao"],
  "Pintura": ["inicio", "finalizacao"],
  "Marcenaria": ["medicao", "recebimento", "instalacao"],
  "Marmoraria": ["medicao", "recebimento", "instalacao"],
  "Esquadrias": ["medicao", "recebimento", "instalacao"],
  "Serralheria": ["medicao", "recebimento", "instalacao"],
  "Vidros": ["medicao", "instalacao"],
  "Ar-condicionado": ["inicio", "instalacao", "finalizacao"],
  "Automação": ["instalacao", "finalizacao"],
  "Iluminação": ["recebimento", "instalacao"],
  "Louças e Metais": ["recebimento", "instalacao"],
  "Impermeabilização": ["inicio", "execucao_critica", "finalizacao"],
  "Acabamento": ["inicio", "finalizacao"],
  "Limpeza": ["finalizacao"],
};

const VISIT_TYPE_LABEL: Record<string, string> = {
  inicio: "Início de serviço",
  execucao_critica: "Execução crítica",
  recebimento: "Recebimento de material",
  instalacao: "Instalação/Montagem",
  finalizacao: "Finalização",
  medicao: "Medição em obra",
};

const VISIT_CHECKLIST: Record<string, string> = {
  inicio: "Conferir alinhamento com projeto, materiais entregues e equipe pronta.",
  execucao_critica: "Acompanhar pontos técnicos sensíveis (caimentos, pontos elétricos/hidráulicos, prumadas).",
  recebimento: "Conferir quantidade, lote, cor/tom, peças quebradas e nota fiscal.",
  instalacao: "Acompanhar instalação para evitar retrabalho e validar acabamentos.",
  finalizacao: "Vistoria final, lista de pendências e aceite com o fornecedor.",
  medicao: "Validar medidas em obra antes da fabricação. Confirmar acessos.",
};

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function midpointDate(start: string, end: string): string {
  const days = daysBetween(start, end);
  const d = new Date(start + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + Math.floor(days / 2));
  return d.toISOString().slice(0, 10);
}

function checkpointsFor(activity: Activity): Checkpoint[] {
  const discipline = activity.discipline ?? "Acabamento";
  const types = CHECKPOINT_RULES[discipline] ?? ["inicio", "finalizacao"];
  const out: Checkpoint[] = [];
  if (!activity.start_date || !activity.end_date) return out;
  for (const t of types) {
    let date: string;
    switch (t) {
      case "medicao":
      case "recebimento":
        // Antes do início — 2 dias antes do start
        const d = new Date(activity.start_date + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() - 2);
        date = d.toISOString().slice(0, 10);
        break;
      case "inicio":
        date = activity.start_date;
        break;
      case "execucao_critica":
        date = midpointDate(activity.start_date, activity.end_date);
        break;
      case "instalacao":
        date = activity.end_date;
        break;
      case "finalizacao":
        date = activity.end_date;
        break;
    }
    out.push({
      visit_date: date,
      visit_type: t,
      notes: `${VISIT_TYPE_LABEL[t]} — ${activity.name}\n${VISIT_CHECKLIST[t]}`,
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { project_id, activities, replace_existing } = await req.json();
    if (!project_id || !Array.isArray(activities)) {
      return new Response(JSON.stringify({ error: "project_id e activities são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const checkpoints: Array<{ visit_date: string; visit_type: string; notes: string; activityName: string }> = [];
    for (const a of activities as Activity[]) {
      const cps = checkpointsFor(a);
      for (const c of cps) checkpoints.push({ ...c, activityName: a.name });
    }

    if (replace_existing) {
      // Remove checkpoints anteriores deste projeto que tenham um dos
      // tipos do nosso enum interno (evita apagar visitas manuais).
      await supabase
        .from("site_visits")
        .delete()
        .eq("project_id", project_id)
        .in("visit_type", Object.keys(VISIT_TYPE_LABEL));
    }

    if (checkpoints.length > 0) {
      const rows = checkpoints.map((c) => ({
        project_id,
        user_id: userId,
        visit_date: c.visit_date,
        visit_type: c.visit_type,
        notes: c.notes,
      }));
      const { error } = await supabase.from("site_visits").insert(rows);
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: checkpoints.length,
        checkpoints: checkpoints.map((c) => ({
          visit_date: c.visit_date,
          visit_type: c.visit_type,
          activity_name: c.activityName,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
