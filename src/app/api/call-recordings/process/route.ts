import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcriptId } = await request.json();
    
    if (!transcriptId) {
      return NextResponse.json({ error: 'Transcript ID required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Get transcript
    const { data: transcript, error: fetchError } = await supabase
      .from('call_transcripts')
      .select(`
        *,
        call_recording:call_recordings(*)
      `)
      .eq('id', transcriptId)
      .single();

    if (fetchError || !transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    // Update recording status
    await supabase
      .from('call_recordings')
      .update({ status: 'processing' })
      .eq('id', transcript.call_recording_id);

    try {
      // Use Claude to analyze the transcript and extract sales techniques
      const analysisPrompt = `
Analyze this sales call transcript and extract specific sales techniques, objection handling, closing strategies, and rapport building examples.

TRANSCRIPT:
${transcript.raw_transcript}

Please extract and categorize the following:

1. OBJECTION_HANDLING: Specific examples where objections were raised and how they were handled
2. CLOSING_TECHNIQUES: Attempts to close the sale or book appointments
3. QUALIFICATION_QUESTIONS: Questions used to qualify the prospect
4. RAPPORT_BUILDING: Examples of building connection with the prospect
5. VALUE_PROPOSITIONS: How benefits/value were communicated
6. FOLLOW_UP_STRATEGIES: Plans for next steps or follow-up

For each extraction, provide:
- The exact quote from the transcript
- Brief context (what led to this moment)
- Effectiveness rating (1-5, where 5 is very effective)
- Why it was effective/ineffective

Format your response as JSON with this structure:
{
  "extracts": [
    {
      "type": "objection_handling",
      "content": "exact quote from transcript",
      "context": "what happened before this",
      "effectiveness_rating": 4,
      "analysis": "why this was effective",
      "tags": ["price_objection", "trust_building"]
    }
  ]
}

Focus on actionable insights that can be used to train other sales conversations.
`;

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      
      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch (parseError) {
        console.error('Failed to parse Claude response:', parseError);
        throw new Error('Invalid analysis format from Claude');
      }

      // Store extracted training data
      const extracts = [];
      if (analysis.extracts && Array.isArray(analysis.extracts)) {
        for (const extract of analysis.extracts) {
          const { data: savedExtract } = await supabase
            .from('sales_training_extracts')
            .insert({
              call_transcript_id: transcriptId,
              organization_id: transcript.organization_id,
              extract_type: extract.type,
              content: extract.content,
              context: extract.context,
              effectiveness_rating: extract.effectiveness_rating || 3,
              tags: extract.tags || [],
              is_approved: false, // Require manual approval
              is_active: true
            })
            .select()
            .single();

          if (savedExtract) {
            extracts.push(savedExtract);
          }
        }
      }

      // Update recording status to processed
      await supabase
        .from('call_recordings')
        .update({ status: 'processed' })
        .eq('id', transcript.call_recording_id);

      return NextResponse.json({
        success: true,
        extractsCount: extracts.length,
        extracts: extracts.map(e => ({
          id: e.id,
          type: e.extract_type,
          content: e.content.substring(0, 100) + '...',
          rating: e.effectiveness_rating
        }))
      });

    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      // Update status to error
      await supabase
        .from('call_recordings')
        .update({ status: 'error' })
        .eq('id', transcript.call_recording_id);

      return NextResponse.json({
        error: 'Processing failed',
        details: processingError instanceof Error ? processingError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Processing API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}