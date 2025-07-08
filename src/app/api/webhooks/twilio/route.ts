import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== EMERGENCY TWILIO WEBHOOK ===');
    
    // Parse webhook data - try both formData and URLSearchParams
    let messageData: any = {};
    
    try {
      const body = await request.text();
      console.log('Raw webhook body:', body);
      
      // Try URLSearchParams first (more reliable for Twilio)
      const params = new URLSearchParams(body);
      messageData = Object.fromEntries(params);
      
      console.log('Parsed message data:', messageData);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return new NextResponse('', { status: 200 });
    }
    
    // CRITICAL: Acknowledge immediately for status webhooks
    if (messageData.MessageStatus) {
      console.log(`Status webhook: ${messageData.MessageStatus} for ${messageData.MessageSid}`);
      return new NextResponse('', { status: 200 });
    }
    
    // Only process if we have a real message
    if (!messageData.Body || !messageData.From || !messageData.MessageSid) {
      console.log('Incomplete message data, skipping');
      return new NextResponse('', { status: 200 });
    }
    
    console.log(`Incoming message from ${messageData.From}: "${messageData.Body}"`);

    const supabase = createServiceClient();

    // Try to insert with conflict handling - NO DUPLICATES
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

    // If duplicate (conflict), acknowledge and exit
    if (error?.code === '23505') { // Postgres unique violation
      console.log(`Duplicate webhook: ${messageData.MessageSid}`);
      return new NextResponse('', { status: 200 });
    }

    // SIMPLIFIED: Just send a response immediately without database operations
    setTimeout(async () => {
      try {
        console.log(`🚀 SIMPLIFIED: Sending immediate response for: ${messageData.MessageSid}`);
        const { sendWhatsAppMessage } = await import('@/lib/twilio');
        const cleanFrom = messageData.From.replace('whatsapp:', '');
        
        // Simple response based on message content
        let response = "Thanks for your message!";
        const body = (messageData.Body || '').toLowerCase();
        
        if (body.includes('where') || body.includes('location') || body.includes('based')) {
          response = "Atlas Fitness has locations in York (Clifton Moor) and Harrogate. Which location interests you?";
        } else if (body.includes('price') || body.includes('cost') || body.includes('much')) {
          response = "Our pricing varies by location. York: 6 weeks £199 then £110/month. Harrogate: 6 weeks £249 then £129/month. Would you like to book a consultation?";
        }
        
        console.log(`📤 Sending response: "${response}"`);
        const result = await sendWhatsAppMessage(cleanFrom, response);
        console.log(`✅ Message sent successfully:`, result.sid);
        
      } catch (err) {
        console.error('❌ SIMPLIFIED sending failed:', err);
        console.error('Error details:', err.message, err.stack);
        // DO NOT throw - let it fail silently
      }
    }, 500);

    // ALWAYS return 200 immediately with empty body
    return new NextResponse('', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    // CRITICAL: Always return 200 to prevent Twilio retries
    return new NextResponse('', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function processMessageAsync(messageData: any) {
  const { MessageSid, From, Body, To } = messageData;
  
  console.log(`📱 Processing message ${MessageSid} from ${From}: "${Body}"`);
  
  try {
    const supabase = createServiceClient();
    
    // 1. Check if already processed (extra safety)
    console.log(`🔍 Checking if already processed: ${MessageSid}`);
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('twilio_message_sid', MessageSid)
      .eq('direction', 'outbound')
      .single();

    if (existing) {
      console.log(`⏭️ Already responded to: ${MessageSid}`);
      return;
    }

    // 2. Simple rate limit check
    console.log(`⏱️ Checking rate limits`);
    const fiveSecondsAgo = new Date(Date.now() - 5 * 1000);
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('created_at')
      .eq('direction', 'outbound')
      .gte('created_at', fiveSecondsAgo.toISOString())
      .limit(1);

    if (recentMessages && recentMessages.length > 0) {
      console.log(`🚫 Rate limited - recent message sent`);
      return;
    }

    // 3. Get organization and lead data
    console.log(`👤 Getting lead data for ${From}`);
    const { organization, lead, conversation } = await getOrCreateLeadData(supabase, From, To);
    
    if (!organization || !lead || !conversation) {
      console.error('❌ Failed to get/create lead data');
      throw new Error('Lead data creation failed');
    }
    
    // 4. Get training data and recent messages
    console.log(`📚 Getting knowledge base and messages`);
    const [knowledgeResult, messagesResult] = await Promise.all([
      supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const knowledgeBase = knowledgeResult.data || [];
    const messages = messagesResult.data || [];

    console.log(`📊 Data loaded - Knowledge: ${knowledgeBase.length} entries, Messages: ${messages.length}`);

    // 5. Generate AI response with training data
    console.log(`🤖 Generating AI response`);
    let aiResponse: string;
    try {
      aiResponse = await generateAIResponse(Body, knowledgeBase, messages, organization, lead);
      console.log(`✅ AI response generated: "${aiResponse.substring(0, 50)}..."`);
    } catch (aiError) {
      console.error('🔄 AI generation failed, using fallback:', aiError);
      aiResponse = generateFallbackResponse(Body);
      console.log(`🔄 Fallback response: "${aiResponse.substring(0, 50)}..."`);
    }

    // 6. Send response - NO RETRIES!
    console.log(`📤 Sending WhatsApp message`);
    await sendWhatsAppMessageNoRetry(From, aiResponse, MessageSid, conversation.id);

  } catch (error) {
    console.error('❌ Process message error:', error);
    console.error('Error stack:', error.stack);
    // DO NOT throw - let it fail silently
  }
}

// Get or create lead data
async function getOrCreateLeadData(supabase: any, from: string, to: string) {
  try {
    // Clean phone numbers
    const customerPhone = from.replace('whatsapp:', '');
    const businessPhone = to.replace('whatsapp:', '');

    // Get organization (using first one for now)
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
      .single();

    if (!organization) {
      throw new Error('No organization found');
    }

    // Find or create lead
    let { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', customerPhone)
      .eq('organization_id', organization.id)
      .single();

    if (!lead) {
      const { data: newLead } = await supabase
        .from('leads')
        .insert({
          phone: customerPhone,
          name: 'WhatsApp User',
          organization_id: organization.id,
          status: 'new',
          source: 'whatsapp'
        })
        .select()
        .single();
      lead = newLead;
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('status', 'active')
      .single();

    if (!conversation) {
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          lead_id: lead.id,
          organization_id: organization.id,
          status: 'active'
        })
        .select()
        .single();
      conversation = newConversation;
    }

    return { organization, lead, conversation };
  } catch (error) {
    console.error('Error getting lead data:', error);
    return { organization: null, lead: null, conversation: null };
  }
}

// Generate AI response using Claude with training data
async function generateAIResponse(message: string, knowledgeBase: any[], messages: any[], organization: any, lead: any): Promise<string> {
  try {
    const { processConversationWithClaude } = await import('@/lib/claude-optimized');
    
    const context = {
      lead: lead || { name: 'WhatsApp User', status: 'new' },
      conversation: { id: 'temp' },
      messages: messages || [],
      knowledgeBase,
      organization: organization || { name: 'Atlas Fitness' },
      callTranscripts: []
    };

    const response = await processConversationWithClaude(context, message);
    return response.response;
  } catch (error) {
    console.error('Claude AI failed:', error);
    throw error;
  }
}

// Fallback response when AI fails
function generateFallbackResponse(message: string): string {
  if (!message) {
    return "Hi! Thanks for reaching out to Atlas Fitness. How can I help you today?";
  }
  
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('much')) {
    return "I'd love to discuss our pricing with you! Could you let me know which location you're interested in - York or Harrogate?";
  }
  
  return "Thanks for your message! I'd love to help you with your fitness goals. Can you tell me a bit more about what you're looking for?";
}

async function sendWhatsAppMessageNoRetry(to: string, body: string, originalSid: string, conversationId?: string) {
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
          conversation_id: conversationId,
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


// GET endpoint for testing webhook URL
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'EMERGENCY Twilio webhook - simplified processing',
    timestamp: new Date().toISOString(),
    status: 'emergency_mode_active'
  });
}