import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse Twilio webhook
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    const from = params.get('From')?.replace('whatsapp:', '') || '';
    const messageBody = params.get('Body') || '';
    
    console.log(`Message from ${from}: "${messageBody}"`);
    
    // Skip status webhooks
    if (!messageBody || messageBody === '') {
      return new NextResponse('', { status: 200 });
    }
    
    // Generate simple response
    const response = generateResponse(messageBody);
    
    // Send response immediately
    await sendMessage(from, response);
    
    return new NextResponse('', { status: 200 });
    
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse('', { status: 200 });
  }
}

function generateResponse(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('price') || lower.includes('cost') || lower.includes('much')) {
    return "Our pricing: York £199 (6 weeks) then £110/month. Harrogate £249 (6 weeks) then £129/month. Ready to start your transformation?";
  }
  
  if (lower.includes('where') || lower.includes('location')) {
    return "Atlas Fitness locations: York (Clifton Moor) and Harrogate. Which is closer to you?";
  }
  
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hi! Welcome to Atlas Fitness. Are you ready to transform your health and fitness?";
  }
  
  return "Thanks for reaching out! Atlas Fitness offers personal training in York and Harrogate. What would you like to know?";
}

async function sendMessage(to: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  
  const twilio = (await import('twilio')).default;
  const client = twilio(accountSid, authToken);
  
  await client.messages.create({
    body: message,
    from: `whatsapp:${fromNumber}`,
    to: `whatsapp:${to}`,
  });
  
  console.log(`✅ Sent to ${to}: "${message}"`);
}