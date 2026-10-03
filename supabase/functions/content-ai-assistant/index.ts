import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCHEMAS: Record<string, Record<string, unknown>> = {
  generate_script: {
    type: "object",
    properties: {
      hook: { type: "string", description: "Frase de abertura impactante, máx 15 palavras" },
      script: { type: "string", description: "Roteiro completo em cenas/tópicos" },
      hashtags: { type: "array", items: { type: "string" }, description: "20 hashtags relevantes" },
      call_to_action: { type: "string" },
      thumbnail_suggestion: { type: "string", description: "Descrição da capa ideal" },
      best_time_to_post: { type: "string", description: "Melhor horário para postar" },
    },
    required: ["hook", "script", "hashtags", "call_to_action", "thumbnail_suggestion", "best_time_to_post"],
    additionalProperties: false,
  },
  suggest_ideas: {
    type: "object",
    properties: {
      ideas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            type: { type: "string", enum: ["reels", "carrossel", "story", "feed", "live"] },
            hook_suggestion: { type: "string" },
            why_it_works: { type: "string" },
          },
          required: ["title", "type", "hook_suggestion", "why_it_works"],
          additionalProperties: false,
        },
      },
    },
    required: ["ideas"],
    additionalProperties: false,
  },
  generate_hashtags: {
    type: "object",
    properties: {
      hashtags: { type: "array", items: { type: "string" } },
    },
    required: ["hashtags"],
    additionalProperties: false,
  },
  rewrite_hook: {
    type: "object",
    properties: {
      hook: { type: "string", description: "Novo hook impactante, máx 15 palavras" },
      alternatives: { type: "array", items: { type: "string" } },
    },
    required: ["hook", "alternatives"],
    additionalProperties: false,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !["generate_script", "suggest_ideas", "generate_hashtags", "rewrite_hook"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
    }

    let systemPrompt = "";
    let userPrompt = "";
    const baseContext = "escritório de arquitetura de Belo Horizonte, especializado em gerenciamento de obras residenciais de alto padrão";

    if (action === "generate_script") {
      const { objective, type, platform, target_audience, tone } = body;
      systemPrompt = "Você é especialista em marketing de conteúdo para profissionais de arquitetura e design de interiores no Brasil.";
      userPrompt = `Crie um roteiro completo para ${type || "reels"} no ${platform || "Instagram"} para um ${baseContext}.
Objetivo: ${objective || "engajamento"}
Público: ${target_audience || "pessoas que querem reformar ou construir"}
Tom: ${tone || "especialista"}`;
    } else if (action === "suggest_ideas") {
      const { posts_history, monthly_objective } = body;
      systemPrompt = "Você é especialista em marketing de conteúdo para arquitetura no Brasil.";
      const historyText = (posts_history || []).map((p: any) => `- ${p.title} (${p.type})`).join("\n");
      userPrompt = `Com base nestes posts anteriores:
${historyText || "Nenhum post anterior"}

Objetivo do mês: ${monthly_objective || "aumentar engajamento"}

Sugira 5 ideias de conteúdo novas para um ${baseContext}. Evite repetir os mesmos temas.`;
    } else if (action === "generate_hashtags") {
      const { title, type, objective } = body;
      systemPrompt = "Você é especialista em hashtags para Instagram de arquitetura no Brasil.";
      userPrompt = `Gere 20 hashtags relevantes para o post:
Título: ${title}
Tipo: ${type}
Objetivo: ${objective || "engajamento"}
Contexto: ${baseContext}`;
    } else if (action === "rewrite_hook") {
      const { hook, type, objective } = body;
      systemPrompt = "Você é copywriter especialista em ganchos para redes sociais de arquitetura.";
      userPrompt = `Reescreva este hook para ficar mais impactante:
"${hook}"
Tipo: ${type}
Objetivo: ${objective || "engajamento"}
Contexto: ${baseContext}`;
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      output_config: { format: { type: "json_schema", schema: SCHEMAS[action] } },
    });

    if (response.stop_reason === "refusal") {
      return new Response(JSON.stringify({ error: "A IA não conseguiu gerar este conteúdo." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const content = textBlock?.type === "text" ? textBlock.text : "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { raw: content };
    }

    // suggest_ideas returns {ideas: [...]} from structured output, but the
    // original API shape was a bare array — keep callers working unchanged.
    if (action === "suggest_ideas" && parsed?.ideas) {
      parsed = parsed.ideas;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("content-ai-assistant error:", err);
    if (err instanceof Anthropic.RateLimitError) {
      return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
