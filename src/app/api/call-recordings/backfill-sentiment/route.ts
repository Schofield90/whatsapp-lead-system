import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();
    
    // First, check if we have any transcripts at all
    console.log('🔍 Checking for transcripts for organization:', userProfile.profile.organization_id);
    
    const { data: allTranscripts, error: allError } = await supabase
      .from('call_transcripts')
      .select('id, sentiment, created_at')
      .eq('organization_id', userProfile.profile.organization_id);
    
    console.log('📊 Total transcripts found:', allTranscripts?.length || 0);
    console.log('📊 Transcripts with sentiment:', allTranscripts?.filter(t => t.sentiment).length || 0);
    console.log('📊 Transcripts without sentiment:', allTranscripts?.filter(t => !t.sentiment).length || 0);
    
    if (allError) {
      console.error('❌ Error fetching all transcripts:', allError);
      return NextResponse.json({ 
        error: 'Failed to fetch transcripts',
        details: allError.message,
        code: allError.code 
      }, { status: 500 });
    }
    
    // Get transcripts without sentiment analysis
    const { data: transcripts, error } = await supabase
      .from('call_transcripts')
      .select('*')
      .eq('organization_id', userProfile.profile.organization_id)
      .is('sentiment', null)
      .limit(10); // Process 10 at a time
    
    if (error) {
      console.error('❌ Error fetching transcripts without sentiment:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch transcripts without sentiment',
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }
    
    if (!transcripts || transcripts.length === 0) {
      return NextResponse.json({ 
        message: 'No transcripts need sentiment analysis',
        processed: 0 
      });
    }
    
    let processedCount = 0;
    let failedCount = 0;
    
    // COST OPTIMIZATION: Disable bulk processing in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        error: 'Bulk sentiment analysis disabled in production to control costs',
        message: 'Use individual processing or enable via ENABLE_BULK_PROCESSING=true',
        transcriptsFound: transcripts.length
      }, { status: 403 });
    }
    
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
        
        // Use a simpler approach - ask Claude for clear text analysis
        const sentimentPrompt = `
Analyze this sales call transcript and determine if the overall customer sentiment is positive, negative, or neutral.

TRANSCRIPT:
${transcript.raw_transcript.substring(0, 1500)}

Please analyze:
1. Customer's tone and attitude throughout the call
2. How receptive they were to the sales pitch
3. Whether they expressed interest or resistance
4. The overall outcome of the conversation

Respond with just one word: POSITIVE, NEGATIVE, or NEUTRAL

Then on a new line, briefly explain why in 1-2 sentences.`;

        const sentimentResponse = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: sentimentPrompt
          }]
        });

        const analysisText = sentimentResponse.content[0].type === 'text' ? sentimentResponse.content[0].text : '';
        console.log('🔍 Raw Claude response:', analysisText);
        
        let sentiment = 'neutral';
        let salesInsights = null;
        
        // Extract sentiment from the first line
        const lines = analysisText.trim().split('\n');
        const firstLine = lines[0].trim().toLowerCase();
        
        if (firstLine.includes('positive')) {
          sentiment = 'positive';
        } else if (firstLine.includes('negative')) {
          sentiment = 'negative';
        } else {
          sentiment = 'neutral';
        }
        
        // Create simple sales insights from the explanation
        const explanation = lines.slice(1).join(' ').trim();
        if (explanation) {
          salesInsights = {
            analysis: explanation,
            sentiment_confidence: sentiment !== 'neutral' ? 'high' : 'medium'
          };
        }
        
        console.log('✅ Extracted sentiment:', sentiment);
        
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