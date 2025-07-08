import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/twilio';
import { processConversationWithClaude, alertIfHighCosts } from '@/lib/claude-optimized';
import { sendBookingConfirmation } from '@/lib/email';
import { createCalendarService } from '@/lib/google-calendar';
import { reminderService } from '@/lib/reminder-service';

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
    const rawFrom = params.get('From') || '';
    const rawTo = params.get('To') || '';
    const from = rawFrom.replace('whatsapp:', '');
    const to = rawTo.replace('whatsapp:', '');
    const messageBody = params.get('Body') || '';
    const messageSid = params.get('MessageSid') || '';
    
    console.log('Parsed webhook data:', {
      rawFrom,
      from,
      rawTo,
      to,
      messageBody,
      messageSid,
      allParams: Object.fromEntries(params)
    });
    
    console.log('Message FROM (sender):', from);
    console.log('Message TO (business number):', to);

    const supabase = createServiceClient();

    // Get organization by business phone number
    const businessPhone = to;
    console.log('Business phone number (TO):', businessPhone);
    console.log('Customer phone number (FROM):', from);
    
    // First, find which organization this business number belongs to
    // You'll need to store this mapping somewhere (e.g., in organization settings)
    // For now, we'll use the first organization
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
      .single();
    
    if (!organization) {
      console.log('No organization found');
      return new NextResponse('Organization not found', { status: 404 });
    }

    // Now find or create the lead for the customer (FROM number)
    const customerPhone = from;
    console.log('Looking for customer lead with phone:', customerPhone);

    // Try to find existing lead
    let { data: lead } = await supabase
      .from('leads')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('phone', customerPhone)
      .eq('organization_id', organization.id)
      .single();

    // If lead doesn't exist, create one
    if (!lead) {
      console.log('Creating new lead for customer:', customerPhone);
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          phone: customerPhone,
          name: 'WhatsApp User',
          organization_id: organization.id,
          status: 'new',
          source: 'whatsapp'
        })
        .select(`
          *,
          organization:organizations(*)
        `)
        .single();
      
      if (createError) {
        console.error('Error creating lead:', createError);
        return new NextResponse('Failed to create lead', { status: 500 });
      }
      
      lead = newLead;
    }

    // Ensure lead has organization attached
    if (!lead.organization) {
      lead.organization = organization;
    }

    console.log('Lead found/created:', lead.id, lead.name);

    // Get or create active conversation for this lead
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('status', 'active')
      .single();

    if (!conversation) {
      console.log('Creating new conversation for lead:', lead.id);
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          lead_id: lead.id,
          organization_id: organization.id,
          status: 'active'
        })
        .select()
        .single();
      
      if (convError) {
        console.error('Error creating conversation:', convError);
        return new NextResponse('Failed to create conversation', { status: 500 });
      }
      
      conversation = newConversation;
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

    // OPTIMIZATION: Limit data fetching to reduce token usage
    const [messagesResult, knowledgeBaseResult] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(10), // Only last 10 messages
      supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20) // Get all knowledge base entries (should be manageable size)
    ]);

    const messages = messagesResult.data || [];
    const knowledgeBase = knowledgeBaseResult.data || [];

    // OPTIMIZATION: Minimal logging to reduce noise
    console.log(`🎯 Context: ${messages.length} msgs, ${knowledgeBase.length} knowledge entries`);
    
    // Check for data errors
    if (messagesResult.error || knowledgeBaseResult.error) {
      console.error('Data fetch errors:', {
        messages: messagesResult.error,
        knowledgeBase: knowledgeBaseResult.error
      });
    }

    // Process with Claude (with fallback)
    let claudeResponse;
    try {
      claudeResponse = await processConversationWithClaude(
        {
          lead,
          conversation,
          messages,
          knowledgeBase,
          organization: lead.organization,
          callTranscripts: [] // Disable call transcripts to force use of knowledge base only
        },
        messageBody
      );
    } catch (claudeError) {
      console.error('Error processing with Claude:', claudeError);
      // Fallback response when Claude API fails
      claudeResponse = {
        response: "Hi! Thanks for reaching out. I'd love to help you with your fitness goals. Could you tell me a bit about what you're looking to achieve?",
        shouldBookCall: false,
        leadQualified: false,
        suggestedActions: []
      };
    }

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

    // Handle booking if customer is ready (check if not already booked)
    if (claudeResponse.shouldBookCall && lead.status !== 'booked') {
      console.log('🗓️ Customer ready to book - starting booking flow');
      await handleBookingFlow(supabase, lead, conversation);
    } else if (claudeResponse.shouldBookCall && lead.status === 'booked') {
      console.log('⚠️ Customer already booked - skipping booking flow');
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    // OPTIMIZATION: Monitor costs after each webhook
    alertIfHighCosts();

    return new NextResponse('', { status: 200 });

  } catch (error) {
    console.error('Twilio webhook error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// GET endpoint for testing webhook URL
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Twilio WhatsApp webhook endpoint is active and ready',
    timestamp: new Date().toISOString(),
    url: request.url,
    version: '1.1'
  });
}

async function handleBookingFlow(supabase: ReturnType<typeof createServiceClient>, lead: { id: string; phone: string; email?: string; name: string; organization_id: string; organization: { name: string } }, conversation: { id: string }) {
  try {
    console.log(`🗓️ Starting booking flow for lead ${lead.name} (${lead.phone})`);

    // Get next available time slot (tomorrow at 10 AM for now)
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);
    scheduledAt.setHours(10, 0, 0, 0); // 10 AM tomorrow

    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + 30);

    let calendarEventId = null;
    let meetLink = null;

    // Try to create Google Calendar event
    try {
      const calendarService = await createCalendarService(lead.organization_id);
      if (calendarService) {
        console.log('📅 Creating Google Calendar event...');
        const calendarEvent = await calendarService.createEvent({
          summary: `Fitness Consultation - ${lead.name}`,
          description: `Fitness consultation with ${lead.name}\nPhone: ${lead.phone}\nEmail: ${lead.email || 'Not provided'}\n\nDiscuss fitness goals and membership options.`,
          startTime: scheduledAt.toISOString(),
          endTime: endTime.toISOString(),
          attendeeEmail: lead.email,
          attendeeName: lead.name,
          attendeePhone: lead.phone,
        });

        calendarEventId = calendarEvent.eventId;
        meetLink = calendarEvent.meetLink;
        console.log(`✅ Calendar event created: ${calendarEventId}`);
      } else {
        console.log('⚠️ Google Calendar not configured, booking without calendar integration');
      }
    } catch (calendarError) {
      console.error('❌ Calendar event creation failed:', calendarError);
      // Continue with booking even if calendar fails
    }

    // Create booking in database
    console.log('💾 Creating booking in database...');
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        organization_id: lead.organization_id,
        lead_id: lead.id,
        conversation_id: conversation.id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: 30,
        status: 'scheduled',
        google_calendar_event_id: calendarEventId,
        google_meet_link: meetLink,
      })
      .select(`
        *,
        lead:leads(id, name, phone, email),
        organization:organizations(id, name)
      `)
      .single();

    if (bookingError) {
      console.error('❌ Error creating booking:', bookingError);
      throw new Error('Failed to create booking');
    }

    console.log(`✅ Booking created with ID: ${booking.id}`);

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: 'booked' })
      .eq('id', lead.id);

    // Schedule reminders (owner notification and 1-hour reminder only)
    // Client confirmation is handled by Claude's response
    console.log('📱 Scheduling reminders...');
    await reminderService.scheduleBookingReminders({
      id: booking.id,
      lead_id: lead.id,
      scheduled_at: scheduledAt.toISOString(),
      lead: {
        phone: lead.phone,
        name: lead.name,
      },
      organization: {
        name: lead.organization.name,
      },
    });

    // Send email confirmation if email is available
    if (lead.email && meetLink) {
      try {
        console.log('📧 Sending email confirmation...');
        await sendBookingConfirmation(lead.email, {
          leadName: lead.name,
          scheduledAt: scheduledAt.toISOString(),
          meetLink: meetLink,
          organizationName: lead.organization.name,
          duration: 30,
        });
        console.log('✅ Email confirmation sent');
      } catch (emailError) {
        console.error('❌ Error sending email confirmation:', emailError);
      }
    }

    console.log(`🎉 Booking flow completed successfully for ${lead.name}`);

  } catch (error) {
    console.error('❌ Error handling booking flow:', error);
    
    // Send fallback confirmation message
    try {
      const fallbackMessage = `Thanks for your interest! I'll arrange a consultation for you and get back to you with the details shortly. Looking forward to helping you with your fitness goals! 💪`;
      await sendWhatsAppMessage(lead.phone, fallbackMessage);
    } catch (fallbackError) {
      console.error('❌ Error sending fallback message:', fallbackError);
    }
  }
}