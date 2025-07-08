import { NextRequest, NextResponse } from 'next/server';
import { getClaudeResponse } from '@/lib/anthropic';

/**
 * Test endpoint to verify knowledge integration with AI
 * POST /api/test-knowledge with { "message": "What are your prices?" }
 */
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }
    
    console.log('Testing knowledge integration with message:', message);
    
    // Test the AI response with knowledge context
    const response = await getClaudeResponse(message, '+447450308627');
    
    return NextResponse.json({
      success: true,
      message: 'Knowledge integration test completed',
      userMessage: message,
      aiResponse: response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error testing knowledge integration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test knowledge integration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to show usage instructions
 */
export async function GET() {
  return NextResponse.json({
    message: 'Knowledge integration test endpoint',
    usage: 'POST with { "message": "What are your prices?" }',
    examples: [
      'What are your opening hours?',
      'How much does membership cost?',
      'Do you offer personal training?',
      'What is your cancellation policy?'
    ],
    timestamp: new Date().toISOString()
  });
}