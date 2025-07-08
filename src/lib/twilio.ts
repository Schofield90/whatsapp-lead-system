import twilio from 'twilio';

// Lazy initialization of Twilio client to avoid build-time errors
let client: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment variables');
    }
    
    client = twilio(accountSid, authToken);
  }
  return client;
}

/**
 * Send a WhatsApp message using Twilio
 * @param to - Recipient phone number (e.g., "whatsapp:+1234567890")
 * @param message - Message content to send
 * @returns Promise with message response
 */
export async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const twilioClient = getTwilioClient();
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    
    if (!whatsappNumber) {
      throw new Error('TWILIO_WHATSAPP_NUMBER must be set in environment variables');
    }
    
    const response = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${whatsappNumber}`, // Correct format for WhatsApp messages
      to: to
    });
    
    console.log('WhatsApp message sent successfully:', response.sid);
    return response;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

/**
 * Validate Twilio webhook signature for security
 * @param signature - X-Twilio-Signature header value
 * @param url - The webhook URL
 * @param params - Request body parameters
 * @returns boolean indicating if signature is valid
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not found in environment variables');
    return false;
  }

  // Use Twilio's built-in signature validation
  return twilio.validateRequest(authToken, signature, url, params);
}

export default getTwilioClient;