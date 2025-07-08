import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for now (will reset on deployment)
let trainingDataStore: Array<{
  id: string;
  data_type: string;
  category: string;
  content: string;
  saved_at: string;
}> = [];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: trainingDataStore,
      count: trainingDataStore.length,
      message: `Found ${trainingDataStore.length} training data entries`
    });
  } catch (error) {
    console.error('Error viewing training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export the store so other files can access it
export { trainingDataStore };