import { NextRequest, NextResponse } from 'next/server';

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
    
    // Use direct Twilio import like the working test
    const twilio = (await import('twilio')).default;
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    const result = await client.messages.create({
      body: message || 'Test message from WhatsApp Lead System',
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phone}`,
    });
    
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