import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é uma assistente de gestão de obra para um escritório de arquitetura em Belo Horizonte.
A partir da descrição abaixo, gere uma lista de atividades sequenciais de obra.
Ordene as atividades pela sequência lógica de execução.
Seja prática e objetiva. Gere entre 5 e 20 atividades dependendo da complexidade.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, content } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: "Conteúdo é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build messages based on mode
    const userContent: any[] = [];

    if (mode === "image") {
      userContent.push(
        { type: "image_url", image_url: { url: content } },
        { type: "text", text: "Analise esta planta/imagem e gere as atividades de obra necessárias." }
      );
    } else {
      // text or audio (audio comes as transcription)
      userContent.push({ type: "text", text: `Descrição do projeto:\n${content}` });
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_activities_list",
            description: "Gera lista de atividades de obra sequenciais",
            parameters: {
              type: "object",
              properties: {
                activities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Nome da atividade, max 60 chars" },
                      discipline: {
                        type: "string",
                        enum: [
                          "Alvenaria", "Elétrica", "Hidráulica", "Pintura", "Piso",
                          "Gesso/Forro", "Esquadrias", "Marcenaria", "Demolição",
                          "Impermeabilização", "Estrutura", "Acabamento",
                          "Ar-condicionado", "Automação", "Revestimento", "Limpeza",
                        ],
                      },
                      area_m2: { type: "number", description: "Área estimada em m²" },
                      duration_days: { type: "integer", description: "Duração estimada em dias" },
                      description: { type: "string", description: "Descrição breve da atividade" },
                    },
                    required: ["name", "discipline", "duration_days"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["activities"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "generate_activities_list" } },
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Configurações > Workspace > Uso." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar atividades" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "Resposta inesperada da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ activities: parsed.activities }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-activities error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
