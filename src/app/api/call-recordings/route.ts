import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
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

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    
    const {
      organization_id,
      original_filename,
      file_url,
      file_size,
      duration_seconds,
      status,
      transcription_status
    } = body;

    console.log('Saving call recording metadata:', { organization_id, original_filename, file_url });

    // Insert call recording metadata
    const { data, error } = await supabase
      .from('call_recordings')
      .insert({
        organization_id,
        original_filename,
        file_url,
        file_size,
        duration_seconds,
        status,
        transcription_status
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to save recording metadata',
        details: error.message 
      }, { status: 500 });
    }

    console.log('Call recording saved successfully:', data.id);
    return NextResponse.json({ success: true, recording: data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}