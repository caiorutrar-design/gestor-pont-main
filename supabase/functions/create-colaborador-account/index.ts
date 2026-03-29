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
      console.error("[create-colaborador-account] No Authorization header");
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !callingUser) {
      console.error("[create-colaborador-account] Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[create-colaborador-account] Caller:", callingUser.email, callingUser.id);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin or super_admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();

    if (!roleData) {
      console.error("[create-colaborador-account] Caller has no admin/super_admin role");
      return new Response(JSON.stringify({ error: "Acesso negado." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { colaborador_id, password } = await req.json();

    if (!colaborador_id || !password) {
      return new Response(JSON.stringify({ error: "colaborador_id e password são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 8 caracteres." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get colaborador data
    const { data: colaborador, error: colabError } = await supabaseAdmin
      .from("colaboradores")
      .select("id, matricula, nome_completo, user_id")
      .eq("id", colaborador_id)
      .single();

    if (colabError || !colaborador) {
      console.error("[create-colaborador-account] Colaborador not found:", colabError?.message);
      return new Response(JSON.stringify({ error: "Colaborador não encontrado." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[create-colaborador-account] Colaborador:", colaborador.matricula, colaborador.nome_completo, "existing user_id:", colaborador.user_id);

    // If already has account, just reset password
    if (colaborador.user_id) {
      console.log("[create-colaborador-account] Resetting password for existing user:", colaborador.user_id);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        colaborador.user_id,
        { password }
      );

      if (updateError) {
        console.error("[create-colaborador-account] Password reset error:", updateError.message);
        return new Response(JSON.stringify({ error: "Erro ao atualizar senha: " + updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Audit log
      await supabaseAdmin.from("audit_logs").insert({
        user_id: callingUser.id,
        user_email: callingUser.email,
        action_type: "colaborador_password_reset",
        entity_type: "colaborador",
        entity_id: colaborador_id,
        details: { matricula: colaborador.matricula, nome: colaborador.nome_completo },
      });

      console.log("[create-colaborador-account] Password reset successful");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Senha atualizada com sucesso.",
          login: colaborador.matricula,
          is_reset: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new auth account using matricula as email
    const email = `${colaborador.matricula}@ponto.interno`;
    console.log("[create-colaborador-account] Creating auth user with email:", email);

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome_completo: colaborador.nome_completo, is_colaborador: true },
    });

    if (createError) {
      console.error("[create-colaborador-account] Auth user creation error:", createError.message);
      return new Response(JSON.stringify({ error: "Erro ao criar conta: " + createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user!.id;
    console.log("[create-colaborador-account] Auth user created:", userId);

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ nome_completo: colaborador.nome_completo, email })
      .eq("user_id", userId);
    
    if (profileError) {
      console.error("[create-colaborador-account] Profile update error:", profileError.message);
    } else {
      console.log("[create-colaborador-account] Profile updated");
    }

    // Set role as 'user'
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "user" });
    if (roleError) {
      console.error("[create-colaborador-account] Role insert error:", roleError.message);
    } else {
      console.log("[create-colaborador-account] Role 'user' assigned");
    }

    // Link colaborador to auth user
    const { error: linkError } = await supabaseAdmin
      .from("colaboradores")
      .update({ user_id: userId })
      .eq("id", colaborador_id);
    
    if (linkError) {
      console.error("[create-colaborador-account] Colaborador link error:", linkError.message);
    } else {
      console.log("[create-colaborador-account] Colaborador linked to auth user");
    }

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: callingUser.id,
      user_email: callingUser.email,
      action_type: "colaborador_account_created",
      entity_type: "colaborador",
      entity_id: colaborador_id,
      details: { matricula: colaborador.matricula, nome: colaborador.nome_completo, auth_user_id: userId },
    });

    console.log("[create-colaborador-account] Account creation complete for", colaborador.matricula);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conta criada com sucesso.",
        login: colaborador.matricula,
        is_reset: false,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[create-colaborador-account] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
