import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

${contextBlock}`;

    const messagesForAI = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-20),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: messagesForAI,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
