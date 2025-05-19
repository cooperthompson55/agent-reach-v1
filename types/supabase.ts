export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string
          agent_name: string
          agent_email: string | null
          agent_phone: string | null
          property_address: string
          property_city: string
          property_postal: string
          property_price: string
          photo_count: number
          listing_url: string
          listing_date: string
          brokerage_name: string
          listing_source: string
          notes: string | null
          instagram_account: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_name: string
          agent_email?: string | null
          agent_phone?: string | null
          property_address: string
          property_city: string
          property_postal: string
          property_price: string
          photo_count?: number
          listing_url: string
          listing_date: string
          brokerage_name: string
          listing_source: string
          notes?: string | null
          instagram_account?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_name?: string
          agent_email?: string | null
          agent_phone?: string | null
          property_address?: string
          property_city?: string
          property_postal?: string
          property_price?: string
          photo_count?: number
          listing_url?: string
          listing_date?: string
          brokerage_name?: string
          listing_source?: string
          notes?: string | null
          instagram_account?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 