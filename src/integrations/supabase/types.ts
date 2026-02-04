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
  public: {
    Tables: {
      appointment_reminders: {
        Row: {
          appointment_id: string
          id: string
          reminder_type: string
          sent_at: string
          status: string
        }
        Insert: {
          appointment_id: string
          id?: string
          reminder_type: string
          sent_at?: string
          status?: string
        }
        Update: {
          appointment_id?: string
          id?: string
          reminder_type?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          barber_id: string
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          coupon_id: string | null
          created_at: string
          discount_amount: number | null
          end_time: string
          final_price: number | null
          id: string
          notes: string | null
          original_price: number | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          service_id: string
          shop_id: string
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          barber_id: string
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_amount?: number | null
          end_time: string
          final_price?: number | null
          id?: string
          notes?: string | null
          original_price?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          service_id: string
          shop_id: string
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          barber_id?: string
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_amount?: number | null
          end_time?: string
          final_price?: number | null
          id?: string
          notes?: string | null
          original_price?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          service_id?: string
          shop_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "loyalty_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_invitations: {
        Row: {
          accepted_at: string | null
          barber_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          shop_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          barber_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          shop_id: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          barber_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          shop_id?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_invitations_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_invitations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_portfolio: {
        Row: {
          barber_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string
        }
        Insert: {
          barber_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
        }
        Update: {
          barber_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_portfolio_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_reviews: {
        Row: {
          appointment_id: string
          barber_id: string
          client_id: string | null
          client_phone: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          appointment_id: string
          barber_id: string
          client_id?: string | null
          client_phone?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
        }
        Update: {
          appointment_id?: string
          barber_id?: string
          client_id?: string | null
          client_phone?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "barber_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_reviews_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_services: {
        Row: {
          barber_id: string
          created_at: string | null
          id: string
          service_id: string
        }
        Insert: {
          barber_id: string
          created_at?: string | null
          id?: string
          service_id: string
        }
        Update: {
          barber_id?: string
          created_at?: string | null
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_services_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          commission_rate: number | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          shop_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          shop_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          shop_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_reminders: {
        Row: {
          id: string
          period_ends_at: string
          reminder_type: string
          sent_at: string
          shop_id: string
        }
        Insert: {
          id?: string
          period_ends_at: string
          reminder_type: string
          sent_at?: string
          shop_id: string
        }
        Update: {
          id?: string
          period_ends_at?: string
          reminder_type?: string
          sent_at?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_reminders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_times: {
        Row: {
          barber_id: string
          created_at: string
          end_time: string
          id: string
          reason: string | null
          shop_id: string
          start_time: string
        }
        Insert: {
          barber_id: string
          created_at?: string
          end_time: string
          id?: string
          reason?: string | null
          shop_id: string
          start_time: string
        }
        Update: {
          barber_id?: string
          created_at?: string
          end_time?: string
          id?: string
          reason?: string | null
          shop_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_times_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_times_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          phone: string
          shop_id: string
          step: string
          temp_data: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          phone: string
          shop_id: string
          step?: string
          temp_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          phone?: string
          shop_id?: string
          step?: string
          temp_data?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_sessions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payments: {
        Row: {
          amount_paid: number
          barber_id: string
          commission_amount: number
          commission_rate: number
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          period_end: string
          period_start: string
          shop_id: string
          status: string
          total_revenue: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number
          barber_id: string
          commission_amount?: number
          commission_rate: number
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period_end: string
          period_start: string
          shop_id: string
          status?: string
          total_revenue?: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          barber_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period_end?: string
          period_start?: string
          shop_id?: string
          status?: string
          total_revenue?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      loyalty_coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          shop_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          shop_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_coupons_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          client_name: string | null
          client_phone: string
          created_at: string
          id: string
          lifetime_points: number
          points_expire_at: string | null
          shop_id: string
          total_points: number
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_phone: string
          created_at?: string
          id?: string
          lifetime_points?: number
          points_expire_at?: string | null
          shop_id: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_phone?: string
          created_at?: string
          id?: string
          lifetime_points?: number
          points_expire_at?: string | null
          shop_id?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          is_active: boolean
          points_required: number
          shop_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          points_required: number
          shop_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          points_required?: number
          shop_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          appointment_id: string | null
          client_phone: string
          created_at: string
          description: string
          id: string
          points_change: number
          reward_id: string | null
          shop_id: string
        }
        Insert: {
          appointment_id?: string | null
          client_phone: string
          created_at?: string
          description: string
          id?: string
          points_change: number
          reward_id?: string | null
          shop_id: string
        }
        Update: {
          appointment_id?: string | null
          client_phone?: string
          created_at?: string
          description?: string
          id?: string
          points_change?: number
          reward_id?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: []
      }
      products: {
        Row: {
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          min_stock_alert: number | null
          name: string
          price: number
          shop_id: string
          sku: string | null
          stock_quantity: number
          track_stock: boolean
          updated_at: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_alert?: number | null
          name: string
          price: number
          shop_id: string
          sku?: string | null
          stock_quantity?: number
          track_stock?: boolean
          updated_at?: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_stock_alert?: number | null
          name?: string
          price?: number
          shop_id?: string
          sku?: string | null
          stock_quantity?: number
          track_stock?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          shop_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          shop_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          current_period_ends_at: string | null
          description: string | null
          has_selected_plan: boolean | null
          id: string
          is_active: boolean
          logo_url: string | null
          loyalty_points_expiration_months: number | null
          name: string
          owner_id: string
          payment_customer_id: string | null
          payment_provider: string | null
          payment_subscription_id: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          slug: string | null
          state: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          tax_id: string | null
          trial_ends_at: string | null
          updated_at: string
          wapi_instance_id: string | null
          wapi_token: string | null
          whatsapp_bot_enabled: boolean | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          current_period_ends_at?: string | null
          description?: string | null
          has_selected_plan?: boolean | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          loyalty_points_expiration_months?: number | null
          name: string
          owner_id: string
          payment_customer_id?: string | null
          payment_provider?: string | null
          payment_subscription_id?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          slug?: string | null
          state?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          tax_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          wapi_instance_id?: string | null
          wapi_token?: string | null
          whatsapp_bot_enabled?: boolean | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          current_period_ends_at?: string | null
          description?: string | null
          has_selected_plan?: boolean | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          loyalty_points_expiration_months?: number | null
          name?: string
          owner_id?: string
          payment_customer_id?: string | null
          payment_provider?: string | null
          payment_subscription_id?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          slug?: string | null
          state?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          tax_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          wapi_instance_id?: string | null
          wapi_token?: string | null
          whatsapp_bot_enabled?: boolean | null
        }
        Relationships: []
      }
      subscription_coupon_uses: {
        Row: {
          billing_id: string | null
          coupon_code: string
          id: string
          shop_id: string
          used_at: string
        }
        Insert: {
          billing_id?: string | null
          coupon_code: string
          id?: string
          shop_id: string
          used_at?: string
        }
        Update: {
          billing_id?: string | null
          coupon_code?: string
          id?: string
          shop_id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_coupon_uses_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          shop_id: string
          status: Database["public"]["Enums"]["conversation_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          shop_id: string
          status?: Database["public"]["Enums"]["conversation_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          shop_id?: string
          status?: Database["public"]["Enums"]["conversation_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          shop_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          shop_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          shop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          barber_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          shop_id: string
          start_time: string
        }
        Insert: {
          barber_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          shop_id: string
          start_time: string
        }
        Update: {
          barber_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          shop_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_shop_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _shop_id?: string
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: {
        Args: { coupon_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "owner" | "barber" | "client" | "super_admin"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      conversation_status: "open" | "pending" | "closed"
      payment_status: "pending" | "paid" | "refunded"
      subscription_plan: "essencial" | "profissional" | "elite"
      subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
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
      app_role: ["owner", "barber", "client", "super_admin"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      conversation_status: ["open", "pending", "closed"],
      payment_status: ["pending", "paid", "refunded"],
      subscription_plan: ["essencial", "profissional", "elite"],
      subscription_status: [
        "trial",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
    },
  },
} as const
