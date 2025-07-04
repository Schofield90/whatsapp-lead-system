import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = await createClient();
    
    // Get failed recordings with error details
    const { data: failedRecordings, error } = await supabase
      .from('call_recordings')
      .select('id, original_filename, error_message, created_at, file_size, transcription_status, status')
      .eq('organization_id', userProfile.profile.organization_id)
      .in('transcription_status', ['failed'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching failed recordings:', error);
      return NextResponse.json({ error: 'Failed to fetch error details' }, { status: 500 });
    }
    
    // Group errors by type for analysis
    const errorSummary = failedRecordings?.reduce((acc, recording) => {
      const errorMsg = recording.error_message || 'Unknown error';
      const errorType = getErrorType(errorMsg);
      
      if (!acc[errorType]) {
        acc[errorType] = { count: 0, examples: [] };
      }
      
      acc[errorType].count++;
      if (acc[errorType].examples.length < 3) {
        acc[errorType].examples.push({
          filename: recording.original_filename,
          error: errorMsg,
          fileSize: recording.file_size
        });
      }
      
      return acc;
    }, {} as any) || {};
    
    return NextResponse.json({
      failedRecordings: failedRecordings || [],
      errorSummary,
      totalFailed: failedRecordings?.length || 0
    });
    
  } catch (error) {
    console.error('Error analysis API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getErrorType(errorMessage: string): string {
  const msg = errorMessage.toLowerCase();
  
  if (msg.includes('timeout')) return 'Timeout';
  if (msg.includes('file too large') || msg.includes('25mb')) return 'File Size';
  if (msg.includes('invalid file format') || msg.includes('unsupported')) return 'File Format';
  if (msg.includes('rate limit') || msg.includes('quota')) return 'API Limits';
  if (msg.includes('download') || msg.includes('not found')) return 'File Access';
  if (msg.includes('openai') || msg.includes('api key')) return 'API Config';
  if (msg.includes('network') || msg.includes('connection')) return 'Network';
  
  return 'Other';
}