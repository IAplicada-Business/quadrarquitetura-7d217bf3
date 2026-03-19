import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_url, focus, instructions } = await req.json();

    if (!file_url || !focus) {
      return new Response(
        JSON.stringify({ error: "file_url e focus são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the image/PDF from the public URL
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Não foi possível acessar o arquivo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileBytes = await fileResponse.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(fileBytes)));
    const contentType = fileResponse.headers.get("content-type") || "image/jpeg";

    const systemPrompt = `Você é um assistente especializado em análise de plantas de projetos de arquitetura e construção civil.

Analise a planta anexa e, para cada elemento que você identificar, retorne uma lista estruturada com os seguintes campos:

- activity_name: nome descritivo da atividade (ex: "Instalação de tomadas baixas")
- environment: ambiente onde a atividade ocorre (ex: "Suíte Master", "Cozinha", "Geral")
- discipline: disciplina da atividade (ex: "Elétrica", "Hidráulica")
- quantity: quantidade identificada (número)
- unit: unidade (un, m, m², ponto)
- estimated_days: prazo estimado em dias para execução

Se não conseguir identificar a quantidade exata, estime com base no que é visível e indique como estimativa.
Seja detalhista e prático. Considere todas as atividades necessárias para o foco solicitado.`;

    const userPrompt = `Analise esta planta com foco em: **${focus}**.

${instructions ? `Instruções adicionais do usuário: ${instructions}` : ""}

Extraia todas as atividades necessárias usando a ferramenta fornecida.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${contentType};base64,${base64}` },
          },
          { type: "text", text: userPrompt },
        ],
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "extract_activities",
              description: "Extrair lista de atividades da planta analisada",
              parameters: {
                type: "object",
                properties: {
                  activities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        activity_name: { type: "string", description: "Nome descritivo da atividade (ex: Instalação de tomadas baixas)" },
                        environment: { type: "string", description: "Ambiente (ex: Suíte Master, Cozinha, Geral)" },
                        discipline: { type: "string", description: "Disciplina (ex: Elétrica, Hidráulica)" },
                        quantity: { type: "number", description: "Quantidade estimada" },
                        unit: { type: "string", description: "Unidade (un, m, m², ponto)" },
                        estimated_days: { type: "number", description: "Prazo estimado em dias para execução" },
                      },
                      required: ["activity_name", "environment", "discipline", "quantity", "unit", "estimated_days"],
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
        tool_choice: { type: "function", function: { name: "extract_activities" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações > Workspace > Uso." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao analisar planta com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      // Fallback: try to parse from content
      return new Response(
        JSON.stringify({ activities: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const activities = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(activities),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-plant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
