import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Getting complete Twilio configuration...');
    
    const twilio = (await import('twilio')).default;
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!whatsappNumber) {
      return NextResponse.json({ error: 'TWILIO_WHATSAPP_NUMBER not configured' }, { status: 400 });
    }
    
    // Get phone number details
    const phoneNumbers = await client.incomingPhoneNumbers
      .list({ phoneNumber: whatsappNumber });
    
    if (phoneNumbers.length === 0) {
      return NextResponse.json({ error: `Phone number ${whatsappNumber} not found` }, { status: 404 });
    }
    
    const phoneNumber = phoneNumbers[0];
    
    // Also check for WhatsApp-specific configuration
    let whatsappConfig = null;
    try {
      // Try to get WhatsApp-specific settings
      const whatsappSenders = await client.conversations.v1.configuration()
        .webhooks()
        .list();
      whatsappConfig = whatsappSenders;
    } catch (e) {
      console.log('No WhatsApp conversation webhooks found');
    }
    
    // Check if there are any Messaging Services
    let messagingServices = [];
    try {
      messagingServices = await client.messaging.v1.services.list();
    } catch (e) {
      console.log('No messaging services found');
    }
    
    return NextResponse.json({
      phoneNumber: {
        phoneNumber: phoneNumber.phoneNumber,
        sid: phoneNumber.sid,
        smsUrl: phoneNumber.smsUrl,
        smsMethod: phoneNumber.smsMethod,
        voiceUrl: phoneNumber.voiceUrl,
        voiceMethod: phoneNumber.voiceMethod,
        statusCallback: phoneNumber.statusCallback,
        capabilities: phoneNumber.capabilities,
        addressRequirements: phoneNumber.addressRequirements,
        beta: phoneNumber.beta
      },
      whatsappConfig,
      messagingServices: messagingServices.map(service => ({
        sid: service.sid,
        friendlyName: service.friendlyName,
        inboundRequestUrl: service.inboundRequestUrl,
        inboundMethod: service.inboundMethod,
        fallbackUrl: service.fallbackUrl,
        fallbackMethod: service.fallbackMethod,
        statusCallback: service.statusCallback,
        useCase: service.useCase
      })),
      accountSid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...',
      environmentCheck: {
        hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasWhatsappNumber: !!process.env.TWILIO_WHATSAPP_NUMBER
      }
    });
    
  } catch (error) {
    console.error('Error getting Twilio config:', error);
    return NextResponse.json({
      error: 'Failed to get Twilio configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}