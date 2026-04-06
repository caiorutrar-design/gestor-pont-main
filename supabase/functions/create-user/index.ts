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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  // Admin client with full privileges
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[Auth] No authorization header found");
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User client to verify calling user's identity and role
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: callingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !callingUser) {
      console.error("[Auth] Failed to get calling user", authError);
      return new Response(JSON.stringify({ error: "Sessão expirada ou inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Verify caller is super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.warn(`[Auth] Acesso negado para usuário ${callingUser.email}. Role: ${roleData?.role}`);
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas Super Admins podem gerenciar usuários." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action = "create" } = body;
    console.log(`[Action] ${action} iniciada por ${callingUser.email}`);

    // ACTION: DELETE USER
    if (action === "deleteUser") {
      const { user_id, justification } = body;
      console.log(`[Delete] Preparando para deletar user_id: ${user_id}`);

      if (!user_id || !justification || justification.length < 20) {
        return new Response(JSON.stringify({ error: "ID e justificativa mínima de 20 caracteres são obrigatórios." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Snapshot for audit
      const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("user_id", user_id).maybeSingle();
      const { data: role } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user_id).maybeSingle();

      console.log("[Delete] Executando soft-delete no profile...");
      await supabaseAdmin
        .from("profiles")
        .update({ deleted_at: new Date().toISOString(), deleted_by: callingUser.id })
        .eq("user_id", user_id);

      console.log("[Delete] Inserindo log de auditoria...");
      await supabaseAdmin.from("audit_logs").insert({
        user_id: callingUser.id,
        user_email: callingUser.email,
        action_type: "user_deleted",
        entity_type: "user",
        entity_id: user_id,
        details: { 
          deleted_email: profile?.email, 
          justification, 
          old_values: { profile, role: role?.role } 
        }
      });

      console.log("[Delete] Removendo do Auth...");
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (deleteAuthError) throw deleteAuthError;

      return new Response(JSON.stringify({ success: true }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // ACTION: EDIT USER
    if (action === "edit") {
      const { user_id, nome, email, password, role } = body;
      console.log(`[Edit] Atualizando usuário: ${user_id}`);

      const updates: any = {};
      if (email) updates.email = email;
      if (password) updates.password = password;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, updates);
        if (error) throw error;
      }

      if (nome) {
        await supabaseAdmin.from("profiles").update({ nome_completo: nome }).eq("user_id", user_id);
      }

      if (role) {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
        await supabaseAdmin.from("user_roles").insert({ user_id, role });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ACTION: CREATE USER (Default)
    const { email, password, nome, role, departamento } = body;
    console.log(`[Create] Criando novo usuário: ${email}`);

    if (!email || !password || !nome || !role) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check Feature Flag
    const { data: flagData } = await supabaseAdmin
      .from("feature_flags")
      .select("enabled")
      .eq("key", "separate_user_colaborador")
      .maybeSingle();
    const isSeparateActive = flagData?.enabled ?? false;
    console.log(`[Flag] separate_user_colaborador: ${isSeparateActive}`);

    // Create Auth User
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome_completo: nome, departamento },
    });

    if (createError) {
      console.error("[Create] Auth error:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user!.id;
    console.log(`[Create] Auth ID gerado: ${userId}`);

    // Trigger might have already created profile, so we use UPDATE + retry handle
    console.log("[Create] Tentando atualizar profile (ignorar falhas, tabela secundária)...");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ nome_completo: nome, email: email })
      .eq("user_id", userId);
    
    if (profileError) console.error("[Create] Profile update warning:", profileError);

    console.log("[Create] Associando papel (user_roles fallback)...");
    const { error: insertRoleInfo } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
    if (insertRoleInfo) console.error("[Create] Falha ao inserir em user_roles (pode já ter sido criado por trigger):", insertRoleInfo);

    // INTEGRAÇÃO COM TABELA PRINCIPAL: COLABORADORES
    if (!isSeparateActive) {
      console.log("[Create] Criando registro na tabela principal: colaboradores...");
      
      const { data: firstOrgao } = await supabaseAdmin.from("orgaos").select("id").limit(1).maybeSingle();
      
      if (!firstOrgao?.id) {
         console.warn("[Create] ALERTA: Nenhum órgão encontrado. Registro na tabela 'colaboradores' será ignorado para evitar erro NOT NULL.");
      } else {
         const { error: colabError } = await supabaseAdmin.from("colaboradores").insert({
            user_id: userId,
            nome_completo: nome,
            matricula: email.split("@")[0], // Fallback para matricula
            cargo: role === 'gestor' ? 'Gestor' : (role === 'admin' || role === 'super_admin' ? 'Administrador' : 'Colaborador'),
            orgao_id: firstOrgao.id
         });

         if (colabError) {
             console.error("[Create] Erro ao inserir colaborador: ", colabError);
             return new Response(JSON.stringify({ error: "Usuário criado na Autenticação, mas falha ao inserir na tabela 'colaboradores'. " + colabError.message }), {
                 status: 400,
                 headers: { ...corsHeaders, "Content-Type": "application/json" }
             });
         }
      }
    }

    // Audit Log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: callingUser.id,
      user_email: callingUser.email,
      action_type: "user_created",
      entity_type: "user",
      entity_id: userId,
      details: { email, role, separate_active: isSeparateActive }
    });

    console.log(`[Success] Usuário ${email} criado com sucesso.`);
    return new Response(JSON.stringify({ success: true, userId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("[Critical] Internal Server Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor", details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
