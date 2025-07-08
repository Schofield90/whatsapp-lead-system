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

    // Get all training data entries from the leads table
    const { data: trainingEntries, error: fetchError } = await supabase
      .from('leads')
      .select('id, name, notes, created_at')
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

    // Parse the training data from the notes field
    const formattedData = (trainingEntries || []).map(entry => {
      try {
        const notesData = JSON.parse(entry.notes || '{}');
        return {
          id: entry.id,
          data_type: notesData.data_type || 'unknown',
          category: notesData.category || 'general',
          content: notesData.content || 'No content',
          saved_at: notesData.saved_at || entry.created_at
        };
      } catch (parseError) {
        // If notes can't be parsed, create a basic entry
        return {
          id: entry.id,
          data_type: 'legacy',
          category: 'general',
          content: entry.name || 'Legacy training data',
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