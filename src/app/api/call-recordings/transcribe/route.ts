import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { recordingId } = await request.json();
    
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
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Update status to transcribing
    await supabase
      .from('call_recordings')
      .update({ 
        status: 'transcribing',
        transcription_status: 'in_progress'
      })
      .eq('id', recordingId);

    try {
      // Get file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('call-recordings')
        .download(recording.file_url);

      if (downloadError || !fileData) {
        throw new Error('Failed to download recording file');
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