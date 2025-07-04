import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Configuring Messaging Service webhook...');
    
    const twilio = (await import('twilio')).default;
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Get all messaging services
    const messagingServices = await client.messaging.v1.services.list();
    
    if (messagingServices.length === 0) {
      return NextResponse.json({ error: 'No messaging services found' }, { status: 404 });
    }
    
    const webhookUrl = `https://whatsapp-lead-system.vercel.app/api/webhooks/twilio`;
    
    // Update each messaging service
    const results = [];
    for (const service of messagingServices) {
      console.log(`Updating messaging service: ${service.friendlyName} (${service.sid})`);
      
      const updatedService = await client.messaging.v1.services(service.sid)
        .update({
          inboundRequestUrl: webhookUrl,
          inboundMethod: 'POST',
          statusCallback: webhookUrl
        });
      
      results.push({
        sid: updatedService.sid,
        friendlyName: updatedService.friendlyName,
        inboundRequestUrl: updatedService.inboundRequestUrl,
        inboundMethod: updatedService.inboundMethod,
        statusCallback: updatedService.statusCallback
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${results.length} messaging service(s)`,
      services: results
    });
    
  } catch (error) {
    console.error('Messaging service configuration error:', error);
    return NextResponse.json({
      error: 'Failed to configure messaging service webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Messaging Service Webhook Configuration',
    usage: 'POST to configure webhook on Twilio Messaging Services'
  });
}