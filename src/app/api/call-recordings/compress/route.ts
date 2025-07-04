import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const maxDuration = 300; // 5 minutes for compression

export async function POST(request: NextRequest) {
  try {
    const { recordingId } = await request.json();
    console.log('🔄 Starting audio compression for recording:', recordingId);
    
    if (!recordingId) {
      return NextResponse.json({ error: 'Recording ID required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Get recording details
    const { data: recording, error: fetchError } = await supabase
      .from('call_recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (fetchError || !recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Download the original file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('call-recordings')
      .download(recording.file_url || recording.original_filename);

    if (downloadError || !fileData) {
      throw new Error('Failed to download recording file');
    }

    const originalSizeMB = fileData.size / (1024 * 1024);
    console.log(`📁 Original file size: ${originalSizeMB.toFixed(2)} MB`);

    // If file is already small enough, skip compression
    if (fileData.size <= 25 * 1024 * 1024) {
      return NextResponse.json({
        success: true,
        message: `File is already ${originalSizeMB.toFixed(2)}MB (under 25MB limit)`,
        compressed: false,
        originalSize: originalSizeMB
      });
    }

    // Use CloudConvert API for audio compression
    const cloudConvertApiKey = process.env.CLOUDCONVERT_API_KEY;
    
    if (!cloudConvertApiKey) {
      return NextResponse.json({
        error: 'CloudConvert API key not configured',
        details: 'Please add CLOUDCONVERT_API_KEY to environment variables for automatic compression'
      }, { status: 501 });
    }

    // Step 1: Create conversion job
    const createJobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudConvertApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tasks: {
          'import-file': {
            operation: 'import/upload'
          },
          'convert-audio': {
            operation: 'convert',
            input: 'import-file',
            output_format: 'mp3',
            engine: 'ffmpeg',
            audio_codec: 'mp3',
            audio_bitrate: 64 // 64kbps for voice
          },
          'export-file': {
            operation: 'export/url',
            input: 'convert-audio'
          }
        }
      })
    });

    if (!createJobResponse.ok) {
      throw new Error('Failed to create conversion job');
    }

    const jobData = await createJobResponse.json();
    console.log('✅ Conversion job created:', jobData.data.id);

    // Step 2: Upload file
    const uploadTask = jobData.data.tasks.find((t: any) => t.name === 'import-file');
    const uploadUrl = uploadTask.result.form.url;
    const uploadParams = uploadTask.result.form.parameters;

    const formData = new FormData();
    Object.entries(uploadParams).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append('file', fileData, recording.original_filename);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file for conversion');
    }

    console.log('✅ File uploaded for conversion');

    // Step 3: Wait for conversion to complete
    let jobStatus = 'waiting';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max

    while (jobStatus !== 'finished' && jobStatus !== 'error' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
        headers: {
          'Authorization': `Bearer ${cloudConvertApiKey}`
        }
      });

      const statusData = await statusResponse.json();
      jobStatus = statusData.data.status;
      attempts++;
      
      console.log(`🔄 Conversion status: ${jobStatus} (attempt ${attempts}/${maxAttempts})`);
    }

    if (jobStatus !== 'finished') {
      throw new Error(`Conversion failed or timed out. Status: ${jobStatus}`);
    }

    // Step 4: Get download URL
    const finalJobResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
      headers: {
        'Authorization': `Bearer ${cloudConvertApiKey}`
      }
    });

    const finalJobData = await finalJobResponse.json();
    const exportTask = finalJobData.data.tasks.find((t: any) => t.name === 'export-file');
    
    if (!exportTask?.result?.files?.[0]?.url) {
      throw new Error('No download URL found in conversion result');
    }

    const downloadUrl = exportTask.result.files[0].url;
    const compressedSize = exportTask.result.files[0].size;
    const compressedSizeMB = compressedSize / (1024 * 1024);

    console.log(`✅ Conversion complete: ${originalSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`);

    // Step 5: Download compressed file
    const compressedResponse = await fetch(downloadUrl);
    const compressedData = await compressedResponse.arrayBuffer();

    // Step 6: Upload compressed file to Supabase Storage
    const compressedFilename = recording.original_filename.replace(/\.(wav|WAV)$/, '.mp3');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('call-recordings')
      .upload(`compressed/${compressedFilename}`, compressedData, {
        contentType: 'audio/mpeg'
      });

    if (uploadError) {
      throw new Error('Failed to upload compressed file: ' + uploadError.message);
    }

    // Step 7: Update database record
    await supabase
      .from('call_recordings')
      .update({
        file_url: `compressed/${compressedFilename}`,
        file_size: compressedSize,
        status: 'compressed'
      })
      .eq('id', recordingId);

    return NextResponse.json({
      success: true,
      message: `File compressed successfully`,
      originalSize: originalSizeMB,
      compressedSize: compressedSizeMB,
      compressionRatio: Math.round(((originalSizeMB - compressedSizeMB) / originalSizeMB) * 100),
      compressedFilename
    });

  } catch (error) {
    console.error('Compression error:', error);
    return NextResponse.json({
      error: 'Compression failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}