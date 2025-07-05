import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TWILIO WEBHOOK DEBUG RECEIVED ===');
    
    // Log all headers
    const headers: any = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('Headers:', headers);
    
    // Get raw body
    const body = await request.text();
    console.log('Raw body:', body);
    
    // Parse the body
    const params = new URLSearchParams(body);
    const data: any = {};
    params.forEach((value, key) => {
      data[key] = value;
    });
    console.log('Parsed data:', data);
    
    // Log specific WhatsApp fields
    console.log('From:', data.From);
    console.log('To:', data.To);
    console.log('Body:', data.Body);
    console.log('MessageSid:', data.MessageSid);
    
    // Return debug info
    return NextResponse.json({
      success: true,
      message: 'Debug webhook received',
      timestamp: new Date().toISOString(),
      headers,
      data,
      from: data.From,
      to: data.To,
      body: data.Body
    });
    
  } catch (error) {
    console.error('Debug webhook error:', error);
    return NextResponse.json({
      error: 'Debug webhook error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Twilio Debug Webhook - Ready',
    timestamp: new Date().toISOString(),
    usage: 'POST WhatsApp messages here for debugging'
  });
}