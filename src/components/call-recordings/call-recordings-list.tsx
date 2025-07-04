'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileAudio, 
  RefreshCw, 
  Upload,
  Mic,
  Download,
  Zap,
  TestTube,
  ChevronDown,
  ChevronUp
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
  const [compressingIds, setCompressingIds] = useState<Set<string>>(new Set());
  const [backfillingsentiment, setBackfillingsentiment] = useState(false);
  const [checkingSchema, setCheckingSchema] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [showAITest, setShowAITest] = useState(false);
  const [testMessage, setTestMessage] = useState('Hi, I saw your gym online and I\'m interested in joining. Can you tell me more about your prices?');
  const [debuggingWebhook, setDebuggingWebhook] = useState(false);

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
    // For now, just suggest downloading instead of trying to play in browser
    alert(
      `Audio Playback Not Supported\n\n` +
      `WAV files often can't play directly in browsers.\n\n` +
      `Please use the "Download" button to:\n` +
      `1. Download the file to your computer\n` +
      `2. Open with your preferred audio player\n\n` +
      `Or try "Compress" first to convert to MP3 format.`
    );
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

  const resetAllFailed = async () => {
    const failedRecordings = recordings.filter(
      recording => recording.transcription_status === 'failed' || 
                  recording.status === 'error'
    );

    if (failedRecordings.length === 0) {
      alert('No failed recordings found');
      return;
    }

    const shouldProceed = confirm(
      `Reset ${failedRecordings.length} failed recordings?\n\n` +
      `This will allow them to be retried with improved error handling.`
    );
    if (!shouldProceed) return;

    for (const recording of failedRecordings) {
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

    alert(`Reset ${failedRecordings.length} failed recordings`);
    await fetchRecordings();
  };

  const backfillSentiment = async () => {
    const shouldProceed = confirm(
      `This will analyze sentiment for existing transcripts using Claude AI.\n\n` +
      `This may take a few minutes and will use Anthropic API credits. Continue?`
    );

    if (!shouldProceed) return;

    setBackfillingsentiment(true);
    
    try {
      const response = await fetch('/api/call-recordings/backfill-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Sentiment Analysis Complete!\n\n` +
          `✅ Processed: ${result.processed}\n` +
          `❌ Failed: ${result.failed}\n\n` +
          `${result.message}`
        );
        await fetchRecordings(); // Refresh to show updated stats
      } else {
        const error = await response.json();
        alert(`❌ Failed to backfill sentiment: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`❌ Error running sentiment analysis: ${error}`);
    } finally {
      setBackfillingsentiment(false);
    }
  };

  const checkSchema = async () => {
    setCheckingSchema(true);
    
    try {
      const response = await fetch('/api/call-recordings/add-sentiment-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Database Schema Check Complete!\n\n` +
          `✅ Total transcripts: ${result.totalTranscripts}\n` +
          `📊 With sentiment: ${result.withSentiment}\n` +
          `🔄 Need analysis: ${result.withoutSentiment}\n\n` +
          `${result.message}`
        );
      } else {
        const error = await response.json();
        alert(`❌ Schema check failed: ${error.error}\n\nDetails: ${error.details || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`❌ Error checking schema: ${error}`);
    } finally {
      setCheckingSchema(false);
    }
  };

  const testAILearning = async () => {
    setTestingAI(true);
    
    try {
      const response = await fetch('/api/test-ai-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMessage }),
      });

      if (response.ok) {
        const result = await response.json();
        
        const learningInfo = `
AI Learning Test Results:

📊 LEARNING DATA:
• Total transcripts: ${result.learningData.totalTranscripts}
• Training data: ${result.learningData.trainingDataCount}
• Sentiment breakdown: ${JSON.stringify(result.learningData.sentimentBreakdown)}

💬 TEST MESSAGE:
"${result.testMessage}"

🤖 AI RESPONSE:
"${result.aiResponse}"

🎯 CALL INSIGHTS BEING USED:
${result.callInsights.map((insight: any, i: number) => 
  `${i + 1}. ${insight.sentiment.toUpperCase()}: ${insight.insight}`
).join('\n')}

${result.learningData.hasLearning ? 
  '✅ AI is successfully learning from your call transcripts!' : 
  '⚠️ No learning data available - run sentiment analysis first'
}`;

        alert(learningInfo);
      } else {
        const error = await response.json();
        alert(`❌ Test failed: ${error.error}`);
      }
    } catch (error) {
      alert(`❌ Error testing AI: ${error}`);
    } finally {
      setTestingAI(false);
    }
  };

  const debugWebhookContext = async () => {
    setDebuggingWebhook(true);
    
    try {
      const response = await fetch('/api/debug-webhook-context');
      
      if (response.ok) {
        const result = await response.json();
        
        const debugInfo = `
🔍 WEBHOOK CONTEXT DEBUG:

📊 CONTEXT LOADED:
• Lead found: ${result.context.leadFound}
• Organization ID: ${result.context.organizationId}
• Messages: ${result.context.messagesCount}
• Training data: ${result.context.trainingDataCount}
• Call transcripts: ${result.context.callTranscriptsCount}

📈 SENTIMENT BREAKDOWN:
${JSON.stringify(result.sentimentBreakdown, null, 2)}

🎯 SAMPLE TRANSCRIPTS:
${result.callTranscriptsSample.map((sample: any, i: number) => 
  `${i + 1}. ${sample.sentiment.toUpperCase()}: ${sample.insightsSample}`
).join('\n')}

❌ ERRORS:
${JSON.stringify(result.errors, null, 2)}

${result.context.callTranscriptsCount > 0 ? 
  '✅ Transcripts should be available to WhatsApp AI' : 
  '⚠️ No transcripts found - check sentiment analysis'
}`;

        alert(debugInfo);
      } else {
        alert('❌ Debug failed');
      }
    } catch (error) {
      alert(`❌ Error debugging: ${error}`);
    } finally {
      setDebuggingWebhook(false);
    }
  };

  const debugSystemPrompt = async () => {
    setTestingAI(true);
    
    try {
      const response = await fetch('/api/debug-system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMessage }),
      });

      if (response.ok) {
        const result = await response.json();
        
        const debugInfo = `
🔍 SYSTEM PROMPT DEBUG:

📊 CONTEXT:
• Organization ID: ${result.context.organizationId}
• Call transcripts: ${result.context.callTranscriptsCount}
• Training data: ${result.context.trainingDataCount}

📈 SENTIMENT BREAKDOWN:
${JSON.stringify(result.sentimentBreakdown, null, 2)}

💬 TEST MESSAGE:
"${result.testMessage}"

🤖 AI RESPONSE:
"${result.aiResponse}"

🎯 TRANSCRIPT ANALYSIS:
${result.transcriptAnalysis.map((t: any, i: number) => 
  `${i + 1}. ${t.sentiment.toUpperCase()} (${t.transcriptLength} chars, insights: ${t.hasInsights})`
).join('\n')}

${result.debugNote}

Compare this response with your WhatsApp test to see differences.`;

        alert(debugInfo);
      } else {
        const error = await response.json();
        alert(`❌ Debug failed: ${error.error}`);
      }
    } catch (error) {
      alert(`❌ Error debugging: ${error}`);
    } finally {
      setTestingAI(false);
    }
  };

  const compressAll = async () => {
    // Get recordings that might need compression (WAV files)
    const wavRecordings = recordings.filter(
      recording => recording.original_filename.toLowerCase().endsWith('.wav') &&
                  !recording.original_filename.includes('compressed/') &&
                  !compressingIds.has(recording.id)
    );

    if (wavRecordings.length === 0) {
      alert('No WAV files found to compress');
      return;
    }

    const shouldProceed = confirm(
      `Compress ${wavRecordings.length} WAV files?\n\n` +
      `This will convert them to MP3 format for transcription.\n` +
      `Process may take 5-10 minutes total.`
    );

    if (!shouldProceed) return;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < wavRecordings.length; i++) {
      const recording = wavRecordings[i];
      
      try {
        setCompressingIds(prev => new Set(prev).add(recording.id));
        
        const response = await fetch('/api/call-recordings/compress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordingId: recording.id }),
        });

        if (response.ok) {
          const result = await response.json();
          successCount++;
          console.log(`✅ Compressed: ${recording.original_filename}`);
        } else {
          failCount++;
          console.error(`❌ Failed: ${recording.original_filename}`);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Error: ${recording.original_filename}`, error);
      } finally {
        setCompressingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recording.id);
          return newSet;
        });
      }

      // Small delay between compressions
      if (i < wavRecordings.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    alert(
      `Compression Complete!\n\n` +
      `✅ Success: ${successCount}\n` +
      `❌ Failed: ${failCount}\n\n` +
      `Refreshing recordings list...`
    );

    await fetchRecordings();
  };

  const compressRecording = async (recordingId: string, filename: string) => {
    setCompressingIds(prev => new Set(prev).add(recordingId));
    
    try {
      const response = await fetch('/api/call-recordings/compress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordingId: recordingId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.compressed) {
          alert(
            `✅ Compression successful!\n\n` +
            `${filename}\n` +
            `${result.originalSize.toFixed(2)}MB → ${result.compressedSize.toFixed(2)}MB\n` +
            `${result.compressionRatio}% reduction\n\n` +
            `File is now ready for transcription!`
          );
        } else {
          alert(`ℹ️ ${result.message}`);
        }
        await fetchRecordings();
      } else {
        let errorMessage = 'Unknown error';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || error.details || 'Unknown error';
          } else {
            const rawText = await response.text();
            errorMessage = rawText || `HTTP ${response.status}`;
          }
        } catch (parseError) {
          errorMessage = `HTTP ${response.status} - Parse error`;
        }
        alert(`❌ Failed to compress ${filename}: ${errorMessage}`);
      }
    } catch (error) {
      alert(`❌ Error compressing ${filename}: ${error}`);
    } finally {
      setCompressingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });
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
        <div className="flex flex-col space-y-2">
          {/* Primary Actions Row */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={fetchRecordings}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3 w-3" />
              )}
              Refresh
            </Button>
            <Button 
              variant="outline"
              onClick={syncFromStorage} 
              disabled={syncing}
              size="sm"
            >
              {syncing ? (
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3 w-3" />
              )}
              {syncing ? 'Syncing...' : 'Sync Storage'}
            </Button>
            <Button 
              onClick={transcribeAll} 
              disabled={transcribing || recordings.length === 0}
              size="sm"
            >
              {transcribing ? (
                <Mic className="mr-2 h-3 w-3 animate-pulse" />
              ) : (
                <Mic className="mr-2 h-3 w-3" />
              )}
              {transcribing 
                ? `${transcriptionProgress.current}/${transcriptionProgress.total}` 
                : 'Transcribe All'
              }
            </Button>
          </div>
          
          {/* Secondary Actions Row */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline"
              onClick={compressAll}
              disabled={recordings.length === 0}
              size="sm"
            >
              <Zap className="mr-2 h-3 w-3" />
              Compress WAV
            </Button>
            <Button 
              variant="outline"
              onClick={backfillSentiment}
              disabled={backfillingsentiment}
              size="sm"
            >
              {backfillingsentiment ? (
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <>🧠</>
              )}
              {backfillingsentiment ? 'Analyzing...' : 'Analyze Sentiment'}
            </Button>
            <Button 
              variant="outline"
              onClick={resetAllStuck}
              size="sm"
            >
              Reset Stuck
            </Button>
            <Button 
              variant="outline"
              onClick={resetAllFailed}
              size="sm"
            >
              Reset Failed
            </Button>
          </div>
          
          {/* Advanced/Debug Actions Row */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowAITest(!showAITest)}
              size="sm"
            >
              <TestTube className="mr-2 h-3 w-3" />
              Test AI Learning
              {showAITest ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
            </Button>
            <Button 
              variant="outline"
              onClick={debugWebhookContext}
              disabled={debuggingWebhook}
              size="sm"
            >
              {debuggingWebhook ? (
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <>🔍</>
              )}
              {debuggingWebhook ? 'Debugging...' : 'Debug WhatsApp'}
            </Button>
            <Button 
              variant="outline"
              onClick={checkSchema}
              disabled={checkingSchema}
              size="sm"
            >
              {checkingSchema ? (
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <>🔧</>
              )}
              {checkingSchema ? 'Checking...' : 'Check Schema'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showAITest && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">🧪 AI Learning Test</CardTitle>
              <CardDescription>
                Test how the AI responds using insights from your call transcripts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Test Message:</label>
                  <Input
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Enter a test customer message..."
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={testAILearning}
                    disabled={testingAI}
                  >
                    {testingAI ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        Test AI
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={debugSystemPrompt}
                    disabled={testingAI}
                    variant="outline"
                  >
                    {testingAI ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Debug...
                      </>
                    ) : (
                      <>
                        🔍 Debug Prompt
                      </>
                    )}
                  </Button>
                </div>
                <div className="text-xs text-gray-600">
                  This will show you exactly what the AI knows from your call transcripts and how it responds to customer messages.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
                {recording.original_filename.toLowerCase().endsWith('.wav') && !recording.original_filename.includes('compressed/') && ( // Show for all WAV files
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => compressRecording(recording.id, recording.original_filename)}
                    disabled={compressingIds.has(recording.id)}
                  >
                    {compressingIds.has(recording.id) ? (
                      <>
                        <Zap className="mr-1 h-3 w-3 animate-pulse" />
                        Compressing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-1 h-3 w-3" />
                        Compress
                      </>
                    )}
                  </Button>
                )}
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
                {(recording.transcription_status === 'in_progress' || 
                  recording.status === 'transcribing' ||
                  recording.transcription_status === 'failed' ||
                  recording.status === 'error') && (
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