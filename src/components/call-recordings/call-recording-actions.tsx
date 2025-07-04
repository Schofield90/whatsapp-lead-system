'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Play, Download, MessageSquare, FileText, Clock, User } from 'lucide-react';

interface CallRecording {
  id: string;
  fileName: string;
  leadName?: string;
  leadPhone?: string;
  callDate?: string;
  duration?: number;
  callType?: string;
  status: string;
  transcription?: string;
  summary?: string;
  keyPoints?: string[];
  sentiment?: string;
  actionItems?: string[];
  url: string;
}

interface CallRecordingActionsProps {
  recording: CallRecording;
}

export function CallRecordingActions({ recording }: CallRecordingActionsProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'transcribed': return 'bg-green-100 text-green-800';
      case 'transcribing': return 'bg-yellow-100 text-yellow-800';
      case 'recorded': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex space-x-2">
      {/* Play Button */}
      <Button size="sm" variant="outline" asChild>
        <a href={recording.url} target="_blank" rel="noopener noreferrer">
          <Play className="h-4 w-4" />
        </a>
      </Button>

      {/* Download Button */}
      <Button size="sm" variant="outline" asChild>
        <a href={recording.url} download={recording.fileName}>
          <Download className="h-4 w-4" />
        </a>
      </Button>

      {/* Transcription Button */}
      {recording.transcription && (
        <Dialog open={transcriptionOpen} onOpenChange={setTranscriptionOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Call Transcription</DialogTitle>
              <DialogDescription>
                AI-generated transcription and analysis for {recording.fileName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto">
              {/* Summary */}
              {recording.summary && (
                <div>
                  <Label className="text-sm font-medium">Summary</Label>
                  <p className="text-sm text-gray-700 mt-1">{recording.summary}</p>
                </div>
              )}

              {/* Sentiment & Key Points */}
              <div className="grid grid-cols-2 gap-4">
                {recording.sentiment && (
                  <div>
                    <Label className="text-sm font-medium">Sentiment</Label>
                    <div className="mt-1">
                      <Badge className={getSentimentColor(recording.sentiment)}>
                        {recording.sentiment}
                      </Badge>
                    </div>
                  </div>
                )}

                {recording.keyPoints && recording.keyPoints.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Key Points</Label>
                    <ul className="text-sm text-gray-700 mt-1 list-disc list-inside">
                      {recording.keyPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Items */}
              {recording.actionItems && recording.actionItems.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Action Items</Label>
                  <ul className="text-sm text-gray-700 mt-1 list-disc list-inside">
                    {recording.actionItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Transcription */}
              <div>
                <Label className="text-sm font-medium">Full Transcription</Label>
                <Textarea
                  value={recording.transcription}
                  readOnly
                  className="mt-1 min-h-[200px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setTranscriptionOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Details Button */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <FileText className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Recording Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">File Name</Label>
                <p className="text-sm text-gray-700">{recording.fileName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge className={getStatusColor(recording.status)}>
                  {recording.status}
                </Badge>
              </div>
              {recording.leadName && (
                <div>
                  <Label className="text-sm font-medium">Lead</Label>
                  <p className="text-sm text-gray-700">{recording.leadName}</p>
                </div>
              )}
              {recording.leadPhone && (
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-gray-700">{recording.leadPhone}</p>
                </div>
              )}
              {recording.callDate && (
                <div>
                  <Label className="text-sm font-medium">Call Date</Label>
                  <p className="text-sm text-gray-700">
                    {new Date(recording.callDate).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Duration</Label>
                <p className="text-sm text-gray-700">{formatDuration(recording.duration)}</p>
              </div>
              {recording.callType && (
                <div>
                  <Label className="text-sm font-medium">Call Type</Label>
                  <p className="text-sm text-gray-700 capitalize">{recording.callType}</p>
                </div>
              )}
              {recording.sentiment && (
                <div>
                  <Label className="text-sm font-medium">Sentiment</Label>
                  <Badge className={getSentimentColor(recording.sentiment)}>
                    {recording.sentiment}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}