'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/lib/google-calendar-events';
import { Calendar as CalendarIcon, Clock, MapPin, Users, Video, ExternalLink, RefreshCw } from 'lucide-react';

interface EventCardProps {
  event: CalendarEvent;
}

function EventCard({ event }: EventCardProps) {
  const startTime = event.start.dateTime ? new Date(event.start.dateTime) : null;
  const endTime = event.end.dateTime ? new Date(event.end.dateTime) : null;
  const isAllDay = !event.start.dateTime;
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = startTime && startTime.toDateString() === new Date().toDateString();
  const isPast = startTime && startTime < new Date();

  return (
    <div className={`bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow ${
      isToday ? 'border-l-blue-500 bg-blue-50' : 
      isPast ? 'border-l-gray-300 bg-gray-50' : 
      'border-l-green-500'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={`font-semibold ${
              isPast ? 'text-gray-600' : 'text-gray-900'
            }`}>
              {event.summary}
            </h3>
            
            {event.description && (
              <p className={`text-sm mt-1 ${
                isPast ? 'text-gray-500' : 'text-gray-600'
              }`}>
                {event.description.length > 100 
                  ? `${event.description.substring(0, 100)}...` 
                  : event.description}
              </p>
            )}
          </div>
          
          {event.status === 'confirmed' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Confirmed
            </span>
          )}
        </div>

        <div className="mt-3 space-y-2">
          {startTime && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>
                {formatDate(startTime)}
                {!isAllDay && (
                  <>
                    {' at '}{formatTime(startTime)}
                    {endTime && ` - ${formatTime(endTime)}`}
                  </>
                )}
                {isAllDay && ' (All Day)'}
              </span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{event.location}</span>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              <span>{event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {event.hangoutLink && (
            <div className="flex items-center">
              <Video className="h-4 w-4 mr-2 text-blue-600" />
              <a 
                href={event.hangoutLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                Join Google Meet
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'today' | 'upcoming' | 'week'>('upcoming');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (view === 'week') {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        params.append('view', 'range');
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      } else {
        params.append('view', view);
        if (view === 'upcoming') {
          params.append('count', '20');
        }
      }

      const response = await fetch(`/api/calendar/events?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch events');
      }
      
      setEvents(data.events);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [view]);

  const handleRefresh = () => {
    fetchEvents();
  };

  const todayEvents = events.filter(event => {
    if (!event.start.dateTime) return false;
    const eventDate = new Date(event.start.dateTime);
    return eventDate.toDateString() === new Date().toDateString();
  });

  const upcomingEvents = events.filter(event => {
    if (!event.start.dateTime) return false;
    const eventDate = new Date(event.start.dateTime);
    return eventDate > new Date();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View your Google Calendar events</p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {lastRefresh && (
        <p className="text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString('en-GB')}
        </p>
      )}

      <div className="flex space-x-4 border-b border-gray-200">
        {[
          { key: 'today', label: 'Today' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'week', label: 'This Week' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key as any)}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              view === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading calendar events...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading calendar</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {view === 'today' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Today's Events ({todayEvents.length})
              </h2>
              
              {todayEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No events scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'upcoming' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Upcoming Events ({upcomingEvents.length})
              </h2>
              
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'week' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                This Week ({events.length} events)
              </h2>
              
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No events this week</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}