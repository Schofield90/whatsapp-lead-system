import { NextRequest, NextResponse } from 'next/server';
import { addKnowledgeEntry } from '@/lib/knowledge';

/**
 * Save training answers as knowledge entries in Supabase
 * This builds the AI's knowledge base from expert gym owner input
 */
export async function POST(request: NextRequest) {
  try {
    const { question, answer, category, questionId } = await request.json();
    
    // Validate required fields
    if (!question || !answer || !category) {
      return NextResponse.json({
        success: false,
        error: 'Question, answer, and category are required'
      }, { status: 400 });
    }
    
    console.log('Saving training answer:', { 
      questionId, 
      category, 
      questionLength: question.length,
      answerLength: answer.length 
    });
    
    // Format the knowledge entry content
    // Create a structured format that the AI can easily understand
    const knowledgeContent = `Training Q&A - ${question}

Expert Answer: ${answer.trim()}

Context: This knowledge was provided during AI training to help with ${category.replace('_', ' ')} inquiries.`;

    // Determine the knowledge type based on category
    const knowledgeType = mapCategoryToKnowledgeType(category);
    
    // Save to Supabase knowledge table
    const savedEntry = await addKnowledgeEntry(knowledgeType, knowledgeContent);
    
    if (!savedEntry) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save knowledge entry to database'
      }, { status: 500 });
    }
    
    console.log('Training answer saved successfully:', savedEntry.id);
    
    // Also save as training-specific entry for tracking
    const trainingEntry = await addKnowledgeEntry('training', JSON.stringify({
      questionId,
      question,
      answer,
      category,
      timestamp: new Date().toISOString(),
      knowledgeEntryId: savedEntry.id
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        knowledgeEntryId: savedEntry.id,
        trainingEntryId: trainingEntry?.id,
        category: knowledgeType,
        message: 'Your expertise has been added to the AI knowledge base!'
      },
      stats: {
        questionLength: question.length,
        answerLength: answer.length,
        category: knowledgeType
      }
    });
    
  } catch (error) {
    console.error('Error saving training answer:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save training answer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Map training categories to knowledge types
 * This ensures training answers are categorized correctly
 */
function mapCategoryToKnowledgeType(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'membership_policies': 'policies',
    'pricing_strategies': 'pricing', 
    'equipment_management': 'sop',
    'class_scheduling': 'services',
    'customer_service': 'sop',
    'safety_protocols': 'sop',
    'staff_management': 'sop',
    'marketing_approach': 'sop',
    'facility_operations': 'sop',
    'member_retention': 'sop',
    'general_operations': 'sop'
  };
  
  return categoryMap[category] || 'sop';
}

/**
 * GET endpoint to retrieve training statistics
 */
export async function GET() {
  return NextResponse.json({
    message: 'Training answer submission endpoint',
    usage: 'POST with { question, answer, category, questionId }',
    supportedCategories: [
      'membership_policies',
      'pricing_strategies',
      'equipment_management', 
      'class_scheduling',
      'customer_service',
      'safety_protocols',
      'staff_management',
      'marketing_approach',
      'facility_operations',
      'member_retention'
    ],
    timestamp: new Date().toISOString()
  });
}