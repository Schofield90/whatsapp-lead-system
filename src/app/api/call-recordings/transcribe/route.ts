import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userProfile = await getUserProfile();
    
    if (!userProfile?.profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 401 });
    }

    const body = await request.json();
    const { recordingId, fileName } = body;

    if (!recordingId || !fileName) {
      return NextResponse.json({ error: 'Recording ID and file name are required' }, { status: 400 });
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
      // Get recording details first
      const { data: recording, error: fetchError } = await supabase
        .from('call_recordings')
        .select('*')
        .eq('id', recordingId)
        .single();

      if (fetchError || !recording) {
        throw new Error('Recording not found');
      }

      // Download the audio file from Supabase Storage
      const { data: audioFile, error: downloadError } = await supabase.storage
        .from('call-recordings')
        .download(recording.file_url || fileName);

      if (downloadError) {
        throw new Error(`Failed to download audio file: ${downloadError.message}`);
      }

      // Convert Blob to File for OpenAI API
      const file = new File([audioFile], recording.original_filename, { type: 'audio/mpeg' });

      // Transcribe with Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      });

      // Process transcription with Claude for analysis
      const analysisPrompt = `
Please analyze this call transcription and provide:
1. A concise summary (2-3 sentences)
2. Key points discussed (bullet points)
3. Sentiment analysis (positive/neutral/negative)
4. Action items or next steps mentioned
5. Lead qualification insights

Transcription:
${transcription.text}

Please respond in JSON format:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "sentiment": "positive|neutral|negative",
  "actionItems": ["...", "..."],
  "leadInsights": "..."
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: analysisPrompt
          }]
        })
      });

      const claudeResult = await response.json();
      let analysis = {};
      
      try {
        analysis = JSON.parse(claudeResult.content[0].text);
      } catch (e) {
        console.error('Failed to parse Claude response:', e);
        analysis = {
          summary: claudeResult.content[0].text,
          keyPoints: [],
          sentiment: 'neutral',
          actionItems: [],
          leadInsights: ''
        };
      }

      // Save transcription to database using your schema
      const { data: transcriptionRecord, error: saveError } = await supabase
        .from('call_transcripts')
        .insert({
          call_recording_id: recordingId,
          organization_id: recording.organization_id,
          raw_transcript: transcription.text,
          processed_transcript: analysis.summary || transcription.text,
          transcript_segments: transcription.segments,
          confidence_score: transcription.segments?.[0]?.avg_logprob || null,
          language: transcription.language
        })
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save transcription: ${saveError.message}`);
      }

      // Update call recording status
      await supabase
        .from('call_recordings')
        .update({ 
          status: 'transcribed',
          transcription_status: 'completed'
        })
        .eq('id', recordingId);

      // Also save sales training extracts if analysis was successful
      if (analysis && typeof analysis === 'object') {
        const extracts = [];
        
        if (analysis.keyPoints && Array.isArray(analysis.keyPoints)) {
          extracts.push({
            call_transcript_id: transcriptionRecord.id,
            organization_id: recording.organization_id,
            extract_type: 'key_points',
            content: analysis.keyPoints.join('\n'),
            context: 'AI-extracted key discussion points',
            tags: ['key_points', 'discussion']
          });
        }

        if (analysis.actionItems && Array.isArray(analysis.actionItems)) {
          extracts.push({
            call_transcript_id: transcriptionRecord.id,
            organization_id: recording.organization_id,
            extract_type: 'action_items',
            content: analysis.actionItems.join('\n'),
            context: 'AI-extracted action items and next steps',
            tags: ['action_items', 'follow_up']
          });
        }

        if (analysis.summary) {
          extracts.push({
            call_transcript_id: transcriptionRecord.id,
            organization_id: recording.organization_id,
            extract_type: 'summary',
            content: analysis.summary,
            context: 'AI-generated call summary',
            tags: ['summary', 'overview']
          });
        }

        if (extracts.length > 0) {
          await supabase
            .from('sales_training_extracts')
            .insert(extracts);
        }
      }

      return NextResponse.json({
        success: true,
        transcription: transcriptionRecord,
        analysis
      });

    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      
      // Update status to failed
      await supabase
        .from('call_recordings')
        .update({ 
          status: 'error',
          transcription_status: 'failed'
        })
        .eq('id', recordingId);

      return NextResponse.json({ 
        error: `Transcription failed: ${transcriptionError.message}` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in POST /api/call-recordings/transcribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}