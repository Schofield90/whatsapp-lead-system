/**
 * Google Calendar API integration utilities
 * Handles OAuth authentication and calendar operations
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Calendar API scopes
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Generate OAuth authorization URL
 * @returns Authorization URL for Google Calendar access
 */
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 * @param code - Authorization code from Google
 * @returns Access and refresh tokens
 */
export async function getTokens(code: string) {
  const { tokens } = await oauth2Client.getAccessToken(code);
  return tokens;
}

/**
 * Set credentials for the OAuth2 client
 * @param tokens - Access and refresh tokens
 */
export function setCredentials(tokens: any) {
  oauth2Client.setCredentials(tokens);
}

/**
 * Get authenticated Google Calendar client
 * @param accessToken - User's access token
 * @param refreshToken - User's refresh token (optional)
 * @returns Authenticated calendar client
 */
export function getCalendarClient(accessToken: string, refreshToken?: string) {
  const authClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  authClient.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  return google.calendar({ version: 'v3', auth: authClient });
}

/**
 * Create a calendar event
 * @param calendarClient - Authenticated calendar client
 * @param eventDetails - Event details
 * @returns Created event
 */
export async function createCalendarEvent(
  calendarClient: any,
  eventDetails: {
    summary: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    attendeeEmail?: string;
    attendeeName?: string;
    timeZone?: string;
  }
) {
  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    start: {
      dateTime: eventDetails.startDateTime,
      timeZone: eventDetails.timeZone || 'America/New_York'
    },
    end: {
      dateTime: eventDetails.endDateTime,
      timeZone: eventDetails.timeZone || 'America/New_York'
    },
    attendees: eventDetails.attendeeEmail ? [
      { 
        email: eventDetails.attendeeEmail,
        displayName: eventDetails.attendeeName || eventDetails.attendeeEmail
      }
    ] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours
        { method: 'popup', minutes: 30 } // 30 minutes
      ]
    },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    }
  };

  const response = await calendarClient.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all'
  });

  return response.data;
}

/**
 * List upcoming events
 * @param calendarClient - Authenticated calendar client
 * @param maxResults - Maximum number of events to return
 * @returns List of upcoming events
 */
export async function listUpcomingEvents(calendarClient: any, maxResults = 10) {
  const response = await calendarClient.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime'
  });

  return response.data.items || [];
}

/**
 * Check if a time slot is available
 * @param calendarClient - Authenticated calendar client
 * @param startTime - Start time to check
 * @param endTime - End time to check
 * @returns Whether the time slot is available
 */
export async function isTimeSlotAvailable(
  calendarClient: any,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const response = await calendarClient.freebusy.query({
    resource: {
      timeMin: startTime,
      timeMax: endTime,
      items: [{ id: 'primary' }]
    }
  });

  const busy = response.data.calendars?.primary?.busy || [];
  return busy.length === 0;
}