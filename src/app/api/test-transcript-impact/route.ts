import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';
import { processConversationWithClaude } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const { testMessage } = await request.json();
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Get a sample lead
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

    // Get training data and transcripts
    const [trainingDataResult, callTranscriptsResult] = await Promise.all([
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

    const trainingData = trainingDataResult.data || [];
    const callTranscripts = callTranscriptsResult.data || [];

    // Create mock conversation
    const mockConversation = {
      id: 'test-conversation',
      lead_id: testLead.id,
      status: 'active',
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      organization_id: testLead.organization_id
    };

    const mockMessages = [{
      id: 'test-1',
      conversation_id: 'test-conversation',
      direction: 'inbound' as const,
      content: testMessage || 'Hi, I\'m interested in joining your gym. What are your prices?',
      created_at: new Date().toISOString()
    }];

    console.log('🧪 Testing transcript impact on AI responses...');

    // Test 1: With transcripts
    const responseWithTranscripts = await processConversationWithClaude(
      {
        lead: testLead,
        conversation: mockConversation,
        messages: mockMessages,
        trainingData: trainingData,
        organization: testLead.organization,
        callTranscripts: callTranscripts
      },
      testMessage || 'Hi, I\'m interested in joining your gym. What are your prices?'
    );

    // Test 2: Without transcripts
    const responseWithoutTranscripts = await processConversationWithClaude(
      {
        lead: testLead,
        conversation: mockConversation,
        messages: mockMessages,
        trainingData: trainingData,
        organization: testLead.organization,
        callTranscripts: [] // Empty transcripts
      },
      testMessage || 'Hi, I\'m interested in joining your gym. What are your prices?'
    );

    // Compare responses
    const comparison = {
      withTranscripts: responseWithTranscripts.response,
      withoutTranscripts: responseWithoutTranscripts.response,
      areDifferent: responseWithTranscripts.response !== responseWithoutTranscripts.response,
      transcriptsUsed: callTranscripts.length,
      sentimentBreakdown: callTranscripts.reduce((acc, t) => {
        acc[t.sentiment] = (acc[t.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      testMessage: testMessage || 'Hi, I\'m interested in joining your gym. What are your prices?',
      comparison,
      context: {
        organizationId: testLead.organization_id,
        trainingDataCount: trainingData.length,
        callTranscriptsCount: callTranscripts.length
      },
      transcriptSamples: callTranscripts.slice(0, 3).map(t => ({
        sentiment: t.sentiment,
        hasInsights: !!t.sales_insights,
        length: t.raw_transcript.length,
        preview: t.raw_transcript.substring(0, 100) + '...'
      }))
    });

  } catch (error) {
    console.error('Test transcript impact error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}