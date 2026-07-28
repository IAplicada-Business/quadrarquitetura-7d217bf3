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
      activity_template_items: {
        Row: {
          ambiente: string | null
          area_m2: number | null
          created_at: string
          depends_on_positions: number[] | null
          description: string | null
          discipline: string | null
          duration_days: number | null
          id: string
          name: string
          position: number
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ambiente?: string | null
          area_m2?: number | null
          created_at?: string
          depends_on_positions?: number[] | null
          description?: string | null
          discipline?: string | null
          duration_days?: number | null
          id?: string
          name: string
          position?: number
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ambiente?: string | null
          area_m2?: number | null
          created_at?: string
          depends_on_positions?: number[] | null
          description?: string | null
          discipline?: string | null
          duration_days?: number | null
          id?: string
          name?: string
          position?: number
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "activity_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          project_type: Database["public"]["Enums"]["client_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_type?: Database["public"]["Enums"]["client_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_type?: Database["public"]["Enums"]["client_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_quote_items: {
        Row: {
          budget_quote_id: string
          created_at: string
          description: string
          id: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          budget_quote_id: string
          created_at?: string
          description: string
          id?: string
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          budget_quote_id?: string
          created_at?: string
          description?: string
          id?: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_budget_quote_items_quote"
            columns: ["budget_quote_id"]
            isOneToOne: false
            referencedRelation: "budget_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_quotes: {
        Row: {
          created_at: string
          delivery_time: string | null
          id: string
          is_current_revision: boolean | null
          material_estimate: number | null
          payment_terms: string | null
          project_id: string
          revision: string | null
          revision_number: number | null
          scope_item_id: string | null
          services_description: string | null
          status: Database["public"]["Enums"]["budget_status"] | null
          supplier_id: string | null
          supplier_name: string | null
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          delivery_time?: string | null
          id?: string
          is_current_revision?: boolean | null
          material_estimate?: number | null
          payment_terms?: string | null
          project_id: string
          revision?: string | null
          revision_number?: number | null
          scope_item_id?: string | null
          services_description?: string | null
          status?: Database["public"]["Enums"]["budget_status"] | null
          supplier_id?: string | null
          supplier_name?: string | null
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          delivery_time?: string | null
          id?: string
          is_current_revision?: boolean | null
          material_estimate?: number | null
          payment_terms?: string | null
          project_id?: string
          revision?: string | null
          revision_number?: number | null
          scope_item_id?: string | null
          services_description?: string | null
          status?: Database["public"]["Enums"]["budget_status"] | null
          supplier_id?: string | null
          supplier_name?: string | null
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_budget_quotes_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_budget_quotes_scope_item"
            columns: ["scope_item_id"]
            isOneToOne: false
            referencedRelation: "scope_items"
            referencedColumns: ["id"]
          },
        ]
      }
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
            foreignKeyName: "budgets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_budgets_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      calculation_parameters: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          parameter_key: string
          parameter_value: Json
          unit: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          parameter_key: string
          parameter_value?: Json
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          parameter_key?: string
          parameter_value?: Json
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      calculation_rules: {
        Row: {
          created_at: string
          discipline: string
          formula: string
          id: string
          is_active: boolean
          notes: string | null
          result_name: string
          unit: string
          updated_at: string
          user_id: string
          variable_name: string
        }
        Insert: {
          created_at?: string
          discipline: string
          formula: string
          id?: string
          is_active?: boolean
          notes?: string | null
          result_name: string
          unit: string
          updated_at?: string
          user_id: string
          variable_name: string
        }
        Update: {
          created_at?: string
          discipline?: string
          formula?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          result_name?: string
          unit?: string
          updated_at?: string
          user_id?: string
          variable_name?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          project_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          project_id?: string | null
          role?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          project_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_pending_responses: {
        Row: {
          client_name: string | null
          created_at: string | null
          id: string
          pending_item: string
          project_id: string
          responded_at: string | null
          response_text: string | null
          status: string | null
          weekly_report_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string | null
          id?: string
          pending_item: string
          project_id: string
          responded_at?: string | null
          response_text?: string | null
          status?: string | null
          weekly_report_id: string
        }
        Update: {
          client_name?: string | null
          created_at?: string | null
          id?: string
          pending_item?: string
          project_id?: string
          responded_at?: string | null
          response_text?: string | null
          status?: string | null
          weekly_report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_pending_responses_weekly_report_id_fkey"
            columns: ["weekly_report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          project_id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          project_id: string
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          project_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          client_type: Database["public"]["Enums"]["client_type"] | null
          converted_at: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          observations: string | null
          origin: Database["public"]["Enums"]["client_origin"] | null
          phone: string | null
          phone_secondary: string | null
          source_lead_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          client_type?: Database["public"]["Enums"]["client_type"] | null
          converted_at?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          observations?: string | null
          origin?: Database["public"]["Enums"]["client_origin"] | null
          phone?: string | null
          phone_secondary?: string | null
          source_lead_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          client_type?: Database["public"]["Enums"]["client_type"] | null
          converted_at?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          observations?: string | null
          origin?: Database["public"]["Enums"]["client_origin"] | null
          phone?: string | null
          phone_secondary?: string | null
          source_lead_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_source_lead_id_fkey"
            columns: ["source_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          created_at: string | null
          hashtags: string[] | null
          hook: string | null
          id: string
          notes: string | null
          objective: string | null
          platform: string | null
          scheduled_date: string | null
          script: string | null
          series_id: string | null
          status: string | null
          target_audience: string | null
          title: string
          tone: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          notes?: string | null
          objective?: string | null
          platform?: string | null
          scheduled_date?: string | null
          script?: string | null
          series_id?: string | null
          status?: string | null
          target_audience?: string | null
          title: string
          tone?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          notes?: string | null
          objective?: string | null
          platform?: string | null
          scheduled_date?: string | null
          script?: string | null
          series_id?: string | null
          status?: string | null
          target_audience?: string | null
          title?: string
          tone?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "content_series"
            referencedColumns: ["id"]
          },
        ]
      }
      content_series: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          clause_confidentiality: string | null
          clause_duration: string | null
          clause_general: string | null
          clause_object: string | null
          clause_obligations_client: string | null
          clause_obligations_contractor: string | null
          clause_scope: string | null
          clause_termination: string | null
          clause_value: string | null
          contract_type: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clause_confidentiality?: string | null
          clause_duration?: string | null
          clause_general?: string | null
          clause_object?: string | null
          clause_obligations_client?: string | null
          clause_obligations_contractor?: string | null
          clause_scope?: string | null
          clause_termination?: string | null
          clause_value?: string | null
          contract_type?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clause_confidentiality?: string | null
          clause_duration?: string | null
          clause_general?: string | null
          clause_object?: string | null
          clause_obligations_client?: string | null
          clause_obligations_contractor?: string | null
          clause_scope?: string | null
          clause_termination?: string | null
          clause_value?: string | null
          contract_type?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          address: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          city: string | null
          clauses: string | null
          client_address: string | null
          client_cpf_cnpj: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          construction_neighborhood: string | null
          contract_number: string | null
          created_at: string
          created_by: string | null
          custom_clauses: string | null
          environments: string | null
          estimated_duration: string | null
          id: string
          lead_id: string | null
          notes: string | null
          payment_conditions: string | null
          payment_method: string | null
          project_id: string | null
          proposal_id: string
          sent_at: string | null
          service_description: string | null
          signed_at: string | null
          start_date: string | null
          status: string
          template_id: string | null
          template_name: string | null
          title: string | null
          total_area: number | null
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          address?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          city?: string | null
          clauses?: string | null
          client_address?: string | null
          client_cpf_cnpj?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          construction_neighborhood?: string | null
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          custom_clauses?: string | null
          environments?: string | null
          estimated_duration?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_conditions?: string | null
          payment_method?: string | null
          project_id?: string | null
          proposal_id: string
          sent_at?: string | null
          service_description?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          template_id?: string | null
          template_name?: string | null
          title?: string | null
          total_area?: number | null
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          address?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          city?: string | null
          clauses?: string | null
          client_address?: string | null
          client_cpf_cnpj?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          construction_neighborhood?: string | null
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          custom_clauses?: string | null
          environments?: string | null
          estimated_duration?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_conditions?: string | null
          payment_method?: string | null
          project_id?: string | null
          proposal_id?: string
          sent_at?: string | null
          service_description?: string | null
          signed_at?: string | null
          start_date?: string | null
          status?: string
          template_id?: string | null
          template_name?: string | null
          title?: string | null
          total_area?: number | null
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      default_disciplines: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      discipline_material_estimates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          project_id: string
          revision_number: number | null
          scope_item_id: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          revision_number?: number | null
          scope_item_id: string
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          revision_number?: number | null
          scope_item_id?: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_material_estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_material_estimates_scope_item_id_fkey"
            columns: ["scope_item_id"]
            isOneToOne: false
            referencedRelation: "scope_items"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_priorities: {
        Row: {
          created_at: string
          id: string
          is_prioritized: boolean | null
          priority: number | null
          project_id: string
          revision_number: number | null
          scope_item_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_prioritized?: boolean | null
          priority?: number | null
          project_id: string
          revision_number?: number | null
          scope_item_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_prioritized?: boolean | null
          priority?: number | null
          project_id?: string
          revision_number?: number | null
          scope_item_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_discipline_priorities_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_discipline_priorities_scope_item"
            columns: ["scope_item_id"]
            isOneToOne: false
            referencedRelation: "scope_items"
            referencedColumns: ["id"]
          },
        ]
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
          notes: string | null
          project_id: string | null
          updated_at: string
          uploaded_by: string | null
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
          notes?: string | null
          project_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
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
          notes?: string | null
          project_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
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
            foreignKeyName: "fk_documents_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          category: string | null
          created_at: string
          date: string | null
          description: string | null
          file_url: string | null
          id: string
          invoice_number: string | null
          project_id: string
          receipt_image_url: string | null
          store_name: string | null
          type: string | null
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          invoice_number?: string | null
          project_id: string
          receipt_image_url?: string | null
          store_name?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          invoice_number?: string | null
          project_id?: string
          receipt_image_url?: string | null
          store_name?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices_nf: {
        Row: {
          amount: number
          competence_month: string | null
          created_at: string | null
          file_url: string | null
          id: string
          issue_date: string
          issuer_cnpj: string | null
          issuer_name: string | null
          nf_number: string | null
          nf_type: string | null
          notes: string | null
          project_id: string | null
          recipient_address_city: string | null
          recipient_address_complement: string | null
          recipient_address_neighborhood: string | null
          recipient_address_number: string | null
          recipient_address_state: string | null
          recipient_address_street: string | null
          recipient_address_zip: string | null
          recipient_cnpj: string | null
          recipient_name: string | null
          sent_to_accountant_at: string | null
          service_code: string | null
          service_description: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          competence_month?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          issue_date: string
          issuer_cnpj?: string | null
          issuer_name?: string | null
          nf_number?: string | null
          nf_type?: string | null
          notes?: string | null
          project_id?: string | null
          recipient_address_city?: string | null
          recipient_address_complement?: string | null
          recipient_address_neighborhood?: string | null
          recipient_address_number?: string | null
          recipient_address_state?: string | null
          recipient_address_street?: string | null
          recipient_address_zip?: string | null
          recipient_cnpj?: string | null
          recipient_name?: string | null
          sent_to_accountant_at?: string | null
          service_code?: string | null
          service_description?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          competence_month?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string
          issuer_cnpj?: string | null
          issuer_name?: string | null
          nf_number?: string | null
          nf_type?: string | null
          notes?: string | null
          project_id?: string | null
          recipient_address_city?: string | null
          recipient_address_complement?: string | null
          recipient_address_neighborhood?: string | null
          recipient_address_number?: string | null
          recipient_address_state?: string | null
          recipient_address_street?: string | null
          recipient_address_zip?: string | null
          recipient_cnpj?: string | null
          recipient_name?: string | null
          sent_to_accountant_at?: string | null
          service_code?: string | null
          service_description?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_nf_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      labor_costs: {
        Row: {
          activity_type: string | null
          cost_per_m2: number | null
          cost_per_unit: number | null
          discipline: string
          id: string
          notes: string | null
          region: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          activity_type?: string | null
          cost_per_m2?: number | null
          cost_per_unit?: number | null
          discipline: string
          id?: string
          notes?: string | null
          region?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_type?: string | null
          cost_per_m2?: number | null
          cost_per_unit?: number | null
          discipline?: string
          id?: string
          notes?: string | null
          region?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_form_submissions: {
        Row: {
          created_at: string
          email: string | null
          generated_lead_id: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          processed: boolean | null
          project_type: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          generated_lead_id?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          processed?: boolean | null
          project_type?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          generated_lead_id?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          processed?: boolean | null
          project_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_form_submissions_generated_lead_id_fkey"
            columns: ["generated_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          construction_type: string | null
          converted_at: string | null
          converted_client_id: string | null
          created_at: string
          email: string | null
          id: string
          lost_reason: string | null
          meeting_date: string | null
          message: string | null
          name: string
          notes: string | null
          origin: Database["public"]["Enums"]["client_origin"]
          phone: string
          phone_secondary: string | null
          project_type: Database["public"]["Enums"]["client_type"]
          responsible: string | null
          source_detail: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          construction_type?: string | null
          converted_at?: string | null
          converted_client_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lost_reason?: string | null
          meeting_date?: string | null
          message?: string | null
          name: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["client_origin"]
          phone: string
          phone_secondary?: string | null
          project_type?: Database["public"]["Enums"]["client_type"]
          responsible?: string | null
          source_detail?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          construction_type?: string | null
          converted_at?: string | null
          converted_client_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lost_reason?: string | null
          meeting_date?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["client_origin"]
          phone?: string
          phone_secondary?: string | null
          project_type?: Database["public"]["Enums"]["client_type"]
          responsible?: string | null
          source_detail?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      material_calculations: {
        Row: {
          category: string
          created_at: string
          id: string
          item_name: string
          linked_purchase_id: string | null
          notes: string | null
          parameters: Json | null
          project_id: string
          quantity: number | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          item_name: string
          linked_purchase_id?: string | null
          notes?: string | null
          parameters?: Json | null
          project_id: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          item_name?: string
          linked_purchase_id?: string | null
          notes?: string | null
          parameters?: Json | null
          project_id?: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_material_calculations_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_calculations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      material_indices: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          index_per_m2: number
          material_name: string
          notes: string | null
          unit: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          index_per_m2: number
          material_name: string
          notes?: string | null
          unit: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          index_per_m2?: number
          material_name?: string
          notes?: string | null
          unit?: string
        }
        Relationships: []
      }
      material_tracking: {
        Row: {
          activity_id: string | null
          adjusted_quantity: number | null
          budget_quote_id: string | null
          calculated_quantity: number | null
          created_at: string
          delivery_date: string | null
          discipline: string | null
          id: string
          is_active: boolean
          material_name: string
          notes: string | null
          product_link: string | null
          project_id: string
          purchase_date: string | null
          quantity_delivered: number | null
          quantity_needed: number | null
          quantity_purchased: number | null
          quantity_used: number | null
          source: string | null
          supplier_name: string | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          adjusted_quantity?: number | null
          budget_quote_id?: string | null
          calculated_quantity?: number | null
          created_at?: string
          delivery_date?: string | null
          discipline?: string | null
          id?: string
          is_active?: boolean
          material_name: string
          notes?: string | null
          product_link?: string | null
          project_id: string
          purchase_date?: string | null
          quantity_delivered?: number | null
          quantity_needed?: number | null
          quantity_purchased?: number | null
          quantity_used?: number | null
          source?: string | null
          supplier_name?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          adjusted_quantity?: number | null
          budget_quote_id?: string | null
          calculated_quantity?: number | null
          created_at?: string
          delivery_date?: string | null
          discipline?: string | null
          id?: string
          is_active?: boolean
          material_name?: string
          notes?: string | null
          product_link?: string | null
          project_id?: string
          purchase_date?: string | null
          quantity_delivered?: number | null
          quantity_needed?: number | null
          quantity_purchased?: number | null
          quantity_used?: number | null
          source?: string | null
          supplier_name?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_material_tracking_budget_quote"
            columns: ["budget_quote_id"]
            isOneToOne: false
            referencedRelation: "budget_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_material_tracking_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_tracking_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "project_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string | null
          id: string
          name: string
          type: string | null
          user_id: string
          variables: string[] | null
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
          user_id: string
          variables?: string[] | null
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
          user_id?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          related_project_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          related_project_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          related_project_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          budget_quote_id: string | null
          client_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          installment_number: number | null
          paid_date: string | null
          parent_payment_id: string | null
          payment_method: string | null
          payment_type: string
          pix_key: string | null
          project_id: string | null
          receipt_url: string | null
          source: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          supplier_id: string | null
          supplier_name: string | null
          total_installments: number | null
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          budget_quote_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          installment_number?: number | null
          paid_date?: string | null
          parent_payment_id?: string | null
          payment_method?: string | null
          payment_type?: string
          pix_key?: string | null
          project_id?: string | null
          receipt_url?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          supplier_id?: string | null
          supplier_name?: string | null
          total_installments?: number | null
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          budget_quote_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          installment_number?: number | null
          paid_date?: string | null
          parent_payment_id?: string | null
          payment_method?: string | null
          payment_type?: string
          pix_key?: string | null
          project_id?: string | null
          receipt_url?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          supplier_id?: string | null
          supplier_name?: string | null
          total_installments?: number | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_budget_quote_id_fkey"
            columns: ["budget_quote_id"]
            isOneToOne: false
            referencedRelation: "budget_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_parent_payment_id_fkey"
            columns: ["parent_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
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
      pending_items: {
        Row: {
          conclusion_date: string | null
          created_at: string
          description: string
          discipline: string | null
          id: string
          inclusion_date: string | null
          project_id: string
          responsible: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conclusion_date?: string | null
          created_at?: string
          description: string
          discipline?: string | null
          id?: string
          inclusion_date?: string | null
          project_id: string
          responsible?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conclusion_date?: string | null
          created_at?: string
          description?: string
          discipline?: string | null
          id?: string
          inclusion_date?: string | null
          project_id?: string
          responsible?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pending_items_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_analyses: {
        Row: {
          ai_result: Json | null
          created_at: string
          file_url: string
          focus: string
          id: string
          instructions: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          ai_result?: Json | null
          created_at?: string
          file_url: string
          focus: string
          id?: string
          instructions?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          ai_result?: Json | null
          created_at?: string
          file_url?: string
          focus?: string
          id?: string
          instructions?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_analyses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      price_research: {
        Row: {
          activity_id: string
          id: string
          material_name: string
          price_avg: number | null
          price_max: number | null
          price_min: number | null
          project_id: string
          searched_at: string | null
          suppliers: Json | null
          unit: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          id?: string
          material_name: string
          price_avg?: number | null
          price_max?: number | null
          price_min?: number | null
          project_id: string
          searched_at?: string | null
          suppliers?: Json | null
          unit?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string
          id?: string
          material_name?: string
          price_avg?: number | null
          price_max?: number | null
          price_min?: number | null
          project_id?: string
          searched_at?: string | null
          suppliers?: Json | null
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_research_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "project_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_research_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      project_activities: {
        Row: {
          area_m2: number | null
          created_at: string | null
          depends_on: string[] | null
          description: string | null
          discipline: string | null
          duration_days: number | null
          end_date: string | null
          id: string
          medicao_date: string | null
          name: string
          position: number | null
          progress_percent: number | null
          project_id: string
          start_date: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          area_m2?: number | null
          created_at?: string | null
          depends_on?: string[] | null
          description?: string | null
          discipline?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          medicao_date?: string | null
          name: string
          position?: number | null
          progress_percent?: number | null
          project_id: string
          start_date?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          area_m2?: number | null
          created_at?: string | null
          depends_on?: string[] | null
          description?: string | null
          discipline?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          medicao_date?: string | null
          name?: string
          position?: number | null
          progress_percent?: number | null
          project_id?: string
          start_date?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_rooms: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          approved_scenario_id: string | null
          area_sqm: number | null
          city: string | null
          client_budget: number | null
          client_id: string | null
          construction_type_estimate: string | null
          contingency_percentage: number | null
          contract_id: string | null
          cotacao_aprovada: boolean | null
          cotacao_aprovada_at: string | null
          cotacao_importada: boolean | null
          cotacao_valor_total: number | null
          created_at: string
          estimated_budget: number | null
          expected_end_date: string | null
          finish_level: number | null
          id: string
          ideal_budget: number | null
          name: string
          neighborhood: string | null
          notes: string | null
          onboarding_dismissed: boolean | null
          project_number: string | null
          project_type: Database["public"]["Enums"]["client_type"] | null
          real_budget: number | null
          real_end_date: string | null
          real_start_date: string | null
          source_proposal_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          sub_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          approved_scenario_id?: string | null
          area_sqm?: number | null
          city?: string | null
          client_budget?: number | null
          client_id?: string | null
          construction_type_estimate?: string | null
          contingency_percentage?: number | null
          contract_id?: string | null
          cotacao_aprovada?: boolean | null
          cotacao_aprovada_at?: string | null
          cotacao_importada?: boolean | null
          cotacao_valor_total?: number | null
          created_at?: string
          estimated_budget?: number | null
          expected_end_date?: string | null
          finish_level?: number | null
          id?: string
          ideal_budget?: number | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          onboarding_dismissed?: boolean | null
          project_number?: string | null
          project_type?: Database["public"]["Enums"]["client_type"] | null
          real_budget?: number | null
          real_end_date?: string | null
          real_start_date?: string | null
          source_proposal_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          sub_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          approved_scenario_id?: string | null
          area_sqm?: number | null
          city?: string | null
          client_budget?: number | null
          client_id?: string | null
          construction_type_estimate?: string | null
          contingency_percentage?: number | null
          contract_id?: string | null
          cotacao_aprovada?: boolean | null
          cotacao_aprovada_at?: string | null
          cotacao_importada?: boolean | null
          cotacao_valor_total?: number | null
          created_at?: string
          estimated_budget?: number | null
          expected_end_date?: string | null
          finish_level?: number | null
          id?: string
          ideal_budget?: number | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          onboarding_dismissed?: boolean | null
          project_number?: string | null
          project_type?: Database["public"]["Enums"]["client_type"] | null
          real_budget?: number | null
          real_end_date?: string | null
          real_start_date?: string | null
          source_proposal_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          sub_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_approved_scenario_id_fkey"
            columns: ["approved_scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_source_proposal_id_fkey"
            columns: ["source_proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_assets: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number | null
          file_url: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          project_category: string | null
          project_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          project_category?: string | null
          project_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          project_category?: string | null
          project_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposal_templates: {
        Row: {
          created_at: string
          differentials: string | null
          display_order: number | null
          footer: string | null
          id: string
          introduction: string | null
          is_active: boolean | null
          methodology: string | null
          name: string
          template_type: string | null
          terms: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          differentials?: string | null
          display_order?: number | null
          footer?: string | null
          id?: string
          introduction?: string | null
          is_active?: boolean | null
          methodology?: string | null
          name: string
          template_type?: string | null
          terms?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          differentials?: string | null
          display_order?: number | null
          footer?: string | null
          id?: string
          introduction?: string | null
          is_active?: boolean | null
          methodology?: string | null
          name?: string
          template_type?: string | null
          terms?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          ambientes: Json | null
          approved_at: string | null
          client_id: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          custom_services: string | null
          deadline: string | null
          discount_percent: number | null
          discount_value: number | null
          estimated_area: number | null
          estimated_duration: string | null
          etapas_ativas: Json | null
          feedback_items: Json | null
          final_value: number | null
          id: string
          includes_3d_visualization: boolean | null
          includes_architectural_project: boolean | null
          includes_construction_management: boolean | null
          includes_interior_design: boolean | null
          installment_entry: number | null
          installment_value: number | null
          installments_count: number | null
          lead_id: string
          notes: string | null
          payment_conditions: string | null
          payment_method: string | null
          pdf_url: string | null
          portfolio_projects: Json | null
          price_full: number | null
          price_note: string | null
          project_description: string | null
          project_name: string | null
          project_type: string | null
          proposal_number: string | null
          rejected_at: string | null
          rejection_reason: string | null
          scope_description: string | null
          sent_at: string | null
          services_included: string | null
          status: string
          template_id: string | null
          template_name: string | null
          timeline_anteprojeto: number | null
          timeline_briefing: number | null
          timeline_budget: number | null
          timeline_construction: number | null
          timeline_fiscalization: number | null
          timeline_mobilization: number | null
          timeline_priorities: number | null
          timeline_study: number | null
          title: string | null
          total_area: number | null
          updated_at: string
          user_id: string
          valid_until: string | null
          value: number | null
        }
        Insert: {
          ambientes?: Json | null
          approved_at?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          custom_services?: string | null
          deadline?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          estimated_area?: number | null
          estimated_duration?: string | null
          etapas_ativas?: Json | null
          feedback_items?: Json | null
          final_value?: number | null
          id?: string
          includes_3d_visualization?: boolean | null
          includes_architectural_project?: boolean | null
          includes_construction_management?: boolean | null
          includes_interior_design?: boolean | null
          installment_entry?: number | null
          installment_value?: number | null
          installments_count?: number | null
          lead_id: string
          notes?: string | null
          payment_conditions?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          portfolio_projects?: Json | null
          price_full?: number | null
          price_note?: string | null
          project_description?: string | null
          project_name?: string | null
          project_type?: string | null
          proposal_number?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          scope_description?: string | null
          sent_at?: string | null
          services_included?: string | null
          status?: string
          template_id?: string | null
          template_name?: string | null
          timeline_anteprojeto?: number | null
          timeline_briefing?: number | null
          timeline_budget?: number | null
          timeline_construction?: number | null
          timeline_fiscalization?: number | null
          timeline_mobilization?: number | null
          timeline_priorities?: number | null
          timeline_study?: number | null
          title?: string | null
          total_area?: number | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
          value?: number | null
        }
        Update: {
          ambientes?: Json | null
          approved_at?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          custom_services?: string | null
          deadline?: string | null
          discount_percent?: number | null
          discount_value?: number | null
          estimated_area?: number | null
          estimated_duration?: string | null
          etapas_ativas?: Json | null
          feedback_items?: Json | null
          final_value?: number | null
          id?: string
          includes_3d_visualization?: boolean | null
          includes_architectural_project?: boolean | null
          includes_construction_management?: boolean | null
          includes_interior_design?: boolean | null
          installment_entry?: number | null
          installment_value?: number | null
          installments_count?: number | null
          lead_id?: string
          notes?: string | null
          payment_conditions?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          portfolio_projects?: Json | null
          price_full?: number | null
          price_note?: string | null
          project_description?: string | null
          project_name?: string | null
          project_type?: string | null
          proposal_number?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          scope_description?: string | null
          sent_at?: string | null
          services_included?: string | null
          status?: string
          template_id?: string | null
          template_name?: string | null
          timeline_anteprojeto?: number | null
          timeline_briefing?: number | null
          timeline_budget?: number | null
          timeline_construction?: number | null
          timeline_fiscalization?: number | null
          timeline_mobilization?: number | null
          timeline_priorities?: number | null
          timeline_study?: number | null
          title?: string | null
          total_area?: number | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "proposal_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          area_m2: number | null
          category: string | null
          created_at: string
          deadline: string | null
          id: string
          material_calc_id: string | null
          name: string
          payment_info: string | null
          pieces_count: number | null
          product_link: string | null
          project_id: string
          room_id: string | null
          specifications: string | null
          status: Database["public"]["Enums"]["purchase_status"] | null
          supplier_name: string | null
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          area_m2?: number | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          material_calc_id?: string | null
          name: string
          payment_info?: string | null
          pieces_count?: number | null
          product_link?: string | null
          project_id: string
          room_id?: string | null
          specifications?: string | null
          status?: Database["public"]["Enums"]["purchase_status"] | null
          supplier_name?: string | null
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          area_m2?: number | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          material_calc_id?: string | null
          name?: string
          payment_info?: string | null
          pieces_count?: number | null
          product_link?: string | null
          project_id?: string
          room_id?: string | null
          specifications?: string | null
          status?: Database["public"]["Enums"]["purchase_status"] | null
          supplier_name?: string | null
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_purchases_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_material_calc_id_fkey"
            columns: ["material_calc_id"]
            isOneToOne: false
            referencedRelation: "material_calculations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content: Json
          created_at: string
          id: string
          period_end: string
          period_start: string
          project_id: string
          type: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          project_id: string
          type: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          project_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reports_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_items: {
        Row: {
          created_at: string
          description: string | null
          discipline: string
          display_order: number | null
          estimated_value: number | null
          id: string
          is_included: boolean | null
          scenario_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discipline: string
          display_order?: number | null
          estimated_value?: number | null
          id?: string
          is_included?: boolean | null
          scenario_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discipline?: string
          display_order?: number | null
          estimated_value?: number | null
          id?: string
          is_included?: boolean | null
          scenario_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_items_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean | null
          name: string
          project_id: string
          total_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          name: string
          project_id: string
          total_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          name?: string
          project_id?: string
          total_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_scenarios_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_tasks: {
        Row: {
          color: string | null
          created_at: string
          dependencies: string[] | null
          description: string | null
          discipline: string | null
          end_date: string | null
          environment: string | null
          estimated_days: number | null
          id: string
          is_client_visible: boolean | null
          is_daily_detail: boolean | null
          materials: Json | null
          order_index: number | null
          parent_id: string | null
          payment_note: string | null
          progress_percentage: number | null
          project_id: string
          requires_presence: boolean | null
          scope_item_id: string | null
          source: string | null
          source_activity_id: string | null
          start_date: string | null
          status: string | null
          supplier_name: string | null
          task_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          discipline?: string | null
          end_date?: string | null
          environment?: string | null
          estimated_days?: number | null
          id?: string
          is_client_visible?: boolean | null
          is_daily_detail?: boolean | null
          materials?: Json | null
          order_index?: number | null
          parent_id?: string | null
          payment_note?: string | null
          progress_percentage?: number | null
          project_id: string
          requires_presence?: boolean | null
          scope_item_id?: string | null
          source?: string | null
          source_activity_id?: string | null
          start_date?: string | null
          status?: string | null
          supplier_name?: string | null
          task_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          discipline?: string | null
          end_date?: string | null
          environment?: string | null
          estimated_days?: number | null
          id?: string
          is_client_visible?: boolean | null
          is_daily_detail?: boolean | null
          materials?: Json | null
          order_index?: number | null
          parent_id?: string | null
          payment_note?: string | null
          progress_percentage?: number | null
          project_id?: string
          requires_presence?: boolean | null
          scope_item_id?: string | null
          source?: string | null
          source_activity_id?: string | null
          start_date?: string | null
          status?: string | null
          supplier_name?: string | null
          task_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_schedule_tasks_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "schedule_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_tasks_scope_item_id_fkey"
            columns: ["scope_item_id"]
            isOneToOne: false
            referencedRelation: "scope_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_tasks_source_activity_id_fkey"
            columns: ["source_activity_id"]
            isOneToOne: false
            referencedRelation: "project_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      scope_items: {
        Row: {
          activities: string | null
          created_at: string
          description: string | null
          discipline: string
          entry_order: number | null
          estimated_value: number | null
          id: string
          parent_id: string | null
          payment_terms: string | null
          project_id: string
          scope_type: string | null
          service_duration: string | null
          status: string | null
          suppliers_to_quote: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activities?: string | null
          created_at?: string
          description?: string | null
          discipline: string
          entry_order?: number | null
          estimated_value?: number | null
          id?: string
          parent_id?: string | null
          payment_terms?: string | null
          project_id: string
          scope_type?: string | null
          service_duration?: string | null
          status?: string | null
          suppliers_to_quote?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activities?: string | null
          created_at?: string
          description?: string | null
          discipline?: string
          entry_order?: number | null
          estimated_value?: number | null
          id?: string
          parent_id?: string | null
          payment_terms?: string | null
          project_id?: string
          scope_type?: string | null
          service_duration?: string | null
          status?: string | null
          suppliers_to_quote?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_scope_items_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scope_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "scope_items"
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
          nf_service_code: string | null
          purchase_categories: string[] | null
          scope: string
          supplier_categories: string[] | null
          tax_rate_percent: number
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
          nf_service_code?: string | null
          purchase_categories?: string[] | null
          scope?: string
          supplier_categories?: string[] | null
          tax_rate_percent?: number
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
          nf_service_code?: string | null
          purchase_categories?: string[] | null
          scope?: string
          supplier_categories?: string[] | null
          tax_rate_percent?: number
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_diary_entries: {
        Row: {
          created_at: string
          disciplines_active: string[] | null
          entry_date: string
          id: string
          observations: string | null
          photos: string[] | null
          project_id: string
          summary: string | null
          updated_at: string
          user_id: string
          weather: string | null
          workers_count: number | null
        }
        Insert: {
          created_at?: string
          disciplines_active?: string[] | null
          entry_date?: string
          id?: string
          observations?: string | null
          photos?: string[] | null
          project_id: string
          summary?: string | null
          updated_at?: string
          user_id: string
          weather?: string | null
          workers_count?: number | null
        }
        Update: {
          created_at?: string
          disciplines_active?: string[] | null
          entry_date?: string
          id?: string
          observations?: string | null
          photos?: string[] | null
          project_id?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
          weather?: string | null
          workers_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_site_diary_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "fk_site_tracking_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          project_id: string
          recurrence_rule: string | null
          updated_at: string
          user_id: string
          visit_date: string
          visit_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          project_id: string
          recurrence_rule?: string | null
          updated_at?: string
          user_id: string
          visit_date: string
          visit_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          project_id?: string
          recurrence_rule?: string | null
          updated_at?: string
          user_id?: string
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_site_visits_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_allocations: {
        Row: {
          contracted_value: number | null
          created_at: string
          discipline: string
          end_date: string | null
          final_value: number | null
          id: string
          notes: string | null
          project_id: string
          rating: number | null
          start_date: string | null
          status: string | null
          supplier_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contracted_value?: number | null
          created_at?: string
          discipline: string
          end_date?: string | null
          final_value?: number | null
          id?: string
          notes?: string | null
          project_id: string
          rating?: number | null
          start_date?: string | null
          status?: string | null
          supplier_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contracted_value?: number | null
          created_at?: string
          discipline?: string
          end_date?: string | null
          final_value?: number | null
          id?: string
          notes?: string | null
          project_id?: string
          rating?: number | null
          start_date?: string | null
          status?: string | null
          supplier_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier_allocations_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_supplier_allocations_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_scopes: {
        Row: {
          activities: Json | null
          created_at: string | null
          discipline: string | null
          id: string
          project_id: string
          quoted_value: number | null
          sent_at: string | null
          status: string | null
          supplier_id: string
          user_id: string
        }
        Insert: {
          activities?: Json | null
          created_at?: string | null
          discipline?: string | null
          id?: string
          project_id: string
          quoted_value?: number | null
          sent_at?: string | null
          status?: string | null
          supplier_id: string
          user_id: string
        }
        Update: {
          activities?: Json | null
          created_at?: string | null
          discipline?: string | null
          id?: string
          project_id?: string
          quoted_value?: number | null
          sent_at?: string | null
          status?: string | null
          supplier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_scopes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_scopes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
          is_active: boolean | null
          name: string
          notes: string | null
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
          is_active?: boolean | null
          name: string
          notes?: string | null
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
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_conditions?: string | null
          phone?: string | null
          pix_key?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          page_key: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          page_key: string
          user_id: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          page_key?: string
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
      voice_tasks: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean
          parent_id: string | null
          priority: string
          project_id: string | null
          recurrence_rule: string | null
          responsible: string | null
          source_transcript: string | null
          status: string
          tags: string[] | null
          task_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean
          parent_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_rule?: string | null
          responsible?: string | null
          source_transcript?: string | null
          status?: string
          tags?: string[] | null
          task_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean
          parent_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_rule?: string | null
          responsible?: string | null
          source_transcript?: string | null
          status?: string
          tags?: string[] | null
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_voice_tasks_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "voice_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          client_pending: string | null
          client_responses: Json | null
          completion_percent: number
          created_at: string
          created_by: string | null
          id: string
          next_steps: string
          photo_urls: Json
          project_id: string
          summary: string
          user_id: string
          week_start: string
        }
        Insert: {
          client_pending?: string | null
          client_responses?: Json | null
          completion_percent?: number
          created_at?: string
          created_by?: string | null
          id?: string
          next_steps: string
          photo_urls?: Json
          project_id: string
          summary: string
          user_id: string
          week_start: string
        }
        Update: {
          client_pending?: string | null
          client_responses?: Json | null
          completion_percent?: number
          created_at?: string
          created_by?: string | null
          id?: string
          next_steps?: string
          photo_urls?: Json
          project_id?: string
          summary?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_team_user_ids: { Args: never; Returns: string[] }
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
        | "proposta"
        | "contrato"
        | "projeto"
        | "planejamento"
        | "mobilizacao"
        | "execucao"
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
        "proposta",
        "contrato",
        "projeto",
        "planejamento",
        "mobilizacao",
        "execucao",
        "concluido",
      ],
      purchase_status: ["pendente", "comprado", "entregue", "instalado"],
      tracking_type: ["checkin", "voz", "foto", "nota"],
    },
  },
} as const
