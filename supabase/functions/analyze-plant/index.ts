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
    const { file_url, focus, instructions, mode, obra_type, ambientes } = await req.json();

    // Mode "activities" — new flow for scope tab
    if (mode === "activities") {
      if (!file_url) {
        return new Response(
          JSON.stringify({ error: "file_url é obrigatório" }),
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

      const obraLabel = obra_type || "reforma";
      const ambientesExtra = ambientes ? `\nAmbientes a considerar especificamente: ${ambientes}` : "";

      const systemPrompt = `Você é um assistente especializado em análise de plantas de projetos de arquitetura e construção civil.

Analise a planta baixa anexa de um projeto de ${obraLabel}.
IMPORTANTE: Todos os ambientes identificados fazem parte de UM ÚNICO projeto integrado. NÃO trate cada ambiente como um projeto independente. As estimativas de área e duração devem refletir as atividades dentro deste projeto único — o cálculo de materiais, mão de obra e prazos deve considerar o projeto como um todo, não como projetos separados por ambiente.
${ambientesExtra}

Para cada ambiente identificado, estime a área em m² baseado nas proporções da planta.
Para cada atividade, indique a disciplina (Demolição, Alvenaria, Elétrica, Hidráulica, Revestimento, Pintura, Piso, Forro, Marcenaria, Serralheria, Impermeabilização, Limpeza, etc.), a área em m², a duração estimada em dias e o ambiente de origem.

Atividades de mesma disciplina que ocorrem em ambientes diferentes podem ser agrupadas (ex: "Pintura — Sala e Cozinha") para representar o projeto como um todo, em vez de listas repetidas por ambiente.

Ordene as atividades pela sequência lógica de execução de obra.
Se uma atividade depende de outra, indique pelo nome da atividade predecessora.`;

      const userPrompt = `Analise esta planta baixa e extraia os ambientes e atividades usando a ferramenta fornecida.`;

      const messages: any[] = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${contentType};base64,${base64}` } },
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
                name: "extract_scope",
                description: "Extrair ambientes e atividades da planta analisada",
                parameters: {
                  type: "object",
                  properties: {
                    ambientes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          nome: { type: "string", description: "Nome do ambiente (ex: Sala, Cozinha, Suíte Master)" },
                          area_m2_estimada: { type: "number", description: "Área estimada em m²" },
                        },
                        required: ["nome", "area_m2_estimada"],
                        additionalProperties: false,
                      },
                    },
                    atividades: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string", description: "Nome da atividade (ex: Demolição de paredes)" },
                          discipline: { type: "string", description: "Disciplina (ex: Demolição, Elétrica)" },
                          area_m2: { type: "number", description: "Área em m² da atividade" },
                          duration_days: { type: "number", description: "Duração estimada em dias" },
                          ambiente_origem: { type: "string", description: "Ambiente onde ocorre (ex: Cozinha)" },
                          depends_on_activity_name: { type: "string", description: "Nome da atividade predecessora, se houver" },
                        },
                        required: ["name", "discipline", "area_m2", "duration_days"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["ambientes", "atividades"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "extract_scope" } },
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
        return new Response(
          JSON.stringify({ ambientes: [], atividades: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify(parsed),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Original flow (focus-based analysis) ──
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
          { type: "image_url", image_url: { url: `data:${contentType};base64,${base64}` } },
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
                        activity_name: { type: "string" },
                        environment: { type: "string" },
                        discipline: { type: "string" },
                        quantity: { type: "number" },
                        unit: { type: "string" },
                        estimated_days: { type: "number" },
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
