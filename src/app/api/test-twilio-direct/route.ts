import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Twilio test...');
    
    // Check environment variables first
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    
    console.log('Environment check:', {
      accountSid: accountSid ? `${accountSid.substring(0, 10)}...` : 'MISSING',
      authToken: authToken ? `${authToken.substring(0, 10)}...` : 'MISSING',
      whatsappNumber: whatsappNumber || 'MISSING'
    });
    
    if (!accountSid || !authToken || !whatsappNumber) {
      return NextResponse.json({
        error: 'Missing Twilio environment variables',
        details: {
          accountSid: !!accountSid,
          authToken: !!authToken,
          whatsappNumber: !!whatsappNumber
        }
      }, { status: 400 });
    }
    
    // Try to import Twilio
    console.log('Attempting to import Twilio...');
    const twilio = (await import('twilio')).default;
    console.log('Twilio imported successfully');
    
    // Create client
    console.log('Creating Twilio client...');
    const client = twilio(accountSid, authToken);
    console.log('Twilio client created');
    
    // Get request body
    const { phone, message } = await request.json();
    
    if (!phone || !message) {
      return NextResponse.json({
        error: 'Phone and message are required'
      }, { status: 400 });
    }
    
    console.log('Sending message to:', phone);
    
    // Send message
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${phone}`,
    });
    
    console.log('Message sent successfully:', result.sid);
    
    return NextResponse.json({
      success: true,
      messageSid: result.sid,
      status: result.status,
      to: result.to,
      from: result.from
    });
    
  } catch (error) {
    console.error('Direct Twilio test error:', error);
    
    return NextResponse.json({
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Direct Twilio Test Endpoint',
    usage: 'POST with { "phone": "+447123456789", "message": "Test message" }'
  });
}