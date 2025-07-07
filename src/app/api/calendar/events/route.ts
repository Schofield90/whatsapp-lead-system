import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarEventsService } from '@/lib/google-calendar-events';
import { requireOrganization } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireOrganization();
    
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'upcoming';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const count = parseInt(searchParams.get('count') || '10');

    const calendarService = new GoogleCalendarEventsService();
    let events;

    switch (view) {
      case 'today':
        events = await calendarService.getTodaysEvents();
        break;
      case 'upcoming':
        events = await calendarService.getUpcomingEvents(count);
        break;
      case 'range':
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        events = await calendarService.getEvents(start, end);
        break;
      default:
        events = await calendarService.getUpcomingEvents(count);
    }

    return NextResponse.json({
      success: true,
      events,
      count: events.length
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({
      error: 'Failed to fetch calendar events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}