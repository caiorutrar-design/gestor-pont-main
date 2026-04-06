import { supabase } from "@/integrations/supabase/client";

export interface SistemaUser {
  id: string;
  user_id: string;
  email: string | null;
  nome_completo: string | null;
  role: string | null;
  created_at: string;
}

export class UsuarioService {
  /**
   * Lista usuários que possuem papéis administrativos/sistema
   */
  static async getSistemaUsers() {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .is("deleted_at", null);

    if (profileError) throw profileError;

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError) throw rolesError;

    // Filtra apenas perfis que possuem roles definidas (dashboard users)
    return (profiles || [])
      .map((p: any) => {
        const userRole = roles?.find((r) => r.user_id === p.user_id);
        return {
          id: p.id,
          user_id: p.user_id,
          email: p.email,
          nome_completo: p.nome_completo,
          role: userRole?.role || null,
          created_at: p.created_at,
        } as SistemaUser;
      })
      .filter((u) => u.role !== null);
  }

  /**
   * Vincula um colaborador existente a um usuário do sistema (Auth)
   */
  static async linkColaboradorToUser(colaboradorId: string, userId: string) {
    const { error } = await supabase
      .from("colaboradores")
      .update({ user_id: userId })
      .eq("id", colaboradorId);

    if (error) throw error;
    return true;
  }

  /**
   * Chama a Edge Function para excluir um usuário com justificativa
   */
  static async deleteUser(userId: string, justification: string) {
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: { 
        action: "deleteUser", 
        user_id: userId, 
        justification 
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data;
  }
}
