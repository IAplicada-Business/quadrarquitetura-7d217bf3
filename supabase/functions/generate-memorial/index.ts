import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_data, documents } = await req.json();
    // project_data: { name, client_name, address, area_sqm, description, obra_type? }
    // documents:    [{ name, file_url, category }]

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build user message parts — embed images/PDFs
    const userParts: unknown[] = [];
    const fileDocs = (documents as Array<{ name: string; file_url: string | null; category: string | null }>)
      .filter((d) => d.file_url)
      .slice(0, 5); // cap to avoid context overflow

    for (const doc of fileDocs) {
      try {
        const resp = await fetch(doc.file_url!);
        if (!resp.ok) continue;
        const bytes = await resp.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
        const ct = resp.headers.get("content-type") || "image/jpeg";
        // Include images; skip unknown binary types
        if (ct.startsWith("image/") || ct === "application/pdf") {
          userParts.push({ type: "image_url", image_url: { url: `data:${ct};base64,${base64}` } });
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
      text: `Com base nos documentos acima e nos dados do projeto abaixo, elabore um Memorial Descritivo técnico completo usando a ferramenta fornecida.\n\n${projectInfo}`,
    });

    const systemPrompt = `Você é um arquiteto especialista em documentação técnica de obras no Brasil. Elabore memoriais descritivos claros, técnicos e profissionais para projetos de arquitetura e construção civil. Use terminologia técnica correta em português brasileiro. Seja específico, objetivo e detalhado sobre os materiais e ambientes identificados.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userParts.length > 1 ? userParts : [userParts[userParts.length - 1]] },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_memorial",
              description: "Gera o memorial descritivo estruturado do projeto de arquitetura",
              parameters: {
                type: "object",
                properties: {
                  objeto: {
                    type: "string",
                    description: "Descrição do objeto do projeto: tipo de intervenção (reforma, construção, ampliação, etc.) e finalidade",
                  },
                  localizacao: {
                    type: "string",
                    description: "Localização e características do imóvel",
                  },
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
                      required: ["nome", "descricao"],
                      additionalProperties: false,
                    },
                  },
                  materiais_acabamentos: {
                    type: "string",
                    description: "Especificação geral dos materiais e acabamentos utilizados no projeto",
                  },
                  instalacoes: {
                    type: "string",
                    description: "Descrição das instalações elétricas, hidráulicas, ar-condicionado e outras instalações especiais",
                  },
                  observacoes: {
                    type: "string",
                    description: "Observações técnicas, exigências normativas, requisitos especiais de execução",
                  },
                },
                required: ["objeto", "descricao_geral", "ambientes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_memorial" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
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
      return new Response(
        JSON.stringify({ error: "Erro ao gerar memorial" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "IA não retornou o memorial. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const memorial = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(memorial), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-memorial error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
