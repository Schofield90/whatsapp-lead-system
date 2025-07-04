'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileAudio, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Play,
  Trash2 
} from 'lucide-react';
import { formatFileSize, formatDuration } from '@/lib/utils';

interface CallRecording {
  id: string;
  original_filename: string;
  file_size: number;
  duration_seconds?: number;
  status: 'uploaded' | 'transcribing' | 'transcribed' | 'processed' | 'error';
  transcription_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  upload_date: string;
}

interface CallRecordingUploadProps {
  recordings: CallRecording[];
  onUploadComplete: () => void;
}

export function CallRecordingUpload({ recordings, onUploadComplete }: CallRecordingUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const audioFiles = acceptedFiles.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.toLowerCase().endsWith('.mp3') ||
      file.name.toLowerCase().endsWith('.wav') ||
      file.name.toLowerCase().endsWith('.m4a') ||
      file.name.toLowerCase().endsWith('.ogg')
    );

    if (audioFiles.length === 0) {
      alert('Please upload audio files only (MP3, WAV, M4A, OGG)');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get the current user and organization
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('Organization not found');
      }

      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        
        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${userProfile.organization_id}/${timestamp}_${sanitizedName}`;

        // Upload directly to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('call-recordings')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Store metadata in database via API (to use service role)
        const response = await fetch('/api/call-recordings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: userProfile.organization_id,
            original_filename: file.name,
            file_url: uploadData.path,
            file_size: file.size,
            duration_seconds: null,
            status: 'uploaded',
            transcription_status: 'pending'
          })
        });

        const dbResult = await response.json();
        if (!response.ok) {
          // Clean up uploaded file
          await supabase.storage.from('call-recordings').remove([fileName]);
          throw new Error(`Failed to save metadata for ${file.name}: ${dbResult.error}`);
        }

        // Trigger transcription
        try {
          await fetch('/api/call-recordings/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: uploadData.path })
          });
        } catch (error) {
          console.error('Failed to trigger transcription:', error);
          // Don't fail the upload, just log the error
        }

        setUploadProgress(((i + 1) / audioFiles.length) * 100);
      }

      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac']
    },
    multiple: true,
    disabled: uploading
  });

  const getStatusIcon = (status: string, transcriptionStatus: string) => {
    if (status === 'error' || transcriptionStatus === 'failed') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (status === 'processed' && transcriptionStatus === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status === 'transcribing' || transcriptionStatus === 'in_progress') {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = (status: string, transcriptionStatus: string) => {
    if (status === 'error' || transcriptionStatus === 'failed') return 'Error';
    if (status === 'processed' && transcriptionStatus === 'completed') return 'Ready';
    if (status === 'transcribing' || transcriptionStatus === 'in_progress') return 'Processing';
    if (transcriptionStatus === 'completed') return 'Transcribed';
    return 'Uploaded';
  };

  const getStatusColor = (status: string, transcriptionStatus: string) => {
    if (status === 'error' || transcriptionStatus === 'failed') return 'bg-red-100 text-red-800';
    if (status === 'processed' && transcriptionStatus === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'transcribing' || transcriptionStatus === 'in_progress') return 'bg-blue-100 text-blue-800';
    if (transcriptionStatus === 'completed') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Call Recordings</CardTitle>
          <CardDescription>
            Upload audio files from your sales calls to train Claude on your communication style and techniques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive || dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop call recordings'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse files
            </p>
            <p className="text-xs text-gray-400">
              Supports MP3, WAV, M4A, OGG, AAC, FLAC files
            </p>
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recordings List */}
      {recordings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Call Recordings ({recordings.length})</CardTitle>
            <CardDescription>
              Manage your uploaded call recordings and their processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileAudio className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{recording.original_filename}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatFileSize(recording.file_size)}</span>
                        {recording.duration_seconds && (
                          <span>{formatDuration(recording.duration_seconds)}</span>
                        )}
                        <span>{new Date(recording.upload_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(recording.status, recording.transcription_status)}
                      <Badge className={getStatusColor(recording.status, recording.transcription_status)}>
                        {getStatusText(recording.status, recording.transcription_status)}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}