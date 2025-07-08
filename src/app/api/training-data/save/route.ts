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

    // Insert new training data with minimal required fields
    const insertData = {
      organization_id: profile.organization_id,
      data_type: data_type,
      content: content,
      is_active: true
    };
    
    // Only add optional fields if they exist
    if (category) {
      insertData.category = category;
    }
    
    const { data, error } = await serviceClient
      .from('training_data')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Database error details:', {
        error: error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        data_type,
        category,
        organization_id: profile.organization_id
      });
      return NextResponse.json({
        error: 'Failed to save training data',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log('✅ Training data saved:', {
      id: data.id,
      type: data_type,
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