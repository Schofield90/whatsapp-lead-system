import { NextRequest, NextResponse } from 'next/server';
import { reminderService } from '@/lib/reminder-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing pending reminders...');
    
    // Verify this is a legitimate request (you might want to add auth here)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 401 });
    }

    await reminderService.processPendingReminders();
    
    return NextResponse.json({
      success: true,
      message: 'Reminders processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json({
      error: 'Failed to process reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Simple health check endpoint
    return NextResponse.json({
      status: 'ready',
      service: 'reminder-processor',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}