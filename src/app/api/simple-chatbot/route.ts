import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Simple AI Chatbot - Message received');
    
    // Parse Twilio webhook
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    const from = params.get('From')?.replace('whatsapp:', '') || '';
    const message = params.get('Body') || '';
    
    console.log(`📱 From: ${from}, Message: "${message}"`);
    
    // Skip empty messages or status updates
    if (!message.trim()) {
      console.log('⏭️ Skipping empty message');
      return new NextResponse('', { status: 200 });
    }
    
    // Get AI response
    console.log('🧠 Getting AI response...');
    const aiResponse = await getAIResponse(message);
    console.log(`🤖 AI says: "${aiResponse}"`);
    
    // Send back via WhatsApp
    console.log('📤 Sending WhatsApp response...');
    await sendWhatsAppMessage(from, aiResponse);
    console.log('✅ Done!');
    
    return new NextResponse('', { status: 200 });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return new NextResponse('', { status: 200 }); // Always return 200 to prevent retries
  }
}

async function getAIResponse(message: string): Promise<string> {
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `You are a friendly AI assistant. Keep responses under 100 words. User says: "${message}"`
        }
      ]
    });
    
    const text = response.content[0].type === 'text' ? response.content[0].text : 'Sorry, I had trouble understanding that.';
    return text;
    
  } catch (error) {
    console.error('AI Error:', error);
    return "Hi! I'm an AI assistant. I'm having a small technical issue right now, but I'm here to help!";
  }
}

async function sendWhatsAppMessage(to: string, message: string) {
  const twilio = (await import('twilio')).default;
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  await client.messages.create({
    body: message,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
  });
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Simple AI Chatbot is ready!', 
    phase: 'Phase 1 - Basic AI Responses' 
  });
}