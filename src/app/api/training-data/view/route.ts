import { NextRequest, NextResponse } from 'next/server';
import { getTrainingData, getTrainingDataCount } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const data = getTrainingData();
    const count = getTrainingDataCount();
    
    console.log(`📖 Fetching training data: ${count} entries found`);
    
    return NextResponse.json({
      success: true,
      data: data,
      count: count,
      message: `Found ${count} training data entries`
    });
  } catch (error) {
    console.error('Error viewing training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}