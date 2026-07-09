import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Check admin role using has_role function
    const { data: isAdmin } = await anonClient.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem criar usuários" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email, password, full_name, role } = await req.json();

    if (!email || !password || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: "email, password, full_name e role são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["admin", "moderator", "user"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Role inválido. Use: admin, moderator ou user" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role to create user
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: newUser, error: createError } =
      await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

    let targetUserId: string | null = newUser?.user?.id ?? null;
    let repaired = false;

    if (createError) {
      // E-mail já cadastrado: em vez de falhar, REPARA o acesso do usuário
      // existente (perfil, role, time). Criações que falhavam no meio
      // deixavam o auth user órfão — sem role/time ele loga e vê tudo
      // vazio, e o retry devolvia só "email já existe", sem saída.
      const emailExists = /already been registered|email_exists|already registered/i.test(createError.message);
      if (!emailExists) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      let existingId: string | null = null;
      for (let page = 1; page <= 10 && !existingId; page++) {
        const { data: list, error: listError } = await serviceClient.auth.admin.listUsers({ page, perPage: 200 });
        if (listError || !list?.users?.length) break;
        existingId = list.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
        if (list.users.length < 200) break;
      }
      if (!existingId) {
        return new Response(
          JSON.stringify({ error: "E-mail já cadastrado, mas não foi possível localizar o usuário para reparar o acesso" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      targetUserId = existingId;
      repaired = true;
      // Garante o perfil (o trigger só roda em INSERT de auth.users)
      await serviceClient
        .from("profiles")
        .upsert({ user_id: targetUserId, full_name }, { onConflict: "user_id" });
    }

    // Assign role (idempotente)
    const { error: roleError } = await serviceClient
      .from("user_roles")
      .upsert({ user_id: targetUserId, role }, { onConflict: "user_id,role", ignoreDuplicates: true });

    if (roleError) {
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign to team
    // 1. Find caller's team_id
    const { data: callerTeam } = await serviceClient
      .from("team_members")
      .select("team_id")
      .eq("user_id", callerId)
      .limit(1)
      .maybeSingle();

    let teamId = callerTeam?.team_id;

    if (!teamId) {
      // First time: generate a team_id for both caller and new user
      teamId = crypto.randomUUID();
      const { error: callerTeamError } = await serviceClient
        .from("team_members")
        .insert({ team_id: teamId, user_id: callerId, role: "admin" });
      if (callerTeamError) {
        return new Response(
          JSON.stringify({ error: `Erro ao criar time: ${callerTeamError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Insert new user into the team (idempotente; sem time o usuário
    // enxerga o sistema vazio — RLS filtra tudo por get_team_user_ids)
    const { error: teamError } = await serviceClient
      .from("team_members")
      .upsert(
        { team_id: teamId, user_id: targetUserId, role: role === "admin" ? "admin" : "member" },
        { onConflict: "team_id,user_id", ignoreDuplicates: true }
      );
    if (teamError) {
      return new Response(
        JSON.stringify({ error: `Usuário criado, mas falhou ao vincular ao time: ${teamError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        user: {
          id: targetUserId,
          email,
          full_name,
          role,
        },
        repaired,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
