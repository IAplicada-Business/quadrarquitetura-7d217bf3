import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// btoa(String.fromCharCode(...bytes)) estoura o limite de argumentos do V8
// (~64KB) e derruba a função com "Maximum call stack size exceeded" —
// qualquer documento real passa disso. Converte em blocos.
function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

const MEMORIAL_SCHEMA = {
  type: "object",
  properties: {
    objeto: {
      type: "string",
      description: "Descrição do objeto do projeto: tipo de intervenção (reforma, construção, ampliação, etc.) e finalidade",
    },
    localizacao: { type: "string", description: "Localização e características do imóvel" },
    descricao_geral: {
      type: "string",
      description: "Descrição geral do projeto: conceito, partido arquitetônico, principais intervenções",
    },
    ambientes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome do ambiente (ex: Sala de Estar, Cozinha, Suíte Master)" },
          area_m2: { type: "number", description: "Área estimada em m²" },
          descricao: {
            type: "string",
            description: "Descrição técnica: materiais de piso, revestimento de paredes, teto/forro, marcenaria, equipamentos e observações específicas",
          },
        },
        required: ["nome", "area_m2", "descricao"],
        additionalProperties: false,
      },
    },
    materiais_acabamentos: { type: "string", description: "Especificação geral dos materiais e acabamentos utilizados no projeto" },
    instalacoes: { type: "string", description: "Descrição das instalações elétricas, hidráulicas, ar-condicionado e outras instalações especiais" },
    observacoes: { type: "string", description: "Observações técnicas, exigências normativas, requisitos especiais de execução" },
  },
  required: ["objeto", "localizacao", "descricao_geral", "ambientes", "materiais_acabamentos", "instalacoes", "observacoes"],
  additionalProperties: false,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_data, documents } = await req.json();
    // project_data: { name, client_name, address, area_sqm, description, obra_type? }
    // documents:    [{ name, file_url, category }]

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build user message parts — embed images/PDFs
    const userParts: Anthropic.ContentBlockParam[] = [];
    const fileDocs = (documents as Array<{ name: string; file_url: string | null; category: string | null }>)
      .filter((d) => d.file_url)
      .slice(0, 5); // cap to avoid context overflow

    for (const doc of fileDocs) {
      try {
        const resp = await fetch(doc.file_url!);
        if (!resp.ok) continue;
        const bytes = await resp.arrayBuffer();
        const base64 = bytesToBase64(new Uint8Array(bytes));
        const ct = resp.headers.get("content-type") || "image/jpeg";
        // Include images and PDFs; skip unknown binary types
        if (ct.startsWith("image/")) {
          userParts.push({ type: "image", source: { type: "base64", media_type: ct as any, data: base64 } });
          userParts.push({ type: "text", text: `↑ Documento: "${doc.name}" (categoria: ${doc.category || "geral"})` });
        } else if (ct === "application/pdf") {
          userParts.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } });
          userParts.push({ type: "text", text: `↑ Documento: "${doc.name}" (categoria: ${doc.category || "geral"})` });
        }
      } catch (e) {
        console.error("Erro ao carregar documento:", doc.name, e);
      }
    }

    const projectInfo = [
      `Projeto: ${project_data.name || "—"}`,
      `Cliente: ${project_data.client_name || "—"}`,
      `Endereço: ${project_data.address || "—"}`,
      `Área total: ${project_data.area_sqm ? `${project_data.area_sqm} m²` : "—"}`,
      project_data.obra_type ? `Tipo de obra: ${project_data.obra_type}` : "",
      project_data.description ? `Descrição: ${project_data.description}` : "",
    ].filter(Boolean).join("\n");

    userParts.push({
      type: "text",
      text: `Com base nos documentos acima e nos dados do projeto abaixo, elabore um Memorial Descritivo técnico completo.\n\n${projectInfo}`,
    });

    const systemPrompt = `Você é um arquiteto especialista em documentação técnica de obras no Brasil. Elabore memoriais descritivos claros, técnicos e profissionais para projetos de arquitetura e construção civil. Use terminologia técnica correta em português brasileiro. Seja específico, objetivo e detalhado sobre os materiais e ambientes identificados.

Retorne o resultado usando o formato estruturado fornecido.`;

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userParts }],
      output_config: { format: { type: "json_schema", schema: MEMORIAL_SCHEMA } },
    });

    if (response.stop_reason === "refusal") {
      return new Response(
        JSON.stringify({ error: "IA não conseguiu gerar o memorial. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";
    if (!raw) {
      return new Response(
        JSON.stringify({ error: "IA não retornou o memorial. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(raw, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-memorial error:", e);
    if (e instanceof Anthropic.RateLimitError) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
