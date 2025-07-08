import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage, validateTwilioSignature } from '@/lib/twilio';
import { getClaudeResponse } from '@/lib/anthropic';

/**
 * Handle incoming WhatsApp messages from Twilio webhook
 * This endpoint receives POST requests when users send WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Received webhook request from Twilio');

    // Step 1: Parse the incoming request body
    const formData = await request.formData();
    const body: Record<string, string> = {};
    
    // Convert FormData to object for easier access
    for (const [key, value] of formData.entries()) {
      body[key] = value.toString();
    }

    console.log('Webhook body:', body);

    // Step 2: Extract important information from the webhook
    const {
      From: fromNumber,           // Sender's phone number (e.g., "whatsapp:+1234567890")
      To: toNumber,              // Your Twilio WhatsApp number
      Body: messageBody,         // The actual message content
      MessageSid: messageSid,    // Unique message identifier
    } = body;

    // Step 3: Validate required fields
    if (!fromNumber || !messageBody) {
      console.error('Missing required fields in webhook:', { fromNumber, messageBody });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Step 4: Validate Twilio signature for security (optional but recommended)
    const signature = request.headers.get('x-twilio-signature');
    if (signature) {
      const url = request.url;
      const isValid = validateTwilioSignature(signature, url, body);
      
      if (!isValid) {
        console.error('Invalid Twilio signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Step 5: Extract clean phone number (remove "whatsapp:" prefix)
    const cleanPhoneNumber = fromNumber.replace('whatsapp:', '');
    
    console.log(`Processing message from ${cleanPhoneNumber}: "${messageBody}"`);

    // Step 6: Send message to Anthropic Claude for AI response
    const aiResponse = await getClaudeResponse(messageBody, cleanPhoneNumber);
    
    console.log('AI response generated:', aiResponse);

    // Step 7: Send AI response back to user via Twilio WhatsApp
    await sendWhatsAppMessage(fromNumber, aiResponse);

    // Step 8: Return success response to Twilio
    return NextResponse.json({ 
      success: true, 
      message: 'Message processed successfully',
      messageSid: messageSid 
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Return error response to Twilio
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests (for webhook URL verification)
 * Some webhook systems send GET requests to verify the endpoint
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'Twilio WhatsApp webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}