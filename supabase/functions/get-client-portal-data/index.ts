import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Token obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from("client_portal_tokens")
      .select("*")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Link inválido ou expirado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check expiration
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Link inválido ou expirado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const projectId = tokenData.project_id;

    // Fetch all data in parallel
    const [projectRes, tasksRes, paymentsRes, invoicesRes, diaryRes] =
      await Promise.all([
        supabase
          .from("projects")
          .select("name, address, city, estimated_budget, ideal_budget, start_date, expected_end_date")
          .eq("id", projectId)
          .single(),
        supabase
          .from("schedule_tasks")
          .select(
            "id, task_name, start_date, end_date, status, discipline, color, progress_percentage, is_client_visible"
          )
          .eq("project_id", projectId)
          .eq("is_client_visible", true)
          .order("start_date", { ascending: true }),
        supabase
          .from("payments")
          .select("id, value, due_date, paid_date, status, description, payment_method")
          .eq("project_id", projectId)
          .order("due_date", { ascending: true }),
        supabase
          .from("invoices")
          .select("id, value, date, store_name, description, invoice_number")
          .eq("project_id", projectId)
          .order("date", { ascending: false }),
        supabase
          .from("site_diary_entries")
          .select("id, entry_date, photos")
          .eq("project_id", projectId)
          .not("photos", "is", null)
          .order("entry_date", { ascending: false })
          .limit(12),
      ]);

    if (projectRes.error) {
      return new Response(
        JSON.stringify({ error: "Projeto não encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract photos from diary entries
    const photos: { url: string; date: string }[] = [];
    (diaryRes.data ?? []).forEach((entry: any) => {
      if (entry.photos && Array.isArray(entry.photos)) {
        entry.photos.forEach((url: string) => {
          photos.push({ url, date: entry.entry_date });
        });
      }
    });

    return new Response(
      JSON.stringify({
        project: projectRes.data,
        tasks: tasksRes.data ?? [],
        payments: paymentsRes.data ?? [],
        invoices: invoicesRes.data ?? [],
        photos: photos.slice(0, 12),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
