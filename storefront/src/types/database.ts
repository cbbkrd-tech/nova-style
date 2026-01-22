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
    PostgrestVersion: "13.0.5"
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
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          password_hash: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          password_hash: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          password_hash?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          email: string | null
          first_name: string | null
          id: number
          last_name: string | null
          list_polecony: boolean | null
          name: string | null
          note: string | null
          phone: string | null
          total_unpaid: number | null
          updated_at: string | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          id: number
          last_name?: string | null
          list_polecony?: boolean | null
          name?: string | null
          note?: string | null
          phone?: string | null
          total_unpaid?: number | null
          updated_at?: string | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          list_polecony?: boolean | null
          name?: string | null
          note?: string | null
          phone?: string | null
          total_unpaid?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_comments: {
        Row: {
          body: string | null
          created_at: string | null
          id: number
          invoice_id: number | null
          source: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: number
          invoice_id?: number | null
          source?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: number
          invoice_id?: number | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_comments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          buyer_city: string | null
          buyer_country: string | null
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          buyer_post_code: string | null
          buyer_street: string | null
          buyer_tax_no: string | null
          client_id: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          email_status: string | null
          id: number
          internal_note: string | null
          issue_date: string | null
          kind: string | null
          number: string | null
          outstanding: number | null
          overdue: boolean | null
          paid: number | null
          paid_date: string | null
          payment_to: string | null
          payment_type: string | null
          payment_url: string | null
          place: string | null
          price_net: number | null
          price_tax: number | null
          print_time: string | null
          sell_date: string | null
          sent_time: string | null
          status: string | null
          total: number | null
          updated_at: string | null
          view_url: string | null
        }
        Insert: {
          buyer_city?: string | null
          buyer_country?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          buyer_post_code?: string | null
          buyer_street?: string | null
          buyer_tax_no?: string | null
          client_id?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email_status?: string | null
          id: number
          internal_note?: string | null
          issue_date?: string | null
          kind?: string | null
          number?: string | null
          outstanding?: number | null
          overdue?: boolean | null
          paid?: number | null
          paid_date?: string | null
          payment_to?: string | null
          payment_type?: string | null
          payment_url?: string | null
          place?: string | null
          price_net?: number | null
          price_tax?: number | null
          print_time?: string | null
          sell_date?: string | null
          sent_time?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string | null
          view_url?: string | null
        }
        Update: {
          buyer_city?: string | null
          buyer_country?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          buyer_post_code?: string | null
          buyer_street?: string | null
          buyer_tax_no?: string | null
          client_id?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email_status?: string | null
          id?: number
          internal_note?: string | null
          issue_date?: string | null
          kind?: string | null
          number?: string | null
          outstanding?: number | null
          overdue?: boolean | null
          paid?: number | null
          paid_date?: string | null
          payment_to?: string | null
          payment_type?: string | null
          payment_url?: string | null
          place?: string | null
          price_net?: number | null
          price_tax?: number | null
          print_time?: string | null
          sell_date?: string | null
          sent_time?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string | null
          view_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      message_history: {
        Row: {
          client_id: number | null
          client_name: string
          error_message: string | null
          id: number
          invoice_currency: string | null
          invoice_id: number | null
          invoice_number: string
          invoice_total: number | null
          is_auto_initial: boolean | null
          level: number
          message_type: string
          sent_at: string | null
          sent_by: string | null
          status: string
        }
        Insert: {
          client_id?: number | null
          client_name: string
          error_message?: string | null
          id?: number
          invoice_currency?: string | null
          invoice_id?: number | null
          invoice_number: string
          invoice_total?: number | null
          is_auto_initial?: boolean | null
          level: number
          message_type: string
          sent_at?: string | null
          sent_by?: string | null
          status: string
        }
        Update: {
          client_id?: number | null
          client_name?: string
          error_message?: string | null
          id?: number
          invoice_currency?: string | null
          invoice_id?: number | null
          invoice_number?: string
          invoice_total?: number | null
          is_auto_initial?: boolean | null
          level?: number
          message_type?: string
          sent_at?: string | null
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          shipping_address: string
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          shipping_address: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          shipping_address?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_main: boolean | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_main?: boolean | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_main?: boolean | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          size: string
          sku: string | null
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          size: string
          sku?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          size?: string
          sku?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          color: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          show_on_homepage: boolean | null
          size_guide: string | null
          slug: string
          subcategory_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          color: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          show_on_homepage?: boolean | null
          size_guide?: string | null
          slug: string
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          show_on_homepage?: boolean | null
          size_guide?: string | null
          slug?: string
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          id: string
          slug: string
          name: string
          parent_category: Database["public"]["Enums"]["product_category"]
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          parent_category: Database["public"]["Enums"]["product_category"]
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          parent_category?: Database["public"]["Enums"]["product_category"]
          sort_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      product_category: "women" | "men"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      product_category: ["women", "men"],
    },
  },
} as const
