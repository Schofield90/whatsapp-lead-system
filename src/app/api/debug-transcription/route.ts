import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();
    
    console.log('🔍 Debug: Checking transcription setup...');
    
    // Check environment variables
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    console.log('🔑 OpenAI API Key configured:', hasOpenAI);
    
    // Get one recording to debug
    const { data: recordings, error } = await supabase
      .from('call_recordings')
      .select('*')
      .eq('organization_id', userProfile.profile.organization_id)
      .limit(1);
    
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!recordings || recordings.length === 0) {
      return NextResponse.json({ 
        message: 'No recordings found',
        hasOpenAI 
      });
    }
    
    const recording = recordings[0];
    console.log('📁 Sample recording:', {
      id: recording.id,
      original_filename: recording.original_filename,
      file_url: recording.file_url,
      status: recording.status,
      transcription_status: recording.transcription_status
    });
    
    // Test file download
    console.log('📥 Testing file download...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('call-recordings')
      .download(recording.file_url);
    
    let downloadStatus = 'success';
    let downloadDetails = '';
    
    if (downloadError) {
      downloadStatus = 'failed';
      downloadDetails = downloadError.message;
      console.error('❌ Download failed:', downloadError);
    } else if (!fileData) {
      downloadStatus = 'failed';
      downloadDetails = 'No file data returned';
      console.error('❌ No file data returned');
    } else {
      downloadDetails = `File size: ${fileData.size} bytes`;
      console.log('✅ Download successful:', downloadDetails);
    }
    
    // Check storage bucket files
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('call-recordings')
      .list('', { limit: 5 });
    
    return NextResponse.json({
      environment: {
        hasOpenAI
      },
      sampleRecording: {
        id: recording.id,
        original_filename: recording.original_filename,
        file_url: recording.file_url,
        status: recording.status,
        transcription_status: recording.transcription_status
      },
      downloadTest: {
        status: downloadStatus,
        details: downloadDetails
      },
      storageFiles: storageFiles?.slice(0, 3).map(f => ({
        name: f.name,
        size: f.metadata?.size
      })) || [],
      storageError: storageError?.message
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}