import { NextRequest, NextResponse } from 'next/server';
import { addTrainingData, getTrainingDataCount } from '@/lib/storage';

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

    // Store using shared storage
    addTrainingData(trainingEntry);
    const totalCount = getTrainingDataCount();

    // Also log it
    console.log('🎯 Training data saved:', {
      id: trainingEntry.id,
      data_type,
      category,
      content: content.substring(0, 100) + '...',
      total_entries: totalCount
    });

    return NextResponse.json({
      success: true,
      message: `Training data saved! You now have ${totalCount} entries.`,
      data: trainingEntry,
      total_count: totalCount
    });

  } catch (error) {
    console.error('Error in save training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}