import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json();
    
    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone and message are required' },
        { status: 400 }
      );
    }
    
    console.log('Attempting to send WhatsApp message to:', phone);
    
    const result = await sendWhatsAppMessage(
      phone,
      message || 'Test message from WhatsApp Lead System'
    );
    
    console.log('WhatsApp message sent successfully:', result.sid);
    
    return NextResponse.json({
      success: true,
      messageSid: result.sid,
      status: result.status,
      to: result.to,
      from: result.from
    });
    
  } catch (error) {
    console.error('WhatsApp test error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send WhatsApp message',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET method for easy browser testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'WhatsApp Test Endpoint',
    usage: 'POST with { "phone": "+447123456789", "message": "Test message" }',
    note: 'Phone number must include country code'
  });
}