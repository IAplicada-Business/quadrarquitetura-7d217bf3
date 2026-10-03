import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

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
- Preencha \`depends_on_indices\` com NO MÁXIMO 1 (UMA) dependência
  por atividade — apenas o pré-requisito DIRETO e imprescindível.
  Não inclua a cadeia toda; o sistema deriva o resto por ordem.
  (Mariana 23/06: o modelo estava devolvendo muitas dependências
  espúrias que ela não conseguia limpar manualmente.)
- NÃO invente dependências entre disciplinas independentes (ex:
  pintura da sala NÃO depende de marcenaria da cozinha).
- Atividades de DIFERENTES ambientes que pertencem à mesma fase
  podem rodar em paralelo: NÃO crie dependência entre elas.
- Atividades de medição/produção (marcenaria, marmoraria etc.) NÃO
  precisam depender de demolição/alvenaria — elas só requerem
  obra liberada para visita. Deixe \`depends_on_indices\` vazio
  para essas em quase todos os casos.
- Se está em dúvida se uma dependência é real, NÃO inclua. O
  cronograma com sequência ordenada já garante a ordem de fluxo;
  \`depends_on_indices\` serve apenas para travas técnicas reais.

Gere o escopo usando a ferramenta "generate_activities_list" fornecida.`;

const ACTIVITIES_SCHEMA = {
  type: "object",
  properties: {
    activities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Nome técnico curto da atividade (ex: 'Pintura paredes — Sala'). Max 60 chars.",
          },
          ambiente: {
            type: "string",
            description: "Ambiente onde acontece (Sala, Cozinha, Suíte, Banho social, Lavanderia, Área externa, etc.). Use string curta consistente.",
          },
          discipline: {
            type: "string",
            enum: [
              "Demolição", "Alvenaria", "Estrutura", "Hidráulica", "Elétrica", "Gesso/Forro",
              "Revestimento", "Pintura", "Marcenaria", "Marmoraria", "Esquadrias", "Serralheria",
              "Vidros", "Ar-condicionado", "Automação", "Iluminação", "Louças e Metais",
              "Impermeabilização", "Piso", "Acabamento", "Limpeza",
            ],
          },
          area_m2: {
            type: "number",
            description: "Área da atividade em m² quando aplicável (piso, parede, forro, revestimento). Derive do material quando o ambiente vier com área citada.",
          },
          duration_days: { type: "integer", description: "Duração estimada em dias úteis" },
          description: { type: "string", description: "Descrição técnica em uma frase do serviço a ser executado." },
          incluso: { type: "array", items: { type: "string" }, description: "Lista do que ESTÁ incluso neste serviço." },
          nao_incluso: { type: "array", items: { type: "string" }, description: "Lista do que NÃO está incluso neste serviço (evita conflito com fornecedor)." },
          depends_on_indices: {
            type: "array",
            items: { type: "integer" },
            description: "Índices (0-based) das outras atividades neste mesmo array que precisam estar concluídas antes desta começar. Use somente para dependências reais entre disciplinas (ex: revestimento depende de hidráulica/elétrica).",
          },
        },
        required: ["name", "ambiente", "discipline", "duration_days", "area_m2", "description", "incluso", "nao_incluso", "depends_on_indices"],
        additionalProperties: false,
      },
    },
  },
  required: ["activities"],
  additionalProperties: false,
};

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

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContent: Anthropic.ContentBlockParam[] = [];

    if (mode === "image") {
      userContent.push(
        { type: "image", source: { type: "url", url: content } },
        { type: "text", text: "Analise esta planta/imagem e gere o escopo de obra completo conforme as regras." },
      );
    } else {
      // text or audio (audio comes as transcription)
      userContent.push({ type: "text", text: `Descrição do projeto:\n${content}` });
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
      output_config: { format: { type: "json_schema", schema: ACTIVITIES_SCHEMA } },
    });

    if (response.stop_reason === "refusal") {
      return new Response(
        JSON.stringify({ error: "A IA não conseguiu processar este conteúdo. Tente um texto mais direto." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.error("Falha ao parsear resposta:", parseErr, raw.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "A IA retornou em formato inesperado. Tente novamente — se persistir, simplifique o texto." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
        // Sprint 7d (call 23/06): mesmo com o prompt limitando a 1
        // dependência por atividade, o modelo às vezes devolve 4-5.
        // Cortamos no servidor para garantir, mantendo só a primeira
        // (geralmente a mais relevante na ordem que ela retorna).
        depends_on_indices: Array.isArray(a.depends_on_indices)
          ? a.depends_on_indices.slice(0, 1)
          : [],
      };
    });

    return new Response(JSON.stringify({ activities }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-activities error:", e);
    if (e instanceof Anthropic.RateLimitError) {
      return new Response(
        JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
