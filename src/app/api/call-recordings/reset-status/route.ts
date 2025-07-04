import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();
    
    const { recordingId } = await request.json();
    
    if (!recordingId) {
      return NextResponse.json({ error: 'Recording ID required' }, { status: 400 });
    }
    
    // Reset the transcription status to allow retry
    const { data, error } = await supabase
      .from('call_recordings')
      .update({ 
        status: 'uploaded',
        transcription_status: 'pending'
      })
      .eq('id', recordingId)
      .eq('organization_id', userProfile.profile.organization_id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to reset status',
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Status reset to pending',
      recording: data
    });
    
  } catch (error) {
    console.error('Reset status error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}