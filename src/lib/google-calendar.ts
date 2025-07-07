import { google } from 'googleapis';

export interface CalendarEvent {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  attendeeEmail?: string;
  attendeeName?: string;
  attendeePhone?: string;
}

export interface CalendarEventResult {
  eventId: string;
  meetLink?: string;
  startTime: string;
  endTime: string;
  htmlLink: string;
}

export class GoogleCalendarService {
  private calendar: any;

  constructor(credentials: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
  }) {
    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      'http://localhost:3000/auth/google/callback' // This would be your redirect URI
    );

    oauth2Client.setCredentials({
      refresh_token: credentials.refresh_token,
    });

    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async createEvent(event: CalendarEvent): Promise<CalendarEventResult> {
    try {
      const calendarEvent = {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.startTime,
          timeZone: 'Europe/London', // Adjust to your timezone
        },
        end: {
          dateTime: event.endTime,
          timeZone: 'Europe/London',
        },
        attendees: event.attendeeEmail ? [
          {
            email: event.attendeeEmail,
            displayName: event.attendeeName,
          }
        ] : [],
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 60 },
          ],
        },
      };

      console.log('Creating calendar event:', calendarEvent);

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent,
        conferenceDataVersion: 1,
        sendUpdates: 'all', // Send email notifications
      });

      const createdEvent = response.data;

      return {
        eventId: createdEvent.id,
        meetLink: createdEvent.conferenceData?.entryPoints?.[0]?.uri,
        startTime: createdEvent.start.dateTime,
        endTime: createdEvent.end.dateTime,
        htmlLink: createdEvent.htmlLink,
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEventResult> {
    try {
      const response = await this.calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        resource: {
          summary: updates.summary,
          description: updates.description,
          start: updates.startTime ? {
            dateTime: updates.startTime,
            timeZone: 'Europe/London',
          } : undefined,
          end: updates.endTime ? {
            dateTime: updates.endTime,
            timeZone: 'Europe/London',
          } : undefined,
        },
        sendUpdates: 'all',
      });

      const updatedEvent = response.data;

      return {
        eventId: updatedEvent.id,
        meetLink: updatedEvent.conferenceData?.entryPoints?.[0]?.uri,
        startTime: updatedEvent.start.dateTime,
        endTime: updatedEvent.end.dateTime,
        htmlLink: updatedEvent.htmlLink,
      };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error(`Failed to delete calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAvailableSlots(date: Date): Promise<string[]> {
    try {
      // Get events for the specified date
      const startOfDay = new Date(date);
      startOfDay.setHours(9, 0, 0, 0); // Start at 9 AM
      
      const endOfDay = new Date(date);
      endOfDay.setHours(17, 0, 0, 0); // End at 5 PM

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      const bookedSlots = events.map((event: any) => ({
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
      }));

      // Generate available 30-minute slots from 9 AM to 5 PM
      const availableSlots: string[] = [];
      const currentSlot = new Date(startOfDay);

      while (currentSlot < endOfDay) {
        const slotEnd = new Date(currentSlot.getTime() + 30 * 60 * 1000); // 30 minutes later
        
        // Check if this slot conflicts with any booked events
        const isAvailable = !bookedSlots.some(booking => 
          (currentSlot >= booking.start && currentSlot < booking.end) ||
          (slotEnd > booking.start && slotEnd <= booking.end) ||
          (currentSlot <= booking.start && slotEnd >= booking.end)
        );

        if (isAvailable) {
          availableSlots.push(currentSlot.toISOString());
        }

        currentSlot.setMinutes(currentSlot.getMinutes() + 30);
      }

      return availableSlots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      throw new Error(`Failed to get available slots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export async function createCalendarService(organizationId: string): Promise<GoogleCalendarService | null> {
  try {
    // This would fetch the Google Calendar credentials from your database
    // For now, we'll use environment variables
    const credentials = {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
    };

    if (!credentials.client_id || !credentials.client_secret || !credentials.refresh_token) {
      console.error('Missing Google Calendar credentials');
      return null;
    }

    return new GoogleCalendarService(credentials);
  } catch (error) {
    console.error('Error creating calendar service:', error);
    return null;
  }
}