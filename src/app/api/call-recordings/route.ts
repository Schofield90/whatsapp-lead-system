import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userProfile = await getUserProfile();
    
    if (!userProfile?.profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 401 });
    }

    // Get call recordings from storage bucket
    const { data: files, error: storageError } = await supabase.storage
      .from('call-recordings')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (storageError) {
      console.error('Error fetching storage files:', storageError);
      return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
    }

    // Get call recordings metadata from database
    const { data: recordings, error: dbError } = await supabase
      .rpc('get_call_recordings_with_transcriptions', {
        org_id: userProfile.profile.organization_id
      });

    if (dbError) {
      console.error('Error fetching recordings metadata:', dbError);
      return NextResponse.json({ error: 'Failed to fetch recordings metadata' }, { status: 500 });
    }

    // Combine storage files with database metadata
    const combinedData = files?.map(file => {
      const metadata = recordings?.find(r => r.file_name === file.name);
      return {
        id: metadata?.recording_id || file.name,
        fileName: file.name,
        size: file.metadata?.size,
        lastModified: file.updated_at,
        url: supabase.storage.from('call-recordings').getPublicUrl(file.name).data.publicUrl,
        // Database metadata
        leadName: metadata?.lead_name,
        leadPhone: metadata?.lead_phone,
        callDate: metadata?.call_date,
        duration: metadata?.duration_seconds,
        callType: metadata?.call_type,
        status: metadata?.status || 'unprocessed',
        transcription: metadata?.transcription_text,
        summary: metadata?.summary,
        keyPoints: metadata?.key_points,
        sentiment: metadata?.sentiment,
        actionItems: metadata?.action_items
      };
    }) || [];

    return NextResponse.json({ recordings: combinedData });
  } catch (error) {
    console.error('Error in GET /api/call-recordings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userProfile = await getUserProfile();
    
    if (!userProfile?.profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, leadId, bookingId, callDate, callType = 'consultation' } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    // Create metadata record for the call recording
    const { data: recording, error } = await supabase
      .from('call_recordings')
      .insert({
        organization_id: userProfile.profile.organization_id,
        lead_id: leadId,
        booking_id: bookingId,
        file_name: fileName,
        file_path: fileName,
        call_date: callDate || new Date().toISOString(),
        call_type: callType,
        status: 'recorded'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating call recording metadata:', error);
      return NextResponse.json({ error: 'Failed to create recording metadata' }, { status: 500 });
    }

    return NextResponse.json({ success: true, recording });
  } catch (error) {
    console.error('Error in POST /api/call-recordings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}