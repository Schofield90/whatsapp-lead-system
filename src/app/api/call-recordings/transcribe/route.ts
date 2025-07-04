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
      .update({ status: 'transcribing' })
      .eq('id', recordingId);

    try {
      // Download the audio file from Supabase Storage
      const { data: audioFile, error: downloadError } = await supabase.storage
        .from('call-recordings')
        .download(fileName);

      if (downloadError) {
        throw new Error(`Failed to download audio file: ${downloadError.message}`);
      }

      // Convert Blob to File for OpenAI API
      const file = new File([audioFile], fileName, { type: 'audio/mpeg' });

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

      // Save transcription and analysis to database
      const { data: transcriptionRecord, error: saveError } = await supabase
        .from('call_transcriptions')
        .insert({
          call_recording_id: recordingId,
          organization_id: userProfile.profile.organization_id,
          transcription_text: transcription.text,
          confidence_score: transcription.segments?.[0]?.avg_logprob || null,
          language: transcription.language,
          segments: transcription.segments,
          summary: analysis.summary,
          key_points: analysis.keyPoints,
          sentiment: analysis.sentiment,
          action_items: analysis.actionItems,
          transcribed_at: new Date().toISOString(),
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save transcription: ${saveError.message}`);
      }

      // Update call recording status
      await supabase
        .from('call_recordings')
        .update({ status: 'transcribed' })
        .eq('id', recordingId);

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
        .update({ status: 'failed' })
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