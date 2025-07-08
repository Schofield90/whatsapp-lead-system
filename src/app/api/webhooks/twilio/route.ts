import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== EMERGENCY TWILIO WEBHOOK ===');
    
    // 1. Parse webhook data FAST
    const formData = await request.formData();
    const messageData = Object.fromEntries(formData);
    
    console.log('Parsed message data:', messageData);
    
    // 2. CRITICAL: Acknowledge immediately for status webhooks
    if (messageData.MessageStatus) {
      console.log(`Status webhook: ${messageData.MessageStatus} for ${messageData.MessageSid}`);
      return new NextResponse('', { status: 200 });
    }
    
    // 3. Log incoming message
    console.log(`Incoming message from ${messageData.From}: ${messageData.Body}`);

    const supabase = createServiceClient();

    // 3. Try to insert with conflict handling - NO DUPLICATES
    const { data, error } = await supabase
      .from('messages')
      .insert({
        twilio_message_sid: messageData.MessageSid,
        direction: 'inbound',
        content: messageData.Body || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // 4. If duplicate (conflict), acknowledge and exit
    if (error?.code === '23505') { // Postgres unique violation
      console.log(`Duplicate webhook: ${messageData.MessageSid}`);
      return new NextResponse('', { status: 200 });
    }

    // 5. Queue for processing (non-blocking)
    process.nextTick(async () => {
      try {
        await processMessageAsync(messageData);
      } catch (err) {
        console.error('Background processing error:', err);
        // DO NOT throw - let it fail silently
      }
    });

    // 6. ALWAYS return 200 immediately - empty response
    return new NextResponse('', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    // CRITICAL: Always return 200 to prevent Twilio retries
    return new NextResponse('', { status: 200 });
  }
}

async function processMessageAsync(messageData: any) {
  const { MessageSid, From, Body, To } = messageData;
  
  try {
    const supabase = createServiceClient();
    
    // 1. Check if already processed (extra safety)
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('twilio_message_sid', MessageSid)
      .eq('direction', 'outbound')
      .single();

    if (existing) {
      console.log(`Already responded to: ${MessageSid}`);
      return;
    }

    // 2. Simple rate limit check
    const fiveSecondsAgo = new Date(Date.now() - 5 * 1000);
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('created_at')
      .eq('direction', 'outbound')
      .gte('created_at', fiveSecondsAgo.toISOString())
      .limit(1);

    if (recentMessages && recentMessages.length > 0) {
      console.log(`Rate limited - recent message sent`);
      return;
    }

    // 3. Generate AI response (simplified)
    const aiResponse = await generateSimpleResponse(Body);

    // 4. Send response - NO RETRIES!
    await sendWhatsAppMessageNoRetry(From, aiResponse, MessageSid);

  } catch (error) {
    console.error('Process message error:', error);
    // DO NOT throw - let it fail silently
  }
}

async function sendWhatsAppMessageNoRetry(to: string, body: string, originalSid: string) {
  try {
    // Clean phone number
    const cleanTo = to.replace('whatsapp:', '');
    
    console.log(`Attempting to send to ${cleanTo}: ${body.substring(0, 50)}...`);
    
    // Dynamic import to avoid dependency issues
    const { sendWhatsAppMessage } = await import('@/lib/twilio');
    const message = await sendWhatsAppMessage(cleanTo, body);
    
    // Try to store successful response - but don't fail if this fails
    try {
      const supabase = createServiceClient();
      await supabase
        .from('messages')
        .insert({
          twilio_message_sid: message.sid,
          direction: 'outbound',
          content: body,
          created_at: new Date().toISOString()
        });
    } catch (dbError) {
      console.error('Database store failed:', dbError);
      // Continue anyway - message was sent
    }

    console.log(`✅ Message sent: ${message.sid}`);
    return message;

  } catch (error: any) {
    // CRITICAL: Log but NEVER throw - always return gracefully
    console.error(`❌ Send failed for ${originalSid}:`, error.message || error);
    
    // Try to log failure but don't fail if this fails either
    try {
      const supabase = createServiceClient();
      await supabase
        .from('messages')
        .insert({
          twilio_message_sid: `failed_${Date.now()}_${originalSid}`,
          direction: 'outbound', 
          content: `SEND_FAILED: ${body.substring(0, 100)}`,
          created_at: new Date().toISOString()
        });
    } catch (dbError) {
      console.error('Failed to log failure:', dbError);
    }

    // CRITICAL: Return null, NEVER throw
    return null;
  }
}

// Simplified AI response - NO EXTERNAL CALLS
async function generateSimpleResponse(message: string): Promise<string> {
  if (!message || message.trim() === '') {
    return "Hi! Thanks for reaching out to Atlas Fitness. How can I help you today?";
  }
  
  const lowerMessage = message.toLowerCase().trim();
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('£')) {
    return "Our pricing varies by location. York: 6 weeks £199 then £110/month. Harrogate: 6 weeks £249 then £129/month. Would you like to book a consultation?";
  }
  
  if (lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('address')) {
    return "Atlas Fitness has locations in York (Clifton Moor) and Harrogate. Which location interests you?";
  }
  
  if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('consultation')) {
    return "Perfect! I'd love to schedule a consultation for you. What's the best time - today or tomorrow around 10am?";
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hi there! Welcome to Atlas Fitness. Are you looking to start your fitness journey with us?";
  }
  
  return "Thanks for your message! I'd love to help you with your fitness goals. What specific information can I provide?";
}

// GET endpoint for testing webhook URL
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'EMERGENCY Twilio webhook - simplified processing',
    timestamp: new Date().toISOString(),
    status: 'emergency_mode_active'
  });
}