import { supabaseAdmin } from '@/lib/supabase';
import { KnowledgeEntry } from '@/lib/knowledge';

/**
 * Enhanced knowledge entry creation with detailed error reporting
 * @param type - Knowledge type
 * @param content - Knowledge content
 * @returns Promise with either the created entry or an error object
 */
export async function addKnowledgeEntryWithErrors(
  type: string, 
  content: string
): Promise<{ success: true; data: KnowledgeEntry } | { success: false; error: any }> {
  console.log('[addKnowledgeEntryWithErrors] Starting...');
  
  try {
    // Check environment variables first
    const envCheck = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    };
    
    console.log('[addKnowledgeEntryWithErrors] Environment check:', {
      hasUrl: !!envCheck.url,
      hasAnonKey: !!envCheck.anonKey,
      hasServiceKey: !!envCheck.serviceKey,
      urlValue: envCheck.url?.substring(0, 30) + '...',
      isPlaceholder: envCheck.url === 'your_supabase_url'
    });
    
    // Check for placeholder values
    if (envCheck.url === 'your_supabase_url' || envCheck.anonKey === 'your_supabase_anon_key') {
      return {
        success: false,
        error: {
          type: 'INVALID_ENV_VARS',
          message: 'Environment variables contain placeholder values',
          details: {
            hint: 'Please update your .env.local file with actual Supabase credentials',
            hasPlaceholderUrl: envCheck.url === 'your_supabase_url',
            hasPlaceholderKey: envCheck.anonKey === 'your_supabase_anon_key'
          }
        }
      };
    }
    
    // Try to get client
    let client;
    let clientType;
    
    try {
      client = supabaseAdmin();
      clientType = 'admin';
      console.log('[addKnowledgeEntryWithErrors] Using admin client');
    } catch (adminError) {
      console.warn('[addKnowledgeEntryWithErrors] Admin client failed, trying anon client:', adminError);
      
      try {
        const { supabase } = await import('@/lib/supabase');
        client = supabase();
        clientType = 'anon';
        console.log('[addKnowledgeEntryWithErrors] Using anon client');
      } catch (anonError) {
        return {
          success: false,
          error: {
            type: 'CLIENT_INIT_ERROR',
            message: 'Failed to initialize Supabase client',
            details: {
              adminError: adminError instanceof Error ? adminError.message : 'Unknown',
              anonError: anonError instanceof Error ? anonError.message : 'Unknown'
            }
          }
        };
      }
    }
    
    // Attempt to insert
    console.log(`[addKnowledgeEntryWithErrors] Attempting insert with ${clientType} client`);
    
    const { data, error } = await client
      .from('knowledge')
      .insert([{ type, content }])
      .select()
      .single();
    
    if (error) {
      console.error(`[addKnowledgeEntryWithErrors] Supabase error with ${clientType} client:`, error);
      
      // Build detailed error response
      const errorResponse = {
        type: 'SUPABASE_ERROR',
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        clientType: clientType
      };
      
      // Add specific guidance based on error code
      if (error.code === '42501') {
        errorResponse.hint = 'Row Level Security policy violation. Run the fix-rls-policies.sql script in your Supabase SQL editor.';
      } else if (error.code === '42P01') {
        errorResponse.hint = 'Knowledge table does not exist. Run the new-knowledge-schema.sql script in your Supabase SQL editor.';
      } else if (error.code === '23505') {
        errorResponse.hint = 'This entry already exists in the database.';
      } else if (error.message?.includes('JWT')) {
        errorResponse.hint = 'Authentication error. Check that your Supabase API keys are correct and not expired.';
      } else if (error.message?.includes('Invalid URL')) {
        errorResponse.hint = 'Invalid Supabase URL. Check NEXT_PUBLIC_SUPABASE_URL in your environment variables.';
      }
      
      return {
        success: false,
        error: errorResponse
      };
    }
    
    console.log(`[addKnowledgeEntryWithErrors] Success! Entry created with ID:`, data.id);
    
    return {
      success: true,
      data: data as unknown as KnowledgeEntry
    };
    
  } catch (unexpectedError) {
    console.error('[addKnowledgeEntryWithErrors] Unexpected error:', unexpectedError);
    
    return {
      success: false,
      error: {
        type: 'UNEXPECTED_ERROR',
        message: unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error',
        stack: unexpectedError instanceof Error ? unexpectedError.stack : undefined
      }
    };
  }
}