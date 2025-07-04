import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Configuring Twilio webhook...');
    
    const twilio = (await import('twilio')).default;
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!whatsappNumber) {
      return NextResponse.json({ error: 'TWILIO_WHATSAPP_NUMBER not configured' }, { status: 400 });
    }
    
    // Update the phone number to set webhook URL
    const phoneNumber = await client.incomingPhoneNumbers
      .list({ phoneNumber: whatsappNumber })
      .then(phoneNumbers => phoneNumbers[0]);
    
    if (!phoneNumber) {
      return NextResponse.json({ error: `Phone number ${whatsappNumber} not found` }, { status: 404 });
    }
    
    const webhookUrl = `https://whatsapp-lead-system.vercel.app/api/webhooks/twilio`;
    
    const updatedNumber = await client.incomingPhoneNumbers(phoneNumber.sid)
      .update({
        smsUrl: webhookUrl,
        smsMethod: 'POST',
        voiceUrl: webhookUrl,
        voiceMethod: 'POST'
      });
    
    return NextResponse.json({
      success: true,
      phoneNumber: updatedNumber.phoneNumber,
      smsWebhookUrl: updatedNumber.smsUrl,
      smsMethod: updatedNumber.smsMethod,
      voiceWebhookUrl: updatedNumber.voiceUrl,
      voiceMethod: updatedNumber.voiceMethod,
      sid: updatedNumber.sid
    });
    
  } catch (error) {
    console.error('Webhook configuration error:', error);
    return NextResponse.json({
      error: 'Failed to configure webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook Configuration Endpoint',
    usage: 'POST to configure Twilio webhook automatically'
  });
}