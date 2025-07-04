import { requireOrganization } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  FileAudio, 
  MessageSquare,
  Clock,
  Zap
} from 'lucide-react';
import { CallRecordingsList } from '@/components/call-recordings/call-recordings-list';
import { CallRecordingsStats } from '@/components/call-recordings/call-recordings-stats';

export default async function CallRecordingsPage() {
  const userProfile = await requireOrganization();

  // For now, we'll show a placeholder since we need to fetch from the API
  // In a real implementation, this would be fetched client-side or through a server action

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'transcribed': return 'bg-green-100 text-green-800';
      case 'transcribing': return 'bg-yellow-100 text-yellow-800';
      case 'recorded': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Call Recordings</h1>
          <p className="text-muted-foreground">
            AI-powered call transcriptions and analysis for better lead insights
          </p>
        </div>
        <Button>
          <FileAudio className="mr-2 h-4 w-4" />
          Upload Recording
        </Button>
      </div>

      {/* Stats Cards */}
      <CallRecordingsStats />

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search recordings..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <CallRecordingsList />
    </div>
  );
}