import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = await createClient();
    
    // Get all recordings for the organization
    const { data: recordings, error: recordingsError } = await supabase
      .from('call_recordings')
      .select('*, transcripts:call_transcripts(*)')
      .eq('organization_id', userProfile.profile.organization_id);
    
    if (recordingsError) {
      console.error('Error fetching recordings:', recordingsError);
      return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
    }
    
    const totalRecordings = recordings?.length || 0;
    
    // Count transcribed recordings
    const transcribedCount = recordings?.filter(r => 
      r.transcription_status === 'completed' || r.status === 'transcribed'
    ).length || 0;
    
    // Calculate average duration
    const recordingsWithDuration = recordings?.filter(r => r.duration_seconds) || [];
    const avgDurationSeconds = recordingsWithDuration.length > 0 
      ? recordingsWithDuration.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / recordingsWithDuration.length
      : 0;
    const avgDurationMinutes = Math.round(avgDurationSeconds / 60);
    
    // Calculate positive sentiment percentage
    const transcriptsWithSentiment = recordings?.flatMap(r => r.transcripts || []).filter(t => t.sentiment) || [];
    const positiveSentimentCount = transcriptsWithSentiment.filter(t => t.sentiment === 'positive').length;
    const positiveSentimentPercent = transcriptsWithSentiment.length > 0 
      ? Math.round((positiveSentimentCount / transcriptsWithSentiment.length) * 100)
      : 0;
    
    // Get recent activity
    const recentTranscriptions = recordings?.filter(r => 
      r.transcription_status === 'completed' && 
      r.updated_at && 
      new Date(r.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    ).length || 0;
    
    return NextResponse.json({
      totalRecordings,
      transcribedCount,
      avgDurationMinutes,
      positiveSentimentPercent,
      recentTranscriptions,
      stats: {
        pending: recordings?.filter(r => r.transcription_status === 'pending').length || 0,
        inProgress: recordings?.filter(r => r.transcription_status === 'in_progress').length || 0,
        completed: transcribedCount,
        failed: recordings?.filter(r => r.transcription_status === 'failed').length || 0
      }
    });
    
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}