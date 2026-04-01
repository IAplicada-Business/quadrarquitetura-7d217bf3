import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "sequence") {
      const activities = data?.activities || [];
      if (activities.length === 0) {
        return new Response(JSON.stringify({ error: "No activities provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const prompt = `Dado este conjunto de atividades de obra:
${JSON.stringify(activities.map((a: any) => ({ id: a.id, name: a.name, discipline: a.discipline, depends_on: a.depends_on })), null, 2)}

Organize-as em sequência lógica de execução considerando dependências técnicas típicas de uma reforma residencial/comercial em Belo Horizonte.
Considere: demolição antes de alvenaria, alvenaria antes de reboco, elétrica e hidráulica antes de acabamento, etc.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Você é um engenheiro de obras especializado em sequenciamento de atividades de construção civil. Responda apenas com a chamada de função solicitada." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
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
            },
          }],
          tool_choice: { type: "function", function: { name: "suggest_sequence" } },
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI error:", response.status, t);
        return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        return new Response(JSON.stringify({ error: "AI did not return structured response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "analyze_budget") {
      const { scenario_items, price_research } = data || {};

      const prompt = `Analise este orçamento de obra comparando com pesquisas de preço de mercado em Belo Horizonte:

Itens do orçamento:
${JSON.stringify(scenario_items || [], null, 2)}

Pesquisas de preço:
${JSON.stringify(price_research || [], null, 2)}

Compare cada item do orçamento com os dados de pesquisa disponíveis. Identifique oportunidades de economia e itens acima da média.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Você é um consultor de custos de obra especializado no mercado de BH. Analise orçamentos de forma objetiva e profissional." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
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
            },
          }],
          tool_choice: { type: "function", function: { name: "budget_analysis" } },
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI error:", response.status, t);
        return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        return new Response(JSON.stringify({ error: "AI did not return structured response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "weekly_summary") {
      const { diary_entries, week_start, week_end } = data || {};

      const prompt = `Com base neste diário de obra da semana ${week_start || ""} a ${week_end || ""}:
${JSON.stringify(diary_entries || [], null, 2)}

Gere:
1) Resumo do que foi executado (3-4 frases)
2) Próximas etapas previstas (lista)
3) Pendências que dependem do cliente (se houver)
Tom: profissional e direto.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Você é assistente de gestão de obras. Gere relatórios semanais profissionais e concisos em português do Brasil." },
            { role: "user", content: prompt },
          ],
          tools: [{
            type: "function",
            function: {
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
            },
          }],
          tool_choice: { type: "function", function: { name: "weekly_report" } },
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI error:", response.status, t);
        return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        return new Response(JSON.stringify({ error: "AI did not return structured response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("project-ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
