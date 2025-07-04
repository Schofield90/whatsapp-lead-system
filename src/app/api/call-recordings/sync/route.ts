import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();
    
    console.log('🔄 Starting sync from storage for organization:', userProfile.profile.organization_id);
    
    // Get all files from the call-recordings storage bucket
    const { data: files, error: storageError } = await supabase.storage
      .from('call-recordings')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (storageError) {
      console.error('❌ Storage error:', storageError);
      return NextResponse.json({ 
        error: 'Failed to fetch files from storage',
        details: storageError.message 
      }, { status: 500 });
    }

    if (!files || files.length === 0) {
      console.log('📁 No files found in storage');
      return NextResponse.json({ 
        message: 'No files found in storage',
        synced: 0,
        skipped: 0
      });
    }

    console.log(`📁 Found ${files.length} files in storage`);

    // Get existing records from database
    const { data: existingRecords, error: dbError } = await supabase
      .from('call_recordings')
      .select('original_filename, file_url')
      .eq('organization_id', userProfile.profile.organization_id);

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to fetch existing records',
        details: dbError.message 
      }, { status: 500 });
    }

    // Create a set of existing filenames for quick lookup
    const existingFilenames = new Set(
      existingRecords?.map(record => record.original_filename || record.file_url) || []
    );

    // Find files that need to be synced
    const filesToSync = files.filter(file => 
      !existingFilenames.has(file.name) && 
      file.name !== '.emptyFolderPlaceholder'
    );

    console.log(`🔍 Found ${filesToSync.length} files to sync`);

    if (filesToSync.length === 0) {
      return NextResponse.json({ 
        message: 'All files already synced',
        synced: 0,
        skipped: files.length
      });
    }

    // Create database entries for missing files
    const recordsToInsert = filesToSync.map(file => ({
      organization_id: userProfile.profile.organization_id,
      original_filename: file.name,
      file_url: file.name, // Storage path
      file_size: file.metadata?.size || null,
      status: 'uploaded',
      transcription_status: 'pending'
    }));

    const { data: insertedRecords, error: insertError } = await supabase
      .from('call_recordings')
      .insert(recordsToInsert)
      .select('id, original_filename');

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create database records',
        details: insertError.message 
      }, { status: 500 });
    }

    console.log(`✅ Successfully synced ${insertedRecords?.length || 0} files`);

    return NextResponse.json({
      message: `Successfully synced ${insertedRecords?.length || 0} files from storage`,
      synced: insertedRecords?.length || 0,
      skipped: files.length - filesToSync.length,
      total: files.length,
      files: insertedRecords?.map(r => r.original_filename) || []
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}