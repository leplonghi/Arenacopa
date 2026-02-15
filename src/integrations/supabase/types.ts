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
      bolao_members: {
        Row: {
          bolao_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          bolao_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          bolao_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_members_bolao_id_fkey"
            columns: ["bolao_id"]
            isOneToOne: false
            referencedRelation: "boloes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bolao_palpites: {
        Row: {
          away_score: number
          bolao_id: string
          created_at: string
          home_score: number
          id: string
          match_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          away_score?: number
          bolao_id: string
          created_at?: string
          home_score?: number
          id?: string
          match_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          away_score?: number
          bolao_id?: string
          created_at?: string
          home_score?: number
          id?: string
          match_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_palpites_bolao_id_fkey"
            columns: ["bolao_id"]
            isOneToOne: false
            referencedRelation: "boloes"
            referencedColumns: ["id"]
          },
        ]
      }
      boloes: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          invite_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          invite_code?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_code: string | null
          created_at: string | null
          date: string
          group_id: string | null
          home_score: number | null
          home_team_code: string | null
          id: string
          phase: string
          round_name: string | null
          stadium_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_code?: string | null
          created_at?: string | null
          date: string
          group_id?: string | null
          home_score?: number | null
          home_team_code?: string | null
          id: string
          phase: string
          round_name?: string | null
          stadium_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_code?: string | null
          created_at?: string | null
          date?: string
          group_id?: string | null
          home_score?: number | null
          home_team_code?: string | null
          id?: string
          phase?: string
          round_name?: string | null
          stadium_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_code_fkey"
            columns: ["away_team_code"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "matches_home_team_code_fkey"
            columns: ["home_team_code"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "matches_stadium_id_fkey"
            columns: ["stadium_id"]
            isOneToOne: false
            referencedRelation: "stadiums"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          id: string
          title: string
          summary: string | null
          url: string | null
          image_url: string | null
          source: string | null
          category: string | null
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          summary?: string | null
          url?: string | null
          image_url?: string | null
          source?: string | null
          category?: string | null
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          summary?: string | null
          url?: string | null
          image_url?: string | null
          source?: string | null
          category?: string | null
          published_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      curiosities: {
        Row: {
          id: string
          content: string
          category: string | null
          image_url: string | null
          displayed_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          category?: string | null
          image_url?: string | null
          displayed_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          category?: string | null
          image_url?: string | null
          displayed_count?: number | null
          created_at?: string
        }
        Relationships: []
      }
      team_updates: {
        Row: {
          id: string
          team_code: string
          content: string
          type: string | null
          source_url: string | null
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_code: string
          content: string
          type?: string | null
          source_url?: string | null
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_code?: string
          content?: string
          type?: string | null
          source_url?: string | null
          published_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      city_status: {
        Row: {
          city_id: string
          temperature: number | null
          condition: string | null
          last_updated: string | null
        }
        Insert: {
          city_id: string
          temperature?: number | null
          condition?: string | null
          last_updated?: string | null
        }
        Update: {
          city_id?: string
          temperature?: number | null
          condition?: string | null
          last_updated?: string | null
        }
        Relationships: []
      }
      stadium_status: {
        Row: {
          stadium_id: string
          status: string | null
          next_match_id: string | null
          last_updated: string | null
        }
        Insert: {
          stadium_id: string
          status?: string | null
          next_match_id?: string | null
          last_updated?: string | null
        }
        Update: {
          stadium_id?: string
          status?: string | null
          next_match_id?: string | null
          last_updated?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          link: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
          link?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          link?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          nickname: string | null
          birth_date: string | null
          gender: string | null
          nationality: string | null
          updated_at: string
          user_id: string
          preferred_language: string | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          nickname?: string | null
          birth_date?: string | null
          gender?: string | null
          nationality?: string | null
          updated_at?: string
          user_id: string
          preferred_language?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          nickname?: string | null
          birth_date?: string | null
          gender?: string | null
          nationality?: string | null
          updated_at?: string
          user_id?: string
          preferred_language?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
        }
        Relationships: []
      }
      simulations: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          selected_groups: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          selected_groups?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          selected_groups?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stadiums: {
        Row: {
          capacity: number | null
          city: string
          climate_hint: string | null
          country: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          timezone: string | null
        }
        Insert: {
          capacity?: number | null
          city: string
          climate_hint?: string | null
          country: string
          id: string
          lat?: number | null
          lng?: number | null
          name: string
          timezone?: string | null
        }
        Update: {
          capacity?: number | null
          city?: string
          climate_hint?: string | null
          country?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          timezone?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          code: string
          confederation: string | null
          demographics: Json | null
          fifa_ranking: number | null
          fifa_titles: number | null
          flag: string
          group_id: string | null
          name: string
          qualifiers_stats: Json | null
        }
        Insert: {
          code: string
          confederation?: string | null
          demographics?: Json | null
          fifa_ranking?: number | null
          fifa_titles?: number | null
          flag: string
          group_id?: string | null
          name: string
          qualifiers_stats?: Json | null
        }
        Update: {
          code?: string
          confederation?: string | null
          demographics?: Json | null
          fifa_ranking?: number | null
          fifa_titles?: number | null
          flag?: string
          group_id?: string | null
          name?: string
          qualifiers_stats?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_bolao_creator: {
        Args: { _bolao_id: string; _user_id: string }
        Returns: boolean
      }
      is_member_of_bolao: {
        Args: { _bolao_id: string; _user_id: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
