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
      systemPrompt = `Você é especialista em marketing de conteúdo para profissionais de arquitetura e design de interiores no Brasil. Responda APENAS em JSON válido, sem markdown.`;
      userPrompt = `Crie um roteiro completo para ${type || "reels"} no ${platform || "Instagram"} para um ${baseContext}.
Objetivo: ${objective || "engajamento"}
Público: ${target_audience || "pessoas que querem reformar ou construir"}
Tom: ${tone || "especialista"}

Retorne JSON:
{
  "hook": "frase de abertura impactante, máx 15 palavras",
  "script": "roteiro completo em cenas/tópicos",
  "hashtags": ["20 hashtags relevantes"],
  "call_to_action": "CTA",
  "thumbnail_suggestion": "descrição da capa ideal",
  "best_time_to_post": "melhor horário para postar"
}`;
    } else if (action === "suggest_ideas") {
      const { posts_history, monthly_objective } = body;
      systemPrompt = `Você é especialista em marketing de conteúdo para arquitetura no Brasil. Responda APENAS em JSON válido, sem markdown.`;
      const historyText = (posts_history || []).map((p: any) => `- ${p.title} (${p.type})`).join("\n");
      userPrompt = `Com base nestes posts anteriores:
${historyText || "Nenhum post anterior"}

Objetivo do mês: ${monthly_objective || "aumentar engajamento"}

Sugira 5 ideias de conteúdo novas para um ${baseContext}.
Para cada ideia retorne JSON array:
[{"title": "", "type": "reels|carrossel|story|feed|live", "hook_suggestion": "", "why_it_works": ""}]
Evite repetir os mesmos temas.`;
    } else if (action === "generate_hashtags") {
      const { title, type, objective } = body;
      systemPrompt = `Você é especialista em hashtags para Instagram de arquitetura no Brasil. Responda APENAS em JSON válido.`;
      userPrompt = `Gere 20 hashtags relevantes para o post:
Título: ${title}
Tipo: ${type}
Objetivo: ${objective || "engajamento"}
Contexto: ${baseContext}

Retorne JSON: {"hashtags": ["#hashtag1", "#hashtag2", ...]}`;
    } else if (action === "rewrite_hook") {
      const { hook, type, objective } = body;
      systemPrompt = `Você é copywriter especialista em ganchos para redes sociais de arquitetura. Responda APENAS em JSON válido.`;
      userPrompt = `Reescreva este hook para ficar mais impactante:
"${hook}"
Tipo: ${type}
Objetivo: ${objective || "engajamento"}
Contexto: ${baseContext}

Retorne JSON: {"hook": "novo hook impactante, máx 15 palavras", "alternatives": ["alternativa 1", "alternativa 2"]}`;
    }

    const aiRes = await fetch("https://ai.lovable.dev/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI API error: ${aiRes.status} - ${errText}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
