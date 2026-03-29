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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !callingUser) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is super_admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas Super Admins podem gerenciar usuários." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // EDIT USER
    if (action === "edit") {
      const { user_id, nome, email, password, role, departamento } = body;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const changes: Record<string, { old: unknown; new: unknown }> = {};

      // Get current data for audit
      const { data: currentProfile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("user_id", user_id)
        .maybeSingle();

      const { data: currentRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user_id)
        .maybeSingle();

      // Update auth user if email or password changed
      const authUpdates: Record<string, string> = {};
      if (email && email !== currentProfile?.email) {
        authUpdates.email = email;
        changes.email = { old: currentProfile?.email, new: email };
      }
      if (password) {
        authUpdates.password = password;
        changes.password = { old: "***", new: "***" };
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(user_id, authUpdates);
        if (updateAuthError) {
          const msg = updateAuthError.message.includes("already been registered")
            ? "Este email já está cadastrado por outro usuário."
            : updateAuthError.message;
          return new Response(JSON.stringify({ error: msg }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Update profile
      const profileUpdates: Record<string, string> = {};
      if (nome && nome !== currentProfile?.nome_completo) {
        profileUpdates.nome_completo = nome;
        changes.nome = { old: currentProfile?.nome_completo, new: nome };
      }
      if (email && email !== currentProfile?.email) {
        profileUpdates.email = email;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await supabaseAdmin.from("profiles").update(profileUpdates).eq("user_id", user_id);
      }

      // Update role - delete old, insert new (avoids duplicate key)
      if (role && role !== currentRole?.role) {
        if (!["admin", "user", "gestor"].includes(role)) {
          return new Response(JSON.stringify({ error: "Papel inválido." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        changes.role = { old: currentRole?.role, new: role };
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
        await supabaseAdmin.from("user_roles").insert({ user_id, role });
      }

      // Audit log
      if (Object.keys(changes).length > 0) {
        await supabaseAdmin.from("audit_logs").insert({
          user_id: callingUser.id,
          user_email: callingUser.email,
          action_type: "user_updated",
          entity_type: "user",
          entity_id: user_id,
          details: { edited_email: email || currentProfile?.email, changes },
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CREATE USER (default action)
    const { email, password, nome, role, departamento } = body;

    if (!email || !password || !nome || !role) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: email, password, nome, role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["admin", "user", "gestor"].includes(role)) {
      return new Response(JSON.stringify({ error: "Papel inválido. Use 'admin', 'user' ou 'gestor'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome_completo: nome, departamento },
    });

    if (createError) {
      const msg = createError.message.includes("already been registered")
        ? "Este email já está cadastrado."
        : createError.message;
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin
      .from("profiles")
      .update({ nome_completo: nome })
      .eq("user_id", newUser.user!.id);

    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user!.id, role });

    await supabaseAdmin.from("audit_logs").insert({
      user_id: callingUser.id,
      user_email: callingUser.email,
      action_type: "user_created",
      entity_type: "user",
      entity_id: newUser.user!.id,
      details: { created_email: email, role, nome, departamento },
    });

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user!.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
