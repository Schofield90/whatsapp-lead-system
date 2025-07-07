import { google } from 'googleapis';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  hangoutLink?: string;
  location?: string;
  status: string;
}

export class GoogleCalendarEventsService {
  private calendar;

  constructor() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async getEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    try {
      const timeMin = startDate || new Date();
      const timeMax = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100,
      });

      const events = response.data.items || [];
      
      return events.map((event: any): CalendarEvent => ({
        id: event.id,
        summary: event.summary || 'No Title',
        description: event.description,
        start: event.start,
        end: event.end,
        attendees: event.attendees,
        hangoutLink: event.hangoutLink,
        location: event.location,
        status: event.status,
      }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  async getUpcomingEvents(count: number = 10): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: count,
      });

      const events = response.data.items || [];
      
      return events.map((event: any): CalendarEvent => ({
        id: event.id,
        summary: event.summary || 'No Title',
        description: event.description,
        start: event.start,
        end: event.end,
        attendees: event.attendees,
        hangoutLink: event.hangoutLink,
        location: event.location,
        status: event.status,
      }));
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw new Error('Failed to fetch upcoming events');
    }
  }

  async getTodaysEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getEvents(today, tomorrow);
  }
}