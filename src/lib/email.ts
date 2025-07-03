import { Resend } from 'resend';

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error('Resend API key not configured');
  }
  
  return new Resend(apiKey);
}

export async function sendBookingConfirmation(
  to: string,
  booking: {
    leadName: string;
    scheduledAt: string;
    meetLink: string;
    organizationName: string;
    duration: number;
  }
) {
  const resend = getResendClient();
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  try {
    const result = await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: to,
      subject: `Consultation Confirmed - ${booking.organizationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Consultation is Confirmed!</h2>
          
          <p>Hi ${booking.leadName},</p>
          
          <p>Great news! Your consultation with ${booking.organizationName} has been confirmed.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Appointment Details:</h3>
            <p><strong>Date & Time:</strong> ${formatDate(booking.scheduledAt)}</p>
            <p><strong>Duration:</strong> ${booking.duration} minutes</p>
            <p><strong>Meeting Link:</strong> <a href="${booking.meetLink}">Join Google Meet</a></p>
          </div>
          
          <p>We're excited to discuss your fitness goals and how we can help you achieve them!</p>
          
          <h3>What to Expect:</h3>
          <ul>
            <li>Discussion of your current fitness level and goals</li>
            <li>Overview of our programs and services</li>
            <li>Personalized recommendations</li>
            <li>Q&A session</li>
          </ul>
          
          <p>If you need to reschedule or have any questions, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br>
          The ${booking.organizationName} Team</p>
        </div>
      `,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    throw error;
  }
}

export async function sendBookingReminder(
  to: string,
  booking: {
    leadName: string;
    scheduledAt: string;
    meetLink: string;
    organizationName: string;
    hoursUntil: number;
  }
) {
  const resend = getResendClient();
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  try {
    const result = await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: to,
      subject: `Reminder: Your consultation with ${booking.organizationName} is in ${booking.hoursUntil} hours`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Consultation Reminder</h2>
          
          <p>Hi ${booking.leadName},</p>
          
          <p>This is a friendly reminder that your consultation with ${booking.organizationName} is coming up in ${booking.hoursUntil} hours.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Appointment Details:</h3>
            <p><strong>Date & Time:</strong> ${formatDate(booking.scheduledAt)}</p>
            <p><strong>Meeting Link:</strong> <a href="${booking.meetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Join Google Meet</a></p>
          </div>
          
          <p>We're looking forward to speaking with you!</p>
          
          <p>Best regards,<br>
          The ${booking.organizationName} Team</p>
        </div>
      `,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending booking reminder:', error);
    throw error;
  }
}