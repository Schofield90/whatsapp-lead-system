'use client';

import { useState, useEffect } from 'react';

interface TrainingQuestion {
  id: string;
  question: string;
  category: string;
  context?: string;
}

interface TrainingSession {
  questionsAsked: number;
  questionsAnswered: number;
  knowledgeAdded: number;
}

export default function TrainPage() {
  // State management for training session
  const [currentQuestion, setCurrentQuestion] = useState<TrainingQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<TrainingSession>({ 
    questionsAsked: 0, 
    questionsAnswered: 0, 
    knowledgeAdded: 0 
  });
  const [feedback, setFeedback] = useState('');

  // Generate a new training question
  const generateQuestion = async () => {
    setIsLoading(true);
    setFeedback('');
    
    try {
      const response = await fetch('/api/training/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          previousQuestions: session.questionsAsked,
          focusArea: 'gym_operations' 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentQuestion(data.question);
        setSession(prev => ({ 
          ...prev, 
          questionsAsked: prev.questionsAsked + 1 
        }));
      } else {
        setFeedback('Error generating question. Please try again.');
      }
    } catch (error) {
      setFeedback('Network error. Please check your connection.');
      console.error('Error generating question:', error);
    }
    
    setIsLoading(false);
  };

  // Submit answer and save as knowledge
  const submitAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim()) {
      setFeedback('Please provide an answer before submitting.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/training/save-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: userAnswer,
          category: currentQuestion.category,
          questionId: currentQuestion.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFeedback('✅ Great! Your knowledge has been saved and will improve the AI responses.');
        setUserAnswer('');
        setSession(prev => ({ 
          ...prev, 
          questionsAnswered: prev.questionsAnswered + 1,
          knowledgeAdded: prev.knowledgeAdded + 1
        }));
        
        // Auto-generate next question after a brief delay
        setTimeout(() => {
          generateQuestion();
        }, 2000);
      } else {
        setFeedback(`Error saving answer: ${data.error}`);
      }
    } catch (error) {
      setFeedback('Network error. Please try again.');
      console.error('Error saving answer:', error);
    }
    
    setIsLoading(false);
  };

  // Skip current question
  const skipQuestion = () => {
    setUserAnswer('');
    setFeedback('');
    generateQuestion();
  };

  // Initialize with first question
  useEffect(() => {
    generateQuestion();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎓 AI Training Session
          </h1>
          <p className="text-xl text-gray-600">
            Help your gym AI learn by answering questions about your business
          </p>
        </div>

        {/* Training Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Training Progress</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{session.questionsAsked}</div>
              <div className="text-gray-600">Questions Asked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{session.questionsAnswered}</div>
              <div className="text-gray-600">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{session.knowledgeAdded}</div>
              <div className="text-gray-600">Knowledge Added</div>
            </div>
          </div>
        </div>

        {/* Current Question */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Current Question</h2>
          
          {isLoading && !currentQuestion && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Generating question...</p>
            </div>
          )}

          {currentQuestion && (
            <div>
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {currentQuestion.category}
                </span>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {currentQuestion.question}
                </h3>
                {currentQuestion.context && (
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                    Context: {currentQuestion.context}
                  </p>
                )}
              </div>

              {/* Answer Input */}
              <div className="mb-4">
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Expert Answer:
                </label>
                <textarea
                  id="answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Share your knowledge and expertise..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  disabled={isLoading}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={submitAnswer}
                  disabled={isLoading || !userAnswer.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save Answer & Next Question'}
                </button>
                
                <button
                  onClick={skipQuestion}
                  disabled={isLoading}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:bg-gray-300"
                >
                  Skip Question
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`p-4 rounded-md mb-6 ${
            feedback.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {feedback}
          </div>
        )}

        {/* Training Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Training Tips</h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Be specific and detailed in your answers</li>
            <li>• Include step-by-step processes where applicable</li>
            <li>• Share real examples from your gym experience</li>
            <li>• The more context you provide, the better the AI will respond to customers</li>
            <li>• Skip questions you're not sure about - accuracy is more important than quantity</li>
          </ul>
        </div>

      </div>
    </div>
  );
}