import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // EMERGENCY: Return error to force stop all loops
  console.log('🚨 EMERGENCY STOP: Rejecting all requests to stop infinite loops');
  
  return new NextResponse('EMERGENCY STOP: API temporarily disabled to prevent infinite loops', { 
    status: 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}