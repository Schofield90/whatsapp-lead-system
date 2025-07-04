import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceClient();
    
    console.log('🔍 Debug endpoint called, checking database...');
    
    // Check if table exists and get all call recordings
    const { data: recordings, error } = await supabase
      .from('call_recordings')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('📊 Database query result:', { 
      error: error?.message, 
      recordingsCount: recordings?.length,
      firstRecording: recordings?.[0] 
    });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: recordings?.length || 0,
      recordings: recordings || [],
      debug: {
        tableExists: !error,
        errorDetails: error?.message,
        sampleRecord: recordings?.[0] || null
      }
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}