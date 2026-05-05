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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      campus_activities: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          posted_by: string
          tenant_id: string | null
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          posted_by: string
          tenant_id?: string | null
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          posted_by?: string
          tenant_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          media_url: string | null
          read_at: string | null
          room_id: string
          sender_id: string
          tenant_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_url?: string | null
          read_at?: string | null
          room_id: string
          sender_id: string
          tenant_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_url?: string | null
          read_at?: string | null
          room_id?: string
          sender_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          id: string
          name: string | null
          tenant_id: string | null
          type: Database["public"]["Enums"]["chat_room_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["chat_room_type"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["chat_room_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_assignments: {
        Row: {
          accepted_at: string | null
          created_at: string
          delivered_at: string | null
          id: string
          order_id: string
          pickup_lat: number | null
          pickup_lng: number | null
          rider_display_id: string | null
          rider_id: string | null
          search_radius: number
          status: Database["public"]["Enums"]["delivery_status"]
          tenant_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rider_display_id?: string | null
          rider_id?: string | null
          search_radius?: number
          status?: Database["public"]["Enums"]["delivery_status"]
          tenant_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          rider_display_id?: string | null
          rider_id?: string | null
          search_radius?: number
          status?: Database["public"]["Enums"]["delivery_status"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_logs: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      farmer_profiles: {
        Row: {
          created_at: string
          farm_type: string | null
          id: string
          is_approved: boolean
          products: string | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_type?: string | null
          id?: string
          is_approved?: boolean
          products?: string | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          farm_type?: string | null
          id?: string
          is_approved?: boolean
          products?: string | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farmer_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      group_buy_participants: {
        Row: {
          group_buy_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_buy_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_buy_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_buy_participants_group_buy_id_fkey"
            columns: ["group_buy_id"]
            isOneToOne: false
            referencedRelation: "group_buys"
            referencedColumns: ["id"]
          },
        ]
      }
      group_buys: {
        Row: {
          created_at: string
          creator_id: string
          current_participants: number
          expires_at: string
          group_price: number
          id: string
          meal_id: string
          min_participants: number
          original_price: number
          status: Database["public"]["Enums"]["group_buy_status"]
          tenant_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          current_participants?: number
          expires_at: string
          group_price: number
          id?: string
          meal_id: string
          min_participants: number
          original_price: number
          status?: Database["public"]["Enums"]["group_buy_status"]
          tenant_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          current_participants?: number
          expires_at?: string
          group_price?: number
          id?: string
          meal_id?: string
          min_participants?: number
          original_price?: number
          status?: Database["public"]["Enums"]["group_buy_status"]
          tenant_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_buys_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_buys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      health_tips: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      landmarks: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      meals: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          group_buy_discount_percent: number
          group_buy_enabled: boolean
          group_buy_min_qty: number
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          rating_avg: number | null
          rating_count: number | null
          stock_quantity: number | null
          tenant_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          group_buy_discount_percent?: number
          group_buy_enabled?: boolean
          group_buy_min_qty?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          rating_avg?: number | null
          rating_count?: number | null
          stock_quantity?: number | null
          tenant_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          group_buy_discount_percent?: number
          group_buy_enabled?: boolean
          group_buy_min_qty?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          rating_avg?: number | null
          rating_count?: number | null
          stock_quantity?: number | null
          tenant_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          channel: string
          content: string
          created_at: string
          direction: string
          id: string
          parsed_data: Json | null
          phone_number: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          content: string
          created_at?: string
          direction?: string
          id?: string
          parsed_data?: Json | null
          phone_number?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          direction?: string
          id?: string
          parsed_data?: Json | null
          phone_number?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          order_id: string
          quantity: number
          tenant_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          order_id: string
          quantity: number
          tenant_id?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          order_id?: string
          quantity?: number
          tenant_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          delivery_address: string | null
          delivery_fee: number | null
          id: string
          notes: string | null
          order_number: string
          payment_reference: string | null
          payment_status: string | null
          rider_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number | null
          tenant_id: string | null
          total_amount: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          delivery_address?: string | null
          delivery_fee?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_reference?: string | null
          payment_status?: string | null
          rider_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          tenant_id?: string | null
          total_amount: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          delivery_address?: string | null
          delivery_fee?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_reference?: string | null
          payment_status?: string | null
          rider_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          tenant_id?: string | null
          total_amount?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      paystack_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          purpose: string
          raw_response: Json | null
          reference: string
          status: string
          tenant_id: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          purpose: string
          raw_response?: Json | null
          reference: string
          status?: string
          tenant_id?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          purpose?: string
          raw_response?: Json | null
          reference?: string
          status?: string
          tenant_id?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paystack_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_approved: boolean
          phone: string | null
          state: string | null
          tenant_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_approved?: boolean
          phone?: string | null
          state?: string | null
          tenant_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_approved?: boolean
          phone?: string | null
          state?: string | null
          tenant_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      registered_members: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          other_details: Json | null
          phone: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          other_details?: Json | null
          phone?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          other_details?: Json | null
          phone?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          booking_fee: number
          created_at: string
          id: string
          notes: string | null
          party_size: number
          reservation_date: string
          status: Database["public"]["Enums"]["reservation_status"]
          tenant_id: string | null
          time_slot: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          booking_fee?: number
          created_at?: string
          id?: string
          notes?: string | null
          party_size?: number
          reservation_date: string
          status?: Database["public"]["Enums"]["reservation_status"]
          tenant_id?: string | null
          time_slot: string
          user_id: string
          vendor_id: string
        }
        Update: {
          booking_fee?: number
          created_at?: string
          id?: string
          notes?: string | null
          party_size?: number
          reservation_date?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          tenant_id?: string | null
          time_slot?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          rating: number
          reviewer_id: string
          tenant_id: string | null
          vendor_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          rating: number
          reviewer_id: string
          tenant_id?: string | null
          vendor_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          rating?: number
          reviewer_id?: string
          tenant_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_locations: {
        Row: {
          id: string
          is_available: boolean
          landmark_passed: string | null
          latitude: number
          longitude: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          is_available?: boolean
          landmark_passed?: string | null
          latitude?: number
          longitude?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          is_available?: boolean
          landmark_passed?: string | null
          latitude?: number
          longitude?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rider_profiles: {
        Row: {
          avg_speed: number | null
          created_at: string
          display_id: string | null
          id: string
          is_approved: boolean
          license_url: string | null
          tenant_id: string | null
          total_deliveries: number | null
          user_id: string
          vehicle_type: string | null
        }
        Insert: {
          avg_speed?: number | null
          created_at?: string
          display_id?: string | null
          id?: string
          is_approved?: boolean
          license_url?: string | null
          tenant_id?: string | null
          total_deliveries?: number | null
          user_id: string
          vehicle_type?: string | null
        }
        Update: {
          avg_speed?: number | null
          created_at?: string
          display_id?: string | null
          id?: string
          is_approved?: boolean
          license_url?: string | null
          tenant_id?: string | null
          total_deliveries?: number | null
          user_id?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          endpoint: string | null
          event_type: string
          id: string
          is_resolved: boolean
          severity: string
          source_ip: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          event_type: string
          id?: string
          is_resolved?: boolean
          severity?: string
          source_ip?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          event_type?: string
          id?: string
          is_resolved?: boolean
          severity?: string
          source_ip?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          priority: string
          resolved_by: string | null
          role: string | null
          status: string
          subject: string
          tenant_id: string | null
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          priority?: string
          resolved_by?: string | null
          role?: string | null
          status?: string
          subject: string
          tenant_id?: string | null
          ticket_number?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          priority?: string
          resolved_by?: string | null
          role?: string | null
          status?: string
          subject?: string
          tenant_id?: string | null
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          settings: Json
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          id: string
          last_seen: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          last_seen?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          last_seen?: string
          status?: string
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
      vendor_profiles: {
        Row: {
          business_description: string | null
          business_name: string
          created_at: string
          delivery_multiplier: number
          food_category: string | null
          id: string
          is_approved: boolean
          kitchen_photos: string[] | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          business_description?: string | null
          business_name: string
          created_at?: string
          delivery_multiplier?: number
          food_category?: string | null
          id?: string
          is_approved?: boolean
          kitchen_photos?: string[] | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          business_description?: string | null
          business_name?: string
          created_at?: string
          delivery_multiplier?: number
          food_category?: string | null
          id?: string
          is_approved?: boolean
          kitchen_photos?: string[] | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          metadata: Json
          reference: string
          related_order_id: string | null
          related_paystack_ref: string | null
          tenant_id: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          metadata?: Json
          reference: string
          related_order_id?: string | null
          related_paystack_ref?: string | null
          tenant_id?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          metadata?: Json
          reference?: string
          related_order_id?: string | null
          related_paystack_ref?: string | null
          tenant_id?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          status: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          active: boolean
          base_fee: number
          created_at: string
          id: string
          name: string
          per_km_fee: number
          polygon: Json | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_fee?: number
          created_at?: string
          id?: string
          name: string
          per_km_fee?: number
          polygon?: Json | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_fee?: number
          created_at?: string
          id?: string
          name?: string
          per_km_fee?: number
          polygon?: Json | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      audit_logs: {
        Row: {
          actor_id: string | null
          created_at: string | null
          event_type: string | null
          id: string | null
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string | null
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string | null
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      mark_messages_as_read: {
        Args: { message_ids: string[]; user_id: string }
        Returns: undefined
      }
      settle_order_payment: {
        Args: { _buyer_id: string; _order_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "buyer"
        | "vendor"
        | "farmer"
        | "rider"
        | "admin"
        | "super_admin"
        | "tenant_admin"
        | "support_agent"
        | "vendor_staff"
      chat_room_type: "direct" | "group"
      delivery_status:
        | "searching"
        | "offered"
        | "accepted"
        | "picked_up"
        | "delivered"
        | "cancelled"
      group_buy_status: "active" | "completed" | "expired" | "cancelled"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "rider_assigned"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      reservation_status: "pending" | "confirmed" | "cancelled" | "completed"
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
      app_role: [
        "buyer",
        "vendor",
        "farmer",
        "rider",
        "admin",
        "super_admin",
        "tenant_admin",
        "support_agent",
        "vendor_staff",
      ],
      chat_room_type: ["direct", "group"],
      delivery_status: [
        "searching",
        "offered",
        "accepted",
        "picked_up",
        "delivered",
        "cancelled",
      ],
      group_buy_status: ["active", "completed", "expired", "cancelled"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "rider_assigned",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      reservation_status: ["pending", "confirmed", "cancelled", "completed"],
    },
  },
} as const
