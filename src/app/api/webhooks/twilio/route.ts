import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/twilio';
import { processConversationWithClaude } from '@/lib/claude';
import { sendBookingConfirmation } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TWILIO WEBHOOK RECEIVED ===');
    const body = await request.text();
    console.log('Raw webhook body:', body);
    
    // const signature = request.headers.get('x-twilio-signature') || '';
    
    // Validate Twilio webhook (simplified for now)
    // const isValid = validateTwilioWebhook(signature, request.url, parsedBody);
    // if (!isValid) {
    //   return new NextResponse('Invalid signature', { status: 401 });
    // }

    const params = new URLSearchParams(body);
    const from = params.get('From')?.replace('whatsapp:', '') || '';
    const messageBody = params.get('Body') || '';
    const messageSid = params.get('MessageSid') || '';
    
    console.log('Parsed webhook data:', {
      from,
      messageBody,
      messageSid,
      allParams: Object.fromEntries(params)
    });

    const supabase = await createClient();

    // Find the lead by phone number
    const { data: lead } = await supabase
      .from('leads')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('phone', from)
      .single();

    if (!lead) {
      console.log('Lead not found for phone:', from);
      return new NextResponse('Lead not found', { status: 404 });
    }

    // Get active conversation for this lead
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('status', 'active')
      .single();

    if (!conversation) {
      console.log('No active conversation found for lead:', lead.id);
      return new NextResponse('No active conversation', { status: 404 });
    }

    // Store incoming message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'inbound',
        content: messageBody,
        twilio_message_sid: messageSid,
      });

    // Get conversation history and training data
    const [messagesResult, trainingDataResult] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('training_data')
        .select('*')
        .eq('organization_id', lead.organization_id)
        .eq('is_active', true),
    ]);

    const messages = messagesResult.data || [];
    const trainingData = trainingDataResult.data || [];

    // Process with Claude
    const claudeResponse = await processConversationWithClaude(
      {
        lead,
        conversation,
        messages,
        trainingData,
        organization: lead.organization,
      },
      messageBody
    );

    // Send response via WhatsApp
    const twilioMessage = await sendWhatsAppMessage(from, claudeResponse.response);

    // Store outbound message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'outbound',
        content: claudeResponse.response,
        twilio_message_sid: twilioMessage.sid,
        claude_response_data: {
          shouldBookCall: claudeResponse.shouldBookCall,
          leadQualified: claudeResponse.leadQualified,
          suggestedActions: claudeResponse.suggestedActions,
        },
      });

    // Update lead status if qualified
    if (claudeResponse.leadQualified && lead.status === 'new') {
      await supabase
        .from('leads')
        .update({ status: 'qualified' })
        .eq('id', lead.id);
    }

    // Handle booking if customer is ready
    if (claudeResponse.shouldBookCall) {
      await handleBookingFlow(supabase, lead, conversation);
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    return new NextResponse('Success', { status: 200 });

  } catch (error) {
    console.error('Twilio webhook error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// GET endpoint for testing webhook URL
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Twilio WhatsApp webhook endpoint is active',
    timestamp: new Date().toISOString(),
    url: request.url
  });
}

async function handleBookingFlow(supabase: Awaited<ReturnType<typeof createClient>>, lead: { id: string; phone: string; email?: string; name: string; organization_id: string; organization: { name: string } }, conversation: { id: string }) {
  try {
    // Get organization settings for calendar integration
    const { data: secrets } = await supabase
      .from('organization_secrets')
      .select('*')
      .eq('organization_id', lead.organization_id)
      .eq('service_name', 'google_calendar')
      .eq('is_active', true)
      .single();

    if (!secrets) {
      console.log('No Google Calendar integration found');
      return;
    }

    // For now, create a booking 24 hours from now
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);
    scheduledAt.setHours(10, 0, 0, 0); // 10 AM tomorrow

    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + 30);

    // Create calendar event (this would need proper Google OAuth implementation)
    // const calendarEvent = await createCalendarEvent(secrets.access_token, {
    //   summary: `Consultation with ${lead.name}`,
    //   description: `Fitness consultation for ${lead.name}`,
    //   startTime: scheduledAt.toISOString(),
    //   endTime: endTime.toISOString(),
    //   attendeeEmail: lead.email,
    // });

    // Create booking in database
    const { data: booking } = await supabase
      .from('bookings')
      .insert({
        organization_id: lead.organization_id,
        lead_id: lead.id,
        conversation_id: conversation.id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: 30,
        status: 'scheduled',
        // google_calendar_event_id: calendarEvent.eventId,
        // google_meet_link: calendarEvent.meetLink,
      })
      .select()
      .single();

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: 'booked' })
      .eq('id', lead.id);

    // Send confirmation message
    const confirmationMessage = `🎉 Perfect! I've scheduled your consultation for ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString()}.

You'll receive an email confirmation with all the details shortly. Looking forward to helping you achieve your fitness goals!

If you need to reschedule, just let me know.`;

    await sendWhatsAppMessage(lead.phone, confirmationMessage);

    // Send email confirmation if email is available
    if (lead.email && booking) {
      try {
        await sendBookingConfirmation(lead.email, {
          leadName: lead.name,
          scheduledAt: scheduledAt.toISOString(),
          meetLink: booking.google_meet_link || 'TBD',
          organizationName: lead.organization.name,
          duration: 30,
        });
      } catch (emailError) {
        console.error('Error sending email confirmation:', emailError);
      }
    }

  } catch (error) {
    console.error('Error handling booking flow:', error);
  }
}