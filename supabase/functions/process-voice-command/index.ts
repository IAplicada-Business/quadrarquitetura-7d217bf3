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
    const { transcript, projects } = await req.json();

    if (!transcript) {
      return new Response(JSON.stringify({ error: "Transcrição vazia" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const projectList = (projects || [])
      .map((p: any) => `- "${p.name}" (id: ${p.id})`)
      .join("\n");

    const systemPrompt = `Você é um assistente de gestão de projetos de arquitetura e construção civil. 
Sua tarefa é interpretar comandos de voz e extrair tarefas estruturadas.

O sistema possui as seguintes categorias/abas:
- cronograma: tarefas de cronograma e prazos
- escopo: itens de escopo do projeto
- orcamentos: orçamentos e cotações
- materiais: materiais e cálculos de materiais
- pendencias: pendências e itens a resolver
- financeiro: pagamentos, notas fiscais
- compras: compras e aquisições
- documentos: documentos do projeto

Tipos de tarefa: projeto, obra, compras, financeiro, administrativo, geral

Prioridades: baixa, media, alta, urgente

Projetos disponíveis:
${projectList || "Nenhum projeto cadastrado"}

IMPORTANTE: 
- Identifique o projeto mencionado pelo nome e retorne o ID correspondente
- Se nenhum projeto for identificado, use project_id como null
- Extraia responsáveis mencionados
- Crie subtarefas quando houver itens relacionados
- Responda SEMPRE em português`;

    const userPrompt = `Transcrição do comando de voz: "${transcript}"

Extraia as tarefas mencionadas e retorne no formato estruturado.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tasks",
              description: "Extrair tarefas estruturadas do comando de voz",
              parameters: {
                type: "object",
                properties: {
                  project_id: {
                    type: "string",
                    description: "UUID do projeto identificado, ou null se não identificado",
                  },
                  project_name: {
                    type: "string",
                    description: "Nome do projeto mencionado",
                  },
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        responsible: { type: "string" },
                        task_type: {
                          type: "string",
                          enum: ["projeto", "obra", "compras", "financeiro", "administrativo", "geral"],
                        },
                        category: {
                          type: "string",
                          enum: ["cronograma", "escopo", "orcamentos", "materiais", "pendencias", "financeiro", "compras", "documentos"],
                        },
                        priority: {
                          type: "string",
                          enum: ["baixa", "media", "alta", "urgente"],
                        },
                        due_date: { type: "string", description: "Data no formato YYYY-MM-DD ou null" },
                        subtasks: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              description: { type: "string" },
                              responsible: { type: "string" },
                              task_type: { type: "string" },
                              category: { type: "string" },
                              priority: { type: "string" },
                            },
                            required: ["title"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["title", "task_type", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tasks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_tasks" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Erro ao processar com IA");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("IA não retornou resultado estruturado");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-voice-command error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
