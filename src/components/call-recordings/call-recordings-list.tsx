'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileAudio, 
  RefreshCw, 
  Upload,
  Mic
} from 'lucide-react';

interface CallRecording {
  id: string;
  original_filename: string;
  file_url: string;
  status: string;
  transcription_status: string;
  created_at: string;
  file_size?: number;
}

export function CallRecordingsList() {
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState({ current: 0, total: 0 });

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/call-recordings');
      const data = await response.json();
      
      if (response.ok) {
        setRecordings(data.recordings || []);
      } else {
        alert('Error: ' + (data.error || 'Failed to fetch recordings'));
      }
    } catch (error) {
      alert('Error: Failed to fetch recordings');
    } finally {
      setLoading(false);
    }
  };

  const syncFromStorage = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/call-recordings/sync', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        alert('Sync Successful: ' + data.message);
        // Refresh the list after sync
        await fetchRecordings();
      } else {
        alert('Sync Failed: ' + (data.error || 'Failed to sync from storage'));
      }
    } catch (error) {
      alert('Sync Failed: Failed to sync from storage');
    } finally {
      setSyncing(false);
    }
  };

  const transcribeAll = async () => {
    // Get recordings that haven't been transcribed yet
    const untranscribedRecordings = recordings.filter(
      recording => recording.transcription_status === 'pending' || 
                  recording.transcription_status === 'failed' ||
                  !recording.transcription_status
    );

    if (untranscribedRecordings.length === 0) {
      alert('No recordings need transcription. All recordings are already transcribed or in progress.');
      return;
    }

    const shouldProceed = confirm(
      `This will transcribe ${untranscribedRecordings.length} recordings. This may take several minutes and will use OpenAI API credits. Continue?`
    );

    if (!shouldProceed) return;

    setTranscribing(true);
    setTranscriptionProgress({ current: 0, total: untranscribedRecordings.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < untranscribedRecordings.length; i++) {
      const recording = untranscribedRecordings[i];
      setTranscriptionProgress({ current: i + 1, total: untranscribedRecordings.length });

      try {
        const response = await fetch('/api/call-recordings/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recordingId: recording.id
          }),
        });

        if (response.ok) {
          successCount++;
          console.log(`✅ Transcribed: ${recording.original_filename}`);
        } else {
          failCount++;
          const error = await response.json();
          console.error(`❌ Failed to transcribe ${recording.original_filename}:`, error);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Error transcribing ${recording.original_filename}:`, error);
      }

      // Small delay between requests to be nice to the API
      if (i < untranscribedRecordings.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setTranscribing(false);
    setTranscriptionProgress({ current: 0, total: 0 });

    // Show results
    alert(
      `Transcription complete!\n\n` +
      `✅ Success: ${successCount}\n` +
      `❌ Failed: ${failCount}\n\n` +
      `Refreshing recordings list...`
    );

    // Refresh the recordings list to show updated statuses
    await fetchRecordings();
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  if (recordings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Call Recordings</CardTitle>
          <CardDescription>
            Recordings from consultation calls with leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileAudio className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings yet</h3>
            <p className="text-gray-500 mb-4">
              Call recordings will appear here when uploaded to Supabase Storage
            </p>
            <div className="flex space-x-2 justify-center">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Recording
              </Button>
              <Button 
                variant="outline"
                onClick={syncFromStorage} 
                disabled={syncing}
              >
                {syncing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {syncing ? 'Syncing...' : 'Sync from Storage'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Call Recordings ({recordings.length})</CardTitle>
          <CardDescription>
            Recordings from consultation calls with leads
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={fetchRecordings}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={syncFromStorage} 
            disabled={syncing}
          >
            {syncing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {syncing ? 'Syncing...' : 'Sync from Storage'}
          </Button>
          <Button 
            onClick={transcribeAll} 
            disabled={transcribing || recordings.length === 0}
          >
            {transcribing ? (
              <Mic className="mr-2 h-4 w-4 animate-pulse" />
            ) : (
              <Mic className="mr-2 h-4 w-4" />
            )}
            {transcribing 
              ? `Transcribing ${transcriptionProgress.current}/${transcriptionProgress.total}...` 
              : 'Transcribe All'
            }
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recordings.map((recording) => (
            <div 
              key={recording.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <FileAudio className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-medium">{recording.original_filename}</h4>
                  <p className="text-sm text-gray-500">
                    {recording.file_size ? `${Math.round(recording.file_size / 1024 / 1024)} MB` : 'Unknown size'} • 
                    Status: {recording.status} • 
                    Transcription: {recording.transcription_status}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Play
                </Button>
                <Button variant="outline" size="sm">
                  Transcribe
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}