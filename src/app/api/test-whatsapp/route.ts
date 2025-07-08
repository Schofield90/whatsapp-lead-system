import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/twilio';
import { getClaudeResponse } from '@/lib/anthropic';

/**
 * Test endpoint to verify WhatsApp integration
 * Usage: POST /api/test-whatsapp with { "message": "Hello", "to": "whatsapp:+1234567890" }
 */
export async function POST(request: NextRequest) {
  try {
    const { message, to } = await request.json();

    if (!message || !to) {
      return NextResponse.json({ 
        error: 'Missing required fields: message and to' 
      }, { status: 400 });
    }

    console.log(`Testing WhatsApp message: "${message}" to ${to}`);

    // Get AI response from Claude
    const aiResponse = await getClaudeResponse(message, to);
    
    // Send message via Twilio
    const twilioResponse = await sendWhatsAppMessage(to, aiResponse);

    return NextResponse.json({
      success: true,
      message: 'Test message sent successfully',
      aiResponse,
      twilioMessageSid: twilioResponse.sid
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to send test message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check if the test endpoint is working
 */
export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp test endpoint is active',
    usage: 'POST with { "message": "Hello", "to": "whatsapp:+1234567890" }',
    timestamp: new Date().toISOString()
  });
}