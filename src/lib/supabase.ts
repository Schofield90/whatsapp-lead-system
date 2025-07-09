import { createClient } from '@supabase/supabase-js'

// Lazy initialization of Supabase clients to avoid build-time errors
let supabaseClient: ReturnType<typeof createClient> | null = null;
let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

function getSupabaseAdminClient() {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    
    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey);
  }
  return supabaseAdminClient;
}

export const supabase = getSupabaseClient;
export const supabaseAdmin = getSupabaseAdminClient;

// Export createClient function for calendar integration
export function createClient() {
  return getSupabaseClient();
}