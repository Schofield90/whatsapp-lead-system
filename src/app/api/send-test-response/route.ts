import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    // Send a test response to your personal number
    const message = "🎉 SUCCESS! Your WhatsApp lead conversion system is working! This is a manual test response.";
    
    const result = await sendWhatsAppMessage('+447490253471', message);
    
    return NextResponse.json({
      success: true,
      message: 'Test response sent successfully',
      twilioSid: result.sid,
      status: result.status
    });
    
  } catch (error) {
    console.error('Error sending test response:', error);
    return NextResponse.json({
      error: 'Failed to send test response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}