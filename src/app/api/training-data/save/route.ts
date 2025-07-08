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

    // Create a simple lead entry to store the training data
    // This is a workaround since the training_data table has issues
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        organization_id: userProfile.profile.organization_id,
        name: `Training Data: ${category || data_type}`,
        phone: 'TRAINING_DATA',
        email: `training+${Date.now()}@internal.system`,
        status: 'training_data',
        notes: JSON.stringify({
          type: 'training_data',
          data_type,
          content,
          category,
          created_at: new Date().toISOString()
        })
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error saving training data:', leadError);
      return NextResponse.json({
        error: 'Failed to save training data',
        details: leadError.message
      }, { status: 500 });
    }

    console.log('✅ Training data saved as lead:', {
      id: lead.id,
      type: data_type,
      category: category
    });

    return NextResponse.json({
      success: true,
      data: lead,
      message: 'Training data saved successfully'
    });

  } catch (error) {
    console.error('Error in save training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}