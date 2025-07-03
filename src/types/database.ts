export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          domain: string | null;
          created_at: string;
          settings: Record<string, any>;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          domain?: string | null;
          created_at?: string;
          settings?: Record<string, any>;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string | null;
          created_at?: string;
          settings?: Record<string, any>;
          is_active?: boolean;
        };
      };
      users: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          email: string;
          role?: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: string;
          name?: string | null;
          created_at?: string;
        };
      };
      lead_sources: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          source_type: string | null;
          webhook_token: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          source_type?: string | null;
          webhook_token?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          source_type?: string | null;
          webhook_token?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          organization_id: string;
          lead_source_id: string;
          name: string;
          phone: string;
          email: string | null;
          facebook_lead_id: string | null;
          status: string;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_source_id: string;
          name: string;
          phone: string;
          email?: string | null;
          facebook_lead_id?: string | null;
          status?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_source_id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          facebook_lead_id?: string | null;
          status?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          twilio_conversation_sid: string | null;
          status: string;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          twilio_conversation_sid?: string | null;
          status?: string;
          last_message_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          twilio_conversation_sid?: string | null;
          status?: string;
          last_message_at?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          direction: string;
          content: string;
          twilio_message_sid: string | null;
          claude_response_data: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          direction: string;
          content: string;
          twilio_message_sid?: string | null;
          claude_response_data?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          direction?: string;
          content?: string;
          twilio_message_sid?: string | null;
          claude_response_data?: Record<string, any> | null;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          conversation_id: string;
          google_calendar_event_id: string | null;
          google_meet_link: string | null;
          scheduled_at: string;
          duration_minutes: number;
          status: string;
          reminder_sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          conversation_id: string;
          google_calendar_event_id?: string | null;
          google_meet_link?: string | null;
          scheduled_at: string;
          duration_minutes?: number;
          status?: string;
          reminder_sent?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          conversation_id?: string;
          google_calendar_event_id?: string | null;
          google_meet_link?: string | null;
          scheduled_at?: string;
          duration_minutes?: number;
          status?: string;
          reminder_sent?: boolean;
          created_at?: string;
        };
      };
      training_data: {
        Row: {
          id: string;
          organization_id: string;
          data_type: string;
          content: string;
          is_active: boolean;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          data_type: string;
          content: string;
          is_active?: boolean;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          data_type?: string;
          content?: string;
          is_active?: boolean;
          version?: number;
          created_at?: string;
        };
      };
      organization_secrets: {
        Row: {
          id: string;
          organization_id: string;
          service_name: string;
          encrypted_credentials: Record<string, any>;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          service_name: string;
          encrypted_credentials: Record<string, any>;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          service_name?: string;
          encrypted_credentials?: Record<string, any>;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'booked' | 'completed' | 'lost';
export type ConversationStatus = 'active' | 'completed' | 'paused';
export type BookingStatus = 'scheduled' | 'completed' | 'no_show' | 'cancelled';
export type MessageDirection = 'inbound' | 'outbound';
export type TrainingDataType = 'sales_script' | 'objection_handling' | 'qualification_criteria';
export type ServiceName = 'twilio' | 'google_calendar' | 'claude' | 'email';