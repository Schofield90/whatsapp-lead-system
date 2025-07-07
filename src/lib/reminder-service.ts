import { createServiceClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/twilio';

export interface Reminder {
  id: string;
  booking_id: string;
  reminder_type: 'confirmation' | 'one_hour_before' | 'owner_notification';
  scheduled_at: string;
  recipient_phone: string;
  message_template: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
}

export class ReminderService {
  private getSupabase() {
    return createServiceClient();
  }

  async scheduleBookingReminders(booking: {
    id: string;
    lead_id: string;
    scheduled_at: string;
    lead: {
      phone: string;
      name: string;
    };
    organization: {
      name: string;
    };
  }) {
    const reminders = [];
    const scheduledDate = new Date(booking.scheduled_at);
    const oneHourBefore = new Date(scheduledDate.getTime() - 60 * 60 * 1000);

    // 1. Owner notification (immediate)
    const ownerReminder = {
      booking_id: booking.id,
      reminder_type: 'owner_notification' as const,
      scheduled_at: new Date().toISOString(),
      recipient_phone: '+447490253471', // Your WhatsApp number
      message_template: `🗓️ NEW BOOKING CONFIRMED

📋 Client: ${booking.lead.name}
📞 Phone: ${booking.lead.phone}
🕐 Time: ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()}

Booking ID: ${booking.id}

The client has been notified and will receive a reminder 1 hour before the call.`,
      status: 'pending' as const
    };

    // 2. Client confirmation (disabled - handled by Claude's response)
    // const clientConfirmation = {
    //   booking_id: booking.id,
    //   reminder_type: 'confirmation' as const,
    //   scheduled_at: new Date().toISOString(),
    //   recipient_phone: booking.lead.phone,
    //   message_template: `🎉 Great news! Your consultation is confirmed!`,
    //   status: 'pending' as const
    // };

    // 3. One hour before reminder
    const oneHourReminder = {
      booking_id: booking.id,
      reminder_type: 'one_hour_before' as const,
      scheduled_at: oneHourBefore.toISOString(),
      recipient_phone: booking.lead.phone,
      message_template: `⏰ REMINDER: Your fitness consultation is in 1 hour!

📅 Time: ${scheduledDate.toLocaleTimeString()}
🏋️ With: ${booking.organization.name}

Please make sure you're ready for our call. We'll be discussing your fitness goals and how we can help you achieve them.

See you soon! 💪`,
      status: 'pending' as const
    };

    reminders.push(ownerReminder, oneHourReminder);

    // Insert all reminders into database
    const { data, error } = await this.getSupabase()
      .from('booking_reminders')
      .insert(reminders)
      .select();

    if (error) {
      console.error('Error scheduling reminders:', error);
      throw new Error('Failed to schedule reminders');
    }

    console.log(`✅ Scheduled ${reminders.length} reminders for booking ${booking.id}`);

    // Send immediate reminders (owner notification only)
    await this.sendImmediateReminders(booking.id);

    return data;
  }

  async sendImmediateReminders(bookingId: string) {
    const { data: immediateReminders } = await this.getSupabase()
      .from('booking_reminders')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('reminder_type', 'owner_notification') // Only owner notifications
      .eq('status', 'pending');

    for (const reminder of immediateReminders || []) {
      await this.sendReminder(reminder.id);
    }
  }

  async sendReminder(reminderId: string) {
    try {
      const { data: reminder } = await this.getSupabase()
        .from('booking_reminders')
        .select('*')
        .eq('id', reminderId)
        .single();

      if (!reminder || reminder.status !== 'pending') {
        console.log(`Reminder ${reminderId} not found or already processed`);
        return;
      }

      // Check if it's time to send the reminder
      const now = new Date();
      const scheduledTime = new Date(reminder.scheduled_at);

      if (now < scheduledTime && reminder.reminder_type === 'one_hour_before') {
        console.log(`Reminder ${reminderId} not yet due. Scheduled for ${scheduledTime}`);
        return;
      }

      console.log(`📱 Sending ${reminder.reminder_type} reminder to ${reminder.recipient_phone}`);

      // Validate phone number format
      if (!reminder.recipient_phone || reminder.recipient_phone.length < 10) {
        throw new Error(`Invalid phone number: ${reminder.recipient_phone}`);
      }

      // Ensure phone number has + prefix
      let formattedPhone = reminder.recipient_phone;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      console.log(`📱 Formatted phone: ${formattedPhone}`);

      // Send WhatsApp message
      const twilioMessage = await sendWhatsAppMessage(
        formattedPhone,
        reminder.message_template
      );

      // Update reminder status
      await this.getSupabase()
        .from('booking_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          twilio_message_sid: twilioMessage.sid
        })
        .eq('id', reminderId);

      console.log(`✅ Reminder ${reminderId} sent successfully`);

    } catch (error) {
      console.error(`❌ Error sending reminder ${reminderId}:`, error);
      
      // Mark as failed to prevent retry loops
      await this.getSupabase()
        .from('booking_reminders')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          sent_at: new Date().toISOString()
        })
        .eq('id', reminderId);
        
      // Don't rethrow to prevent breaking the batch process
    }
  }

  async processPendingReminders() {
    try {
      const now = new Date();
      
      // Get reminders that are due to be sent (limit to prevent spam)
      const { data: dueReminders } = await this.getSupabase()
        .from('booking_reminders')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', now.toISOString())
        .limit(5); // Limit to 5 at a time to prevent spam

      console.log(`📋 Processing ${dueReminders?.length || 0} due reminders`);

      if (!dueReminders || dueReminders.length === 0) {
        console.log('No pending reminders to process');
        return;
      }

      for (const reminder of dueReminders) {
        await this.sendReminder(reminder.id);
        // Add delay between messages to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error('Error processing pending reminders:', error);
    }
  }

  async cancelBookingReminders(bookingId: string) {
    try {
      await this.getSupabase()
        .from('booking_reminders')
        .update({ status: 'cancelled' })
        .eq('booking_id', bookingId)
        .eq('status', 'pending');

      console.log(`📅 Cancelled reminders for booking ${bookingId}`);
    } catch (error) {
      console.error('Error cancelling reminders:', error);
    }
  }
}

export const reminderService = new ReminderService();