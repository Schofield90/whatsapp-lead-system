import { createClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/twilio';
import { sendBookingReminder } from '@/lib/email';
import { Database } from '@/types/database';

type Lead = Database['public']['Tables']['leads']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

export async function processFollowUps() {
  const supabase = await createClient();
  
  try {
    // Get all active leads that need follow-ups
    await Promise.all([
      processLeadFollowUps(supabase),
      processBookingReminders(supabase),
      processNoShowFollowUps(supabase),
    ]);
  } catch (error) {
    console.error('Error processing follow-ups:', error);
  }
}

async function processLeadFollowUps(supabase: Awaited<ReturnType<typeof createClient>>) {
  // Find leads that haven't responded in 24 hours
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data: staleLeads } = await supabase
    .from('leads')
    .select(`
      *,
      organization:organizations(*),
      conversations!inner(
        *,
        messages(created_at, direction)
      )
    `)
    .eq('status', 'new')
    .filter('conversations.last_message_at', 'lt', twentyFourHoursAgo.toISOString());

  for (const lead of staleLeads || []) {
    // Check if we've already sent a follow-up
    const lastMessage = lead.conversations[0]?.messages?.[0];
    if (lastMessage?.direction === 'outbound') {
      // Already sent a follow-up, skip
      continue;
    }

    await sendLeadFollowUp(lead, lead.organization);
  }
}

async function processBookingReminders(supabase: Awaited<ReturnType<typeof createClient>>) {
  const now = new Date();
  const twentyFourHours = new Date(now.getTime() + (24 * 60 * 60 * 1000));
  const oneHour = new Date(now.getTime() + (60 * 60 * 1000));

  // 24-hour reminders
  const { data: upcomingBookings24h } = await supabase
    .from('bookings')
    .select(`
      *,
      lead:leads(*),
      organization:organizations(*)
    `)
    .eq('status', 'scheduled')
    .eq('reminder_sent', false)
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', twentyFourHours.toISOString());

  for (const booking of upcomingBookings24h || []) {
    await send24HourReminder(booking);
  }

  // 1-hour reminders
  const { data: upcomingBookings1h } = await supabase
    .from('bookings')
    .select(`
      *,
      lead:leads(*),
      organization:organizations(*)
    `)
    .eq('status', 'scheduled')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', oneHour.toISOString());

  for (const booking of upcomingBookings1h || []) {
    await send1HourReminder(booking);
  }
}

async function processNoShowFollowUps(supabase: Awaited<ReturnType<typeof createClient>>) {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - (30 * 60 * 1000));

  // Find bookings that should have happened but are still "scheduled"
  const { data: missedBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      lead:leads(*),
      organization:organizations(*)
    `)
    .eq('status', 'scheduled')
    .lte('scheduled_at', thirtyMinutesAgo.toISOString());

  for (const booking of missedBookings || []) {
    // Mark as no-show and send follow-up
    await supabase
      .from('bookings')
      .update({ status: 'no_show' })
      .eq('id', booking.id);

    await sendNoShowFollowUp(booking);
  }
}

async function sendLeadFollowUp(lead: Lead & { organization: Organization }, organization: Organization) {
  const followUpMessages = [
    `Hi ${lead.name}! 👋 

I wanted to follow up on your interest in ${organization.name}. 

Are you still looking to get started on your fitness journey? I'd love to help answer any questions you might have!`,

    `Hey ${lead.name}! 

I know how busy life can get, but I didn't want you to miss out on the opportunity to transform your health and fitness.

${organization.name} has helped hundreds of people just like you achieve amazing results. Would you like to chat about your goals?`,

    `Hi ${lead.name},

Just checking in one more time! 

If you're ready to make a change and commit to your health, I'm here to help. We have some exciting programs that could be perfect for you.

What do you say? Ready to take the first step? 💪`
  ];

  try {
    const supabase = await createClient();
    
    // Get current follow-up count
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', lead.conversations[0].id)
      .eq('direction', 'outbound');

    const followUpIndex = Math.min((messages?.length || 0) - 1, followUpMessages.length - 1);
    const message = followUpMessages[followUpIndex];

    await sendWhatsAppMessage(lead.phone, message);

    // Log the follow-up message
    await supabase
      .from('messages')
      .insert({
        conversation_id: lead.conversations[0].id,
        direction: 'outbound',
        content: message,
      });

    console.log(`Follow-up sent to ${lead.name}`);
  } catch (error) {
    console.error(`Error sending follow-up to ${lead.name}:`, error);
  }
}

async function send24HourReminder(booking: Booking & { lead: Lead; organization: Organization }) {
  const reminderMessage = `🗓️ Reminder: Your consultation with ${booking.organization.name} is tomorrow!

📅 Date: ${new Date(booking.scheduled_at).toLocaleDateString()}
⏰ Time: ${new Date(booking.scheduled_at).toLocaleTimeString()}
⏱️ Duration: ${booking.duration_minutes} minutes

${booking.google_meet_link ? `📱 Meeting Link: ${booking.google_meet_link}` : ''}

We're excited to help you start your fitness journey! If you need to reschedule, just let me know.

See you tomorrow! 💪`;

  try {
    const supabase = await createClient();

    // Send WhatsApp reminder
    await sendWhatsAppMessage(booking.lead.phone, reminderMessage);

    // Send email reminder if email available
    if (booking.lead.email) {
      await sendBookingReminder(booking.lead.email, {
        leadName: booking.lead.name,
        scheduledAt: booking.scheduled_at,
        meetLink: booking.google_meet_link || '',
        organizationName: booking.organization.name,
        hoursUntil: 24,
      });
    }

    // Mark reminder as sent
    await supabase
      .from('bookings')
      .update({ reminder_sent: true })
      .eq('id', booking.id);

    console.log(`24-hour reminder sent to ${booking.lead.name}`);
  } catch (error) {
    console.error(`Error sending 24-hour reminder to ${booking.lead.name}:`, error);
  }
}

async function send1HourReminder(booking: Booking & { lead: Lead; organization: Organization }) {
  const reminderMessage = `⏰ Your consultation with ${booking.organization.name} is starting in 1 hour!

Don't forget:
📅 Time: ${new Date(booking.scheduled_at).toLocaleTimeString()}
${booking.google_meet_link ? `📱 Join here: ${booking.google_meet_link}` : ''}

See you soon! 🎯`;

  try {
    await sendWhatsAppMessage(booking.lead.phone, reminderMessage);
    console.log(`1-hour reminder sent to ${booking.lead.name}`);
  } catch (error) {
    console.error(`Error sending 1-hour reminder to ${booking.lead.name}:`, error);
  }
}

async function sendNoShowFollowUp(booking: Booking & { lead: Lead; organization: Organization }) {
  const noShowMessage = `Hi ${booking.lead.name},

I noticed you weren't able to make your consultation today. No worries - life happens! 

I'd love to reschedule when it's more convenient for you. ${booking.organization.name} is here to help whenever you're ready.

Just let me know when works better, and we'll get you set up! 😊`;

  try {
    const supabase = await createClient();

    await sendWhatsAppMessage(booking.lead.phone, noShowMessage);

    // Log the follow-up
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', booking.lead_id)
      .single();

    if (conversation) {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          direction: 'outbound',
          content: noShowMessage,
        });
    }

    console.log(`No-show follow-up sent to ${booking.lead.name}`);
  } catch (error) {
    console.error(`Error sending no-show follow-up to ${booking.lead.name}:`, error);
  }
}

// Follow-up sequences for different lead statuses
export const FOLLOW_UP_SEQUENCES = {
  NEW_LEAD: {
    intervals: [24, 72, 168], // 1 day, 3 days, 1 week (in hours)
    messages: [
      "Quick follow-up on your fitness goals!",
      "Still interested in transforming your health?",
      "Last chance to get started with our special program!"
    ]
  },
  QUALIFIED_LEAD: {
    intervals: [12, 24, 48], // 12 hours, 1 day, 2 days
    messages: [
      "Ready to schedule your consultation?",
      "Don't miss out on your transformation opportunity!",
      "Final reminder - let's get you started!"
    ]
  },
  POST_CONSULTATION: {
    intervals: [24, 72], // 1 day, 3 days
    messages: [
      "Thanks for your time today! Ready to get started?",
      "Following up on our consultation - any questions?"
    ]
  }
};