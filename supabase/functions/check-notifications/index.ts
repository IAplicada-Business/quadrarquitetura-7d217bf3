import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().split("T")[0];
    const threeDaysFromNow = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0];
    const threeDaysAgoISO = new Date(Date.now() - 3 * 86400000).toISOString();

    let totalCreated = 0;

    // Helper: check if notification already exists for this type+entity in last 3 days
    async function isDuplicate(type: string, entityId: string): Promise<boolean> {
      const { data } = await supabase
        .from("notifications")
        .select("id")
        .eq("type", type)
        .eq("related_entity_id", entityId)
        .gte("created_at", threeDaysAgoISO)
        .limit(1);
      return (data && data.length > 0);
    }

    // Rule 1: Overdue tasks
    const { data: overdueTasks } = await supabase
      .from("schedule_tasks")
      .select("id, task_name, user_id, end_date, project_id")
      .lt("end_date", today)
      .not("status", "eq", "executado")
      .lt("progress_percentage", 100);

    if (overdueTasks) {
      // Get project names
      const projectIds = [...new Set(overdueTasks.map((t: any) => t.project_id))];
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .in("id", projectIds);
      const projectMap = Object.fromEntries((projects || []).map((p: any) => [p.id, p.name]));

      for (const task of overdueTasks) {
        if (await isDuplicate("task_overdue", task.id)) continue;
        await supabase.from("notifications").insert({
          user_id: task.user_id,
          type: "task_overdue",
          title: "Tarefa atrasada",
          message: `${task.task_name} na obra ${projectMap[task.project_id] || "—"} — prazo era ${task.end_date}`,
          related_entity_type: "task",
          related_entity_id: task.id,
          related_project_id: task.project_id,
        });
        totalCreated++;
      }
    }

    // Rule 2: Payments due in 3 days
    const { data: paymentsDueSoon } = await supabase
      .from("payments")
      .select("id, value, description, due_date, user_id, project_id")
      .gte("due_date", today)
      .lte("due_date", threeDaysFromNow)
      .not("status", "eq", "pago");

    if (paymentsDueSoon) {
      for (const p of paymentsDueSoon) {
        if (await isDuplicate("payment_due_soon", p.id)) continue;
        await supabase.from("notifications").insert({
          user_id: p.user_id,
          type: "payment_due_soon",
          title: "Pagamento próximo do vencimento",
          message: `R$ ${Number(p.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — ${p.description || "Sem descrição"} vence em ${p.due_date}`,
          related_entity_type: "payment",
          related_entity_id: p.id,
          related_project_id: p.project_id,
        });
        totalCreated++;
      }
    }

    // Rule 3: Overdue payments
    const { data: paymentsOverdue } = await supabase
      .from("payments")
      .select("id, value, description, due_date, user_id, project_id")
      .lt("due_date", today)
      .not("status", "eq", "pago");

    if (paymentsOverdue) {
      for (const p of paymentsOverdue) {
        if (await isDuplicate("payment_overdue", p.id)) continue;
        await supabase.from("notifications").insert({
          user_id: p.user_id,
          type: "payment_overdue",
          title: "Pagamento vencido",
          message: `R$ ${Number(p.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — ${p.description || "Sem descrição"} venceu em ${p.due_date}`,
          related_entity_type: "payment",
          related_entity_id: p.id,
          related_project_id: p.project_id,
        });
        totalCreated++;
      }
    }

    // Rule 4: Material pending delivery (purchased > 7 days ago, not fully delivered)
    const { data: pendingMaterials } = await supabase
      .from("material_tracking")
      .select("id, material_name, user_id, project_id, purchase_date, quantity_purchased, quantity_delivered")
      .eq("is_active", true)
      .not("purchase_date", "is", null)
      .lte("purchase_date", sevenDaysAgo);

    if (pendingMaterials) {
      for (const m of pendingMaterials) {
        const purchased = Number(m.quantity_purchased) || 0;
        const delivered = Number(m.quantity_delivered) || 0;
        if (delivered >= purchased) continue;
        if (await isDuplicate("material_pending_delivery", m.id)) continue;
        const daysSincePurchase = Math.floor((Date.now() - new Date(m.purchase_date).getTime()) / 86400000);
        await supabase.from("notifications").insert({
          user_id: m.user_id,
          type: "material_pending_delivery",
          title: "Material aguardando entrega",
          message: `${m.material_name} — comprado há ${daysSincePurchase} dias, ainda não entregue`,
          related_entity_type: "material",
          related_entity_id: m.id,
          related_project_id: m.project_id,
        });
        totalCreated++;
      }
    }

    // Rule 6: Budget quotes without response for 5+ days
    const { data: pendingQuotes } = await supabase
      .from("budget_quotes")
      .select("id, services_description, user_id, project_id, created_at")
      .eq("status", "pendente")
      .lte("created_at", fiveDaysAgo);

    if (pendingQuotes) {
      for (const q of pendingQuotes) {
        if (await isDuplicate("quote_no_response", q.id)) continue;
        const daysSinceCreated = Math.floor((Date.now() - new Date(q.created_at).getTime()) / 86400000);
        await supabase.from("notifications").insert({
          user_id: q.user_id,
          type: "quote_no_response",
          title: "Cotação sem resposta",
          message: `${q.services_description || "Cotação"} — enviada há ${daysSinceCreated} dias`,
          related_entity_type: "budget_quote",
          related_entity_id: q.id,
          related_project_id: q.project_id,
        });
        totalCreated++;
      }
    }

    // Helper: para regras que geram "Tarefas Quadra" além da notificação.
    // Evita duplicar tarefa para a mesma entidade nos últimos 3 dias.
    async function hasRecentVoiceTask(userId: string, projectId: string, title: string): Promise<boolean> {
      const { data } = await supabase
        .from("voice_tasks")
        .select("id")
        .eq("user_id", userId)
        .eq("project_id", projectId)
        .eq("title", title)
        .gte("created_at", threeDaysAgoISO)
        .limit(1);
      return (data && data.length > 0) ?? false;
    }

    // Rule 7: Cliente sem resposta no portal há 5+ dias.
    // Pedido vídeo 9 ("gere tarefas para mim Quadra, coisas que eu preciso
    // resolver"): além de notificar, criar entrada em voice_tasks para
    // aparecer no kanban de tarefas internas.
    const { data: stalePendingResponses } = await supabase
      .from("client_pending_responses")
      .select("id, pending_item, weekly_report_id, status, created_at, weekly_reports!inner(project_id, user_id)")
      .eq("status", "pendente")
      .lte("created_at", fiveDaysAgo);

    if (stalePendingResponses) {
      for (const r of stalePendingResponses as any[]) {
        const projectId = r.weekly_reports?.project_id;
        const userId = r.weekly_reports?.user_id;
        if (!projectId || !userId) continue;
        if (await isDuplicate("client_no_response", r.id)) continue;
        const days = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "client_no_response",
          title: "Cliente sem resposta no portal",
          message: `Pendência "${r.pending_item}" sem resposta há ${days} dias`,
          related_entity_type: "pending_response",
          related_entity_id: r.id,
          related_project_id: projectId,
        });
        const taskTitle = `Cobrar resposta do cliente: ${r.pending_item}`;
        if (!(await hasRecentVoiceTask(userId, projectId, taskTitle))) {
          await supabase.from("voice_tasks").insert({
            user_id: userId,
            project_id: projectId,
            title: taskTitle,
            description: `Cliente não respondeu há ${days} dias — entrar em contato manualmente.`,
            category: "pendencias",
            task_type: "administrativo",
            priority: days >= 10 ? "alta" : "media",
          });
        }
        totalCreated++;
      }
    }

    // Rule 8: Projeto em execução sem atividade atualizada há 14+ dias.
    // Pedido vídeo 9: detectar obras paradas/sem registro e jogar
    // "atualizar acompanhamento" na lista de tarefas internas.
    const fourteenDaysAgoISO = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data: runningProjects } = await supabase
      .from("projects")
      .select("id, name, user_id, updated_at, status")
      .in("status", ["mobilizacao", "execucao"]);

    if (runningProjects) {
      for (const p of runningProjects as any[]) {
        const { data: recentActivity } = await supabase
          .from("project_activities")
          .select("id")
          .eq("project_id", p.id)
          .gte("updated_at", fourteenDaysAgoISO)
          .limit(1);
        if (recentActivity && recentActivity.length > 0) continue;

        const { data: recentDiary } = await supabase
          .from("site_diary_entries")
          .select("id")
          .eq("project_id", p.id)
          .gte("entry_date", new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0])
          .limit(1);
        if (recentDiary && recentDiary.length > 0) continue;

        if (await isDuplicate("project_stale", p.id)) continue;
        await supabase.from("notifications").insert({
          user_id: p.user_id,
          type: "project_stale",
          title: "Obra sem registro recente",
          message: `${p.name} — nenhuma atividade ou RDO atualizado nos últimos 14 dias`,
          related_entity_type: "project",
          related_entity_id: p.id,
          related_project_id: p.id,
        });
        const taskTitle = `Atualizar acompanhamento: ${p.name}`;
        if (!(await hasRecentVoiceTask(p.user_id, p.id, taskTitle))) {
          await supabase.from("voice_tasks").insert({
            user_id: p.user_id,
            project_id: p.id,
            title: taskTitle,
            description: "Nenhuma atividade ou RDO registrado nas últimas 2 semanas.",
            category: "cronograma",
            task_type: "obra",
            priority: "media",
          });
        }
        totalCreated++;
      }
    }

    // Rule 9: Contrato assinado há 30+ dias sem NF emitida.
    // Pedido implícito (vídeo 10): emissão de NF é fricção; lembrar.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const { data: signedContracts } = await supabase
      .from("contracts")
      .select("id, title, contract_number, user_id, project_id, signed_at, value")
      .eq("status", "assinado")
      .not("signed_at", "is", null)
      .lte("signed_at", thirtyDaysAgo);

    if (signedContracts) {
      for (const c of signedContracts as any[]) {
        if (!c.project_id) continue;
        const { data: existingNf } = await supabase
          .from("invoices_nf")
          .select("id")
          .eq("project_id", c.project_id)
          .eq("nf_type", "emitida")
          .limit(1);
        if (existingNf && existingNf.length > 0) continue;
        if (await isDuplicate("contract_no_nf", c.id)) continue;

        await supabase.from("notifications").insert({
          user_id: c.user_id,
          type: "contract_no_nf",
          title: "Contrato sem NF emitida",
          message: `${c.contract_number || c.title || "Contrato"} assinado há 30+ dias e nenhuma NF emitida vinculada`,
          related_entity_type: "contract",
          related_entity_id: c.id,
          related_project_id: c.project_id,
        });
        const taskTitle = `Emitir NF do contrato ${c.contract_number || c.title || ""}`.trim();
        if (!(await hasRecentVoiceTask(c.user_id, c.project_id, taskTitle))) {
          await supabase.from("voice_tasks").insert({
            user_id: c.user_id,
            project_id: c.project_id,
            title: taskTitle,
            description: `Contrato assinado em ${c.signed_at?.slice(0, 10)}, valor R$ ${Number(c.value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
            category: "financeiro",
            task_type: "financeiro",
            priority: "alta",
          });
        }
        totalCreated++;
      }
    }

    return new Response(JSON.stringify({ success: true, notifications_created: totalCreated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
