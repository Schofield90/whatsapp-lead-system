import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';
import { processConversationWithClaude } from '@/lib/claude-optimized';

export async function POST(request: NextRequest) {
  try {
    const { testMessage } = await request.json();
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Get a sample lead for testing
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
      return NextResponse.json({
        error: 'No leads found for testing'
      }, { status: 404 });
    }

    // Get call transcripts with sentiment
    const { data: callTranscripts } = await supabase
      .from('call_transcripts')
      .select('raw_transcript, sentiment, sales_insights, created_at')
      .eq('organization_id', userProfile.profile.organization_id)
      .not('sentiment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get ALL knowledge from unified knowledge base (this is the ONLY source of truth)
    const knowledgeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/knowledge-base/get`);
    const knowledgeResult = await knowledgeResponse.json();
    const allKnowledge = knowledgeResult.success ? knowledgeResult.data : [];

    // Create a mock conversation
    const mockConversation = {
      id: 'test-conversation',
      lead_id: testLead.id,
      status: 'active',
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      organization_id: userProfile.profile.organization_id
    };

    const mockMessages = [
      {
        id: 'test-1',
        conversation_id: 'test-conversation',
        direction: 'inbound',
        content: testMessage || 'Hi, I saw your gym online and I\'m interested in joining. Can you tell me more about your prices?',
        created_at: new Date().toISOString()
      }
    ];

    console.log(`🧪 Testing AI with ${allKnowledge?.length || 0} knowledge entries from unified knowledge base`);

    // Test the AI learning with ONLY the unified knowledge base
    const response = await processConversationWithClaude(
      {
        lead: testLead,
        conversation: mockConversation,
        messages: mockMessages,
        knowledgeBase: allKnowledge || [], // Use unified knowledge base instead of trainingData
        organization: testLead.organization,
        callTranscripts: [] // Disable call transcripts to force AI to use only knowledge base
      },
      testMessage || 'Hi, I saw your gym online and I\'m interested in joining. Can you tell me more about your prices?'
    );

    // Count sentiment breakdown
    const sentimentBreakdown = (callTranscripts || []).reduce((acc, transcript) => {
      acc[transcript.sentiment] = (acc[transcript.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      testMessage: testMessage || 'Hi, I saw your gym online and I\'m interested in joining. Can you tell me more about your prices?',
      aiResponse: response.response,
      learningData: {
        totalTranscripts: 0, // Disabled call transcripts
        sentimentBreakdown: {},
        knowledgeBaseCount: allKnowledge?.length || 0,
        hasLearning: (allKnowledge?.length || 0) > 0
      },
      callInsights: callTranscripts?.slice(0, 3).map(t => ({
        sentiment: t.sentiment,
        insight: t.sales_insights?.analysis || 'No analysis available',
        snippet: t.raw_transcript.substring(0, 100) + '...'
      })) || []
    });

  } catch (error) {
    console.error('Test AI learning error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Get call transcript stats
    const { data: transcripts } = await supabase
      .from('call_transcripts')
      .select('sentiment, created_at')
      .eq('organization_id', userProfile.profile.organization_id)
      .not('sentiment', 'is', null);

    const sentimentBreakdown = (transcripts || []).reduce((acc, transcript) => {
      acc[transcript.sentiment] = (acc[transcript.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalTranscripts: transcripts?.length || 0,
      sentimentBreakdown,
      hasLearningData: (transcripts?.length || 0) > 0,
      message: (transcripts?.length || 0) > 0 
        ? 'AI has learning data from call transcripts' 
        : 'No call transcript data available for learning'
    });

  } catch (error) {
    console.error('Get learning status error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}