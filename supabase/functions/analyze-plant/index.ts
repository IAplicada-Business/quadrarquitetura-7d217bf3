import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Limite alinhado ao que a UI promete ("PNG, JPG ou PDF, até 20MB").
const MAX_FILE_BYTES = 20 * 1024 * 1024;

// btoa(String.fromCharCode(...bytes)) estoura o limite de argumentos do V8
// (~64KB) e derruba a função com "Maximum call stack size exceeded" —
// qualquer planta real passa disso. Converte em blocos.
function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

const EXT_CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
};

function resolveContentType(headerValue: string | null, fileUrl: string): string {
  const fromHeader = (headerValue || "").split(";")[0].trim().toLowerCase();
  if (fromHeader && fromHeader !== "application/octet-stream" && fromHeader !== "binary/octet-stream") {
    return fromHeader;
  }
  const ext = fileUrl.split("?")[0].split(".").pop()?.toLowerCase() || "";
  return EXT_CONTENT_TYPES[ext] || "image/jpeg";
}

// Baixa o arquivo e devolve a data URI pronta pro gateway, ou uma
// resposta de erro já formatada com mensagem que a arquiteta entende.
async function loadFileAsDataUrl(
  fileUrl: string,
): Promise<{ dataUrl: string } | { errorResponse: Response }> {
  let fileResponse: Response;
  try {
    fileResponse = await fetch(fileUrl);
  } catch (e) {
    console.error("fetch do arquivo falhou:", e);
    return {
      errorResponse: new Response(
        JSON.stringify({ error: "Não foi possível baixar o arquivo enviado. Tente enviar novamente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  if (!fileResponse.ok) {
    console.error("arquivo inacessível:", fileResponse.status, fileUrl);
    return {
      errorResponse: new Response(
        JSON.stringify({ error: "Não foi possível acessar o arquivo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  const fileBytes = new Uint8Array(await fileResponse.arrayBuffer());

  if (fileBytes.byteLength === 0) {
    return {
      errorResponse: new Response(
        JSON.stringify({ error: "O arquivo enviado está vazio." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  if (fileBytes.byteLength > MAX_FILE_BYTES) {
    const mb = (fileBytes.byteLength / (1024 * 1024)).toFixed(1);
    return {
      errorResponse: new Response(
        JSON.stringify({ error: `Arquivo muito grande (${mb}MB). O limite é 20MB — reduza a resolução da planta.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  const contentType = resolveContentType(fileResponse.headers.get("content-type"), fileUrl);
  return { dataUrl: `data:${contentType};base64,${bytesToBase64(fileBytes)}` };
}

// Propaga o motivo real do gateway em vez de "Erro ao analisar planta" seco —
// sem isso o front só recebe "Edge Function returned a non-2xx status code".
async function aiGatewayErrorResponse(response: Response): Promise<Response> {
  const errorText = await response.text();
  console.error("AI gateway error:", response.status, errorText);

  if (response.status === 429) {
    return new Response(
      JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (response.status === 402) {
    return new Response(
      JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações > Workspace > Uso." }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let detail = "";
  try {
    const parsed = JSON.parse(errorText);
    detail = parsed?.error?.message || parsed?.error || parsed?.message || "";
  } catch {
    detail = errorText;
  }
  detail = String(detail).slice(0, 300);

  return new Response(
    JSON.stringify({
      error: detail
        ? `Erro ao analisar planta com IA (${response.status}): ${detail}`
        : `Erro ao analisar planta com IA (${response.status})`,
    }),
    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

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

      const loaded = await loadFileAsDataUrl(file_url);
      if ("errorResponse" in loaded) return loaded.errorResponse;
      const dataUrl = loaded.dataUrl;

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
            { type: "image_url", image_url: { url: dataUrl } },
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
        return await aiGatewayErrorResponse(response);
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

    const loaded = await loadFileAsDataUrl(file_url);
    if ("errorResponse" in loaded) return loaded.errorResponse;
    const dataUrl = loaded.dataUrl;

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
          { type: "image_url", image_url: { url: dataUrl } },
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
      return await aiGatewayErrorResponse(response);
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
