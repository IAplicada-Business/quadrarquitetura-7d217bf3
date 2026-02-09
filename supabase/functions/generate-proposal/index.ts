import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { leadName, projectType, constructionType, templateIntroduction, templateMethodology, templateDifferentials, services, estimatedArea, value, paymentConditions } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const servicesList = [];
    if (services?.architectural) servicesList.push("Projeto Arquitetônico completo");
    if (services?.construction) servicesList.push("Gerenciamento e Acompanhamento de Obra");
    if (services?.interior) servicesList.push("Design de Interiores");
    if (services?.visualization) servicesList.push("Visualização 3D e Renders");
    if (services?.custom) servicesList.push(services.custom);

    const systemPrompt = `Você é um especialista em elaboração de propostas comerciais para escritórios de arquitetura e construção civil no Brasil. 
Gere textos profissionais, persuasivos e personalizados para propostas comerciais.
Use linguagem formal mas acessível, em português brasileiro.
NÃO inclua cabeçalhos, títulos ou formatação markdown. Apenas o texto corrido da descrição dos serviços.
O texto deve ter entre 3 a 5 parágrafos.`;

    const userPrompt = `Gere a descrição dos serviços para uma proposta comercial com os seguintes dados:

- Cliente: ${leadName || "não informado"}
- Tipo de projeto: ${projectType || "residencial"}
- Tipo de obra: ${constructionType || "não especificado"}
- Área estimada: ${estimatedArea ? `${estimatedArea} m²` : "não informada"}
- Valor do investimento: ${value ? `R$ ${Number(value).toLocaleString("pt-BR")}` : "a definir"}
- Condições de pagamento: ${paymentConditions || "a combinar"}
- Serviços inclusos: ${servicesList.join(", ") || "projeto arquitetônico"}

${templateIntroduction ? `Use como base esta introdução do template:\n${templateIntroduction}\n` : ""}
${templateMethodology ? `Metodologia de trabalho:\n${templateMethodology}\n` : ""}
${templateDifferentials ? `Diferenciais:\n${templateDifferentials}\n` : ""}

Gere um texto descritivo dos serviços que será incluído na proposta comercial. Seja específico sobre o que está incluso e como o trabalho será conduzido.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações > Workspace > Uso." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar proposta" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ text: generatedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-proposal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
