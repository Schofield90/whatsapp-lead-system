'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, MessageCircle, Eye } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
}

interface LeadActionsProps {
  lead: Lead;
}

export function LeadActions({ lead }: LeadActionsProps) {
  const router = useRouter();
  const [messageOpen, setMessageOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    `Hi ${lead.name}! Thank you for your interest in our gym. I'd love to schedule a quick consultation to discuss your fitness goals. When would be a good time for you? 💪`
  );

  const handleSendMessage = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: lead.phone,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setMessageOpen(false);
      alert(`Message sent to ${lead.name}!`);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex space-x-2">
      {/* View Chat Button */}
      <Button 
        size="sm" 
        variant="outline"
        onClick={() => router.push(`/dashboard/conversations?lead=${lead.id}`)}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        View Chat
      </Button>

      {/* Message Button */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message to {lead.name}</DialogTitle>
            <DialogDescription>
              Send a WhatsApp message to {lead.phone}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMessageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Button */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-gray-700">{lead.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-sm text-gray-700 capitalize">{lead.status}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                <p className="text-sm text-gray-700">{lead.phone}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-gray-700">{lead.email || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Lead ID</Label>
              <p className="text-xs text-gray-500 font-mono">{lead.id}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}