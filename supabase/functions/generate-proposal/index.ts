import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { leadName, projectType, constructionType, templateIntroduction, templateMethodology, templateDifferentials, services, estimatedArea, value, paymentConditions } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

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

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    if (response.stop_reason === "refusal") {
      return new Response(JSON.stringify({ error: "Não foi possível gerar o texto para esta solicitação." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const generatedText = textBlock?.type === "text" ? textBlock.text : "";

    return new Response(JSON.stringify({ text: generatedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-proposal error:", e);
    if (e instanceof Anthropic.RateLimitError) {
      return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
