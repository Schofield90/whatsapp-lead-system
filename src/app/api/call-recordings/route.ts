import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = await createClient();
    
    const { data: recordings, error } = await supabase
      .from('call_recordings')
      .select('*')
      .eq('organization_id', userProfile.profile.organization_id)
      .order('created_at', { ascending: false });

    // Get real file sizes from storage for recordings without size info
    if (recordings) {
      for (const recording of recordings) {
        if (!recording.file_size) {
          try {
            const { data: fileInfo } = await supabase.storage
              .from('call-recordings')
              .list('', {
                search: recording.original_filename
              });
            
            if (fileInfo && fileInfo.length > 0) {
              const realSize = fileInfo[0].metadata?.size;
              if (realSize) {
                // Update the recording with real size
                recording.file_size = realSize;
                await supabase
                  .from('call_recordings')
                  .update({ file_size: realSize })
                  .eq('id', recording.id);
              }
            }
          } catch (e) {
            console.log('Could not get size for:', recording.original_filename);
          }
        }
      }
    }

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