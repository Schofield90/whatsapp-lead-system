import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { data_type, content, category } = await request.json();
    
    if (!data_type || !content) {
      return NextResponse.json({
        error: 'Missing required fields: data_type and content'
      }, { status: 400 });
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get user profile with organization
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({
        error: 'User profile or organization not found'
      }, { status: 401 });
    }
    
    const serviceClient = createServiceClient();

    // Check if similar training data already exists
    const { data: existingData } = await serviceClient
      .from('training_data')
      .select('id, version')
      .eq('organization_id', profile.organization_id)
      .eq('data_type', data_type)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingData && existingData.length > 0 
      ? (existingData[0].version || 0) + 1 
      : 1;

    // Insert new training data
    const { data, error } = await serviceClient
      .from('training_data')
      .insert({
        organization_id: profile.organization_id,
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
      await serviceClient
        .from('training_data')
        .update({ is_active: false })
        .eq('organization_id', profile.organization_id)
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