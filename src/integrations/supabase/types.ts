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
      budgets: {
        Row: {
          category: string
          created_at: string
          estimated_value: number | null
          id: string
          is_prioritized: boolean | null
          priority: number | null
          project_id: string
          real_value: number | null
          revision: string | null
          status: Database["public"]["Enums"]["budget_status"] | null
          supplier_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          is_prioritized?: boolean | null
          priority?: number | null
          project_id: string
          real_value?: number | null
          revision?: string | null
          status?: Database["public"]["Enums"]["budget_status"] | null
          supplier_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          is_prioritized?: boolean | null
          priority?: number | null
          project_id?: string
          real_value?: number | null
          revision?: string | null
          status?: Database["public"]["Enums"]["budget_status"] | null
          supplier_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          client_type: Database["public"]["Enums"]["client_type"] | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          observations: string | null
          origin: Database["public"]["Enums"]["client_origin"] | null
          phone: string | null
          phone_secondary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_type?: Database["public"]["Enums"]["client_type"] | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          observations?: string | null
          origin?: Database["public"]["Enums"]["client_origin"] | null
          phone?: string | null
          phone_secondary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_type?: Database["public"]["Enums"]["client_type"] | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          observations?: string | null
          origin?: Database["public"]["Enums"]["client_origin"] | null
          phone?: string | null
          phone_secondary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"] | null
          client_id: string | null
          created_at: string
          file_size: number | null
          file_url: string | null
          id: string
          name: string
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"] | null
          client_id?: string | null
          created_at?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          name: string
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"] | null
          client_id?: string | null
          created_at?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          pix_key: string | null
          project_id: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          supplier_id: string | null
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          pix_key?: string | null
          project_id?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          supplier_id?: string | null
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          pix_key?: string | null
          project_id?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          supplier_id?: string | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          address: string | null
          area_sqm: number | null
          city: string | null
          client_id: string | null
          created_at: string
          estimated_budget: number | null
          expected_end_date: string | null
          finish_level: number | null
          id: string
          name: string
          neighborhood: string | null
          project_type: Database["public"]["Enums"]["client_type"] | null
          real_budget: number | null
          real_end_date: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          area_sqm?: number | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          estimated_budget?: number | null
          expected_end_date?: string | null
          finish_level?: number | null
          id?: string
          name: string
          neighborhood?: string | null
          project_type?: Database["public"]["Enums"]["client_type"] | null
          real_budget?: number | null
          real_end_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          area_sqm?: number | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          estimated_budget?: number | null
          expected_end_date?: string | null
          finish_level?: number | null
          id?: string
          name?: string
          neighborhood?: string | null
          project_type?: Database["public"]["Enums"]["client_type"] | null
          real_budget?: number | null
          real_end_date?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          product_link: string | null
          project_id: string
          status: Database["public"]["Enums"]["purchase_status"] | null
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          product_link?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["purchase_status"] | null
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          product_link?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["purchase_status"] | null
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          calculation_params: Json | null
          cost_per_sqm: number | null
          created_at: string
          id: string
          message_templates: Json | null
          supplier_categories: string[] | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calculation_params?: Json | null
          cost_per_sqm?: number | null
          created_at?: string
          id?: string
          message_templates?: Json | null
          supplier_categories?: string[] | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calculation_params?: Json | null
          cost_per_sqm?: number | null
          created_at?: string
          id?: string
          message_templates?: Json | null
          supplier_categories?: string[] | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_tracking: {
        Row: {
          content: string | null
          created_at: string
          id: string
          media_url: string | null
          project_id: string
          tracking_type: Database["public"]["Enums"]["tracking_type"]
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          project_id: string
          tracking_type: Database["public"]["Enums"]["tracking_type"]
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          project_id?: string
          tracking_type?: Database["public"]["Enums"]["tracking_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          category: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          payment_conditions: string | null
          phone: string | null
          pix_key: string | null
          rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          payment_conditions?: string | null
          phone?: string | null
          pix_key?: string | null
          rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          payment_conditions?: string | null
          phone?: string | null
          pix_key?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      budget_status: "pendente" | "cotado" | "aprovado" | "rejeitado"
      client_origin: "indicacao" | "instagram" | "google" | "site" | "outro"
      client_type: "residencial" | "comercial" | "saude" | "outro"
      document_category:
        | "planta"
        | "contrato"
        | "laudo"
        | "proposta"
        | "relatorio"
        | "orcamento"
      payment_status: "pendente" | "notificado" | "pago" | "atrasado"
      project_status:
        | "proposta_enviada"
        | "contrato_assinado"
        | "levantamento"
        | "briefing"
        | "estudo_preliminar"
        | "revisao"
        | "anteprojeto_3d"
        | "projeto_executivo"
        | "memoria_calculo"
        | "orcamento"
        | "reuniao_prioridades"
        | "mobilizacao_fornecedores"
        | "execucao_obra"
        | "concluido"
      purchase_status: "pendente" | "comprado" | "entregue" | "instalado"
      tracking_type: "checkin" | "voz" | "foto" | "nota"
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
      app_role: ["admin", "moderator", "user"],
      budget_status: ["pendente", "cotado", "aprovado", "rejeitado"],
      client_origin: ["indicacao", "instagram", "google", "site", "outro"],
      client_type: ["residencial", "comercial", "saude", "outro"],
      document_category: [
        "planta",
        "contrato",
        "laudo",
        "proposta",
        "relatorio",
        "orcamento",
      ],
      payment_status: ["pendente", "notificado", "pago", "atrasado"],
      project_status: [
        "proposta_enviada",
        "contrato_assinado",
        "levantamento",
        "briefing",
        "estudo_preliminar",
        "revisao",
        "anteprojeto_3d",
        "projeto_executivo",
        "memoria_calculo",
        "orcamento",
        "reuniao_prioridades",
        "mobilizacao_fornecedores",
        "execucao_obra",
        "concluido",
      ],
      purchase_status: ["pendente", "comprado", "entregue", "instalado"],
      tracking_type: ["checkin", "voz", "foto", "nota"],
    },
  },
} as const
