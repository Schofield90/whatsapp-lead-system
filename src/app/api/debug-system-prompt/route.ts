import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';
import { processConversationWithClaude } from '@/lib/claude';

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

    // Create mock conversation context (same as webhook)
    const mockConversation = {
      id: 'debug-conversation',
      lead_id: testLead.id,
      status: 'active',
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      organization_id: testLead.organization_id
    };

    const mockMessages = [
      {
        id: 'debug-1',
        conversation_id: 'debug-conversation',
        direction: 'inbound' as const,
        content: testMessage || 'Hi, I\'m interested in joining your gym. What are your prices?',
        created_at: new Date().toISOString()
      }
    ];

    console.log('🔍 Debug system prompt with exact webhook context');

    // This will trigger our debug logging in buildSystemPrompt
    const response = await processConversationWithClaude(
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

    // Analyze call transcripts structure
    const transcriptAnalysis = callTranscripts.map(t => ({
      sentiment: t.sentiment,
      hasInsights: !!t.sales_insights,
      insightsKeys: t.sales_insights ? Object.keys(t.sales_insights) : [],
      transcriptLength: t.raw_transcript.length,
      transcriptPreview: t.raw_transcript.substring(0, 100) + '...'
    }));

    return NextResponse.json({
      success: true,
      context: {
        leadName: testLead.name,
        organizationId: testLead.organization_id,
        callTranscriptsCount: callTranscripts.length,
        messagesCount: messages.length,
        trainingDataCount: trainingData.length,
      },
      aiResponse: response.response,
      transcriptAnalysis: transcriptAnalysis.slice(0, 5), // First 5 for review
      sentimentBreakdown: callTranscripts.reduce((acc, t) => {
        acc[t.sentiment] = (acc[t.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      testMessage: testMessage || 'Hi, I\'m interested in joining your gym. What are your prices?',
      debugNote: 'Check server logs for detailed system prompt info'
    });

  } catch (error) {
    console.error('Debug system prompt error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}