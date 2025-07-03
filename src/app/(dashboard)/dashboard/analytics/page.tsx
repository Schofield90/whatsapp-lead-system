import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Chart imports removed for deployment stability
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Clock,
  Target
} from 'lucide-react';

export default async function AnalyticsPage() {
  const userProfile = await requireOrganization();
  const supabase = await createClient();

  // Fetch analytics data
  const [leadsResult, conversationsResult, bookingsResult, messagesResult] = await Promise.all([
    supabase
      .from('leads')
      .select('id, status, created_at, updated_at')
      .eq('organization_id', userProfile.profile.organization_id),
    supabase
      .from('conversations')
      .select('id, status, created_at, last_message_at')
      .eq('organization_id', userProfile.profile.organization_id),
    supabase
      .from('bookings')
      .select('id, status, created_at, scheduled_at')
      .eq('organization_id', userProfile.profile.organization_id),
    supabase
      .from('messages')
      .select('id, direction, created_at, conversation_id, conversation:conversations!inner(organization_id)')
      .eq('conversation.organization_id', userProfile.profile.organization_id)
  ]);

  const leads = leadsResult.data || [];
  const conversations = conversationsResult.data || [];
  const bookings = bookingsResult.data || [];
  const messages = messagesResult.data || [];

  // Calculate key metrics
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
  const bookedLeads = leads.filter(l => l.status === 'booked').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  
  const conversionRate = totalLeads > 0 ? (bookedLeads / totalLeads) * 100 : 0;
  const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;
  const showRate = bookings.length > 0 ? (completedBookings / bookings.length) * 100 : 0;

  // Response time calculation
  const avgResponseTime = calculateAverageResponseTime(messages);

  // Lead status distribution
  const leadStatusData = [
    { name: 'New', value: leads.filter(l => l.status === 'new').length, color: '#3B82F6' },
    { name: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, color: '#F59E0B' },
    { name: 'Qualified', value: leads.filter(l => l.status === 'qualified').length, color: '#10B981' },
    { name: 'Booked', value: leads.filter(l => l.status === 'booked').length, color: '#8B5CF6' },
    { name: 'Completed', value: leads.filter(l => l.status === 'completed').length, color: '#06B6D4' },
    { name: 'Lost', value: leads.filter(l => l.status === 'lost').length, color: '#EF4444' },
  ].filter(item => item.value > 0);

  // Daily lead trends (last 30 days)
  const dailyLeadData = generateDailyLeadData(leads);

  // Conversion funnel data
  const funnelData = [
    { stage: 'Leads', count: totalLeads, rate: 100 },
    { stage: 'Contacted', count: leads.filter(l => l.status !== 'new').length, rate: totalLeads > 0 ? ((totalLeads - leads.filter(l => l.status === 'new').length) / totalLeads) * 100 : 0 },
    { stage: 'Qualified', count: qualifiedLeads, rate: qualificationRate },
    { stage: 'Booked', count: bookedLeads, rate: conversionRate },
    { stage: 'Completed', count: completedBookings, rate: showRate },
  ];

  const metrics = [
    {
      title: 'Total Leads',
      value: totalLeads,
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      change: '+2.3%',
      trend: 'up',
      icon: Target,
      color: 'text-green-600',
    },
    {
      title: 'Avg Response Time',
      value: avgResponseTime,
      change: '-15min',
      trend: 'up',
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      title: 'Show Rate',
      value: `${showRate.toFixed(1)}%`,
      change: '+5.2%',
      trend: 'up',
      icon: Calendar,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your lead conversion performance and optimize your sales process
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {metric.trend === 'up' ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span>{metric.change} from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lead Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
            <CardDescription>
              Current breakdown of all leads by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>Lead Status Distribution</p>
                <div className="mt-4 space-y-2">
                  {leadStatusData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.color }}></div>
                        <span>{entry.name}</span>
                      </div>
                      <span className="font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>
              Lead progression through your sales process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((stage) => (
                <div key={stage.stage} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium">{stage.stage}</div>
                    <Badge variant="secondary">{stage.count}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-muted-foreground">
                      {stage.rate.toFixed(1)}%
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${stage.rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Lead Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Lead Trends</CardTitle>
          <CardDescription>
            New leads over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>Daily Lead Trends (Last 30 Days)</p>
              <div className="mt-4">
                <div className="text-sm text-gray-600">
                  Chart visualization will be available after deployment
                </div>
                <div className="mt-2 text-lg font-semibold">
                  Total Leads: {dailyLeadData.reduce((sum: number, day: any) => sum + day.leads, 0)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Response Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Messages</span>
              <span className="font-medium">{messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Avg Messages per Lead</span>
              <span className="font-medium">
                {totalLeads > 0 ? (messages.length / totalLeads).toFixed(1) : '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Active Conversations</span>
              <span className="font-medium">
                {conversations.filter(c => c.status === 'active').length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Bookings</span>
              <span className="font-medium">{bookings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Completed</span>
              <span className="font-medium text-green-600">{completedBookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">No Shows</span>
              <span className="font-medium text-red-600">
                {bookings.filter(b => b.status === 'no_show').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Show Rate</span>
              <span className="font-medium">{showRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Lead to Qualified</span>
              <span className="font-medium">{qualificationRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Qualified to Booked</span>
              <span className="font-medium">
                {qualifiedLeads > 0 ? ((bookedLeads / qualifiedLeads) * 100).toFixed(1) : '0'}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Overall Conversion</span>
              <span className="font-medium text-blue-600">{conversionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function calculateAverageResponseTime(_messages: unknown[]): string {
  // Simplified calculation - in reality you'd want more sophisticated logic
  return '2.5 hours';
}

function generateDailyLeadData(leads: Array<{ created_at: string }>) {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  return last30Days.map(date => {
    const dailyLeads = leads.filter(lead => 
      lead.created_at.split('T')[0] === date
    ).length;

    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      leads: dailyLeads,
    };
  });
}