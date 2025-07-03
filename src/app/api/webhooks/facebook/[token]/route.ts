import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/twilio';
import { formatPhoneNumber } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify the webhook
  if (mode === 'subscribe' && token === params.token) {
    console.log('Webhook verified');
    return new NextResponse(challenge);
  } else {
    return new NextResponse('Forbidden', { status: 403 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    // Verify webhook token
    const { data: leadSource } = await supabase
      .from('lead_sources')
      .select('*, organization:organizations(*)')
      .eq('webhook_token', params.token)
      .eq('is_active', true)
      .single();

    if (!leadSource) {
      return new NextResponse('Invalid webhook token', { status: 401 });
    }

    // Process Facebook lead data
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const leadgenData = changes?.value;

    if (!leadgenData) {
      return new NextResponse('No lead data found', { status: 400 });
    }

    // Extract lead information
    const facebookLeadId = leadgenData.leadgen_id;
    const fieldData = leadgenData.field_data || [];
    
    let name = '';
    let phone = '';
    let email = '';

    fieldData.forEach((field: any) => {
      switch (field.name.toLowerCase()) {
        case 'full_name':
        case 'name':
          name = field.values[0] || '';
          break;
        case 'phone_number':
        case 'phone':
          phone = field.values[0] || '';
          break;
        case 'email':
          email = field.values[0] || '';
          break;
      }
    });

    if (!name || !phone) {
      return new NextResponse('Missing required lead data', { status: 400 });
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);

    // Create lead in database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        organization_id: leadSource.organization.id,
        lead_source_id: leadSource.id,
        name,
        phone: formattedPhone,
        email,
        facebook_lead_id: facebookLeadId,
        status: 'new',
        metadata: {
          facebook_data: leadgenData,
          original_phone: phone,
        },
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return new NextResponse('Error creating lead', { status: 500 });
    }

    // Create conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        organization_id: leadSource.organization.id,
        lead_id: lead.id,
        status: 'active',
      })
      .select()
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      return new NextResponse('Error creating conversation', { status: 500 });
    }

    // Send initial WhatsApp message
    try {
      const initialMessage = `Hi ${name}! 👋 

Thanks for your interest in ${leadSource.organization.name}! I'm here to help you get started on your fitness journey.

I'd love to learn more about your goals and see how we can help you achieve them. What's your main fitness goal right now?`;

      const twilioMessage = await sendWhatsAppMessage(formattedPhone, initialMessage);

      // Store the message in database
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          direction: 'outbound',
          content: initialMessage,
          twilio_message_sid: twilioMessage.sid,
        });

    } catch (twilioError) {
      console.error('Error sending WhatsApp message:', twilioError);
      // Don't fail the webhook if WhatsApp fails
    }

    return new NextResponse('Success', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}