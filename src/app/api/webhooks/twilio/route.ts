import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('📞 Twilio webhook received (basic test mode)');
  
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const from = (params.get('From') || '').replace('whatsapp:', '');
    const messageBody = params.get('Body') || '';
    
    console.log(`Message from ${from}: ${messageBody}`);
    
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Error', { status: 200 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Twilio WhatsApp webhook endpoint is active (test mode)',
    timestamp: new Date().toISOString(),
    url: request.url,
    version: 'TEST'
  });
}