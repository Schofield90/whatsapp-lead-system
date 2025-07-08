import { NextRequest, NextResponse } from 'next/server';
import { getRandomQuizQuestion, getKnowledgeByType, KNOWLEDGE_TYPES } from '@/lib/knowledge';

/**
 * GET /api/quiz - Get a random quiz question
 * Query params: ?category=fitness_guidelines (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    console.log('Fetching random quiz question, category:', category);
    
    // Get a random quiz question
    const quizQuestion = await getRandomQuizQuestion(category || undefined);
    
    if (!quizQuestion) {
      return NextResponse.json({
        success: false,
        message: 'No quiz questions available for the specified category',
        availableCategories: [
          'fitness_guidelines',
          'workout_order', 
          'rest_periods',
          'nutrition',
          'exercise_form',
          'gym_etiquette',
          'safety',
          'goal_setting',
          'services'
        ]
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        question: quizQuestion.question,
        category: quizQuestion.category,
        difficulty: quizQuestion.difficulty,
        // Don't return the answer in the API response for interactive quiz
        hasAnswer: true
      },
      message: 'Quiz question retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching quiz question:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch quiz question'
    }, { status: 500 });
  }
}

/**
 * POST /api/quiz - Get quiz answer or submit answer for checking
 * Body: { question: string, userAnswer?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { question, userAnswer } = await request.json();
    
    if (!question) {
      return NextResponse.json({
        success: false,
        error: 'Question is required'
      }, { status: 400 });
    }
    
    console.log('Processing quiz interaction:', { question: question.substring(0, 50) + '...', hasUserAnswer: !!userAnswer });
    
    // Get all quiz entries to find the matching question
    const quizEntries = await getKnowledgeByType([KNOWLEDGE_TYPES.QUIZ]);
    
    // Find the quiz entry that matches the question
    let matchingQuiz = null;
    for (const entry of quizEntries) {
      try {
        const quizData = JSON.parse(entry.content);
        if (quizData.question === question) {
          matchingQuiz = quizData;
          break;
        }
      } catch (error) {
        console.error('Error parsing quiz entry:', error);
      }
    }
    
    if (!matchingQuiz) {
      return NextResponse.json({
        success: false,
        error: 'Quiz question not found'
      }, { status: 404 });
    }
    
    // If user provided an answer, check it
    if (userAnswer) {
      const isCorrect = userAnswer.toLowerCase().includes(matchingQuiz.answer.toLowerCase().substring(0, 20));
      
      return NextResponse.json({
        success: true,
        data: {
          question: matchingQuiz.question,
          userAnswer: userAnswer,
          correctAnswer: matchingQuiz.answer,
          isCorrect: isCorrect,
          category: matchingQuiz.category,
          difficulty: matchingQuiz.difficulty
        },
        message: isCorrect ? 'Correct answer!' : 'Not quite right, but good try!'
      });
    } 
    // Otherwise, just return the answer
    else {
      return NextResponse.json({
        success: true,
        data: {
          question: matchingQuiz.question,
          answer: matchingQuiz.answer,
          category: matchingQuiz.category,
          difficulty: matchingQuiz.difficulty
        },
        message: 'Quiz answer retrieved successfully'
      });
    }
    
  } catch (error) {
    console.error('Error processing quiz interaction:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process quiz interaction'
    }, { status: 500 });
  }
}