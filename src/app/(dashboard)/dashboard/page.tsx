import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Calendar, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const userProfile = await requireOrganization();
  const supabase = await createClient();

  // Fetch dashboard stats
  const [leadsResult, conversationsResult, bookingsResult] = await Promise.all([
    supabase
      .from('leads')
      .select('id, status, created_at')
      .eq('organization_id', userProfile.profile.organization_id),
    supabase
      .from('conversations')
      .select('id, status, created_at')
      .eq('organization_id', userProfile.profile.organization_id),
    supabase
      .from('bookings')
      .select('id, status, created_at')
      .eq('organization_id', userProfile.profile.organization_id),
  ]);

  const leads = leadsResult.data || [];
  const conversations = conversationsResult.data || [];
  const bookings = bookingsResult.data || [];

  // Calculate stats
  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.status === 'new').length;
  const qualifiedLeads = leads.filter(lead => lead.status === 'qualified').length;
  const bookedLeads = leads.filter(lead => lead.status === 'booked').length;
  
  const activeConversations = conversations.filter(conv => conv.status === 'active').length;
  const scheduledBookings = bookings.filter(booking => booking.status === 'scheduled').length;
  
  const conversionRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;

  const stats = [
    {
      title: 'Total Leads',
      value: totalLeads,
      description: `${newLeads} new this week`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Conversations',
      value: activeConversations,
      description: `${qualifiedLeads} qualified leads`,
      icon: MessageSquare,
      color: 'bg-green-500',
    },
    {
      title: 'Scheduled Bookings',
      value: scheduledBookings,
      description: `${bookedLeads} total booked`,
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      description: 'Lead to booking rate',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your lead conversion system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>
              Latest leads from your Facebook campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leads.slice(0, 5).length > 0 ? (
              <div className="space-y-4">
                {leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div>
                        <p className="text-sm font-medium">New Lead</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {lead.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No leads yet. Set up your Facebook integration to start receiving leads.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>
              Scheduled consultations and meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.slice(0, 5).length > 0 ? (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div>
                        <p className="text-sm font-medium">Consultation</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No upcoming bookings. Leads will appear here once they book consultations.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}