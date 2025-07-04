import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Get a sample lead for testing (same as webhook would use)
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

    // Mirror the exact same query from the webhook
    const [messagesResult, trainingDataResult, callTranscriptsResult] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('organization_id', userProfile.profile.organization_id)
        .order('created_at', { ascending: true })
        .limit(5), // Just get a few for testing
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
        .order('sentiment', { ascending: false }) // Prioritize positive sentiment
        .order('created_at', { ascending: false }) // Then by recency
        .limit(20) // Use last 20 transcripts for context
    ]);

    const messages = messagesResult.data || [];
    const trainingData = trainingDataResult.data || [];
    const callTranscripts = callTranscriptsResult.data || [];

    console.log('🔍 Webhook context debug:', {
      leadId: testLead.id,
      organizationId: testLead.organization_id,
      messagesCount: messages.length,
      trainingDataCount: trainingData.length,
      callTranscriptsCount: callTranscripts.length,
    });

    // Check the actual content we're getting
    const transcriptsSample = callTranscripts.slice(0, 3).map(t => ({
      sentiment: t.sentiment,
      hasInsights: !!t.sales_insights,
      insightsSample: t.sales_insights?.analysis?.substring(0, 100) || 'No analysis',
      transcriptSample: t.raw_transcript.substring(0, 100) + '...'
    }));

    return NextResponse.json({
      context: {
        leadFound: !!testLead,
        leadName: testLead.name,
        organizationId: testLead.organization_id,
        messagesCount: messages.length,
        trainingDataCount: trainingData.length,
        callTranscriptsCount: callTranscripts.length,
      },
      callTranscriptsSample: transcriptsSample,
      sentimentBreakdown: callTranscripts.reduce((acc, t) => {
        acc[t.sentiment] = (acc[t.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      errors: {
        messagesError: messagesResult.error,
        trainingDataError: trainingDataResult.error,
        callTranscriptsError: callTranscriptsResult.error,
      }
    });

  } catch (error) {
    console.error('Debug webhook context error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json();
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Get specific lead if provided
    const { data: lead } = await supabase
      .from('leads')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('organization_id', userProfile.profile.organization_id)
      .eq('id', leadId || '')
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get call transcripts for this lead's organization
    const { data: callTranscripts, error: transcriptsError } = await supabase
      .from('call_transcripts')
      .select('raw_transcript, sentiment, sales_insights, created_at')
      .eq('organization_id', lead.organization_id)
      .not('sentiment', 'is', null);

    console.log('🔍 Call transcripts for organization:', {
      organizationId: lead.organization_id,
      totalTranscripts: callTranscripts?.length || 0,
      error: transcriptsError,
    });

    return NextResponse.json({
      leadId: lead.id,
      organizationId: lead.organization_id,
      totalTranscripts: callTranscripts?.length || 0,
      transcriptsWithSentiment: callTranscripts?.filter(t => t.sentiment).length || 0,
      sentimentBreakdown: callTranscripts?.reduce((acc, t) => {
        acc[t.sentiment] = (acc[t.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      error: transcriptsError,
    });

  } catch (error) {
    console.error('Debug specific lead error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}