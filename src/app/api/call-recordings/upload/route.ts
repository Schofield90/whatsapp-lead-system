import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = await createClient();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/aac', 'audio/flac'];
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'];
    
    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload audio files only.' 
      }, { status: 400 });
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 100MB.' 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${userProfile.profile.organization_id}/${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('call-recordings')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file',
        details: uploadError.message,
        hint: 'Make sure the "call-recordings" bucket exists in Supabase Storage'
      }, { status: 500 });
    }

    // Get file duration (this would require a media processing library)
    // For now, we'll set it as null and could process it later
    const duration = null;

    // Store metadata in database
    const { data: recording, error: dbError } = await supabase
      .from('call_recordings')
      .insert({
        organization_id: userProfile.profile.organization_id,
        original_filename: file.name,
        file_url: uploadData.path,
        file_size: file.size,
        duration_seconds: duration,
        status: 'uploaded',
        transcription_status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('call-recordings').remove([fileName]);
      return NextResponse.json({ 
        error: 'Failed to save recording metadata' 
      }, { status: 500 });
    }

    // Trigger transcription process (we'll implement this next)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/call-recordings/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId: recording.id })
      });
    } catch (error) {
      console.error('Failed to trigger transcription:', error);
      // Don't fail the upload, just log the error
    }

    return NextResponse.json({
      success: true,
      recording: {
        id: recording.id,
        filename: recording.original_filename,
        size: recording.file_size,
        status: recording.status
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}