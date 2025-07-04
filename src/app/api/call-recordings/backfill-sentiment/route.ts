import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();
    
    // Get transcripts without sentiment analysis
    const { data: transcripts, error } = await supabase
      .from('call_transcripts')
      .select('*')
      .eq('organization_id', userProfile.profile.organization_id)
      .is('sentiment', null)
      .limit(10); // Process 10 at a time
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch transcripts' }, { status: 500 });
    }
    
    if (!transcripts || transcripts.length === 0) {
      return NextResponse.json({ 
        message: 'No transcripts need sentiment analysis',
        processed: 0 
      });
    }
    
    let processedCount = 0;
    let failedCount = 0;
    
    // Check for Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ 
        error: 'Anthropic API key not configured',
        details: 'Please add ANTHROPIC_API_KEY to environment variables'
      }, { status: 501 });
    }
    
    // Dynamic import for Anthropic
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    for (const transcript of transcripts) {
      try {
        console.log(`🧠 Analyzing sentiment for transcript ${transcript.id}...`);
        
        const sentimentPrompt = `
Analyze this sales call transcript for sentiment and provide key insights:

TRANSCRIPT:
${transcript.raw_transcript}

Provide a JSON response with:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.85,
  "sales_insights": {
    "key_points": "Main talking points covered",
    "objections_raised": "Any objections mentioned",
    "outcome": "Call outcome/next steps",
    "effectiveness": "Overall effectiveness assessment"
  }
}

Focus on the overall customer sentiment and sales effectiveness.`;

        const sentimentResponse = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: sentimentPrompt
          }]
        });

        const analysisText = sentimentResponse.content[0].type === 'text' ? sentimentResponse.content[0].text : '';
        
        let sentiment = 'neutral';
        let salesInsights = null;
        
        try {
          const analysis = JSON.parse(analysisText);
          sentiment = analysis.sentiment || 'neutral';
          salesInsights = analysis.sales_insights || null;
        } catch (parseError) {
          console.log('⚠️ Could not parse sentiment analysis for transcript', transcript.id);
        }
        
        // Update transcript with sentiment
        const { error: updateError } = await supabase
          .from('call_transcripts')
          .update({
            sentiment: sentiment,
            sales_insights: salesInsights
          })
          .eq('id', transcript.id);
        
        if (updateError) {
          console.error('Failed to update transcript:', updateError);
          failedCount++;
        } else {
          processedCount++;
          console.log(`✅ Updated transcript ${transcript.id} with sentiment: ${sentiment}`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing transcript ${transcript.id}:`, error);
        failedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} transcripts, ${failedCount} failed`,
      processed: processedCount,
      failed: failedCount,
      remaining: Math.max(0, transcripts.length - processedCount - failedCount)
    });
    
  } catch (error) {
    console.error('Backfill sentiment API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}