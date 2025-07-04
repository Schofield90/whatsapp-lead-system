import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const recordingId = searchParams.get('id');
    
    if (!recordingId) {
      return NextResponse.json({ error: 'Recording ID required' }, { status: 400 });
    }
    
    // Get recording details
    const { data: recording, error: fetchError } = await supabase
      .from('call_recordings')
      .select('*')
      .eq('id', recordingId)
      .eq('organization_id', userProfile.profile.organization_id)
      .single();
    
    if (fetchError || !recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }
    
    // Get public URL from Supabase Storage
    const { data } = supabase.storage
      .from('call-recordings')
      .getPublicUrl(recording.file_url);
    
    return NextResponse.json({ 
      url: data.publicUrl,
      filename: recording.original_filename 
    });
    
  } catch (error) {
    console.error('Play API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}