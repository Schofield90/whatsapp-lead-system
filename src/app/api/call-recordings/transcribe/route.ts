import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Set a longer timeout for this API route
export const maxDuration = 60; // 60 seconds for Pro plan, 10 for Hobby

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

      // Get file from Supabase Storage - try multiple paths
      console.log('📥 Attempting to download file. Recording details:', {
        file_url: recording.file_url,
        original_filename: recording.original_filename,
        status: recording.status
      });
      
      let fileData;
      let downloadSuccess = false;
      let actualFilename = recording.original_filename;
      
      // Try file_url first (might be compressed path)
      if (recording.file_url) {
        const { data: fileData1, error: downloadError1 } = await supabase.storage
          .from('call-recordings')
          .download(recording.file_url);

        if (!downloadError1 && fileData1) {
          fileData = fileData1;
          downloadSuccess = true;
          actualFilename = recording.file_url.split('/').pop() || recording.original_filename;
          console.log('✅ Download successful with file_url:', recording.file_url);
        } else {
          console.log('⚠️ Download failed with file_url:', downloadError1?.message);
        }
      }
      
      // Try original_filename if file_url failed
      if (!downloadSuccess) {
        console.log('🔍 Trying with original_filename:', recording.original_filename);
        const { data: fileData2, error: downloadError2 } = await supabase.storage
          .from('call-recordings')
          .download(recording.original_filename);
          
        if (!downloadError2 && fileData2) {
          fileData = fileData2;
          downloadSuccess = true;
          console.log('✅ Download successful with original_filename');
        } else {
          console.log('❌ Download failed with original_filename:', downloadError2?.message);
        }
      }
      
      if (!downloadSuccess || !fileData) {
        throw new Error(`Failed to download recording file. Tried paths: ${recording.file_url}, ${recording.original_filename}`);
      }

      // Check file size - Whisper has a 25MB limit
      const fileSizeMB = fileData.size / (1024 * 1024);
      console.log(`📁 File size: ${fileSizeMB.toFixed(2)} MB`);
      
      if (fileSizeMB > 25) {
        // For large files, suggest alternative approach
        throw new Error(
          `File too large: ${fileSizeMB.toFixed(2)}MB (limit: 25MB). ` +
          `For 15-minute calls, consider: 1) Compress audio to lower bitrate, ` +
          `2) Split into chunks, or 3) Use a different transcription service. ` +
          `Typical 15-min calls should be compressed to <25MB before transcription.`
        );
      }

      // Convert blob to File object for OpenAI - detect correct MIME type
      const isCompressed = actualFilename.toLowerCase().endsWith('.mp3');
      const mimeType = isCompressed ? 'audio/mpeg' : 'audio/wav';
      
      const file = new File([fileData], actualFilename, {
        type: mimeType
      });
      
      console.log(`🎵 File details: ${actualFilename}, ${mimeType}, ${fileSizeMB.toFixed(2)}MB`);

      console.log('🎤 Starting Whisper transcription...');
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Transcription timeout after 45 seconds')), 45000);
      });

      // Attempt transcription with retry logic
      let transcription;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          transcription = await Promise.race([
            openai.audio.transcriptions.create({
              file: file,
              model: 'whisper-1',
              language: 'en',
              response_format: 'json'
            }),
            timeoutPromise
          ]);
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`❌ Transcription attempt ${retryCount} failed: ${errorMessage}`);
          
          if (retryCount > maxRetries) {
            // Final failure - categorize the error
            if (errorMessage.includes('timeout')) {
              throw new Error(`Transcription timeout after ${maxRetries + 1} attempts. File may be too complex or service overloaded.`);
            } else if (errorMessage.includes('Invalid file format') || errorMessage.includes('unsupported')) {
              throw new Error(`Invalid audio format: ${errorMessage}. Try re-compressing the file.`);
            } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
              throw new Error(`API quota exceeded: ${errorMessage}. Please try again later.`);
            } else {
              throw new Error(`Transcription failed after ${maxRetries + 1} attempts: ${errorMessage}`);
            }
          } else {
            // Wait before retry
            console.log(`⏳ Waiting 5 seconds before retry ${retryCount + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }

      console.log('✅ Transcription completed');

      // Store transcription
      const { data: transcript, error: transcriptError } = await supabase
        .from('call_transcripts')
        .insert({
          call_recording_id: recordingId,
          organization_id: recording.organization_id,
          raw_transcript: transcription.text,
          processed_transcript: transcription.text, // We'll process this later
          transcript_segments: [], // Simple format doesn't include segments
          confidence_score: null, // Whisper doesn't provide overall confidence
          language: 'en' // Default to English
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