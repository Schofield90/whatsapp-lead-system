import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, time, name, email, phone, notes } = body;

    // Validate required fields
    if (!date || !time || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create booking in database
    const client = supabase();
    const { data, error } = await client
      .from('calendar_bookings')
      .insert({
        date,
        time,
        name,
        email,
        phone,
        notes,
        status: 'confirmed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Send WhatsApp confirmation
    try {
      const confirmationMessage = `
📅 *Consultation Confirmed*

Hi ${name}! Your consultation has been booked:

📆 Date: ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
⏰ Time: ${time}

We'll discuss how our WhatsApp AI system can help automate your lead qualification and boost your sales.

Looking forward to speaking with you!

_You'll receive a reminder 1 hour before our meeting._
      `.trim();

      await sendWhatsAppMessage(phone, confirmationMessage);
    } catch (twilioError) {
      console.error('Failed to send WhatsApp confirmation:', twilioError);
      // Don't fail the booking if WhatsApp fails
    }

    return NextResponse.json({
      success: true,
      booking: data,
      message: 'Booking confirmed! Check your WhatsApp for confirmation.'
    });

  } catch (error) {
    console.error('Error in calendar booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get all bookings for the specified date
    const client = supabase();
    const { data, error } = await client
      .from('calendar_bookings')
      .select('time')
      .eq('date', date)
      .eq('status', 'confirmed');

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Return booked times
    const bookedTimes = data?.map(booking => booking.time) || [];
    return NextResponse.json({ bookedTimes });

  } catch (error) {
    console.error('Error in calendar GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}