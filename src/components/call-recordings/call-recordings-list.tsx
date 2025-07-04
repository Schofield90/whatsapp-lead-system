'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  FileAudio, 
  RefreshCw, 
  Upload
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
  const { toast } = useToast();

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/call-recordings');
      const data = await response.json();
      
      if (response.ok) {
        setRecordings(data.recordings || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch recordings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch recordings',
        variant: 'destructive',
      });
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
        toast({
          title: 'Sync Successful',
          description: data.message,
        });
        // Refresh the list after sync
        await fetchRecordings();
      } else {
        toast({
          title: 'Sync Failed',
          description: data.error || 'Failed to sync from storage',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync from storage',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
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