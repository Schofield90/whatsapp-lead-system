import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

/**
 * Test Supabase connection and configuration
 * GET /api/test-supabase
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    
    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'Missing',
      anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'Missing',
      serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
        process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...' : 'Missing'
    };
    
    console.log('Environment check:', envCheck);
    
    // Test regular client connection
    let anonClientTest = null;
    try {
      const anonClient = supabase();
      const { data: anonData, error: anonError } = await anonClient
        .from('knowledge')
        .select('count', { count: 'exact', head: true });
      
      anonClientTest = {
        success: !anonError,
        error: anonError?.message,
        code: anonError?.code,
        count: anonData
      };
    } catch (error: any) {
      anonClientTest = {
        success: false,
        error: error.message,
        type: 'connection_error'
      };
    }
    
    // Test admin client connection
    let adminClientTest = null;
    try {
      const adminClient = supabaseAdmin();
      const { data: adminData, error: adminError } = await adminClient
        .from('knowledge')
        .select('count', { count: 'exact', head: true });
      
      adminClientTest = {
        success: !adminError,
        error: adminError?.message,
        code: adminError?.code,
        count: adminData
      };
    } catch (error: any) {
      adminClientTest = {
        success: false,
        error: error.message,
        type: 'connection_error'
      };
    }
    
    // Test table structure
    let tableStructureTest = null;
    try {
      const adminClient = supabaseAdmin();
      const { data: columns, error: structureError } = await adminClient
        .rpc('get_table_columns', { table_name: 'knowledge' })
        .single();
      
      tableStructureTest = {
        success: !structureError,
        error: structureError?.message,
        columns: columns
      };
    } catch (error: any) {
      // Fallback: try to query the table directly
      try {
        const adminClient = supabaseAdmin();
        const { data: sample, error: sampleError } = await adminClient
          .from('knowledge')
          .select('*')
          .limit(1);
          
        tableStructureTest = {
          success: !sampleError,
          error: sampleError?.message,
          sampleExists: !!sample && sample.length > 0,
          sampleData: sample?.[0]
        };
      } catch (fallbackError: any) {
        tableStructureTest = {
          success: false,
          error: fallbackError.message,
          type: 'table_access_error'
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      tests: {
        anonClient: anonClientTest,
        adminClient: adminClientTest,
        tableStructure: tableStructureTest
      },
      recommendations: [
        envCheck.hasSupabaseUrl ? null : "❌ Set NEXT_PUBLIC_SUPABASE_URL",
        envCheck.hasAnonKey ? null : "❌ Set NEXT_PUBLIC_SUPABASE_ANON_KEY", 
        envCheck.hasServiceRoleKey ? null : "⚠️ Set SUPABASE_SERVICE_ROLE_KEY for admin operations",
        anonClientTest?.success ? null : "❌ Fix anon client connection",
        adminClientTest?.success ? null : "⚠️ Fix admin client connection", 
        tableStructureTest?.success ? null : "❌ Create or fix knowledge table"
      ].filter(Boolean)
    });
    
  } catch (error: any) {
    console.error('Error in Supabase test:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}