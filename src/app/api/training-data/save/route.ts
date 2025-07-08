import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data_type, content, category, question } = await request.json();
    
    if (!data_type || !content) {
      return NextResponse.json({
        error: 'Missing required fields: data_type and content'
      }, { status: 400 });
    }

    // Redirect to unified knowledge base API
    const knowledgeBaseResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/knowledge-base/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: data_type,
        category: category || 'general',
        question: question || null,
        content: content.trim(),
        source: 'training_form',
        metadata: {
          original_endpoint: 'training-data/save',
          timestamp: new Date().toISOString()
        }
      }),
    });

    const result = await knowledgeBaseResponse.json();

    if (!knowledgeBaseResponse.ok) {
      return NextResponse.json({
        error: 'Failed to save to knowledge base',
        details: result.error || 'Unknown error'
      }, { status: knowledgeBaseResponse.status });
    }

    console.log('🎯 Training data redirected to unified knowledge base:', {
      id: result.data?.id,
      type: data_type,
      category,
      content: content.substring(0, 100) + '...',
      total_entries: result.total_count
    });

    return NextResponse.json({
      success: true,
      message: `Training data saved to knowledge base! You now have ${result.total_count} entries.`,
      data: {
        id: result.data?.id,
        data_type,
        category: category || 'general',
        content: content,
        question: question || '',
        saved_at: result.data?.saved_at
      },
      total_count: result.total_count
    });

  } catch (error) {
    console.error('Error in save training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}