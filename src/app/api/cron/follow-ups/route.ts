import { NextRequest, NextResponse } from 'next/server';
import { processFollowUps } from '@/lib/follow-ups';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (e.g., Vercel Cron or your server)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting follow-up processing...');
    await processFollowUps();
    console.log('Follow-up processing completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Follow-ups processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing follow-ups:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process follow-ups',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Allow GET for testing purposes
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (secret !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await processFollowUps();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Follow-ups processed successfully (test)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test follow-ups:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process follow-ups',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}