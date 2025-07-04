'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileAudio, 
  RefreshCw, 
  Upload,
  Mic,
  Download
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
  const [transcribingIds, setTranscribingIds] = useState<Set<string>>(new Set());

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

  const playRecording = async (recording: CallRecording) => {
    try {
      // Get the public URL for the recording
      const response = await fetch(`/api/call-recordings/play?id=${recording.id}`);
      if (response.ok) {
        const data = await response.json();
        
        // Check if browser supports the audio format
        const audio = new Audio();
        const canPlayWav = audio.canPlayType('audio/wav');
        const canPlayMp3 = audio.canPlayType('audio/mpeg');
        
        console.log('Audio support - WAV:', canPlayWav, 'MP3:', canPlayMp3);
        console.log('Trying to play URL:', data.url);
        
        // Try to load and play the audio
        audio.src = data.url;
        audio.load();
        
        audio.addEventListener('loadeddata', () => {
          console.log('Audio loaded successfully');
        });
        
        audio.addEventListener('error', (error) => {
          console.error('Audio error:', error);
          alert(`Audio error: ${error.message || 'Failed to load audio file'}. File format may not be supported or file may be corrupted.`);
        });
        
        audio.play().catch(error => {
          console.error('Play error:', error);
          alert(`Error playing audio: ${error.message}. Try downloading the file instead.`);
        });
      } else {
        alert('Could not get audio URL');
      }
    } catch (error) {
      alert('Error playing recording: ' + error);
    }
  };

  const downloadRecording = async (recording: CallRecording) => {
    try {
      const response = await fetch(`/api/call-recordings/play?id=${recording.id}`);
      if (response.ok) {
        const data = await response.json();
        
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = data.url;
        link.download = recording.original_filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Could not get download URL');
      }
    } catch (error) {
      alert('Error downloading recording: ' + error);
    }
  };

  const transcribeOne = async (recordingId: string, filename: string) => {
    setTranscribingIds(prev => new Set(prev).add(recordingId));
    
    try {
      const response = await fetch('/api/call-recordings/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordingId: recordingId
        }),
      });

      if (response.ok) {
        alert(`✅ Successfully transcribed: ${filename}`);
        // Refresh the recordings list to show updated status
        await fetchRecordings();
      } else {
        let errorMessage = 'Unknown error';
        try {
          // Try to parse as JSON first
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || error.details || 'Unknown error';
          } else {
            // Get raw text if not JSON
            const rawText = await response.text();
            errorMessage = rawText || `HTTP ${response.status}`;
          }
        } catch (parseError) {
          errorMessage = `HTTP ${response.status} - Parse error`;
        }
        alert(`❌ Failed to transcribe ${filename}: ${errorMessage}`);
      }
    } catch (error) {
      alert(`❌ Error transcribing ${filename}: ${error}`);
    } finally {
      setTranscribingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });
    }
  };

  const resetStatus = async (recordingId: string, filename: string) => {
    try {
      const response = await fetch('/api/call-recordings/reset-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordingId: recordingId
        }),
      });

      if (response.ok) {
        alert(`✅ Status reset for: ${filename}`);
        await fetchRecordings();
      } else {
        const error = await response.json();
        alert(`❌ Failed to reset status: ${error.error}`);
      }
    } catch (error) {
      alert(`❌ Error resetting status: ${error}`);
    }
  };

  const resetAllStuck = async () => {
    const stuckRecordings = recordings.filter(
      recording => recording.transcription_status === 'in_progress' || 
                  recording.status === 'transcribing'
    );

    if (stuckRecordings.length === 0) {
      alert('No stuck recordings found');
      return;
    }

    const shouldProceed = confirm(`Reset ${stuckRecordings.length} stuck recordings?`);
    if (!shouldProceed) return;

    for (const recording of stuckRecordings) {
      try {
        await fetch('/api/call-recordings/reset-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordingId: recording.id }),
        });
      } catch (error) {
        console.error('Error resetting:', recording.original_filename, error);
      }
    }

    alert(`Reset ${stuckRecordings.length} recordings`);
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
          <Button 
            variant="outline"
            onClick={resetAllStuck}
          >
            Reset All Stuck
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => playRecording(recording)}
                >
                  Play
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadRecording(recording)}
                >
                  <Download className="mr-1 h-3 w-3" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => transcribeOne(recording.id, recording.original_filename)}
                  disabled={transcribingIds.has(recording.id) || recording.transcription_status === 'completed'}
                >
                  {transcribingIds.has(recording.id) ? (
                    <>
                      <Mic className="mr-1 h-3 w-3 animate-pulse" />
                      Transcribing...
                    </>
                  ) : (
                    'Transcribe'
                  )}
                </Button>
                {(recording.transcription_status === 'in_progress' || recording.status === 'transcribing') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => resetStatus(recording.id, recording.original_filename)}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}