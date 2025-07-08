import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data_type, content, category } = await request.json();
    
    if (!data_type || !content) {
      return NextResponse.json({
        error: 'Missing required fields: data_type and content'
      }, { status: 400 });
    }

    // Log the training data for now - we'll add database storage later
    console.log('🎯 Training data received:', {
      data_type,
      category,
      content: content.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Training data saved successfully',
      data: {
        id: `temp_${Date.now()}`,
        data_type,
        category,
        content,
        saved_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in save training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}