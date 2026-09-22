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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      campaign_items: {
        Row: {
          campaign_id: string
          collab: boolean
          created_at: string
          description: string
          id: string
          line_total: number | null
          paid_media: boolean
          quantity: number
          service_id: string | null
          sort_order: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          campaign_id: string
          collab?: boolean
          created_at?: string
          description: string
          id?: string
          line_total?: number | null
          paid_media?: boolean
          quantity?: number
          service_id?: string | null
          sort_order?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          collab?: boolean
          created_at?: string
          description?: string
          id?: string
          line_total?: number | null
          paid_media?: boolean
          quantity?: number
          service_id?: string | null
          sort_order?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_statuses: {
        Row: {
          color: string
          created_at: string
          id: string
          is_closed: boolean
          is_default: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_closed?: boolean
          is_default?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_closed?: boolean
          is_default?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          brief: string | null
          commission_paid: boolean
          commission_paid_at: string | null
          commission_pct: number
          company_id: string
          contact_id: string | null
          content_due_date: string | null
          contract_signed: boolean
          created_at: string
          currency: string
          fx_rate_mxn: number
          gross_amount: number
          id: string
          name: string
          net_amount: number
          notes: string | null
          produced: boolean
          publish_date: string | null
          signed_at: string | null
          status_id: string | null
          updated_at: string
        }
        Insert: {
          brief?: string | null
          commission_paid?: boolean
          commission_paid_at?: string | null
          commission_pct?: number
          company_id: string
          contact_id?: string | null
          content_due_date?: string | null
          contract_signed?: boolean
          created_at?: string
          currency?: string
          fx_rate_mxn?: number
          gross_amount?: number
          id?: string
          name: string
          net_amount?: number
          notes?: string | null
          produced?: boolean
          publish_date?: string | null
          signed_at?: string | null
          status_id?: string | null
          updated_at?: string
        }
        Update: {
          brief?: string | null
          commission_paid?: boolean
          commission_paid_at?: string | null
          commission_pct?: number
          company_id?: string
          contact_id?: string | null
          content_due_date?: string | null
          contract_signed?: boolean
          created_at?: string
          currency?: string
          fx_rate_mxn?: number
          gross_amount?: number
          id?: string
          name?: string
          net_amount?: number
          notes?: string | null
          produced?: boolean
          publish_date?: string | null
          signed_at?: string | null
          status_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "campaign_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          name: string
          notes: string | null
          stage: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          stage?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          stage?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          linkedin: string | null
          name: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          linkedin?: string | null
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          linkedin?: string | null
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      gifting: {
        Row: {
          company_id: string | null
          company_name: string
          contact_email: string | null
          created_at: string
          id: string
          notes: string | null
          products: string | null
          received_at: string | null
          status: string
          tracking_links: string[]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          company_name: string
          contact_email?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          products?: string | null
          received_at?: string | null
          status?: string
          tracking_links?: string[]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          company_name?: string
          contact_email?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          products?: string | null
          received_at?: string | null
          status?: string
          tracking_links?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gifting_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          campaign_id: string
          created_at: string
          filename: string
          id: string
          kind: string
          size_bytes: number | null
          storage_path: string
          uuid_fiscal: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          filename: string
          id?: string
          kind: string
          size_bytes?: number | null
          storage_path: string
          uuid_fiscal?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          filename?: string
          id?: string
          kind?: string
          size_bytes?: number | null
          storage_path?: string
          uuid_fiscal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          due_date: string
          id: string
          notes: string | null
          paid_at: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          campaign_id: string
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          campaign_id: string
          created_at: string
          currency: string
          folio: string
          id: string
          issued_at: string
          items_snapshot: Json
          notes: string | null
          payment_terms_label: string | null
          total: number
          valid_until: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          currency: string
          folio: string
          id?: string
          issued_at?: string
          items_snapshot: Json
          notes?: string | null
          payment_terms_label?: string | null
          total: number
          valid_until?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          currency?: string
          folio?: string
          id?: string
          issued_at?: string
          items_snapshot?: Json
          notes?: string | null
          payment_terms_label?: string | null
          total?: number
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          pdf_path: string | null
          period_end: string
          period_start: string
          period_type: string
          snapshot: Json
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          pdf_path?: string | null
          period_end: string
          period_start: string
          period_type: string
          snapshot: Json
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          pdf_path?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          snapshot?: Json
          title?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          default_price: number
          description: string | null
          id: string
          name: string
          paid_media_default: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          default_price?: number
          description?: string | null
          id?: string
          name: string
          paid_media_default?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          default_price?: number
          description?: string | null
          id?: string
          name?: string
          paid_media_default?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          brand_email: string | null
          brand_handle: string | null
          brand_logo_path: string | null
          brand_name: string
          brand_phone: string | null
          commission_pct: number
          default_currency: string
          id: number
          payment_presets: Json
          sales_goals: Json
          quote_footer: string | null
          quote_validity_days: number
          updated_at: string
        }
        Insert: {
          brand_email?: string | null
          brand_handle?: string | null
          brand_logo_path?: string | null
          brand_name?: string
          brand_phone?: string | null
          commission_pct?: number
          default_currency?: string
          id?: number
          payment_presets?: Json
          sales_goals?: Json
          quote_footer?: string | null
          quote_validity_days?: number
          updated_at?: string
        }
        Update: {
          brand_email?: string | null
          brand_handle?: string | null
          brand_logo_path?: string | null
          brand_name?: string
          brand_phone?: string | null
          commission_pct?: number
          default_currency?: string
          id?: number
          payment_presets?: Json
          sales_goals?: Json
          quote_footer?: string | null
          quote_validity_days?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_quote_folio: { Args: never; Returns: string }
      ping: { Args: never; Returns: string }
      report_summary: {
        Args: { from_date: string; to_date: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
