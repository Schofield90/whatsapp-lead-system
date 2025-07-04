import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Extended timeout for large file processing
export const maxDuration = 300; // 5 minutes for chunked processing

export async function POST(request: NextRequest) {
  try {
    const { recordingId } = await request.json();
    console.log('🎙️ Starting large file transcription for recording:', recordingId);
    
    if (!recordingId) {
      return NextResponse.json({ error: 'Recording ID required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Get recording details
    const { data: recording, error: fetchError } = await supabase
      .from('call_recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (fetchError || !recording) {
      console.error('❌ Recording not found:', recordingId, fetchError);
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Update status to processing
    await supabase
      .from('call_recordings')
      .update({ 
        status: 'transcribing',
        transcription_status: 'in_progress'
      })
      .eq('id', recordingId);

    // For now, return a message about the limitation
    // In a full implementation, you would:
    // 1. Use FFmpeg to split audio into 10-minute chunks
    // 2. Transcribe each chunk separately
    // 3. Combine the results
    
    const fileSizeMB = recording.file_size ? (recording.file_size / (1024 * 1024)) : 0;
    
    return NextResponse.json({
      error: 'Large file transcription not yet implemented',
      details: `File size: ${fileSizeMB.toFixed(2)}MB. For 15-minute calls, please:\n\n` +
               `1. **Compress audio**: Use tools like Audacity to reduce bitrate to 64kbps\n` +
               `2. **Convert format**: Convert WAV to MP3 for smaller file size\n` +
               `3. **Split manually**: Break into 10-minute segments\n\n` +
               `Target: Get files under 25MB for Whisper API compatibility.`
    }, { status: 501 });

  } catch (error) {
    console.error('Large transcription error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}