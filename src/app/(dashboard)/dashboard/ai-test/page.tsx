'use client';

import { useState, useEffect } from 'react';
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
import { Brain, MessageSquare, Target, HelpCircle, BarChart, Zap } from 'lucide-react';
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

interface TrainingDataSummary {
  success: boolean;
  totalItems: number;
  dataTypes: string[];
  breakdown: Array<{
    type: string;
    count: number;
    activeCount: number;
    items: Array<{
      id: string;
      version: number;
      is_active: boolean;
      created_at: string;
      contentPreview: string;
    }>;
  }>;
}

interface KnowledgeGap {
  category: string;
  question: string;
  importance: 'high' | 'medium' | 'low';
  context: string;
}

interface AIQuestion {
  question: string;
  importance: string;
  why_needed: string;
}

export default function AITestPage() {
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [trainingData, setTrainingData] = useState<TrainingDataSummary | null>(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [aiQuestions, setAiQuestions] = useState<{category: string, questions: AIQuestion[]}[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('test');
  const [answerText, setAnswerText] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchTrainingData();
    generateKnowledgeGaps();
  }, []);

  const fetchTrainingData = async () => {
    try {
      const response = await fetch('/api/check-training-data');
      const data = await response.json();
      setTrainingData(data);
    } catch (error) {
      console.error('Error fetching training data:', error);
      toast.error('Failed to load training data');
    }
  };

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

  const generateAIQuestions = async (category: string, context: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-ask-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category, context }),
      });

      const result = await response.json();
      
      if (result.success) {
        setAiQuestions(prev => {
          const filtered = prev.filter(item => item.category !== category);
          return [...filtered, { category, questions: result.questions }];
        });
        toast.success(`AI generated ${result.questions.length} questions for ${category}`);
      } else {
        toast.error('Failed to generate AI questions');
      }
    } catch (error) {
      console.error('Error generating AI questions:', error);
      toast.error('Failed to generate AI questions');
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = async (category: string, question: string, answer: string) => {
    if (!answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    try {
      // Here we'll save the answer as training data
      const response = await fetch('/api/training-data/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data_type: 'sop',
          content: `${category}\n\nQ: ${question}\n\nA: ${answer}`,
          category: category
        }),
      });

      if (response.ok) {
        toast.success('Answer saved! This will improve AI responses.');
        // Clear the answer text for this question
        const key = `${category}-${question}`;
        setAnswerText(prev => ({ ...prev, [key]: '' }));
        // Refresh training data
        fetchTrainingData();
      } else {
        toast.error('Failed to save answer');
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
        setActiveTab('results');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Testing & Knowledge</h1>
          <p className="text-muted-foreground">
            Test your AI's knowledge and identify areas for improvement
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">
            <MessageSquare className="mr-2 h-4 w-4" />
            Test AI
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <Brain className="mr-2 h-4 w-4" />
            Knowledge Status
          </TabsTrigger>
          <TabsTrigger value="gaps">
            <HelpCircle className="mr-2 h-4 w-4" />
            Knowledge Gaps
          </TabsTrigger>
          <TabsTrigger value="ai-questions">
            <Target className="mr-2 h-4 w-4" />
            AI Questions
          </TabsTrigger>
          <TabsTrigger value="results">
            <BarChart className="mr-2 h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* AI Testing Tab */}
        <TabsContent value="test">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom AI Test</CardTitle>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tests</CardTitle>
                <CardDescription>
                  Test common scenarios with preset messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presetMessages.map((message, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left justify-start h-auto p-3"
                      onClick={() => testPresetMessage(message)}
                      disabled={loading}
                    >
                      <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{message}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Knowledge Status Tab */}
        <TabsContent value="knowledge">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Data Overview</CardTitle>
                <CardDescription>
                  Current status of your AI's training data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trainingData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{trainingData.totalItems}</div>
                        <div className="text-sm text-gray-600">Total Training Items</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{trainingData.dataTypes.length}</div>
                        <div className="text-sm text-gray-600">Data Types</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {trainingData.breakdown.reduce((sum, item) => sum + item.activeCount, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Active Items</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Training Data Breakdown</h3>
                      {trainingData.breakdown.map((item) => (
                        <div key={item.type} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{item.type.replace('_', ' ').toUpperCase()}</Badge>
                            <span className="text-sm">
                              {item.activeCount} active of {item.count} total
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            v{Math.max(...item.items.map(i => i.version), 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Loading training data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Knowledge Gaps Tab */}
        <TabsContent value="gaps">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Gap Analysis</CardTitle>
              <CardDescription>
                Areas where your AI might need more training data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {knowledgeGaps.map((gap, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <HelpCircle className="h-5 w-5 text-orange-500" />
                        <h3 className="font-medium">{gap.category}</h3>
                      </div>
                      <Badge variant={gap.importance === 'high' ? 'destructive' : gap.importance === 'medium' ? 'default' : 'secondary'}>
                        {gap.importance} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{gap.question}</p>
                    <p className="text-xs text-gray-500">{gap.context}</p>
                    <div className="mt-3 flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Add Training Data
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Training Data for {gap.category}</DialogTitle>
                            <DialogDescription>
                              Provide information to help the AI answer: "{gap.question}"
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Enter the information the AI should know about this topic..."
                              rows={5}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline">Cancel</Button>
                              <Button>Add to Training</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="ghost" onClick={() => testPresetMessage(gap.question)}>
                        Test This
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Questions Tab */}
        <TabsContent value="ai-questions">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Questions</CardTitle>
                <CardDescription>
                  Let the AI ask you questions to fill knowledge gaps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Select a category below and the AI will generate specific questions to help improve its knowledge in that area.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {knowledgeGaps.map((gap, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="text-left justify-start h-auto p-4"
                        onClick={() => generateAIQuestions(gap.category, gap.context)}
                        disabled={loading}
                      >
                        <div className="flex items-start space-x-3">
                          <HelpCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-500" />
                          <div className="text-left">
                            <div className="font-medium text-sm">{gap.category}</div>
                            <div className="text-xs text-gray-500 mt-1">{gap.context}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>

                  {aiQuestions.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h3 className="font-semibold text-lg">AI Generated Questions</h3>
                      {aiQuestions.map((categoryData, categoryIndex) => (
                        <Card key={categoryIndex}>
                          <CardHeader>
                            <CardTitle className="text-lg">{categoryData.category}</CardTitle>
                            <CardDescription>
                              The AI has {categoryData.questions.length} questions for this category
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {categoryData.questions.map((question, questionIndex) => (
                                <div key={questionIndex} className="border rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Target className="h-4 w-4 text-green-500" />
                                      <Badge variant={question.importance === 'high' ? 'destructive' : 'default'}>
                                        {question.importance} priority
                                      </Badge>
                                    </div>
                                  </div>
                                  <h4 className="font-medium text-sm mb-2">{question.question}</h4>
                                  <p className="text-xs text-gray-500 mb-3">{question.why_needed}</p>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline" className="w-full">
                                        Answer This Question
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>{question.question}</DialogTitle>
                                        <DialogDescription>
                                          {question.why_needed}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor={`answer-${questionIndex}`}>Your Answer</Label>
                                          <Textarea
                                            id={`answer-${questionIndex}`}
                                            placeholder="Provide detailed information to help the AI answer this question..."
                                            rows={6}
                                            value={answerText[`${categoryData.category}-${question.question}`] || ''}
                                            onChange={(e) => {
                                              const key = `${categoryData.category}-${question.question}`;
                                              setAnswerText(prev => ({ ...prev, [key]: e.target.value }));
                                            }}
                                          />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                          <Button 
                                            variant="outline" 
                                            onClick={() => {
                                              const key = `${categoryData.category}-${question.question}`;
                                              setAnswerText(prev => ({ ...prev, [key]: '' }));
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                          <Button 
                                            onClick={() => {
                                              const key = `${categoryData.category}-${question.question}`;
                                              const answer = answerText[key] || '';
                                              saveAnswer(categoryData.category, question.question, answer);
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-8">
                      <Brain className="mx-auto h-8 w-8 text-blue-500 animate-pulse mb-2" />
                      <p className="text-sm text-gray-500">AI is generating questions...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <div className="grid gap-6">
            {testResult ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Test Results</CardTitle>
                    <CardDescription>
                      AI response to: "{testResult.testMessage}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-blue-50">
                        <h3 className="font-medium mb-2">AI Response:</h3>
                        <p className="text-sm whitespace-pre-wrap">{testResult.aiResponse}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold text-blue-600">{testResult.learningData.totalTranscripts}</div>
                          <div className="text-xs text-gray-600">Call Transcripts</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold text-green-600">{testResult.learningData.trainingDataCount}</div>
                          <div className="text-xs text-gray-600">Training Items</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold text-purple-600">
                            {testResult.learningData.hasLearning ? 'Yes' : 'No'}
                          </div>
                          <div className="text-xs text-gray-600">Has Learning Data</div>
                        </div>
                      </div>

                      {Object.keys(testResult.learningData.sentimentBreakdown).length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Call Sentiment Analysis:</h3>
                          <div className="flex space-x-4">
                            {Object.entries(testResult.learningData.sentimentBreakdown).map(([sentiment, count]) => (
                              <Badge key={sentiment} variant="outline">
                                {sentiment}: {count}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {testResult.callInsights.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Top Call Insights:</h3>
                          <div className="space-y-2">
                            {testResult.callInsights.map((insight, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge variant={insight.sentiment === 'positive' ? 'default' : 'secondary'}>
                                    {insight.sentiment}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700">{insight.insight}</p>
                                <p className="text-xs text-gray-500 mt-1">"{insight.snippet}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Results Yet</h3>
                  <p className="text-gray-500 mb-4">Run a test to see AI performance results here</p>
                  <Button onClick={() => setActiveTab('test')}>
                    Start Testing
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}