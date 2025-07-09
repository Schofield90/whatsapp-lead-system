/**
 * Calendar booking API endpoint
 * Creates calendar events for WhatsApp AI bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCalendarClient, createCalendarEvent, isTimeSlotAvailable } from '@/lib/google-calendar';
import { createClient } from '@/lib/supabase';

// Define the booking request structure
interface BookingRequest {
  date: string; // ISO date string
  time: string; // Time in HH:MM format
  duration?: number; // Duration in minutes, default 30
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  notes?: string;
  timeZone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const bookingData: BookingRequest = await request.json();

    // Validate required fields
    if (!bookingData.date || !bookingData.time || !bookingData.customerName || !bookingData.customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: date, time, customerName, customerPhone' },
        { status: 400 }
      );
    }

    // Get stored Google tokens from Supabase
    const supabase = createClient();
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('access_token, refresh_token')
      .eq('id', 'admin') // In production, use actual user ID
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Google Calendar not connected. Please authenticate first.' },
        { status: 401 }
      );
    }

    // Create calendar client
    const calendarClient = getCalendarClient(
      tokenData.access_token as string,
      tokenData.refresh_token as string
    );

    // Parse date and time
    const duration = bookingData.duration || 30; // Default 30 minutes
    const startDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
    const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 1000));

    // Check if time slot is available
    const isAvailable = await isTimeSlotAvailable(
      calendarClient,
      startDateTime.toISOString(),
      endDateTime.toISOString()
    );

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Time slot is not available' },
        { status: 409 }
      );
    }

    // Create calendar event
    const eventDetails = {
      summary: `Sales Call - ${bookingData.customerName}`,
      description: `
WhatsApp AI Booking

Customer: ${bookingData.customerName}
Phone: ${bookingData.customerPhone}
${bookingData.customerEmail ? `Email: ${bookingData.customerEmail}` : ''}

${bookingData.notes ? `Notes: ${bookingData.notes}` : ''}

This booking was automatically created by the WhatsApp AI system.
      `.trim(),
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      attendeeEmail: bookingData.customerEmail,
      attendeeName: bookingData.customerName,
      timeZone: bookingData.timeZone || 'America/New_York'
    };

    const event = await createCalendarEvent(calendarClient, eventDetails);

    // Store booking in Supabase for tracking
    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({
        google_event_id: event.id,
        customer_name: bookingData.customerName,
        customer_email: bookingData.customerEmail,
        customer_phone: bookingData.customerPhone,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'confirmed',
        notes: bookingData.notes,
        created_at: new Date().toISOString()
      });

    if (bookingError) {
      console.error('Error storing booking:', bookingError);
      // Don't fail the API call, just log the error
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Calendar event created successfully',
      event: {
        id: event.id,
        summary: event.summary,
        start: event.start,
        end: event.end,
        meetingLink: event.conferenceData?.entryPoints?.[0]?.uri,
        htmlLink: event.htmlLink
      }
    });

  } catch (error) {
    console.error('Calendar booking error:', error);
    
    // Handle specific Google API errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 401) {
      return NextResponse.json(
        { error: 'Google Calendar authentication expired. Please re-authenticate.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}

// GET endpoint to check available time slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Get stored Google tokens
    const supabase = createClient();
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('access_token, refresh_token')
      .eq('id', 'admin')
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 401 }
      );
    }

    const calendarClient = getCalendarClient(
      tokenData.access_token as string,
      tokenData.refresh_token as string
    );

    // Define business hours (9 AM to 5 PM)
    const businessHours = [];
    for (let hour = 9; hour < 17; hour++) {
      const startTime = new Date(`${date}T${hour.toString().padStart(2, '0')}:00`);
      const endTime = new Date(startTime.getTime() + (30 * 60 * 1000)); // 30 min slots
      
      const isAvailable = await isTimeSlotAvailable(
        calendarClient,
        startTime.toISOString(),
        endTime.toISOString()
      );

      if (isAvailable) {
        businessHours.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          available: true
        });
      }
    }

    return NextResponse.json({
      date,
      availableSlots: businessHours
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}