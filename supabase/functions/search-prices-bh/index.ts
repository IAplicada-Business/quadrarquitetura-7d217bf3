import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
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

    for (const mat of materials) {
      const query = `Pesquise preços atuais de "${mat.name}" (${mat.unit}) em distribuidoras e lojas de materiais de construção em ${searchCity}, MG, Brasil, em 2025.

Para cada fornecedor encontrado, retorne:
- Nome do fornecedor/loja
- Bairro/região em ${searchCity}
- Faixa de preço (mínimo e máximo) por ${mat.unit}
- URL da fonte quando disponível

Retorne no formato JSON:
{
  "results": [
    {
      "supplier": "Nome da Loja",
      "neighborhood": "Bairro",
      "price_min": 0.00,
      "price_max": 0.00,
      "unit": "${mat.unit}",
      "source_url": "https://..."
    }
  ]
}

Busque pelo menos 3 fornecedores. Use preços reais e atualizados.`;

      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: "Você é um assistente especializado em pesquisa de preços de materiais de construção no Brasil. Sempre retorne dados em formato JSON válido. Seja preciso com preços e fornecedores reais.",
            },
            { role: "user", content: query },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Perplexity API error for ${mat.name}: ${response.status} - ${errorBody}`);
        results.push({
          material: mat.name,
          unit: mat.unit,
          results: [],
          searched_at: new Date().toISOString(),
        });
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      let supplierResults: SupplierResult[] = [];
      try {
        const jsonMatch = content.match(/\{[\s\S]*"results"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          supplierResults = (parsed.results || []).map((r: any) => ({
            supplier: r.supplier || "Não informado",
            neighborhood: r.neighborhood || "Não informado",
            price_min: Number(r.price_min) || 0,
            price_max: Number(r.price_max) || 0,
            unit: r.unit || mat.unit,
            source_url: r.source_url || "",
          }));
        }
      } catch (parseErr) {
        console.error(`Failed to parse results for ${mat.name}:`, parseErr);
      }

      results.push({
        material: mat.name,
        unit: mat.unit,
        results: supplierResults,
        searched_at: new Date().toISOString(),
      });
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
