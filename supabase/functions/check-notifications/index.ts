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
