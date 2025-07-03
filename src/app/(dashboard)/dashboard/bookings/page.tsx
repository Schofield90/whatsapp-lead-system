import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatDateTime, getRelativeTime } from '@/lib/utils';
import { Calendar, Clock, Users, Video, Phone } from 'lucide-react';

export default async function BookingsPage() {
  const userProfile = await requireOrganization();
  const supabase = await createClient();

  // Fetch bookings with related data
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      lead:leads(name, phone, email),
      conversation:conversations(id)
    `)
    .eq('organization_id', userProfile.profile.organization_id)
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching bookings:', error);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'no_show': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const upcomingBookings = bookings?.filter(booking => 
    booking.status === 'scheduled' && new Date(booking.scheduled_at) > new Date()
  ) || [];

  const pastBookings = bookings?.filter(booking => 
    booking.status !== 'scheduled' || new Date(booking.scheduled_at) <= new Date()
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            Manage consultations and meetings with your leads
          </p>
        </div>
        <Button>Manual Booking</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingBookings.filter(booking => {
                const bookingDate = new Date(booking.scheduled_at);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return bookingDate <= weekFromNow;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings?.filter(b => b.status === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Shows</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings?.filter(b => b.status === 'no_show').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
          <CardDescription>
            {upcomingBookings.length} scheduled consultations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.lead?.name}</div>
                        <div className="text-sm text-gray-500">{booking.lead?.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatDateTime(booking.scheduled_at)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getRelativeTime(booking.scheduled_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{booking.duration_minutes} minutes</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {booking.google_meet_link && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={booking.google_meet_link} target="_blank" rel="noopener noreferrer">
                              <Video className="h-4 w-4 mr-1" />
                              Join
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          Reschedule
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming bookings</h3>
              <p className="text-gray-500">
                Bookings will appear here when leads schedule consultations
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Bookings</CardTitle>
            <CardDescription>
              {pastBookings.length} completed or past bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastBookings.slice(0, 10).map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.lead?.name}</div>
                        <div className="text-sm text-gray-500">{booking.lead?.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatDateTime(booking.scheduled_at)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getRelativeTime(booking.scheduled_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{booking.duration_minutes} minutes</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}