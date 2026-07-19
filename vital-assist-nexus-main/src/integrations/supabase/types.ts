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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          meta: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          meta?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          meta?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      ambulance_requests: {
        Row: {
          assigned_ambulance: string | null
          created_at: string
          destination: string | null
          eta_min: number | null
          id: string
          patient_name: string | null
          pickup: string | null
          sos_id: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_ambulance?: string | null
          created_at?: string
          destination?: string | null
          eta_min?: number | null
          id?: string
          patient_name?: string | null
          pickup?: string | null
          sos_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_ambulance?: string | null
          created_at?: string
          destination?: string | null
          eta_min?: number | null
          id?: string
          patient_name?: string | null
          pickup?: string | null
          sos_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_requests_sos_id_fkey"
            columns: ["sos_id"]
            isOneToOne: false
            referencedRelation: "sos_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appt_at: string
          created_at: string
          doctor_name: string
          hospital: string | null
          id: string
          notes: string | null
          specialty: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          appt_at: string
          created_at?: string
          doctor_name: string
          hospital?: string | null
          id?: string
          notes?: string | null
          specialty?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          appt_at?: string
          created_at?: string
          doctor_name?: string
          hospital?: string | null
          id?: string
          notes?: string | null
          specialty?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blood_banks: {
        Row: {
          city: string | null
          created_at: string
          critical_requests: number | null
          id: string
          inventory: Json | null
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          critical_requests?: number | null
          id?: string
          inventory?: Json | null
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          critical_requests?: number | null
          id?: string
          inventory?: Json | null
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blood_requests: {
        Row: {
          blood_group: string
          city: string | null
          contact_phone: string | null
          created_at: string
          hospital: string | null
          id: string
          notes: string | null
          patient_name: string
          status: string | null
          units_needed: number
          updated_at: string
          urgency: Database["public"]["Enums"]["priority_level"]
          user_id: string
        }
        Insert: {
          blood_group: string
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          hospital?: string | null
          id?: string
          notes?: string | null
          patient_name: string
          status?: string | null
          units_needed?: number
          updated_at?: string
          urgency?: Database["public"]["Enums"]["priority_level"]
          user_id: string
        }
        Update: {
          blood_group?: string
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          hospital?: string | null
          id?: string
          notes?: string | null
          patient_name?: string
          status?: string | null
          units_needed?: number
          updated_at?: string
          urgency?: Database["public"]["Enums"]["priority_level"]
          user_id?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          priority: number
          relation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          priority?: number
          relation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          priority?: number
          relation?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hospitals: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          doctors_on_duty: number | null
          emergency_queue: number | null
          general_beds_free: number | null
          general_beds_total: number | null
          icu_beds_free: number | null
          icu_beds_total: number | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          rating: number | null
          specialties: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          doctors_on_duty?: number | null
          emergency_queue?: number | null
          general_beds_free?: number | null
          general_beds_total?: number | null
          icu_beds_free?: number | null
          icu_beds_total?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          rating?: number | null
          specialties?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          doctors_on_duty?: number | null
          emergency_queue?: number | null
          general_beds_free?: number | null
          general_beds_total?: number | null
          icu_beds_free?: number | null
          icu_beds_total?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          rating?: number | null
          specialties?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          hospital: string | null
          id: string
          notes: string | null
          prescription: string | null
          record_date: string
          record_type: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          hospital?: string | null
          id?: string
          notes?: string | null
          prescription?: string | null
          record_date?: string
          record_type: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          hospital?: string | null
          id?: string
          notes?: string | null
          prescription?: string | null
          record_date?: string
          record_type?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string[] | null
          avatar_url: string | null
          blood_group: string | null
          conditions: string[] | null
          created_at: string
          dob: string | null
          email: string
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          insurance: Json | null
          last_login: string | null
          phone: string | null
          provider: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          blood_group?: string | null
          conditions?: string[] | null
          created_at?: string
          dob?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          insurance?: Json | null
          last_login?: string | null
          phone?: string | null
          provider?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          blood_group?: string | null
          conditions?: string[] | null
          created_at?: string
          dob?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          insurance?: Json | null
          last_login?: string | null
          phone?: string | null
          provider?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      sos_requests: {
        Row: {
          ambulance_code: string | null
          created_at: string
          distance_km: number | null
          eta_min: number | null
          hospital_name: string | null
          id: string
          lat: number | null
          lng: number | null
          location_text: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          reason: string | null
          status: Database["public"]["Enums"]["sos_status"]
          timeline: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ambulance_code?: string | null
          created_at?: string
          distance_km?: number | null
          eta_min?: number | null
          hospital_name?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_text?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          reason?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          timeline?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ambulance_code?: string | null
          created_at?: string
          distance_km?: number | null
          eta_min?: number | null
          hospital_name?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_text?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          reason?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          timeline?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      triage_reports: {
        Row: {
          ai_summary: string | null
          confidence: number | null
          created_at: string
          department: string | null
          hospital_recommendation: string | null
          id: string
          possible_conditions: string[] | null
          risk_score: number
          severity: Database["public"]["Enums"]["priority_level"]
          symptoms: string[]
          user_id: string
          vitals: Json | null
        }
        Insert: {
          ai_summary?: string | null
          confidence?: number | null
          created_at?: string
          department?: string | null
          hospital_recommendation?: string | null
          id?: string
          possible_conditions?: string[] | null
          risk_score?: number
          severity?: Database["public"]["Enums"]["priority_level"]
          symptoms?: string[]
          user_id: string
          vitals?: Json | null
        }
        Update: {
          ai_summary?: string | null
          confidence?: number | null
          created_at?: string
          department?: string | null
          hospital_recommendation?: string | null
          id?: string
          possible_conditions?: string[] | null
          risk_score?: number
          severity?: Database["public"]["Enums"]["priority_level"]
          symptoms?: string[]
          user_id?: string
          vitals?: Json | null
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
      user_settings: {
        Row: {
          created_at: string
          email_prefs: Json | null
          language: string | null
          notifications: Json | null
          privacy: Json | null
          sos_prefs: Json | null
          theme: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_prefs?: Json | null
          language?: string | null
          notifications?: Json | null
          privacy?: Json | null
          sos_prefs?: Json | null
          theme?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_prefs?: Json | null
          language?: string | null
          notifications?: Json | null
          privacy?: Json | null
          sos_prefs?: Json | null
          theme?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
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
      app_role: "patient" | "hospital" | "ambulance" | "blood_bank" | "admin"
      appointment_status: "upcoming" | "completed" | "cancelled"
      priority_level: "critical" | "high" | "moderate" | "low"
      sos_status:
        | "pending"
        | "accepted"
        | "dispatched"
        | "arriving"
        | "picked"
        | "reached"
        | "completed"
        | "cancelled"
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
      app_role: ["patient", "hospital", "ambulance", "blood_bank", "admin"],
      appointment_status: ["upcoming", "completed", "cancelled"],
      priority_level: ["critical", "high", "moderate", "low"],
      sos_status: [
        "pending",
        "accepted",
        "dispatched",
        "arriving",
        "picked",
        "reached",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
