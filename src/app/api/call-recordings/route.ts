import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = await createClient();
    
    const { data: recordings, error } = await supabase
      .from('call_recordings')
      .select(`
        *,
        transcripts:call_transcripts(
          id,
          raw_transcript,
          confidence_score,
          language
        )
      `)
      .eq('organization_id', userProfile.profile.organization_id)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching call recordings:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch recordings' 
      }, { status: 500 });
    }

    return NextResponse.json({
      recordings: recordings || []
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}