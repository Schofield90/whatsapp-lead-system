import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { data_type, content, category } = await request.json();
    
    if (!data_type || !content) {
      return NextResponse.json({
        error: 'Missing required fields: data_type and content'
      }, { status: 400 });
    }

    const supabase = await createClient();
    const userProfile = await getUserProfile();
    
    if (!userProfile?.profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 401 });
    }

    // Store in call_recordings table as a workaround (we know this table works)
    const { data: savedEntry, error: saveError } = await supabase
      .from('call_recordings')
      .insert({
        organization_id: userProfile.profile.organization_id,
        sid: `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recording_url: 'TRAINING_DATA',
        status: 'training_data',
        transcript: JSON.stringify({
          type: 'ai_training_data',
          data_type,
          category: category || 'general',
          content,
          saved_at: new Date().toISOString()
        })
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving to database:', saveError);
      return NextResponse.json({
        error: 'Failed to save training data',
        details: saveError.message
      }, { status: 500 });
    }

    // Get count of all training data entries  
    const { data: allTrainingEntries } = await supabase
      .from('call_recordings')
      .select('id')
      .eq('organization_id', userProfile.profile.organization_id)
      .eq('status', 'training_data');

    const totalCount = allTrainingEntries?.length || 1;

    console.log('🎯 Training data saved to database:', {
      id: savedEntry.id,
      data_type,
      category,
      content: content.substring(0, 100) + '...',
      total_entries: totalCount
    });

    return NextResponse.json({
      success: true,
      message: `Training data saved to database! You now have ${totalCount} entries.`,
      data: {
        id: savedEntry.id,
        data_type,
        category: category || 'general',
        content,
        saved_at: savedEntry.created_at
      },
      total_count: totalCount
    });

  } catch (error) {
    console.error('Error in save training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}