import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // EMERGENCY: Return empty data immediately to stop API loops
  console.log('📖 Emergency mode: returning empty data to stop API loops');
  
  return NextResponse.json({
    success: true,
    data: [],
    count: 0,
    message: 'Emergency mode: API loops prevented'
  });
}