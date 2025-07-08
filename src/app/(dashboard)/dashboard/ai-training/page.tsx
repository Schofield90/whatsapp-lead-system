'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Brain, MessageSquare, Target, Save } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  success: boolean;
  testMessage: string;
  aiResponse: string;
  learningData: {
    totalTranscripts: number;
    sentimentBreakdown: Record<string, number>;
    trainingDataCount: number;
    hasLearning: boolean;
  };
  callInsights: Array<{
    sentiment: string;
    insight: string;
    snippet: string;
  }>;
}

interface KnowledgeGap {
  category: string;
  question: string;
  importance: 'high' | 'medium' | 'low';
  context: string;
}


export default function AITrainingPage() {
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ai-questions');
  const [answerText, setAnswerText] = useState<{[key: string]: string}>({});
  const [savedTrainingData, setSavedTrainingData] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUnmountedRef = useRef(false);

  const fetchSavedTrainingData = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (dataLoaded || isUnmountedRef.current) {
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/training-data/view', {
        signal: abortControllerRef.current.signal,
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      // Check if component is still mounted
      if (isUnmountedRef.current) {
        return;
      }

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSavedTrainingData(result.data || []);
        console.log(`📖 Loaded ${result.count} training entries from database`);
      } else {
        console.error('Fetch error:', result);
        setSavedTrainingData([]);
      }
      
      setDataLoaded(true);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error('Error fetching saved training data:', error);
      if (!isUnmountedRef.current) {
        setSavedTrainingData([]);
        setDataLoaded(true);
      }
    }
  }, [dataLoaded]);

  useEffect(() => {
    generateKnowledgeGaps();
    // DISABLED FETCH TO STOP API LOOPS
    // fetchSavedTrainingData();
  }, []);


  const generateKnowledgeGaps = async () => {
    // Simulate knowledge gap analysis
    const gaps: KnowledgeGap[] = [
      {
        category: 'Pricing Information',
        question: 'What are the specific membership prices and packages offered?',
        importance: 'high',
        context: 'Essential for answering pricing inquiries'
      },
      {
        category: 'Facility Details',
        question: 'What equipment and amenities are available at the gym?',
        importance: 'high',
        context: 'Helps address facility-related questions'
      },
      {
        category: 'Class Schedules',
        question: 'What fitness classes are offered and when?',
        importance: 'medium',
        context: 'Important for members interested in group fitness'
      },
      {
        category: 'Personal Training',
        question: 'What personal training options and rates are available?',
        importance: 'high',
        context: 'Key service offering for many prospects'
      },
      {
        category: 'Location & Hours',
        question: 'What are the exact gym hours and location details?',
        importance: 'high',
        context: 'Basic information prospects need'
      },
      {
        category: 'Cancellation Policy',
        question: 'What is the membership cancellation and freeze policy?',
        importance: 'medium',
        context: 'Common concern that affects sign-ups'
      }
    ];
    setKnowledgeGaps(gaps);
  };


  const saveAnswer = async (category: string, question: string, answer: string) => {
    if (!answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    try {
      // Save to database via API
      const response = await fetch('/api/training-data/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          data_type: 'sop',
          content: answer,
          category: category,
          question: question
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message || 'Answer saved to database!');
        
        // Clear the answer text for this question
        const key = `${category}-${question}`;
        setAnswerText(prev => ({ ...prev, [key]: '' }));
        
        // DISABLED REFRESH TO STOP API LOOPS
        // setDataLoaded(false);
        // fetchSavedTrainingData();
      } else {
        console.error('Save error:', result);
        if (result.create_table_needed) {
          toast.error('Database table needs to be created. Check console for details.');
        } else {
          toast.error(result.error || 'Failed to save answer');
        }
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save answer');
    }
  };

  const testAI = async () => {
    if (!testMessage.trim()) {
      toast.error('Please enter a test message');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-ai-learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testMessage }),
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult(result);
        toast.success('AI test completed successfully');
      } else {
        toast.error('Test failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error testing AI:', error);
      toast.error('Failed to test AI');
    } finally {
      setLoading(false);
    }
  };

  const testPresetMessage = async (message: string) => {
    setTestMessage(message);
    setLoading(true);
    try {
      const response = await fetch('/api/test-ai-learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testMessage: message }),
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult(result);
        toast.success('AI test completed');
      } else {
        toast.error('Test failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error testing AI:', error);
      toast.error('Failed to test AI');
    } finally {
      setLoading(false);
    }
  };


  const presetMessages = [
    "Hi, what are your membership prices?",
    "I'm new to fitness and feeling intimidated. Can you help?",
    "Do you offer personal training?",
    "What are your gym hours?",
    "I want to cancel my membership",
    "Can I book a consultation today?"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Training & Knowledge Base</h1>
        <p className="text-muted-foreground">
          Train your AI with business knowledge and test its responses
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="ai-questions">
            <Brain className="mr-2 h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="test">
            <MessageSquare className="mr-2 h-4 w-4" />
            Test AI
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Save className="mr-2 h-4 w-4" />
            Saved ({savedTrainingData.length})
          </TabsTrigger>
        </TabsList>

        {/* AI Testing Tab */}
        <TabsContent value="test">
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Test AI Response</CardTitle>
                  <CardDescription>
                    Enter a message to test how your AI responds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testMessage">Test Message</Label>
                    <Textarea
                      id="testMessage"
                      placeholder="Enter a message to test the AI..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={testAI} disabled={loading} className="w-full">
                    {loading ? 'Testing...' : 'Test AI Response'}
                  </Button>
                  
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Quick Tests:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {presetMessages.slice(0, 3).map((message, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-left justify-start"
                          onClick={() => {
                            setTestMessage(message);
                            testPresetMessage(message);
                          }}
                          disabled={loading}
                        >
                          <span className="text-xs truncate">{message}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {testResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Response</CardTitle>
                    <CardDescription>
                      Response to: "{testResult.testMessage.substring(0, 50)}..."
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <p className="text-sm whitespace-pre-wrap">{testResult.aiResponse}</p>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      Knowledge Base Items: {testResult.learningData.trainingDataCount || 0}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>


        {/* Business Questions Tab */}
        <TabsContent value="ai-questions">
          <Card>
            <CardHeader>
              <CardTitle>Business Questions</CardTitle>
              <CardDescription>
                Answer these questions to help your AI better qualify and book leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Answer the questions below to build your AI's knowledge about your business.
                </p>
                
                <div className="space-y-4">
                  {knowledgeGaps.map((gap, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Target className="h-5 w-5 text-blue-500" />
                          <h3 className="font-medium">{gap.category}</h3>
                        </div>
                        <Badge variant={gap.importance === 'high' ? 'destructive' : gap.importance === 'medium' ? 'default' : 'secondary'}>
                          {gap.importance} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{gap.question}</p>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="w-full">
                            Answer This Question
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{gap.question}</DialogTitle>
                            <DialogDescription>
                              {gap.context}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`answer-${index}`}>Your Answer</Label>
                              <Textarea
                                id={`answer-${index}`}
                                placeholder="Provide detailed information to help the AI answer this question..."
                                rows={6}
                                value={answerText[`${gap.category}-${gap.question}`] || ''}
                                onChange={(e) => {
                                  const key = `${gap.category}-${gap.question}`;
                                  setAnswerText(prev => ({ ...prev, [key]: e.target.value }));
                                }}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  const key = `${gap.category}-${gap.question}`;
                                  setAnswerText(prev => ({ ...prev, [key]: '' }));
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => {
                                  const key = `${gap.category}-${gap.question}`;
                                  const answer = answerText[key] || '';
                                  saveAnswer(gap.category, gap.question, answer);
                                }}
                              >
                                Save Answer
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Saved Answers Tab */}
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Your Saved Training Answers</CardTitle>
              <CardDescription>
                All the answers you've provided to improve AI responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedTrainingData.length > 0 ? (
                <div className="space-y-4">
                  {savedTrainingData.map((entry, index) => (
                    <div key={entry.id || index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{entry.category}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.saved_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        {entry.question && (
                          <>
                            <p className="font-medium mb-2">Question:</p>
                            <p className="text-gray-600 mb-3 italic">{entry.question}</p>
                          </>
                        )}
                        <p className="font-medium mb-2">Answer:</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Save className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No answers saved yet</h3>
                  <p className="text-gray-500 mb-4">Answer some AI questions to see them here</p>
                  <Button onClick={() => setActiveTab('ai-questions')}>
                    Go to AI Questions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}