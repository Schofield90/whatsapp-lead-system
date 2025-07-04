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
import { getRelativeTime } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Phone, 
  User,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { ManualMessageDialog } from '@/components/conversations/manual-message-dialog';
import { TestMessageDialog } from '@/components/conversations/test-message-dialog';
import { ConversationsClient } from '@/components/conversations/conversations-client';

interface PageProps {
  searchParams: { lead?: string };
}

export default async function ConversationsPage({ searchParams }: PageProps) {
  const userProfile = await requireOrganization();
  const supabase = await createClient();

  // Build query with optional lead filter
  let query = supabase
    .from('conversations')
    .select(`
      *,
      lead:leads(
        id,
        name,
        phone,
        email,
        status
      ),
      messages(
        id,
        direction,
        content,
        created_at
      ),
      bookings(
        id,
        status,
        scheduled_at
      )
    `)
    .eq('organization_id', userProfile.profile.organization_id);

  // Filter by lead if provided
  if (searchParams.lead) {
    query = query.eq('lead_id', searchParams.lead);
  }

  const { data: conversations, error } = await query
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeadStatusColor = (status: string) => {
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
    <ConversationsClient 
      conversations={conversations || []}
      selectedLeadId={searchParams.lead}
    />
  );
}