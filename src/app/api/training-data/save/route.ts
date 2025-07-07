import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { data_type, content, category } = await request.json();
    
    if (!data_type || !content) {
      return NextResponse.json({
        error: 'Missing required fields: data_type and content'
      }, { status: 400 });
    }

    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Check if similar training data already exists
    const { data: existingData } = await supabase
      .from('training_data')
      .select('id, version')
      .eq('organization_id', userProfile.profile.organization_id)
      .eq('data_type', data_type)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingData && existingData.length > 0 
      ? (existingData[0].version || 0) + 1 
      : 1;

    // Insert new training data
    const { data, error } = await supabase
      .from('training_data')
      .insert({
        organization_id: userProfile.profile.organization_id,
        data_type: data_type,
        content: content,
        version: nextVersion,
        is_active: true,
        metadata: category ? { category } : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving training data:', error);
      return NextResponse.json({
        error: 'Failed to save training data',
        details: error.message
      }, { status: 500 });
    }

    // If this is a new version, deactivate previous versions
    if (nextVersion > 1) {
      await supabase
        .from('training_data')
        .update({ is_active: false })
        .eq('organization_id', userProfile.profile.organization_id)
        .eq('data_type', data_type)
        .lt('version', nextVersion);
    }

    console.log('✅ Training data saved:', {
      id: data.id,
      type: data_type,
      version: nextVersion,
      category: category
    });

    return NextResponse.json({
      success: true,
      data: data,
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