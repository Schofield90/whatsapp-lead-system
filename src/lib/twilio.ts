let twilioClient: any;

export async function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  
  if (!twilioClient) {
    const twilio = (await import('twilio')).default;
    twilioClient = twilio(accountSid, authToken);
  }
  
  return twilioClient;
}

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  from?: string
) {
  const client = await getTwilioClient();
  const fromNumber = from || process.env.TWILIO_WHATSAPP_NUMBER;
  
  if (!fromNumber) {
    throw new Error('Twilio WhatsApp number not configured');
  }
  
  try {
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${to}`,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

export async function validateTwilioWebhook(
  signature: string,
  url: string,
  body: Record<string, unknown>
) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!authToken) {
    throw new Error('Twilio auth token not configured');
  }
  
  const twilio = (await import('twilio')).default;
  return twilio.validateRequest(authToken, signature, url, body);
}