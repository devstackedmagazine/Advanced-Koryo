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
  public: {
    Tables: {
      accessories: {
        Row: {
          active: boolean
          brand: string | null
          category: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          featured: boolean
          id: string
          images: string[]
          in_stock: boolean
          name: string
          name_ar: string | null
          price_sar: number | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          in_stock?: boolean
          name: string
          name_ar?: string | null
          price_sar?: number | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          in_stock?: boolean
          name?: string
          name_ar?: string | null
          price_sar?: number | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_holder: string
          account_number: string | null
          active: boolean
          bank_name: string
          country: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          iban: string | null
          id: string
          label: string
          label_ar: string | null
          notes: string | null
          notes_ar: string | null
          sort_order: number
          swift: string | null
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_number?: string | null
          active?: boolean
          bank_name: string
          country?: string | null
          created_at?: string
          currency: Database["public"]["Enums"]["currency_code"]
          iban?: string | null
          id?: string
          label: string
          label_ar?: string | null
          notes?: string | null
          notes_ar?: string | null
          sort_order?: number
          swift?: string | null
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_number?: string | null
          active?: boolean
          bank_name?: string
          country?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          iban?: string | null
          id?: string
          label?: string
          label_ar?: string | null
          notes?: string | null
          notes_ar?: string | null
          sort_order?: number
          swift?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          handled: boolean
          id: string
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          handled?: boolean
          id?: string
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          handled?: boolean
          id?: string
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      custom_orders: {
        Row: {
          admin_notes: string | null
          admin_offer: Json | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          email: string | null
          full_name: string
          id: string
          make: string | null
          model: string | null
          notes: string | null
          phone: string
          status: Database["public"]["Enums"]["custom_order_status"]
          updated_at: string
          user_id: string | null
          whatsapp: string | null
          year_from: number | null
          year_to: number | null
        }
        Insert: {
          admin_notes?: string | null
          admin_offer?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          email?: string | null
          full_name: string
          id?: string
          make?: string | null
          model?: string | null
          notes?: string | null
          phone: string
          status?: Database["public"]["Enums"]["custom_order_status"]
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
          year_from?: number | null
          year_to?: number | null
        }
        Update: {
          admin_notes?: string | null
          admin_offer?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          email?: string | null
          full_name?: string
          id?: string
          make?: string | null
          model?: string | null
          notes?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["custom_order_status"]
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
          year_from?: number | null
          year_to?: number | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          created_at: string
          effective_at: string
          from_currency: Database["public"]["Enums"]["currency_code"]
          id: string
          rate: number
          to_currency: Database["public"]["Enums"]["currency_code"]
        }
        Insert: {
          created_at?: string
          effective_at?: string
          from_currency: Database["public"]["Enums"]["currency_code"]
          id?: string
          rate: number
          to_currency: Database["public"]["Enums"]["currency_code"]
        }
        Update: {
          created_at?: string
          effective_at?: string
          from_currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          rate?: number
          to_currency?: Database["public"]["Enums"]["currency_code"]
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          content_ar: Json
          content_en: Json
          created_at: string
          heading_color: string
          id: string
          slug: string
          text_color: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          content_ar?: Json
          content_en?: Json
          created_at?: string
          heading_color?: string
          id?: string
          slug: string
          text_color?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          content_ar?: Json
          content_en?: Json
          created_at?: string
          heading_color?: string
          id?: string
          slug?: string
          text_color?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          custom_order_id: string | null
          description: string | null
          id: string
          line_items: Json
          order_type: Database["public"]["Enums"]["order_type"]
          requires_admin_approval: boolean
          reservation_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          custom_order_id?: string | null
          description?: string | null
          id?: string
          line_items?: Json
          order_type: Database["public"]["Enums"]["order_type"]
          requires_admin_approval?: boolean
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          custom_order_id?: string | null
          description?: string | null
          id?: string
          line_items?: Json
          order_type?: Database["public"]["Enums"]["order_type"]
          requires_admin_approval?: boolean
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_custom_order_id_fkey"
            columns: ["custom_order_id"]
            isOneToOne: false
            referencedRelation: "custom_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          admin_notes: string | null
          amount_claimed: number | null
          bank_account_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"] | null
          id: string
          payment_id: string
          receipt_url: string
          reference_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_name: string | null
          status: Database["public"]["Enums"]["proof_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_claimed?: number | null
          bank_account_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"] | null
          id?: string
          payment_id: string
          receipt_url: string
          reference_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_claimed?: number | null
          bank_account_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"] | null
          id?: string
          payment_id?: string
          receipt_url?: string
          reference_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          checkout_url: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          failure_reason: string | null
          gateway: string
          gateway_payload: Json | null
          gateway_reference: string | null
          id: string
          order_id: string
          paid_at: string | null
          payment_type: Database["public"]["Enums"]["order_type"]
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          checkout_url?: string | null
          created_at?: string
          currency: Database["public"]["Enums"]["currency_code"]
          failure_reason?: string | null
          gateway: string
          gateway_payload?: Json | null
          gateway_reference?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          payment_type: Database["public"]["Enums"]["order_type"]
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          checkout_url?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          failure_reason?: string | null
          gateway?: string
          gateway_payload?: Json | null
          gateway_reference?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_type?: Database["public"]["Enums"]["order_type"]
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          gateway_reference: string | null
          id: string
          initiated_by: string | null
          payment_id: string
          reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: Database["public"]["Enums"]["currency_code"]
          gateway_reference?: string | null
          id?: string
          initiated_by?: string | null
          payment_id: string
          reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          gateway_reference?: string | null
          id?: string
          initiated_by?: string | null
          payment_id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          deposit_amount: number
          hold_until: string | null
          id: string
          refundable: boolean
          refunded_at: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          deposit_amount: number
          hold_until?: string | null
          id?: string
          refundable?: boolean
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          deposit_amount?: number
          hold_until?: string | null
          id?: string
          refundable?: boolean
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_fees: {
        Row: {
          active: boolean
          amount: number
          code: Database["public"]["Enums"]["service_fee_code"]
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          description: string | null
          description_ar: string | null
          id: string
          is_free: boolean
          name: string
          name_ar: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          code: Database["public"]["Enums"]["service_fee_code"]
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          description_ar?: string | null
          id?: string
          is_free?: boolean
          name: string
          name_ar?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          code?: Database["public"]["Enums"]["service_fee_code"]
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          description_ar?: string | null
          id?: string
          is_free?: boolean
          name?: string
          name_ar?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      spare_parts: {
        Row: {
          active: boolean
          brand: string | null
          category: string | null
          compatible_makes: string[]
          compatible_models: string[]
          created_at: string
          description: string | null
          description_ar: string | null
          featured: boolean
          id: string
          images: string[]
          in_stock: boolean
          name: string
          name_ar: string | null
          oem: boolean
          part_number: string | null
          price_sar: number | null
          slug: string | null
          updated_at: string
          year_from: number | null
          year_to: number | null
        }
        Insert: {
          active?: boolean
          brand?: string | null
          category?: string | null
          compatible_makes?: string[]
          compatible_models?: string[]
          created_at?: string
          description?: string | null
          description_ar?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          in_stock?: boolean
          name: string
          name_ar?: string | null
          oem?: boolean
          part_number?: string | null
          price_sar?: number | null
          slug?: string | null
          updated_at?: string
          year_from?: number | null
          year_to?: number | null
        }
        Update: {
          active?: boolean
          brand?: string | null
          category?: string | null
          compatible_makes?: string[]
          compatible_models?: string[]
          created_at?: string
          description?: string | null
          description_ar?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          in_stock?: boolean
          name?: string
          name_ar?: string | null
          oem?: boolean
          part_number?: string | null
          price_sar?: number | null
          slug?: string | null
          updated_at?: string
          year_from?: number | null
          year_to?: number | null
        }
        Relationships: []
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
      vehicles: {
        Row: {
          accident_history: string | null
          admin_notes: string | null
          auction_end_at: string | null
          auction_source: string | null
          auction_status: string | null
          auction_url: string | null
          body_type: string | null
          city: string | null
          color: string | null
          coming_soon: boolean
          condition: string | null
          created_at: string
          current_bid_krw: number | null
          cylinders: number | null
          deposit_sar: number | null
          description: string | null
          description_ar: string | null
          drive_type: string | null
          engine_cc: number | null
          est_export_sar: number | null
          est_landed_sar: number | null
          est_shipping_sar: number | null
          estimated_final_price_krw: number | null
          exchange_rate_krw_sar: number | null
          exterior_color: string | null
          external_id: string | null
          external_source: string | null
          featured: boolean
          fuel: Database["public"]["Enums"]["fuel_type"] | null
          id: string
          images: string[]
          import_status: string | null
          imported_at: string | null
          inspection_fee_sar: number | null
          inspection_notes: string | null
          interior_color: string | null
          is_active: boolean
          korea_location: string | null
          last_synced_at: string | null
          listing_type: string
          make: string
          meta_description: string | null
          meta_title: string | null
          mileage_km: number | null
          model: string
          negotiation_fee_sar: number | null
          options: string[]
          other_fees_sar: number | null
          price_krw: number | null
          price_sar: number | null
          price_usd: number | null
          public_notes: string | null
          published_at: string | null
          raw_import_data: Json | null
          slug: string | null
          source_platform: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["vehicle_status"]
          stock_number: string | null
          title_ar: string | null
          title_en: string | null
          transmission: string | null
          trim: string | null
          updated_at: string
          year: number
        }
        Insert: {
          accident_history?: string | null
          admin_notes?: string | null
          auction_end_at?: string | null
          auction_source?: string | null
          auction_status?: string | null
          auction_url?: string | null
          body_type?: string | null
          city?: string | null
          color?: string | null
          coming_soon?: boolean
          condition?: string | null
          created_at?: string
          current_bid_krw?: number | null
          cylinders?: number | null
          deposit_sar?: number | null
          description?: string | null
          description_ar?: string | null
          drive_type?: string | null
          engine_cc?: number | null
          est_export_sar?: number | null
          est_landed_sar?: number | null
          est_shipping_sar?: number | null
          estimated_final_price_krw?: number | null
          exchange_rate_krw_sar?: number | null
          exterior_color?: string | null
          external_id?: string | null
          external_source?: string | null
          featured?: boolean
          fuel?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          images?: string[]
          import_status?: string | null
          imported_at?: string | null
          inspection_fee_sar?: number | null
          inspection_notes?: string | null
          interior_color?: string | null
          is_active?: boolean
          korea_location?: string | null
          last_synced_at?: string | null
          listing_type?: string
          make: string
          meta_description?: string | null
          meta_title?: string | null
          mileage_km?: number | null
          model: string
          negotiation_fee_sar?: number | null
          options?: string[]
          other_fees_sar?: number | null
          price_krw?: number | null
          price_sar?: number | null
          price_usd?: number | null
          public_notes?: string | null
          published_at?: string | null
          raw_import_data?: Json | null
          slug?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          stock_number?: string | null
          title_ar?: string | null
          title_en?: string | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          accident_history?: string | null
          admin_notes?: string | null
          auction_end_at?: string | null
          auction_source?: string | null
          auction_status?: string | null
          auction_url?: string | null
          body_type?: string | null
          city?: string | null
          color?: string | null
          coming_soon?: boolean
          condition?: string | null
          created_at?: string
          current_bid_krw?: number | null
          cylinders?: number | null
          deposit_sar?: number | null
          description?: string | null
          description_ar?: string | null
          drive_type?: string | null
          engine_cc?: number | null
          est_export_sar?: number | null
          est_landed_sar?: number | null
          est_shipping_sar?: number | null
          estimated_final_price_krw?: number | null
          exchange_rate_krw_sar?: number | null
          exterior_color?: string | null
          external_id?: string | null
          external_source?: string | null
          featured?: boolean
          fuel?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          images?: string[]
          import_status?: string | null
          imported_at?: string | null
          inspection_fee_sar?: number | null
          inspection_notes?: string | null
          interior_color?: string | null
          is_active?: boolean
          korea_location?: string | null
          last_synced_at?: string | null
          listing_type?: string
          make?: string
          meta_description?: string | null
          meta_title?: string | null
          mileage_km?: number | null
          model?: string
          negotiation_fee_sar?: number | null
          options?: string[]
          other_fees_sar?: number | null
          price_krw?: number | null
          price_sar?: number | null
          price_usd?: number | null
          public_notes?: string | null
          published_at?: string | null
          raw_import_data?: Json | null
          slug?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          stock_number?: string | null
          title_ar?: string | null
          title_en?: string | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          year?: number
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
      app_role: "admin" | "user"
      currency_code: "USD" | "SAR" | "KRW"
      custom_order_status:
        | "submitted"
        | "reviewing"
        | "offered"
        | "accepted"
        | "rejected"
        | "cancelled"
        | "completed"
      fuel_type: "gasoline" | "diesel" | "hybrid" | "electric" | "lpg"
      order_status:
        | "draft"
        | "pending_admin_approval"
        | "awaiting_payment"
        | "paid"
        | "cancelled"
        | "refunded"
      order_type:
        | "deposit"
        | "service_fee"
        | "full_purchase"
        | "remaining_balance"
        | "custom_order"
      payment_status:
        | "initiated"
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "cancelled"
      proof_status: "submitted" | "approved" | "rejected"
      reservation_status:
        | "pending"
        | "approved"
        | "cancelled"
        | "refunded"
        | "completed"
      service_fee_code:
        | "inspection"
        | "negotiation"
        | "transfer"
        | "customs_korea"
        | "replace_wheels"
        | "custom_sourcing"
      vehicle_status:
        | "available"
        | "reserved"
        | "sold"
        | "hidden"
        | "under_review"
        | "coming_soon"
        | "draft"
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
      app_role: ["admin", "user"],
      currency_code: ["USD", "SAR", "KRW"],
      custom_order_status: [
        "submitted",
        "reviewing",
        "offered",
        "accepted",
        "rejected",
        "cancelled",
        "completed",
      ],
      fuel_type: ["gasoline", "diesel", "hybrid", "electric", "lpg"],
      order_status: [
        "draft",
        "pending_admin_approval",
        "awaiting_payment",
        "paid",
        "cancelled",
        "refunded",
      ],
      order_type: [
        "deposit",
        "service_fee",
        "full_purchase",
        "remaining_balance",
        "custom_order",
      ],
      payment_status: [
        "initiated",
        "pending",
        "paid",
        "failed",
        "refunded",
        "cancelled",
      ],
      proof_status: ["submitted", "approved", "rejected"],
      reservation_status: [
        "pending",
        "approved",
        "cancelled",
        "refunded",
        "completed",
      ],
      service_fee_code: [
        "inspection",
        "negotiation",
        "transfer",
        "customs_korea",
        "replace_wheels",
        "custom_sourcing",
      ],
      vehicle_status: [
        "available",
        "reserved",
        "sold",
        "hidden",
        "under_review",
        "coming_soon",
        "draft",
      ],
    },
  },
} as const
