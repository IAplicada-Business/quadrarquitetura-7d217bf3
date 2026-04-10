import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callAI(LOVABLE_API_KEY: string, systemPrompt: string, userPrompt: string, toolDef: any) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{ type: "function", function: toolDef }],
      tool_choice: { type: "function", function: { name: toolDef.name } },
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error("AI error:", response.status, t);
    throw new Error("Erro no serviço de IA");
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return structured response");

  return JSON.parse(toolCall.function.arguments);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { project_id, action, data } = await req.json();
    if (!project_id || !action) {
      return new Response(JSON.stringify({ error: "project_id and action required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ok = (body: any) => new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const err = (msg: string, status = 500) => new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // ===== SEQUENCE =====
    if (action === "sequence") {
      const activities = data?.activities || [];
      if (activities.length === 0) return err("No activities provided", 400);

      const parsed = await callAI(
        LOVABLE_API_KEY,
        "Você é um engenheiro de obras especializado em sequenciamento de atividades de construção civil. Responda apenas com a chamada de função solicitada.",
        `Dado este conjunto de atividades de obra:\n${JSON.stringify(activities.map((a: any) => ({ id: a.id, name: a.name, discipline: a.discipline, depends_on: a.depends_on })), null, 2)}\n\nOrganize-as em sequência lógica de execução considerando dependências técnicas típicas de uma reforma residencial/comercial em Belo Horizonte.`,
        {
          name: "suggest_sequence",
          description: "Retorna sugestão de sequenciamento lógico de atividades de obra",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    activity_id: { type: "string" },
                    activity_name: { type: "string" },
                    suggested_position: { type: "number" },
                    depends_on_activity_id: { type: "string", description: "ID da atividade predecessora, ou null" },
                    depends_on_activity_name: { type: "string" },
                    reason: { type: "string" },
                  },
                  required: ["activity_id", "activity_name", "suggested_position", "reason"],
                  additionalProperties: false,
                },
              },
            },
            required: ["suggestions"],
            additionalProperties: false,
          },
        }
      );
      return ok(parsed);
    }

    // ===== ANALYZE BUDGET =====
    if (action === "analyze_budget") {
      const { scenario_items, price_research } = data || {};
      const parsed = await callAI(
        LOVABLE_API_KEY,
        "Você é um consultor de custos de obra especializado no mercado de BH. Analise orçamentos de forma objetiva e profissional.",
        `Analise este orçamento de obra comparando com pesquisas de preço de mercado em Belo Horizonte:\n\nItens do orçamento:\n${JSON.stringify(scenario_items || [], null, 2)}\n\nPesquisas de preço:\n${JSON.stringify(price_research || [], null, 2)}\n\nCompare cada item do orçamento com os dados de pesquisa disponíveis. Identifique oportunidades de economia e itens acima da média.`,
        {
          name: "budget_analysis",
          description: "Retorna análise comparativa do orçamento com preços de mercado",
          parameters: {
            type: "object",
            properties: {
              analysis_text: { type: "string", description: "Análise geral em 2-3 parágrafos" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    current_price: { type: "number" },
                    avg_price: { type: "number" },
                    status: { type: "string", enum: ["above", "below", "ok"] },
                    note: { type: "string" },
                  },
                  required: ["name", "status"],
                  additionalProperties: false,
                },
              },
            },
            required: ["analysis_text", "items"],
            additionalProperties: false,
          },
        }
      );
      return ok(parsed);
    }

    // ===== WEEKLY SUMMARY =====
    if (action === "weekly_summary") {
      const { diary_entries, week_start, week_end } = data || {};
      const parsed = await callAI(
        LOVABLE_API_KEY,
        "Você é assistente de gestão de obras. Gere relatórios semanais profissionais e concisos em português do Brasil.",
        `Com base neste diário de obra da semana ${week_start || ""} a ${week_end || ""}:\n${JSON.stringify(diary_entries || [], null, 2)}\n\nGere:\n1) Resumo do que foi executado (3-4 frases)\n2) Próximas etapas previstas (lista)\n3) Pendências que dependem do cliente (se houver)\nTom: profissional e direto.`,
        {
          name: "weekly_report",
          description: "Gera rascunho de relatório semanal de obra",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Resumo das atividades executadas" },
              next_steps: { type: "string", description: "Próximas etapas previstas" },
              client_pending: { type: "string", description: "Pendências que dependem do cliente" },
            },
            required: ["summary", "next_steps"],
            additionalProperties: false,
          },
        }
      );
      return ok(parsed);
    }

    // ===== ESTIMATE COSTS =====
    if (action === "estimate_costs") {
      const activities = data?.activities || [];
      if (activities.length === 0) return err("No activities provided", 400);

      const parsed = await callAI(
        LOVABLE_API_KEY,
        "Você é uma especialista em gestão de obras em Belo Horizonte. Forneça estimativas realistas baseadas em preços praticados em BH em 2025.",
        `Com base nestas atividades de obra:\n${JSON.stringify(activities.map((a: any) => ({ name: a.name, area_m2: a.area_m2, discipline: a.discipline })), null, 2)}\n\nGere uma estimativa de custo para cada uma considerando mão de obra e materiais típicos de BH em 2025.`,
        {
          name: "cost_estimates",
          description: "Estimativas de custo por atividade",
          parameters: {
            type: "object",
            properties: {
              estimates: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    activity_name: { type: "string" },
                    estimated_cost_min: { type: "number" },
                    estimated_cost_max: { type: "number" },
                    unit: { type: "string" },
                    notes: { type: "string" },
                  },
                  required: ["activity_name", "estimated_cost_min", "estimated_cost_max"],
                  additionalProperties: false,
                },
              },
            },
            required: ["estimates"],
            additionalProperties: false,
          },
        }
      );
      return ok(parsed);
    }

    // ===== GENERATE MATERIALS =====
    if (action === "generate_materials") {
      const activities = data?.activities || [];
      if (activities.length === 0) return err("No activities provided", 400);

      const parsed = await callAI(
        LOVABLE_API_KEY,
        "Você é uma especialista em materiais de construção em Belo Horizonte. Forneça listas de materiais com quantidades baseadas em índices típicos de obra em BH.",
        `Com base nestas atividades:\n${JSON.stringify(activities.map((a: any) => ({ name: a.name, area_m2: a.area_m2, discipline: a.discipline })), null, 2)}\n\nEstime os materiais necessários para cada uma com quantidades baseadas nas áreas informadas. Considere índices típicos de obra em BH.`,
        {
          name: "material_list",
          description: "Lista de materiais necessários por atividade",
          parameters: {
            type: "object",
            properties: {
              materials: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    activity_name: { type: "string" },
                    material_name: { type: "string" },
                    quantity: { type: "number" },
                    unit: { type: "string" },
                    notes: { type: "string" },
                  },
                  required: ["activity_name", "material_name", "quantity", "unit"],
                  additionalProperties: false,
                },
              },
            },
            required: ["materials"],
            additionalProperties: false,
          },
        }
      );
      return ok(parsed);
    }

    // ===== GENERATE SCHEDULE =====
    if (action === "generate_schedule") {
      const activities = data?.activities || [];
      if (activities.length === 0) return err("No activities provided", 400);

      const parsed = await callAI(
        LOVABLE_API_KEY,
        "Você é uma especialista em planejamento de obras. Sugira cronogramas realistas considerando sequência lógica de execução de uma reforma.",
        `Com base nestas atividades de obra:\n${JSON.stringify(activities.map((a: any) => ({ name: a.name, discipline: a.discipline, area_m2: a.area_m2 })), null, 2)}\n\nSugira um cronograma em dias para cada atividade e as dependências entre elas considerando sequência lógica de execução de uma reforma.`,
        {
          name: "schedule_suggestion",
          description: "Sugestão de cronograma com duração e dependências",
          parameters: {
            type: "object",
            properties: {
              schedule: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    activity_name: { type: "string" },
                    duration_days: { type: "number" },
                    depends_on_activity_name: { type: "string" },
                    week_number: { type: "number" },
                  },
                  required: ["activity_name", "duration_days", "week_number"],
                  additionalProperties: false,
                },
              },
            },
            required: ["schedule"],
            additionalProperties: false,
          },
        }
      );
      return ok(parsed);
    }

    // ===== FINANCIAL ANALYSIS =====
    if (action === "financial_analysis") {
      const { receita, despesas, pendentes, progresso } = data || {};

      const parsed = await callAI(
        LOVABLE_API_KEY,
        "Você é um consultor financeiro especializado em gestão de obras. Analise dados financeiros de forma objetiva e profissional em português do Brasil.",
        `Analise o desempenho financeiro deste projeto:\nReceita contratada: R$${receita || 0}\nDespesas até hoje: R$${despesas || 0}\nPagamentos pendentes: R$${pendentes || 0}\nProgresso físico: ${progresso || 0}%\n\nGere uma análise de 3-4 parágrafos identificando:\n1) Se o projeto está dentro do orçamento\n2) Riscos financeiros identificados\n3) Recomendações para o próximo período`,
        {
          name: "financial_report",
          description: "Análise financeira do projeto",
          parameters: {
            type: "object",
            properties: {
              analysis_text: { type: "string", description: "Análise completa em 3-4 parágrafos" },
              risks: { type: "string", description: "Riscos financeiros identificados" },
              recommendations: { type: "string", description: "Recomendações para o próximo período" },
            },
            required: ["analysis_text"],
            additionalProperties: false,
          },
        }
      );
      return ok(parsed);
    }

    // ===== WEEKLY INSIGHTS =====
    if (action === "weekly_insights") {
      const { diary_entries } = data || {};
      if (!diary_entries || diary_entries.length === 0) return err("No diary entries provided", 400);

      const parsed = await callAI(
        LOVABLE_API_KEY,
        "Você é um consultor de obras. Analise registros do diário de obra e forneça insights práticos e diretos em português do Brasil.",
        `Com base no diário de obra desta semana:\n${JSON.stringify(diary_entries, null, 2)}\n\nIdentifique:\n1) Principais avanços\n2) Problemas ou riscos observados\n3) Sugestões para a próxima semana\nSeja direto e prático.`,
        {
          name: "weekly_insights",
          description: "Insights da semana baseados no diário de obra",
          parameters: {
            type: "object",
            properties: {
              advances: { type: "string", description: "Principais avanços da semana" },
              issues: { type: "string", description: "Problemas ou riscos observados" },
              suggestions: { type: "string", description: "Sugestões para a próxima semana" },
            },
            required: ["advances", "issues", "suggestions"],
            additionalProperties: false,
          },
        }
      );
      return ok(parsed);
    }

    return err(`Unknown action: ${action}`, 400);
  } catch (e) {
    console.error("project-ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
