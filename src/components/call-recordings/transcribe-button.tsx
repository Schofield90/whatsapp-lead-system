'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2 } from 'lucide-react';

interface TranscribeButtonProps {
  recordingId: string;
  fileName: string;
  status: string;
  onTranscribed?: () => void;
}

export function TranscribeButton({ recordingId, fileName, status, onTranscribed }: TranscribeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleTranscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/call-recordings/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordingId,
          fileName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe recording');
      }

      const result = await response.json();
      alert('Recording transcribed and analyzed successfully!');
      
      if (onTranscribed) {
        onTranscribed();
      }
    } catch (error) {
      console.error('Error transcribing recording:', error);
      alert('Failed to transcribe recording. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'transcribed') {
    return (
      <Button size="sm" variant="outline" disabled>
        <Mic className="h-4 w-4 mr-1" />
        Transcribed
      </Button>
    );
  }

  if (status === 'transcribing') {
    return (
      <Button size="sm" variant="outline" disabled>
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        Transcribing...
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={handleTranscribe} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Mic className="h-4 w-4 mr-1" />
      )}
      {loading ? 'Starting...' : 'Transcribe'}
    </Button>
  );
}