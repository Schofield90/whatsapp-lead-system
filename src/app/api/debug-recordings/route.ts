import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceClient();
    
    // Get all call recordings
    const { data: recordings, error } = await supabase
      .from('call_recordings')
      .select('*')
      .order('upload_date', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: recordings?.length || 0,
      recordings: recordings || []
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}