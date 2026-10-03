import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    // Parse body
    const { message, conversation_id, history, context } = await req.json();

    // Query context data using service role
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const [
      projectsRes,
      leadsRes,
      paymentsRes,
      purchasesRes,
      pendingRes,
      scheduleRes,
      suppliersRes,
      voiceTasksRes,
      clientsRes,
    ] = await Promise.all([
      admin.from("projects").select("id, name, status, client_budget, estimated_budget, real_budget, start_date, expected_end_date, city, neighborhood").eq("user_id", userId).limit(50),
      admin.from("leads").select("id, name, status, phone, email, project_type, origin, created_at").eq("user_id", userId).limit(50),
      admin.from("payments").select("id, description, value, status, due_date, supplier_name, payment_method, project_id").eq("user_id", userId).limit(100),
      admin.from("purchases").select("id, name, value, status, supplier_name, category, project_id").eq("user_id", userId).limit(100),
      admin.from("pending_items").select("id, description, status, responsible, discipline, project_id").eq("user_id", userId).limit(100),
      admin.from("schedule_tasks").select("id, task_name, status, start_date, end_date, discipline, supplier_name, progress_percentage, project_id").eq("user_id", userId).limit(100),
      admin.from("suppliers").select("id, name, category, phone, email, is_active").eq("user_id", userId).limit(50),
      admin.from("voice_tasks").select("id, title, status, responsible, task_type, category, priority, project_id").eq("user_id", userId).limit(50),
      admin.from("clients").select("id, name, email, phone, client_type").eq("user_id", userId).limit(50),
    ]);

    // Build context summary
    const projects = projectsRes.data || [];
    const leads = leadsRes.data || [];
    const payments = paymentsRes.data || [];
    const purchases = purchasesRes.data || [];
    const pending = pendingRes.data || [];
    const schedule = scheduleRes.data || [];
    const suppliers = suppliersRes.data || [];
    const voiceTasks = voiceTasksRes.data || [];
    const clients = clientsRes.data || [];

    const pendingPayments = payments.filter((p: any) => p.status === "pendente");
    const overduePayments = payments.filter((p: any) => p.status === "pendente" && p.due_date && new Date(p.due_date) < new Date());
    const activeProjects = projects.filter((p: any) => p.status === "em_andamento" || p.status === "planejamento");
    const pendingLeads = leads.filter((l: any) => l.status === "novo" || l.status === "contato" || l.status === "reuniao");
    const pendingPurchases = purchases.filter((p: any) => p.status === "pendente");
    const pendingItems = pending.filter((p: any) => p.status === "pendente" || p.status === "em_andamento");
    const delayedTasks = schedule.filter((t: any) => t.status !== "concluido" && t.end_date && new Date(t.end_date) < new Date());

    const totalPaid = payments.filter((p: any) => p.status === "pago").reduce((sum: number, p: any) => sum + Number(p.value || 0), 0);
    const totalPending = pendingPayments.reduce((sum: number, p: any) => sum + Number(p.value || 0), 0);

    const contextBlock = `
## Dados da Empresa do Usuário (contexto atual do banco de dados)

### Projetos (${projects.length} total, ${activeProjects.length} ativos)
${projects.map((p: any) => `- ${p.name} | Status: ${p.status} | Orçamento cliente: R$${p.client_budget || "N/A"} | Orçamento estimado: R$${p.estimated_budget || "N/A"} | Orçamento real: R$${p.real_budget || "N/A"} | Início: ${p.start_date || "N/A"} | Previsão: ${p.expected_end_date || "N/A"} | Local: ${p.city || ""} ${p.neighborhood || ""}`).join("\n")}

### Clientes (${clients.length})
${clients.map((c: any) => `- ${c.name} | Tipo: ${c.client_type || "N/A"} | Tel: ${c.phone || "N/A"} | Email: ${c.email || "N/A"}`).join("\n")}

### Leads (${leads.length} total, ${pendingLeads.length} pendentes)
${leads.map((l: any) => `- ${l.name} | Status: ${l.status} | Tipo: ${l.project_type} | Origem: ${l.origin} | Tel: ${l.phone}`).join("\n")}

### Financeiro
- Total pago: R$${totalPaid.toLocaleString("pt-BR")}
- Total pendente: R$${totalPending.toLocaleString("pt-BR")}
- Pagamentos vencidos: ${overduePayments.length}
${pendingPayments.slice(0, 10).map((p: any) => `- ${p.description || "Sem descrição"} | R$${p.value} | Vence: ${p.due_date || "N/A"} | Fornecedor: ${p.supplier_name || "N/A"}`).join("\n")}

### Compras (${purchases.length} total, ${pendingPurchases.length} pendentes)
${pendingPurchases.slice(0, 10).map((p: any) => `- ${p.name} | R$${p.value || "N/A"} | Fornecedor: ${p.supplier_name || "N/A"} | Categoria: ${p.category || "N/A"}`).join("\n")}

### Pendências (${pendingItems.length} abertas)
${pendingItems.slice(0, 10).map((p: any) => `- ${p.description} | Status: ${p.status} | Responsável: ${p.responsible || "N/A"} | Disciplina: ${p.discipline || "N/A"}`).join("\n")}

### Cronograma - Tarefas Atrasadas (${delayedTasks.length})
${delayedTasks.slice(0, 10).map((t: any) => `- ${t.task_name} | Prazo: ${t.end_date} | Progresso: ${t.progress_percentage || 0}% | Fornecedor: ${t.supplier_name || "N/A"}`).join("\n")}

### Fornecedores (${suppliers.length})
${suppliers.slice(0, 10).map((s: any) => `- ${s.name} | Categoria: ${s.category || "N/A"} | Ativo: ${s.is_active ? "Sim" : "Não"}`).join("\n")}

### Tarefas de Voz (${voiceTasks.length})
${voiceTasks.slice(0, 10).map((t: any) => `- ${t.title} | Status: ${t.status} | Responsável: ${t.responsible || "N/A"} | Tipo: ${t.task_type} | Prioridade: ${t.priority}`).join("\n")}
`.trim();

    // Build project-specific context if available
    let projectContextBlock = "";
    if (context?.project_id) {
      const [projRes, actRes, payRes, scenRes] = await Promise.all([
        admin.from("projects").select("id, name, project_number, status, client_budget, estimated_budget, real_budget, start_date, expected_end_date, client_id, area_sqm").eq("id", context.project_id).single(),
        admin.from("project_activities").select("id, name, discipline, status, progress_percent, start_date, end_date, duration_days, depends_on").eq("project_id", context.project_id).order("position", { ascending: true }),
        admin.from("payments").select("id, description, value, status, due_date, supplier_name").eq("project_id", context.project_id),
        admin.from("scenarios").select("id, name, is_approved, total_value").eq("project_id", context.project_id),
      ]);

      if (projRes.data) {
        const p = projRes.data;
        const acts = actRes.data || [];
        const pays = payRes.data || [];
        const scens = scenRes.data || [];
        const totalPaidProj = pays.filter((x: any) => x.status === "pago").reduce((s: number, x: any) => s + Number(x.value || 0), 0);
        const totalPendingProj = pays.filter((x: any) => x.status === "pendente").reduce((s: number, x: any) => s + Number(x.value || 0), 0);
        const pendingActs = acts.filter((a: any) => a.status === "pendente" || a.status === "em_andamento");
        const approvedScen = scens.find((s: any) => s.is_approved);

        // Get client name if available
        let clientName = "";
        if (p.client_id) {
          const clientRes = await admin.from("clients").select("name").eq("id", p.client_id).single();
          clientName = clientRes.data?.name || "";
        }

        projectContextBlock = `
## CONTEXTO DO PROJETO ATUAL (o usuário está visualizando este projeto)
- Projeto: ${p.project_number || ""} — ${p.name}
- Cliente: ${clientName || "Não definido"}
- Status: ${p.status} | Área: ${p.area_sqm || "N/A"} m²
- Orçamento cliente: R$${p.client_budget || "N/A"} | Estimado: R$${p.estimated_budget || "N/A"} | Real: R$${p.real_budget || "N/A"}
- Cenário aprovado: ${approvedScen ? `${approvedScen.name} (R$${approvedScen.total_value})` : "Nenhum"}
- Total pago neste projeto: R$${totalPaidProj.toLocaleString("pt-BR")}
- Total pendente neste projeto: R$${totalPendingProj.toLocaleString("pt-BR")}
- Atividades (${acts.length} total, ${pendingActs.length} pendentes):
${acts.map((a: any) => `  • ${a.name} | ${a.discipline || "-"} | ${a.status} | ${a.progress_percent || 0}%`).join("\n")}

Responda com foco neste projeto quando a pergunta for sobre "este projeto", "a obra", etc.
`;
      }
    }

    // Build lead-specific context if available
    let leadContextBlock = "";
    if (context?.lead_id) {
      const [leadRes, proposalRes] = await Promise.all([
        admin.from("leads").select("*").eq("id", context.lead_id).single(),
        admin.from("proposals").select("id, title, status, value, final_value, sent_at").eq("lead_id", context.lead_id),
      ]);
      if (leadRes.data) {
        const l = leadRes.data;
        const props = proposalRes.data || [];
        leadContextBlock = `
## CONTEXTO DO LEAD ATUAL
- Lead: ${l.name} | Status: ${l.status} | Tel: ${l.phone}
- Tipo: ${l.project_type} | Origem: ${l.origin}
- Propostas (${props.length}):
${props.map((p: any) => `  • ${p.title || "Sem título"} | ${p.status} | R$${p.final_value || p.value || "N/A"}`).join("\n")}
`;
      }
    }

    const systemPrompt = `Você é o assistente inteligente do sistema de gestão de arquitetura e construção Quadra Arquitetura. Você tem acesso aos dados reais da empresa do usuário.

Diretrizes de comunicação:
- Seja profissional, direto e natural
- Use bullets (•) para listas quando apropriado
- Não use emojis em excesso (no máximo 1-2 por resposta quando fizer sentido)
- Formate valores monetários em R$ com separadores brasileiros
- Ao falar de datas, use formato brasileiro (dd/mm/aaaa)
- Responda sempre em português brasileiro
- Seja preciso com números e dados
- Se não tiver dados suficientes para responder, diga claramente
- Ofereça insights e sugestões quando relevante

O sistema possui as seguintes seções:
- Dashboard (Escritório e Obras)
- Clientes
- Projetos (com abas: Resumo, Escopo, Cenários, Orçamentos, Cronograma, Materiais, Compras, Financeiro, Pendências, Documentos, Acompanhamento)
- Leads (Pipeline, Propostas, Contratos)
- Obra (Acompanhamento, Tarefas, Fornecedores, Tarefas de Voz, Documentos, Relatórios)
- Administrativo (Configurações, Usuários)

${projectContextBlock}
${leadContextBlock}
${contextBlock}`;

    // Fetch persistent project history from DB
    let dbHistory: any[] = [];
    if (context?.project_id) {
      const { data: dbMsgs } = await admin.from("chat_messages")
        .select("role, content")
        .eq("user_id", userId)
        .eq("project_id", context.project_id)
        .order("created_at", { ascending: false })
        .limit(10);
      dbHistory = (dbMsgs || []).reverse();
    }

    // Merge: dbHistory + session history, dedup by content, cap at 20
    const sessionHistory = (history || []).slice(-18);
    const sessionContents = new Set(sessionHistory.map((m: any) => m.content));
    const uniqueDbHistory = dbHistory.filter((m: any) => !sessionContents.has(m.content));
    const mergedHistory = [...uniqueDbHistory, ...sessionHistory].slice(-20);

    const messagesForAI = [
      ...mergedHistory.map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    // Proxy Claude's stream as OpenAI-shaped SSE chunks, since the frontend
    // (useAIChat.ts) parses `data: {"choices":[{"delta":{"content": "..."}}]}`.
    const encoder = new TextEncoder();
    const sseStream = new ReadableStream({
      async start(controller) {
        try {
          const claudeStream = anthropic.messages.stream({
            model: "claude-opus-5-5",
            max_tokens: 4096,
            system: systemPrompt,
            messages: messagesForAI,
          });

          claudeStream.on("text", (delta) => {
            const chunk = { choices: [{ delta: { content: delta } }] };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          });

          const final = await claudeStream.finalMessage();
          if (final.stop_reason === "refusal") {
            const chunk = { choices: [{ delta: { content: "\n\n(resposta interrompida por política de segurança)" } }] };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (streamErr) {
          console.error("Claude stream error:", streamErr);
          const message = streamErr instanceof Anthropic.RateLimitError
            ? "Limite de requisições excedido. Tente novamente em alguns instantes."
            : "Erro no serviço de IA";
          const chunk = { choices: [{ delta: { content: message } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(sseStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
