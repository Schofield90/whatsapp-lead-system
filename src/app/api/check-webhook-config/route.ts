import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking Twilio webhook configuration...');
    
    const twilio = (await import('twilio')).default;
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!whatsappNumber) {
      return NextResponse.json({ error: 'TWILIO_WHATSAPP_NUMBER not configured' }, { status: 400 });
    }
    
    // Get the phone number configuration
    const phoneNumbers = await client.incomingPhoneNumbers
      .list({ phoneNumber: whatsappNumber });
    
    if (phoneNumbers.length === 0) {
      return NextResponse.json({ error: `Phone number ${whatsappNumber} not found` }, { status: 404 });
    }
    
    const phoneNumber = phoneNumbers[0];
    
    return NextResponse.json({
      phoneNumber: phoneNumber.phoneNumber,
      smsUrl: phoneNumber.smsUrl,
      smsMethod: phoneNumber.smsMethod,
      voiceUrl: phoneNumber.voiceUrl,
      voiceMethod: phoneNumber.voiceMethod,
      statusCallback: phoneNumber.statusCallback,
      sid: phoneNumber.sid,
      expectedWebhook: `https://whatsapp-lead-system.vercel.app/api/webhooks/twilio`,
      isWebhookConfigured: phoneNumber.smsUrl === `https://whatsapp-lead-system.vercel.app/api/webhooks/twilio`
    });
    
  } catch (error) {
    console.error('Error checking webhook config:', error);
    return NextResponse.json({
      error: 'Failed to check webhook configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}