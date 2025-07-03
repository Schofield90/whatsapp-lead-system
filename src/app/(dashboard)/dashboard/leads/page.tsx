import { createClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatDateTime, getRelativeTime } from '@/lib/utils';
import { Search, Filter, Phone, Mail, MessageSquare, Users } from 'lucide-react';

export default async function LeadsPage() {
  const userProfile = await requireOrganization();
  const supabase = await createClient();

  // Fetch leads with related data
  const { data: leads, error } = await supabase
    .from('leads')
    .select(`
      *,
      lead_source:lead_sources(name),
      conversations(id, status, last_message_at),
      bookings(id, status, scheduled_at)
    `)
    .eq('organization_id', userProfile.profile.organization_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Manage and track all your leads from Facebook campaigns
          </p>
        </div>
        <Button>Export Leads</Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search leads..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>
            {leads?.length || 0} total leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads && leads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {lead.name}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="mr-2 h-3 w-3" />
                          {lead.phone}
                        </div>
                        {lead.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="mr-2 h-3 w-3" />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.lead_source?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {lead.conversations?.[0]?.last_message_at
                        ? getRelativeTime(lead.conversations[0].last_message_at)
                        : getRelativeTime(lead.created_at)
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
              <p className="text-gray-500 mb-4">
                Set up your Facebook Lead Ads integration to start receiving leads
              </p>
              <Button>Set Up Integration</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}