import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { recordingId } = await request.json();
    console.log('🎙️ Starting transcription for recording:', recordingId);
    
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

    console.log('✅ Recording found, updating status to transcribing...');
    // Update status to transcribing
    await supabase
      .from('call_recordings')
      .update({ 
        status: 'transcribing',
        transcription_status: 'in_progress'
      })
      .eq('id', recordingId);

    try {
      // Check for OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      // Dynamic import OpenAI to avoid build-time errors
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Get file from Supabase Storage
      console.log('📥 Attempting to download file:', recording.file_url);
      let fileData;
      let downloadSuccess = false;
      
      const { data: fileData1, error: downloadError1 } = await supabase.storage
        .from('call-recordings')
        .download(recording.file_url);

      if (downloadError1 || !fileData1) {
        console.error('❌ Download failed with file_url:', downloadError1);
        console.log('🔍 Trying with original_filename instead...');
        
        // Try with original_filename if file_url fails
        const { data: fileData2, error: downloadError2 } = await supabase.storage
          .from('call-recordings')
          .download(recording.original_filename);
          
        if (downloadError2 || !fileData2) {
          throw new Error(`Failed to download recording file: ${downloadError1?.message || 'Unknown error'}. Also tried original_filename: ${downloadError2?.message || 'Unknown error'}`);
        }
        
        fileData = fileData2;
        downloadSuccess = true;
        console.log('✅ Download successful with original_filename');
      } else {
        fileData = fileData1;
        downloadSuccess = true;
        console.log('✅ Download successful with file_url');
      }

      // Convert blob to File object for OpenAI
      const file = new File([fileData], recording.original_filename, {
        type: 'audio/mpeg'
      });

      // Transcribe with OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      });

      // Store transcription
      const { data: transcript, error: transcriptError } = await supabase
        .from('call_transcripts')
        .insert({
          call_recording_id: recordingId,
          organization_id: recording.organization_id,
          raw_transcript: transcription.text,
          processed_transcript: transcription.text, // We'll process this later
          transcript_segments: transcription.segments || [],
          confidence_score: null, // Whisper doesn't provide overall confidence
          language: transcription.language || 'en'
        })
        .select()
        .single();

      if (transcriptError) {
        throw new Error('Failed to save transcript: ' + transcriptError.message);
      }

      // Update recording status
      await supabase
        .from('call_recordings')
        .update({ 
          status: 'transcribed',
          transcription_status: 'completed'
        })
        .eq('id', recordingId);

      // Trigger processing for sales training extraction
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/call-recordings/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcriptId: transcript.id })
        });
      } catch (error) {
        console.error('Failed to trigger processing:', error);
      }

      return NextResponse.json({
        success: true,
        transcript: {
          id: transcript.id,
          text: transcript.raw_transcript,
          language: transcript.language
        }
      });

    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      
      // Update status to error
      await supabase
        .from('call_recordings')
        .update({ 
          status: 'error',
          transcription_status: 'failed'
        })
        .eq('id', recordingId);

      return NextResponse.json({
        error: 'Transcription failed',
        details: transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}