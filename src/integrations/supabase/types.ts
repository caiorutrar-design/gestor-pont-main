export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abonos: {
        Row: {
          colaborador_id: string
          concedido_por: string | null
          created_at: string
          data_abono: string
          id: string
          motivo: string
        }
        Insert: {
          colaborador_id: string
          concedido_por?: string | null
          created_at?: string
          data_abono: string
          id?: string
          motivo: string
        }
        Update: {
          colaborador_id?: string
          concedido_por?: string | null
          created_at?: string
          data_abono?: string
          id?: string
          motivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "abonos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          ativo: boolean
          cargo: string
          created_at: string
          geolocation_obrigatoria: boolean
          id: string
          jornada_entrada_manha: string
          jornada_entrada_tarde: string
          jornada_saida_manha: string
          jornada_saida_tarde: string
          lotacao_id: string | null
          matricula: string
          nome_completo: string
          orgao_id: string
          senha_ponto: string | null
          senha_ponto_hash: string | null
          unidade_trabalho_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          cargo: string
          created_at?: string
          geolocation_obrigatoria?: boolean
          id?: string
          jornada_entrada_manha?: string
          jornada_entrada_tarde?: string
          jornada_saida_manha?: string
          jornada_saida_tarde?: string
          lotacao_id?: string | null
          matricula: string
          nome_completo: string
          orgao_id: string
          senha_ponto?: string | null
          senha_ponto_hash?: string | null
          unidade_trabalho_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          geolocation_obrigatoria?: boolean
          id?: string
          jornada_entrada_manha?: string
          jornada_entrada_tarde?: string
          jornada_saida_manha?: string
          jornada_saida_tarde?: string
          lotacao_id?: string | null
          matricula?: string
          nome_completo?: string
          orgao_id?: string
          senha_ponto?: string | null
          senha_ponto_hash?: string | null
          unidade_trabalho_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_lotacao_id_fkey"
            columns: ["lotacao_id"]
            isOneToOne: false
            referencedRelation: "lotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_orgao_id_fkey"
            columns: ["orgao_id"]
            isOneToOne: false
            referencedRelation: "orgaos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_unidade_trabalho_id_fkey"
            columns: ["unidade_trabalho_id"]
            isOneToOne: false
            referencedRelation: "unidades_trabalho"
            referencedColumns: ["id"]
          },
        ]
      }
      ferias: {
        Row: {
          aprovado_por: string | null
          colaborador_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          observacao: string | null
          tipo: Database["public"]["Enums"]["tipo_ferias"]
        }
        Insert: {
          aprovado_por?: string | null
          colaborador_id: string
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          observacao?: string | null
          tipo?: Database["public"]["Enums"]["tipo_ferias"]
        }
        Update: {
          aprovado_por?: string | null
          colaborador_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          observacao?: string | null
          tipo?: Database["public"]["Enums"]["tipo_ferias"]
        }
        Relationships: [
          {
            foreignKeyName: "ferias_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      frequencias_geradas: {
        Row: {
          ano: number
          assinada_em: string | null
          created_at: string
          folha_assinada_url: string | null
          gerado_em: string
          id: string
          lotacao_id: string | null
          mes: number
          orgao_id: string | null
          quantidade_colaboradores: number
        }
        Insert: {
          ano: number
          assinada_em?: string | null
          created_at?: string
          folha_assinada_url?: string | null
          gerado_em?: string
          id?: string
          lotacao_id?: string | null
          mes: number
          orgao_id?: string | null
          quantidade_colaboradores?: number
        }
        Update: {
          ano?: number
          assinada_em?: string | null
          created_at?: string
          folha_assinada_url?: string | null
          gerado_em?: string
          id?: string
          lotacao_id?: string | null
          mes?: number
          orgao_id?: string | null
          quantidade_colaboradores?: number
        }
        Relationships: [
          {
            foreignKeyName: "frequencias_geradas_lotacao_id_fkey"
            columns: ["lotacao_id"]
            isOneToOne: false
            referencedRelation: "lotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frequencias_geradas_orgao_id_fkey"
            columns: ["orgao_id"]
            isOneToOne: false
            referencedRelation: "orgaos"
            referencedColumns: ["id"]
          },
        ]
      }
      justificativas: {
        Row: {
          anexo_nome: string | null
          anexo_url: string | null
          colaborador_id: string
          created_at: string
          data_falta: string
          descricao: string
          id: string
          registrado_por: string | null
          updated_at: string
        }
        Insert: {
          anexo_nome?: string | null
          anexo_url?: string | null
          colaborador_id: string
          created_at?: string
          data_falta: string
          descricao: string
          id?: string
          registrado_por?: string | null
          updated_at?: string
        }
        Update: {
          anexo_nome?: string | null
          anexo_url?: string | null
          colaborador_id?: string
          created_at?: string
          data_falta?: string
          descricao?: string
          id?: string
          registrado_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "justificativas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      lotacoes: {
        Row: {
          created_at: string
          id: string
          nome: string
          orgao_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          orgao_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          orgao_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotacoes_orgao_id_fkey"
            columns: ["orgao_id"]
            isOneToOne: false
            referencedRelation: "orgaos"
            referencedColumns: ["id"]
          },
        ]
      }
      orgaos: {
        Row: {
          created_at: string
          id: string
          nome: string
          sigla: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          sigla?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          sigla?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome_completo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome_completo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome_completo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registros_ponto: {
        Row: {
          colaborador_id: string
          created_at: string
          data_registro: string
          dentro_raio: boolean | null
          hora_registro: string
          id: string
          latitude: number | null
          longitude: number | null
          timestamp_registro: string
          tipo: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          data_registro?: string
          dentro_raio?: boolean | null
          hora_registro?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          timestamp_registro?: string
          tipo: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          data_registro?: string
          dentro_raio?: boolean | null
          hora_registro?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          timestamp_registro?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_ponto_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades_trabalho: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          latitude: number
          longitude: number
          nome: string
          orgao_id: string
          raio_metros: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          nome: string
          orgao_id: string
          raio_metros?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          nome?: string
          orgao_id?: string
          raio_metros?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_trabalho_orgao_id_fkey"
            columns: ["orgao_id"]
            isOneToOne: false
            referencedRelation: "orgaos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_senha_ponto: {
        Args: { _matricula: string; _senha_ponto: string }
        Returns: {
          id: string
          matricula: string
          nome_completo: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user" | "gestor"
      tipo_ferias: "ferias_anuais" | "ferias_premio" | "licenca" | "recesso"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "user", "gestor"],
      tipo_ferias: ["ferias_anuais", "ferias_premio", "licenca", "recesso"],
    },
  },
} as const
