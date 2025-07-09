import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeByType, addKnowledgeEntry, KNOWLEDGE_TYPES } from '@/lib/knowledge';
import { addKnowledgeEntryWithErrors } from '@/lib/knowledge-with-errors';

/**
 * GET /api/knowledge - Fetch knowledge entries
 * Query params: ?type=faq,sop (optional, comma-separated types)
 */
export async function GET(request: NextRequest) {
  console.log('[GET /api/knowledge] Request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');
    
    // Parse types from query parameter
    const types = typeParam ? typeParam.split(',').map(t => t.trim()) : undefined;
    
    console.log('[GET /api/knowledge] Fetching knowledge entries, types:', types);
    
    // Fetch knowledge entries from Supabase
    const knowledge = await getKnowledgeByType(types);
    
    console.log(`[GET /api/knowledge] Retrieved ${knowledge.length} entries`);
    
    return NextResponse.json({
      success: true,
      data: knowledge,
      count: knowledge.length,
      availableTypes: Object.values(KNOWLEDGE_TYPES)
    });
    
  } catch (error) {
    console.error('[GET /api/knowledge] Error:', error);
    
    const errorResponse: any = {
      success: false,
      error: 'Failed to fetch knowledge entries',
      details: {
        message: 'Error retrieving data from database'
      }
    };
    
    if (error instanceof Error) {
      errorResponse.details.error = error.message;
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST /api/knowledge - Add new knowledge entry
 * Body: { type: string, content: string }
 */
export async function POST(request: NextRequest) {
  console.log('[POST /api/knowledge] Request received');
  
  try {
    // Step 1: Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
    };
    
    console.log('[POST /api/knowledge] Environment check:', {
      hasSupabaseUrl: !!envCheck.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!envCheck.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPrefix: envCheck.NEXT_PUBLIC_SUPABASE_URL ? envCheck.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'MISSING',
      anonKeyPrefix: envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY ? envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'MISSING'
    });
    
    // Check for missing required environment variables
    if (!envCheck.NEXT_PUBLIC_SUPABASE_URL || !envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const missingVars = [];
      if (!envCheck.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      
      console.error('[POST /api/knowledge] Missing environment variables:', missingVars);
      
      return NextResponse.json({
        success: false,
        error: 'Missing required environment variables',
        details: {
          missing: missingVars,
          message: 'Please set the missing environment variables in your .env.local file or Vercel dashboard'
        }
      }, { status: 500 });
    }
    
    // Step 2: Parse request body
    let body;
    try {
      body = await request.json();
      console.log('[POST /api/knowledge] Request body:', {
        type: body.type,
        contentLength: body.content ? body.content.length : 0,
        contentPreview: body.content ? body.content.substring(0, 100) + '...' : 'MISSING'
      });
    } catch (parseError) {
      console.error('[POST /api/knowledge] Failed to parse request body:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        details: {
          message: 'Request body must be valid JSON with type and content fields',
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        }
      }, { status: 400 });
    }
    
    const { type, content } = body;
    
    // Step 3: Validate required fields
    if (!type || !content) {
      const missingFields = [];
      if (!type) missingFields.push('type');
      if (!content) missingFields.push('content');
      
      console.error('[POST /api/knowledge] Missing required fields:', missingFields);
      
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        details: {
          missing: missingFields,
          message: 'Both type and content fields are required',
          received: { type: !!type, content: !!content }
        }
      }, { status: 400 });
    }
    
    // Step 4: Validate type
    const validTypes = Object.values(KNOWLEDGE_TYPES);
    if (!validTypes.includes(type)) {
      console.error('[POST /api/knowledge] Invalid type:', type);
      
      return NextResponse.json({
        success: false,
        error: 'Invalid knowledge type',
        details: {
          provided: type,
          validTypes: validTypes,
          message: `Type must be one of: ${validTypes.join(', ')}`
        }
      }, { status: 400 });
    }
    
    console.log('[POST /api/knowledge] Validated input, attempting to add knowledge entry...');
    
    // Step 5: Add knowledge entry to Supabase with detailed error handling
    try {
      const result = await addKnowledgeEntryWithErrors(type, content);
      
      if (!result.success) {
        console.error('[POST /api/knowledge] Failed to create entry:', result.error);
        
        // Return the detailed error from the knowledge service
        return NextResponse.json({
          success: false,
          error: 'Failed to create knowledge entry',
          details: result.error
        }, { status: 500 });
      }
      
      console.log('[POST /api/knowledge] Knowledge entry created successfully:', result.data.id);
      
      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Knowledge entry created successfully'
      });
      
    } catch (supabaseError) {
      console.error('[POST /api/knowledge] Unexpected error during insert:', supabaseError);
      
      // Extract useful error details
      const errorDetails: any = {
        message: 'Unexpected error during database operation',
        type: 'unexpected_database_error'
      };
      
      if (supabaseError instanceof Error) {
        errorDetails.error = supabaseError.message;
        errorDetails.stack = supabaseError.stack;
      }
      
      return NextResponse.json({
        success: false,
        error: 'Database operation failed unexpectedly',
        details: errorDetails
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[POST /api/knowledge] Unexpected error:', error);
    
    // Comprehensive error response
    const errorResponse: any = {
      success: false,
      error: 'Internal server error',
      details: {
        message: 'An unexpected error occurred',
        type: 'unexpected_error'
      }
    };
    
    if (error instanceof Error) {
      errorResponse.details.error = error.message;
      errorResponse.details.stack = error.stack;
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}