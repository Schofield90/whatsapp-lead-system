import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { customerPhone = '+1234567890', message = 'Hi, I\'m interested in joining your gym. What are your prices?' } = await request.json();
    
    // Create test webhook payload
    const testPayload = new URLSearchParams({
      From: `whatsapp:${customerPhone}`,
      To: 'whatsapp:+447450308627', // Your business number
      Body: message,
      MessageSid: 'test_' + Date.now()
    });

    // Call webhook directly
    const webhookUrl = new URL('/api/webhooks/twilio', request.url).toString();
    
    console.log('📱 Testing webhook directly:', {
      url: webhookUrl,
      customerPhone,
      message
    });
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: testPayload.toString()
    });

    const responseText = await response.text();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: responseText,
      testDetails: {
        webhookUrl,
        customerPhone,
        businessPhone: '+447450308627',
        message,
        payload: Object.fromEntries(testPayload)
      }
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}