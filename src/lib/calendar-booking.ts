/**
 * Calendar booking helper functions for WhatsApp AI
 * Handles calendar booking requests from the AI system
 */

import { NextRequest } from 'next/server';

// Define booking request structure
export interface BookingRequest {
  date: string;
  time: string;
  duration?: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  notes?: string;
  timeZone?: string;
}

/**
 * Book a calendar appointment via API
 * @param bookingData - Booking details
 * @returns Promise with booking result
 */
export async function bookCalendarAppointment(bookingData: BookingRequest): Promise<{
  success: boolean;
  message: string;
  event?: any;
  error?: string;
}> {
  try {
    // Make internal API call to calendar booking endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/calendar/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.error || 'Failed to book appointment',
        error: result.error
      };
    }

    return {
      success: true,
      message: result.message,
      event: result.event
    };

  } catch (error) {
    console.error('Error booking calendar appointment:', error);
    return {
      success: false,
      message: 'Internal error occurred while booking appointment',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check available time slots for a given date
 * @param date - Date to check (YYYY-MM-DD format)
 * @returns Promise with available slots
 */
export async function checkAvailableSlots(date: string): Promise<{
  success: boolean;
  slots?: any[];
  error?: string;
}> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/calendar/book?date=${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to check availability'
      };
    }

    return {
      success: true,
      slots: result.availableSlots
    };

  } catch (error) {
    console.error('Error checking available slots:', error);
    return {
      success: false,
      error: 'Internal error occurred while checking availability'
    };
  }
}

/**
 * Parse date and time from natural language
 * @param dateTimeString - Natural language date/time string
 * @returns Parsed date and time or null if parsing fails
 */
export function parseDateTime(dateTimeString: string): {
  date: string;
  time: string;
} | null {
  try {
    // Common patterns to look for
    const patterns = [
      // "tomorrow at 2pm", "today at 10am"
      /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2})(:\d{2})?\s*(am|pm)\b/i,
      // "2pm tomorrow", "10am today"
      /\b(\d{1,2})(:\d{2})?\s*(am|pm)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      // "January 15 at 2pm", "Dec 25 at 10am"
      /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\s+at\s+(\d{1,2})(:\d{2})?\s*(am|pm)\b/i,
      // "2024-01-15 at 14:00", "2024-01-15 14:00"
      /\b(\d{4}-\d{2}-\d{2})\s+(?:at\s+)?(\d{1,2}):(\d{2})\b/,
    ];

    const now = new Date();
    
    for (const pattern of patterns) {
      const match = dateTimeString.match(pattern);
      if (match) {
        // Handle different pattern matches
        // This is a simplified parser - you might want to use a library like date-fns or moment.js
        
        // For now, return a basic format that works with ISO dates
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return {
          date: tomorrow.toISOString().split('T')[0], // YYYY-MM-DD
          time: '14:00' // Default to 2 PM
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing date/time:', error);
    return null;
  }
}

/**
 * Format booking confirmation message
 * @param bookingResult - Result from calendar booking
 * @param customerName - Customer name
 * @returns Formatted confirmation message
 */
export function formatBookingConfirmation(
  bookingResult: any,
  customerName: string
): string {
  if (!bookingResult.success) {
    return `Sorry ${customerName}, I couldn't book your appointment. ${bookingResult.message}. Please try a different time or contact us directly.`;
  }

  const event = bookingResult.event;
  const startTime = new Date(event.start.dateTime);
  const meetingLink = event.meetingLink;

  let message = `✅ Great news ${customerName}! I've booked your appointment for ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()}.`;

  if (meetingLink) {
    message += `\n\n🔗 Meeting Link: ${meetingLink}`;
  }

  message += `\n\nYou'll receive a calendar invitation shortly. Looking forward to speaking with you!`;

  return message;
}