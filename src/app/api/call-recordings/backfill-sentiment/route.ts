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
Analyze this sales call transcript for sentiment and provide key insights.

TRANSCRIPT:
${transcript.raw_transcript.substring(0, 2000)} // Limit length to avoid token limits

You must respond with ONLY valid JSON in this exact format:
{
  "sentiment": "positive",
  "confidence": 0.85,
  "sales_insights": {
    "key_points": "Main talking points covered",
    "objections_raised": "Any objections mentioned",
    "outcome": "Call outcome/next steps",
    "effectiveness": "Overall effectiveness assessment"
  }
}

The sentiment must be exactly one of: positive, negative, neutral
Do not include any text before or after the JSON.`;

        const sentimentResponse = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: sentimentPrompt
          }]
        });

        const analysisText = sentimentResponse.content[0].type === 'text' ? sentimentResponse.content[0].text : '';
        console.log('🔍 Raw Claude response:', analysisText.substring(0, 200));
        
        let sentiment = 'neutral';
        let salesInsights = null;
        
        try {
          // Clean the response - remove any text before/after JSON
          let cleanedText = analysisText.trim();
          
          // Extract JSON if it's wrapped in other text
          const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanedText = jsonMatch[0];
          }
          
          const analysis = JSON.parse(cleanedText);
          sentiment = analysis.sentiment || 'neutral';
          
          // Validate sentiment value
          if (!['positive', 'negative', 'neutral'].includes(sentiment)) {
            console.log('⚠️ Invalid sentiment value:', sentiment, '- defaulting to neutral');
            sentiment = 'neutral';
          }
          
          salesInsights = analysis.sales_insights || null;
          console.log('✅ Parsed sentiment:', sentiment);
        } catch (parseError) {
          console.log('⚠️ Could not parse sentiment analysis for transcript', transcript.id);
          console.log('Raw response:', analysisText);
          console.log('Parse error:', parseError);
          
          // Fallback: Try to extract sentiment from text
          const lowerText = analysisText.toLowerCase();
          if (lowerText.includes('positive')) {
            sentiment = 'positive';
          } else if (lowerText.includes('negative')) {
            sentiment = 'negative';
          } else {
            sentiment = 'neutral';
          }
          console.log('📝 Fallback sentiment extraction:', sentiment);
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