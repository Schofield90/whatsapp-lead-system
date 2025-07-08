import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for now (will reset on deployment)
let trainingDataStore: Array<{
  id: string;
  data_type: string;
  category: string;
  content: string;
  saved_at: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const { data_type, content, category } = await request.json();
    
    if (!data_type || !content) {
      return NextResponse.json({
        error: 'Missing required fields: data_type and content'
      }, { status: 400 });
    }

    const trainingEntry = {
      id: `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data_type,
      category: category || 'general',
      content,
      saved_at: new Date().toISOString()
    };

    // Store in memory
    trainingDataStore.push(trainingEntry);

    // Also log it
    console.log('🎯 Training data saved:', {
      id: trainingEntry.id,
      data_type,
      category,
      content: content.substring(0, 100) + '...',
      total_entries: trainingDataStore.length
    });

    return NextResponse.json({
      success: true,
      message: `Training data saved! You now have ${trainingDataStore.length} entries.`,
      data: trainingEntry,
      total_count: trainingDataStore.length
    });

  } catch (error) {
    console.error('Error in save training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export the store so other files can access it
export { trainingDataStore };