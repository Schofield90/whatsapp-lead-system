import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Check if training_data table exists
    const { data: trainingTableCheck, error: trainingError } = await supabase
      .from('training_data')
      .select('count')
      .limit(1);

    // Check what tables are accessible
    const tableChecks = {
      training_data: !trainingError,
      leads: false,
      call_recordings: false,
      organizations: false,
      users: false
    };

    // Test other tables
    try {
      const { error: leadsError } = await supabase.from('leads').select('count').limit(1);
      tableChecks.leads = !leadsError;
    } catch (e) { /* ignore */ }

    try {
      const { error: recordingsError } = await supabase.from('call_recordings').select('count').limit(1);
      tableChecks.call_recordings = !recordingsError;
    } catch (e) { /* ignore */ }

    try {
      const { error: orgsError } = await supabase.from('organizations').select('count').limit(1);
      tableChecks.organizations = !orgsError;
    } catch (e) { /* ignore */ }

    try {
      const { error: usersError } = await supabase.from('users').select('count').limit(1);
      tableChecks.users = !usersError;
    } catch (e) { /* ignore */ }

    console.log('📊 Database table accessibility:', tableChecks);

    return NextResponse.json({
      success: true,
      tables: tableChecks,
      training_data_exists: tableChecks.training_data,
      message: `Found ${Object.values(tableChecks).filter(Boolean).length} accessible tables`
    });

  } catch (error) {
    console.error('Error checking database:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}