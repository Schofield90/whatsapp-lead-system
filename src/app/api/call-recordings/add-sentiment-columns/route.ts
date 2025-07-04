import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();
    
    // Check current table structure
    console.log('🔍 Checking call_transcripts table structure...');
    
    // Try to add sentiment column if it doesn't exist
    try {
      // This will fail if column already exists, which is fine
      await supabase.rpc('exec_sql', {
        sql: `
        ALTER TABLE call_transcripts 
        ADD COLUMN IF NOT EXISTS sentiment TEXT,
        ADD COLUMN IF NOT EXISTS sales_insights JSONB;
        `
      });
      console.log('✅ Added sentiment and sales_insights columns');
    } catch (error) {
      console.log('ℹ️ Columns may already exist or RPC not available');
    }
    
    // Test if we can query the table
    const { data: testQuery, error: testError } = await supabase
      .from('call_transcripts')
      .select('id, sentiment, sales_insights, created_at')
      .eq('organization_id', userProfile.profile.organization_id)
      .limit(1);
    
    if (testError) {
      console.error('❌ Test query failed:', testError);
      return NextResponse.json({
        error: 'Database schema issue',
        details: testError.message,
        suggestion: 'The sentiment and sales_insights columns may not exist in call_transcripts table'
      }, { status: 500 });
    }
    
    // Count transcripts
    const { data: allTranscripts, error: countError } = await supabase
      .from('call_transcripts')
      .select('id, sentiment, created_at')
      .eq('organization_id', userProfile.profile.organization_id);
    
    if (countError) {
      return NextResponse.json({
        error: 'Failed to count transcripts',
        details: countError.message
      }, { status: 500 });
    }
    
    const totalTranscripts = allTranscripts?.length || 0;
    const withSentiment = allTranscripts?.filter(t => t.sentiment)?.length || 0;
    const withoutSentiment = totalTranscripts - withSentiment;
    
    return NextResponse.json({
      success: true,
      tableStructureOk: true,
      totalTranscripts,
      withSentiment,
      withoutSentiment,
      message: `Found ${totalTranscripts} transcripts, ${withoutSentiment} need sentiment analysis`
    });
    
  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}