export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Plan = 'free' | 'pro' | 'business';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          plan: Plan;
          usage_count: number;
          usage_reset_at: string | null;
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          plan?: Plan;
          usage_count?: number;
          usage_reset_at?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          plan?: Plan;
          usage_count?: number;
          usage_reset_at?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          doc_type: string;
          score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          doc_type: string;
          score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          filename?: string;
          doc_type?: string;
          score?: number | null;
          created_at?: string;
        };
      };
      rewrites: {
        Row: {
          id: string;
          document_id: string;
          original_text: string;
          fixed_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          original_text: string;
          fixed_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          original_text?: string;
          fixed_text?: string;
          created_at?: string;
        };
      };
    };
  };
}
