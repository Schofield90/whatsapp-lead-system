import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Test database connection and table existence
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%calendar%');

    console.log('Calendar tables:', tables);

    // Test calendar_config table access
    const { data: config, error: configError } = await supabase
      .from('calendar_config')
      .select('*')
      .eq('organization_id', userProfile.profile.organization_id)
      .limit(1);

    console.log('Config data:', config);
    console.log('Config error:', configError);

    // Test environment variables
    const envVars = {
      has_google_client_id: !!process.env.GOOGLE_CLIENT_ID,
      has_google_client_secret: !!process.env.GOOGLE_CLIENT_SECRET,
      has_google_refresh_token: !!process.env.GOOGLE_REFRESH_TOKEN,
    };

    return NextResponse.json({
      success: true,
      organizationId: userProfile.profile.organization_id,
      tables,
      tablesError,
      config,
      configError,
      envVars,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Calendar test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}