import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const { google_client_id, google_client_secret, google_refresh_token } = await request.json();

    if (!google_client_id || !google_client_secret || !google_refresh_token) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from('calendar_config')
      .select('id')
      .eq('organization_id', userProfile.profile.organization_id)
      .single();

    if (existingConfig) {
      // Update existing config
      const { error } = await supabase
        .from('calendar_config')
        .update({
          google_client_id,
          google_client_secret,
          google_refresh_token,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', userProfile.profile.organization_id);

      if (error) {
        console.error('Error updating calendar config:', error);
        return NextResponse.json({
          error: 'Failed to update configuration'
        }, { status: 500 });
      }
    } else {
      // Create new config
      const { error } = await supabase
        .from('calendar_config')
        .insert({
          organization_id: userProfile.profile.organization_id,
          google_client_id,
          google_client_secret,
          google_refresh_token,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating calendar config:', error);
        return NextResponse.json({
          error: 'Failed to save configuration'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar configuration saved successfully'
    });

  } catch (error) {
    console.error('Error in calendar config API:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    const { data: config, error } = await supabase
      .from('calendar_config')
      .select('google_client_id, google_client_secret, google_refresh_token, created_at, updated_at')
      .eq('organization_id', userProfile.profile.organization_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching calendar config:', error);
      return NextResponse.json({
        error: 'Failed to fetch configuration'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      config: config || null
    });

  } catch (error) {
    console.error('Error in calendar config GET API:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}