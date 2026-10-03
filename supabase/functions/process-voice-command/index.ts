import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUBTASK_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    responsible: { type: "string" },
    task_type: { type: "string" },
    category: { type: "string" },
    priority: { type: "string" },
  },
  required: ["title", "description", "responsible", "task_type", "category", "priority"],
  additionalProperties: false,
};

const TASKS_SCHEMA = {
  type: "object",
  properties: {
    project_id: { type: "string", description: "UUID do projeto identificado, ou null se não identificado" },
    project_name: { type: "string", description: "Nome do projeto mencionado" },
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          responsible: { type: "string" },
          task_type: { type: "string", enum: ["projeto", "obra", "compras", "financeiro", "administrativo", "geral"] },
          category: { type: "string", enum: ["cronograma", "escopo", "orcamentos", "materiais", "pendencias", "financeiro", "compras", "documentos"] },
          priority: { type: "string", enum: ["baixa", "media", "alta", "urgente"] },
          due_date: { type: "string", description: "Data no formato YYYY-MM-DD ou null" },
          subtasks: { type: "array", items: SUBTASK_SCHEMA },
        },
        required: ["title", "description", "responsible", "task_type", "category", "priority", "due_date", "subtasks"],
        additionalProperties: false,
      },
    },
  },
  required: ["project_id", "project_name", "tasks"],
  additionalProperties: false,
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

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
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

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      output_config: { format: { type: "json_schema", schema: TASKS_SCHEMA } },
    });

    if (response.stop_reason === "refusal") {
      throw new Error("IA não conseguiu processar este comando");
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text : "";
    if (!raw) {
      throw new Error("IA não retornou resultado estruturado");
    }

    const result = JSON.parse(raw);

    // Ensure project_id is actual null, not string "null"
    if (!result.project_id || result.project_id === "null") {
      result.project_id = null;
    }

    console.log("Parsed result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-voice-command error:", error);
    if (error instanceof Anthropic.RateLimitError) {
      return new Response(JSON.stringify({ error: "Limite de requisições excedido, tente novamente em alguns segundos." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
