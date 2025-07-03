import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export function getGoogleCalendarClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google Calendar credentials not configured');
  }
  
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

export async function createCalendarEvent(
  accessToken: string,
  eventDetails: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendeeEmail?: string;
    timeZone?: string;
  }
) {
  const oauth2Client = getGoogleCalendarClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    start: {
      dateTime: eventDetails.startTime,
      timeZone: eventDetails.timeZone || 'UTC',
    },
    end: {
      dateTime: eventDetails.endTime,
      timeZone: eventDetails.timeZone || 'UTC',
    },
    attendees: eventDetails.attendeeEmail ? [{ email: eventDetails.attendeeEmail }] : [],
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };
  
  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
    });
    
    return {
      eventId: response.data.id,
      meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri,
      htmlLink: response.data.htmlLink,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export async function getAvailableSlots(
  accessToken: string,
  startDate: string,
  endDate: string,
  timeZone: string = 'UTC'
) {
  const oauth2Client = getGoogleCalendarClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate,
        timeMax: endDate,
        timeZone: timeZone,
        items: [{ id: 'primary' }],
      },
    });
    
    const busySlots = response.data.calendars?.primary?.busy || [];
    
    // Generate available slots (this is a simplified version)
    // In a real implementation, you'd want more sophisticated slot generation
    const availableSlots = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Generate 30-minute slots from 9 AM to 5 PM
    for (let d = start; d < end; d.setDate(d.getDate() + 1)) {
      for (let hour = 9; hour < 17; hour++) {
        const slotStart = new Date(d);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(30);
        
        // Check if slot conflicts with busy times
        const isConflict = busySlots.some(busy => {
          const busyStart = new Date(busy.start!);
          const busyEnd = new Date(busy.end!);
          return slotStart < busyEnd && slotEnd > busyStart;
        });
        
        if (!isConflict) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
          });
        }
      }
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error getting available slots:', error);
    throw error;
  }
}