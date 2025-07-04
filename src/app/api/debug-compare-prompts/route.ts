import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

function buildSystemPrompt(context: any): string {
  const { organization, trainingData, lead, callTranscripts } = context;
  
  let systemPrompt = `You are a professional gym sales agent for ${organization.name}. 
Your goal is to qualify leads and book consultations for potential gym members.

Lead Information:
- Name: ${lead.name}
- Phone: ${lead.phone}
- Email: ${lead.email || 'Not provided'}
- Status: ${lead.status}

`;

  // Add training data specific to the organization
  trainingData.forEach((data: any) => {
    switch (data.data_type) {
      case 'sales_script':
        systemPrompt += `\nSales Script:\n${data.content}\n`;
        break;
      case 'objection_handling':
        systemPrompt += `\nObjection Handling:\n${data.content}\n`;
        break;
      case 'qualification_criteria':
        systemPrompt += `\nQualification Criteria:\n${data.content}\n`;
        break;
    }
  });

  // Add insights from call transcripts
  if (callTranscripts && callTranscripts.length > 0) {
    systemPrompt += `\n=== CALL TRANSCRIPTION INSIGHTS ===\n`;
    systemPrompt += `Based on ${callTranscripts.length} sales calls (prioritizing successful ones), here are key insights:\n\n`;
    
    // Analyze sentiment patterns
    const sentiments = callTranscripts
      .filter((t: any) => t.sentiment)
      .map((t: any) => t.sentiment);
    
    if (sentiments.length > 0) {
      const positiveCalls = sentiments.filter((s: string) => s === 'positive').length;
      const neutralCalls = sentiments.filter((s: string) => s === 'neutral').length;
      const negativeCalls = sentiments.filter((s: string) => s === 'negative').length;
      const percentPositive = Math.round((positiveCalls / sentiments.length) * 100);
      systemPrompt += `Call Performance Analysis: ${percentPositive}% positive (${positiveCalls} positive, ${neutralCalls} neutral, ${negativeCalls} negative)\n\n`;
    }
    
    // Add successful conversation patterns (from positive calls)
    const positiveCalls = callTranscripts.filter((t: any) => t.sentiment === 'positive');
    if (positiveCalls.length > 0) {
      systemPrompt += `PROVEN SUCCESSFUL PATTERNS (from ${positiveCalls.length} positive calls):\n`;
      
      // Extract key phrases from positive calls with better summarization
      positiveCalls.slice(0, 5).forEach((call: any, index: number) => {
        const snippet = call.raw_transcript.substring(0, 150);
        const analysis = call.sales_insights?.analysis || 'High engagement call';
        systemPrompt += `${index + 1}. "${snippet}..." → ${analysis}\n`;
      });
      systemPrompt += `\n`;
    }
    
    // Add sales insights from all calls with sentiment analysis
    const callsWithInsights = callTranscripts.filter((t: any) => t.sales_insights);
    if (callsWithInsights.length > 0) {
      systemPrompt += `ACTIONABLE INSIGHTS FROM CALLS:\n`;
      
      // Group insights by sentiment for better context
      const positiveInsights = callsWithInsights.filter((c: any) => c.sentiment === 'positive');
      const neutralInsights = callsWithInsights.filter((c: any) => c.sentiment === 'neutral');
      
      if (positiveInsights.length > 0) {
        systemPrompt += `✅ FROM SUCCESSFUL CALLS:\n`;
        positiveInsights.slice(0, 3).forEach((call: any) => {
          if (call.sales_insights?.analysis) {
            systemPrompt += `- ${call.sales_insights.analysis}\n`;
          }
        });
      }
      
      if (neutralInsights.length > 0) {
        systemPrompt += `⚠️ AREAS FOR IMPROVEMENT:\n`;
        neutralInsights.slice(0, 2).forEach((call: any) => {
          if (call.sales_insights?.analysis) {
            systemPrompt += `- ${call.sales_insights.analysis}\n`;
          }
        });
      }
      
      systemPrompt += `\n`;
    }
    
    systemPrompt += `Focus on replicating the successful patterns while avoiding the pitfalls identified in neutral/negative calls.\n`;
    systemPrompt += `=== END CALL INSIGHTS ===\n\n`;
  }

  systemPrompt += `
Guidelines:
- Be conversational and friendly
- Ask qualifying questions to understand their fitness goals
- Address objections professionally using proven responses from successful calls
- When the lead is qualified and interested, offer to book a consultation
- Keep responses concise and focused
- Always end with a question to keep the conversation flowing
- Apply learnings from recent call transcriptions to improve your approach
`;

  return systemPrompt;
}

export async function POST(request: NextRequest) {
  try {
    const { testMessage } = await request.json();
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Get a sample lead (same as webhook)
    const { data: testLead } = await supabase
      .from('leads')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('organization_id', userProfile.profile.organization_id)
      .limit(1)
      .single();

    if (!testLead) {
      return NextResponse.json({ error: 'No leads found' }, { status: 404 });
    }

    // Mirror exact webhook query
    const [messagesResult, trainingDataResult, callTranscriptsResult] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('organization_id', testLead.organization_id)
        .order('created_at', { ascending: true })
        .limit(5),
      supabase
        .from('training_data')
        .select('*')
        .eq('organization_id', testLead.organization_id)
        .eq('is_active', true),
      supabase
        .from('call_transcripts')
        .select('raw_transcript, sentiment, sales_insights, created_at')
        .eq('organization_id', testLead.organization_id)
        .not('sentiment', 'is', null)
        .order('sentiment', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    const messages = messagesResult.data || [];
    const trainingData = trainingDataResult.data || [];
    const callTranscripts = callTranscriptsResult.data || [];

    // Build both system prompts
    const testContext = {
      lead: testLead,
      organization: testLead.organization,
      trainingData,
      callTranscripts
    };

    const systemPrompt = buildSystemPrompt(testContext);

    // Check if system prompt includes call insights
    const hasCallInsights = systemPrompt.includes('CALL TRANSCRIPTION INSIGHTS');
    const insightsStartIndex = systemPrompt.indexOf('=== CALL TRANSCRIPTION INSIGHTS ===');
    const insightsEndIndex = systemPrompt.indexOf('=== END CALL INSIGHTS ===');
    
    let insightsSection = '';
    if (insightsStartIndex > -1 && insightsEndIndex > -1) {
      insightsSection = systemPrompt.substring(insightsStartIndex, insightsEndIndex + 26);
    }

    return NextResponse.json({
      success: true,
      context: {
        leadName: testLead.name,
        organizationId: testLead.organization_id,
        callTranscriptsCount: callTranscripts.length,
        messagesCount: messages.length,
        trainingDataCount: trainingData.length,
      },
      systemPrompt: {
        full: systemPrompt,
        length: systemPrompt.length,
        hasCallInsights,
        insightsSection: insightsSection || 'No insights section found'
      },
      callTranscripts: {
        total: callTranscripts.length,
        sentimentBreakdown: callTranscripts.reduce((acc, t) => {
          acc[t.sentiment] = (acc[t.sentiment] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        sampleData: callTranscripts.slice(0, 3).map(t => ({
          sentiment: t.sentiment,
          hasInsights: !!t.sales_insights,
          transcriptLength: t.raw_transcript.length,
          transcriptPreview: t.raw_transcript.substring(0, 100) + '...'
        }))
      },
      testMessage: testMessage || 'Hi, I\'m interested in joining your gym. What are your prices?',
      debugNote: 'This shows the exact system prompt that would be used in WhatsApp conversations'
    });

  } catch (error) {
    console.error('Debug compare prompts error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}