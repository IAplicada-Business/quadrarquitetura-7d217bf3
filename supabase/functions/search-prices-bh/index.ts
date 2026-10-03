import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MaterialInput {
  name: string;
  unit: string;
  quantity: number;
}

interface SupplierResult {
  supplier: string;
  neighborhood: string;
  price_min: number;
  price_max: number;
  unit: string;
  source_url: string;
}

interface MaterialResult {
  material: string;
  unit: string;
  results: SupplierResult[];
  searched_at: string;
}

const RESULTS_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          supplier: { type: "string" },
          neighborhood: { type: "string" },
          price_min: { type: "number" },
          price_max: { type: "number" },
          unit: { type: "string" },
          source_url: { type: "string" },
        },
        required: ["supplier", "neighborhood", "price_min", "price_max", "unit", "source_url"],
        additionalProperties: false,
      },
    },
  },
  required: ["results"],
  additionalProperties: false,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const { activity_name, materials, city } = await req.json() as {
      activity_name: string;
      materials: MaterialInput[];
      city: string;
    };

    if (!activity_name || !materials || !Array.isArray(materials) || materials.length === 0) {
      return new Response(JSON.stringify({ error: "activity_name and materials[] are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchCity = city || "Belo Horizonte";
    const results: MaterialResult[] = [];
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    for (const mat of materials) {
      const query = `Pesquise na internet preços atuais de "${mat.name}" (${mat.unit}) em distribuidoras e lojas de materiais de construção em ${searchCity}, MG, Brasil, em 2025.

Para cada fornecedor encontrado, retorne:
- Nome do fornecedor/loja
- Bairro/região em ${searchCity}
- Faixa de preço (mínimo e máximo) por ${mat.unit}
- URL da fonte quando disponível

Busque pelo menos 3 fornecedores. Use preços reais e atualizados, obtidos via busca na web.`;

      try {
        const response = await anthropic.messages.create({
          model: "claude-opus-5-5",
          max_tokens: 4096,
          system: "Você é um assistente especializado em pesquisa de preços de materiais de construção no Brasil, com acesso à internet via busca web. Sempre baseie os preços em resultados reais da busca. Seja preciso com preços e fornecedores reais.",
          messages: [{ role: "user", content: query }],
          tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
          output_config: { format: { type: "json_schema", schema: RESULTS_SCHEMA } },
        });

        if (response.stop_reason === "refusal") {
          results.push({ material: mat.name, unit: mat.unit, results: [], searched_at: new Date().toISOString() });
          continue;
        }

        const textBlock = response.content.find((b) => b.type === "text");
        const raw = textBlock?.type === "text" ? textBlock.text : "";

        let supplierResults: SupplierResult[] = [];
        try {
          const parsed = raw ? JSON.parse(raw) : { results: [] };
          supplierResults = (parsed.results || []).map((r: any) => ({
            supplier: r.supplier || "Não informado",
            neighborhood: r.neighborhood || "Não informado",
            price_min: Number(r.price_min) || 0,
            price_max: Number(r.price_max) || 0,
            unit: r.unit || mat.unit,
            source_url: r.source_url || "",
          }));
        } catch (parseErr) {
          console.error(`Failed to parse results for ${mat.name}:`, parseErr);
        }

        results.push({
          material: mat.name,
          unit: mat.unit,
          results: supplierResults,
          searched_at: new Date().toISOString(),
        });
      } catch (matErr) {
        console.error(`Claude API error for ${mat.name}:`, matErr);
        results.push({
          material: mat.name,
          unit: mat.unit,
          results: [],
          searched_at: new Date().toISOString(),
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in search-prices-bh:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
