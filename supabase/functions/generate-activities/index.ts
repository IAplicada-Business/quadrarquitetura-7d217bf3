import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Prompt alinhado com o guia "Imersão Cronograma 2.0" da Mariana
// (compartilhado em 18/06). A IA recebe descrição da reforma e devolve um
// escopo estruturado por AMBIENTE → FORNECEDOR/DISCIPLINA → SERVIÇO,
// com incluso/não-incluso e metragem por linha. Isso elimina o passo
// de copiar do ChatGPT pro sistema.
const SYSTEM_PROMPT = `Você é uma arquiteta especialista em gerenciamento de obras de interiores residenciais no Brasil.

A partir do material enviado (texto, áudio transcrito ou imagem),
gere um Escopo de Obra de Interiores profissional, claro e organizado.

Organize seguindo exatamente esta estrutura:
1. Separação por ambiente (Sala, Cozinha, Banheiro, Quarto, Suíte, Lavabo, Área externa, etc.)
2. Dentro de cada ambiente, separe por DISCIPLINA / fornecedor
   (demolição, marcenaria, elétrica, hidráulica, gesso, pintura,
   marmoraria, ar-condicionado, serralheria, revestimento, esquadrias,
   automação, iluminação, louças e metais).
3. Para cada disciplina dentro de cada ambiente, descreva:
   - serviço (frase técnica curta, max 60 chars)
   - o que está incluso (lista de bullets)
   - o que NÃO está incluso (lista de bullets)
   - área estimada em m² (quando o serviço incidir sobre área:
     piso, parede, forro, pintura, revestimento, marcenaria por m²)
   - duração estimada em dias úteis

Regras obrigatórias:
- Use linguagem técnica clara.
- Não invente informações que não estejam no material.
- Se faltar info, sinalize incluso/não-incluso como
  "a definir em projeto executivo".
- Para áreas, derive do material quando ele disser algo como
  "cozinha de 12m²" — atribua os 12m² ao piso/parede/forro
  dessa cozinha conforme a disciplina exigir.

REGRAS DE SEQUENCIAMENTO (críticas — Mariana sinalizou que isso
estava saindo bagunçado):

- Ordene SEMPRE pela sequência lógica de execução em obra de
  interiores: 1) Demolição; 2) Estrutura/Alvenaria; 3) Infraestrutura
  (Hidráulica/Elétrica/Ar-condicionado/Automação primária);
  4) Impermeabilização; 5) Gesso/Forro; 6) Revestimentos e pisos;
  7) Marcenaria/Marmoraria/Esquadrias/Serralheria/Vidros (medição,
  produção, instalação); 8) Pintura; 9) Louças e Metais/Iluminação;
  10) Acabamento final; 11) Limpeza.
- Preencha \`depends_on_indices\` com a lista de índices (0-based,
  na ordem do array) das atividades pré-requisito. NÃO invente
  dependências entre disciplinas independentes (ex: pintura da sala
  NÃO depende de marcenaria da cozinha).
- Atividades de DIFERENTES ambientes que pertencem à mesma fase
  podem rodar em paralelo: NÃO crie dependência entre elas.
- Atividades de medição/produção (marcenaria, marmoraria etc.) devem
  começar cedo no cronograma para que a instalação aconteça depois
  dos revestimentos. Modele isso com \`depends_on_indices\`.`;

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
        { type: "text", text: "Analise esta planta/imagem e gere o escopo de obra completo conforme as regras." }
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
            description:
              "Gera escopo de obra estruturado: lista plana de atividades onde cada linha corresponde a um par (ambiente, disciplina). Pensar primeiro em ambientes e depois nas disciplinas dentro deles.",
            parameters: {
              type: "object",
              properties: {
                activities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description:
                          "Nome técnico curto da atividade (ex: 'Pintura paredes — Sala'). Max 60 chars.",
                      },
                      ambiente: {
                        type: "string",
                        description:
                          "Ambiente onde acontece (Sala, Cozinha, Suíte, Banho social, Lavanderia, Área externa, etc.). Use string curta consistente.",
                      },
                      discipline: {
                        type: "string",
                        enum: [
                          "Demolição",
                          "Alvenaria",
                          "Estrutura",
                          "Hidráulica",
                          "Elétrica",
                          "Gesso/Forro",
                          "Revestimento",
                          "Pintura",
                          "Marcenaria",
                          "Marmoraria",
                          "Esquadrias",
                          "Serralheria",
                          "Vidros",
                          "Ar-condicionado",
                          "Automação",
                          "Iluminação",
                          "Louças e Metais",
                          "Impermeabilização",
                          "Piso",
                          "Acabamento",
                          "Limpeza",
                        ],
                      },
                      area_m2: {
                        type: "number",
                        description:
                          "Área da atividade em m² quando aplicável (piso, parede, forro, revestimento). Derive do material quando o ambiente vier com área citada.",
                      },
                      duration_days: { type: "integer", description: "Duração estimada em dias úteis" },
                      description: {
                        type: "string",
                        description:
                          "Descrição técnica em uma frase do serviço a ser executado.",
                      },
                      incluso: {
                        type: "array",
                        items: { type: "string" },
                        description: "Lista do que ESTÁ incluso neste serviço.",
                      },
                      nao_incluso: {
                        type: "array",
                        items: { type: "string" },
                        description:
                          "Lista do que NÃO está incluso neste serviço (evita conflito com fornecedor).",
                      },
                      depends_on_indices: {
                        type: "array",
                        items: { type: "integer" },
                        description:
                          "Índices (0-based) das outras atividades neste mesmo array que precisam estar concluídas antes desta começar. Use somente para dependências reais entre disciplinas (ex: revestimento depende de hidráulica/elétrica).",
                      },
                    },
                    required: ["name", "ambiente", "discipline", "duration_days"],
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
      // Mariana (vídeo 11): quando o tool_calls vem vazio, antes
      // mostrávamos "Erro ao gerar atividades" seco. Devolvemos
      // mensagem útil mencionando texto simplificado.
      console.error("Tool call vazio. Resposta bruta:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({
          error:
            "A IA não conseguiu estruturar o conteúdo. Tente um texto mais direto, sem bullets ou markdown.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (parseErr) {
      console.error("Falha ao parsear tool_call:", parseErr, toolCall.function.arguments.slice(0, 300));
      return new Response(
        JSON.stringify({
          error:
            "A IA retornou em formato inesperado. Tente novamente — se persistir, simplifique o texto.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compõe a `description` final concatenando bullets de incluso/não-incluso
    // — assim o front existente (que só lê `description`) já mostra o
    // escopo estruturado sem precisar de campos novos na tabela
    // `project_activities`.
    const activities = (parsed.activities || []).map((a: any) => {
      const parts: string[] = [];
      if (a.description) parts.push(a.description);
      if (a.incluso && a.incluso.length > 0) {
        parts.push("INCLUSO:\n" + a.incluso.map((x: string) => `• ${x}`).join("\n"));
      }
      if (a.nao_incluso && a.nao_incluso.length > 0) {
        parts.push("NÃO INCLUSO:\n" + a.nao_incluso.map((x: string) => `• ${x}`).join("\n"));
      }
      return {
        name: a.name,
        ambiente: a.ambiente,
        discipline: a.discipline,
        area_m2: a.area_m2 ?? null,
        duration_days: a.duration_days,
        description: parts.join("\n\n") || null,
        incluso: a.incluso ?? [],
        nao_incluso: a.nao_incluso ?? [],
        depends_on_indices: Array.isArray(a.depends_on_indices) ? a.depends_on_indices : [],
      };
    });

    return new Response(JSON.stringify({ activities }), {
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
