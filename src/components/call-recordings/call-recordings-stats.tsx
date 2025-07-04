'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileAudio, 
  MessageSquare,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react';

interface CallRecordingStats {
  totalRecordings: number;
  transcribedCount: number;
  avgDurationMinutes: number;
  positiveSentimentPercent: number;
  recentTranscriptions: number;
  stats: {
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
  };
}

export function CallRecordingsStats() {
  const [stats, setStats] = useState<CallRecordingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/call-recordings/stats');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setError(null);
      } else {
        setError('Failed to fetch stats');
      }
    } catch (err) {
      setError('Error loading stats');
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Loading data...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500 text-sm">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Recordings</CardTitle>
          <FileAudio className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRecordings}</div>
          <p className="text-xs text-muted-foreground">
            {stats.recentTranscriptions > 0 && `+${stats.recentTranscriptions} today`}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transcribed</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.transcribedCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.stats.inProgress > 0 && `${stats.stats.inProgress} in progress`}
            {stats.stats.pending > 0 && `${stats.stats.pending} pending`}
            {stats.stats.inProgress === 0 && stats.stats.pending === 0 && 'Ready for analysis'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgDurationMinutes}m</div>
          <p className="text-xs text-muted-foreground">
            Average call length
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.positiveSentimentPercent}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.transcribedCount > 0 ? 'Positive call outcomes' : 'No data yet'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}