import { NextRequest, NextResponse } from 'next/server';
import { requireOrganization } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    
    // Create a test webhook payload
    const testPayload = new URLSearchParams({
      From: 'whatsapp:+1234567890', // Customer number
      To: 'whatsapp:+447450308627', // Your business number
      Body: 'Hi, I\'m interested in joining your gym. What are your prices?',
      MessageSid: 'test_message_sid_' + Date.now()
    });

    // Call the webhook endpoint directly
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://whatsapp-lead-system.vercel.app'}/api/webhooks/twilio`;
    
    console.log('📱 Testing webhook directly:', webhookUrl);
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: testPayload.toString()
    });

    const responseText = await webhookResponse.text();
    
    return NextResponse.json({
      success: webhookResponse.ok,
      status: webhookResponse.status,
      response: responseText,
      webhookUrl,
      testPayload: Object.fromEntries(testPayload),
      note: 'Check your server logs for detailed system prompt information'
    });

  } catch (error) {
    console.error('Test WhatsApp exact error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}