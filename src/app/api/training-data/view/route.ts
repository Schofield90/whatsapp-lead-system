import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userProfile = await getUserProfile();
    
    if (!userProfile?.profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 401 });
    }

    // Get all training data entries from call_recordings table
    const { data: trainingEntries, error: fetchError } = await supabase
      .from('call_recordings')
      .select('id, sid, transcript, created_at')
      .eq('organization_id', userProfile.profile.organization_id)
      .eq('status', 'training_data')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching training data:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch training data',
        details: fetchError.message
      }, { status: 500 });
    }

    // Parse the training data from the transcript field
    const formattedData = (trainingEntries || []).map(entry => {
      try {
        const transcriptData = JSON.parse(entry.transcript || '{}');
        return {
          id: entry.id,
          data_type: transcriptData.data_type || 'unknown',
          category: transcriptData.category || 'general',
          content: transcriptData.content || 'No content',
          saved_at: transcriptData.saved_at || entry.created_at
        };
      } catch (parseError) {
        // If transcript can't be parsed, create a basic entry
        return {
          id: entry.id,
          data_type: 'legacy',
          category: 'general',
          content: entry.sid || 'Legacy training data',
          saved_at: entry.created_at
        };
      }
    });

    const count = formattedData.length;
    
    console.log(`📖 Fetching training data from database: ${count} entries found`);
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      count: count,
      message: `Found ${count} training data entries in database`
    });
  } catch (error) {
    console.error('Error viewing training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}